import 'server-only';

import type Anthropic from '@anthropic-ai/sdk';

import {
  buildAnalystSystemPrompt,
  buildAnalystUserPrompt,
  buildSystemPrompt,
  prependNarratorVerdicts,
} from '../../prompts/analyst';
import { buildGoalDirective } from '../../prompts/fragments/goals';
import { buildRevisionDirective } from '../../prompts/fragments/revision';
import type { AnalysisMode, DiagnosticResult } from '../../prompts/types';
import { cachedSystemBlock, getAnthropicClient } from '../client';
import { adaptiveAnalystConfig } from '../config';
import { recordBrainUsage } from '../cost-tracker';

/**
 * Brain 2 — Analyst (streaming, adaptive thinking, effort tunable). Receives the
 * tradition LOCKED from Brain 1 and never re-identifies it. Emits ⟦…⟧ around
 * verbatim quotes for inline anchoring (§18). Streams text via `onText`; the
 * post-stream narrator correction is applied by the orchestrator. Ported from
 * runMainAnalysis() — exact model/thinking/effort settings preserved.
 */

export interface AnalystInput {
  mode: AnalysisMode;
  text: string;
  genre: string;
  intent?: string;
  bible?: string;
  wordCount: number;
  pageEst: number;
  diagnostic: DiagnosticResult;
  /** When this submission is a revision, a magnitude+location note (CHANGE 3). */
  revisionNote?: string;
  /** Real stored WHAT TO REVISE text from the prior reading, or null. Never a
   *  placeholder — see buildRevisionDirective. */
  priorRevisionNotes?: string | null;
  /** Excerpt vs complete piece — a fragment is read on different terms (§Excerpt Mode). */
  submissionType?: 'complete' | 'excerpt';
  /** What the writer says they are trying to do, in their own words (Gap B).
   *  Held alongside the tradition, never as a rubric — see buildGoalDirective. */
  goals?: readonly string[];
}

export async function runAnalyst(
  input: AnalystInput,
  onText?: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const {
    mode,
    text,
    genre,
    intent,
    bible,
    wordCount,
    pageEst,
    diagnostic,
    revisionNote,
    priorRevisionNotes,
    submissionType,
    goals,
  } = input;

  // System: cache the constant mode+genre base; append the per-work diagnostic
  // block as a second (uncached) block so the large prefix is reused (§14b).
  const fullSystem = buildAnalystSystemPrompt(mode, genre, diagnostic, submissionType);
  const baseSystem = buildSystemPrompt(mode, genre);
  const dynamicSystem = fullSystem.startsWith(baseSystem)
    ? fullSystem.slice(baseSystem.length)
    : '';
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = dynamicSystem
    ? [...cachedSystemBlock(baseSystem), { type: 'text', text: dynamicSystem }]
    : cachedSystemBlock(fullSystem);

  // User prompt: base report request, then partial-read directive when truncated,
  // then the locked narrator verdicts — same order the prototype concatenates.
  let userPrompt = buildAnalystUserPrompt({
    mode,
    text,
    genre,
    intent,
    wordCount,
    pageEst,
    bible,
  });
  userPrompt = prependNarratorVerdicts(userPrompt, diagnostic);
  // What the writer said they were trying to do (Gap B) — above the report
  // request, below the revision context. A goal is context the reading holds
  // while it works; a revision is what the whole reading is a response to, so
  // it stays first.
  if (goals && goals.length > 0) {
    userPrompt = buildGoalDirective(goals) + userPrompt;
  }
  // Revision context goes to the very front so the analyst frames the whole
  // reading as a response to the revision (CHANGE 3).
  if (revisionNote) {
    userPrompt = buildRevisionDirective(revisionNote, priorRevisionNotes) + userPrompt;
  }

  const { model, maxTokens, effort, useThinking } = adaptiveAnalystConfig(wordCount);
  const params = {
    model,
    max_tokens: maxTokens,
    ...(useThinking ? { thinking: { type: 'adaptive' }, output_config: { effort } } : {}),
    system: systemBlocks,
    messages: [{ role: 'user', content: userPrompt }],
  } as unknown as Anthropic.Messages.MessageStreamParams;

  const client = getAnthropicClient();
  let report = '';
  const startedAtMs = Date.now();
  const stream = client.messages.stream(
    params,
    signal ? { signal } : undefined
  );
  stream.on('text', (delta) => {
    report += delta;
    onText?.(delta);
  });
  const finalMsg = await stream.finalMessage();
  const endedAtMs = Date.now();
  recordBrainUsage('analyst', model, finalMsg.usage, { startedAtMs, endedAtMs });
  return report;
}
