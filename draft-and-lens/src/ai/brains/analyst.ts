import 'server-only';

import type Anthropic from '@anthropic-ai/sdk';

import {
  buildAnalystSystemPrompt,
  buildAnalystUserPrompt,
  buildSystemPrompt,
  prependNarratorVerdicts,
} from '../../prompts/analyst';
import { buildPartialReadDirective } from '../../prompts/fragments/partial-read';
import type {
  AnalysisMode,
  CoverageSignal,
  DiagnosticResult,
} from '../../prompts/types';
import { cachedSystemBlock, getAnthropicClient } from '../client';
import { ANALYST_EFFORT, MODELS, TOKEN_LIMITS } from '../config';

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
  coverage: CoverageSignal;
}

export async function runAnalyst(
  input: AnalystInput,
  onText?: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const { mode, text, genre, intent, bible, wordCount, pageEst, diagnostic, coverage } =
    input;

  // System: cache the constant mode+genre base; append the per-work diagnostic
  // block as a second (uncached) block so the large prefix is reused (§14b).
  const fullSystem = buildAnalystSystemPrompt(mode, genre, diagnostic);
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
  if (coverage.truncated) {
    userPrompt =
      buildPartialReadDirective(coverage.wordsRead, coverage.wordsTotal) + userPrompt;
  }
  userPrompt = prependNarratorVerdicts(userPrompt, diagnostic);

  const params = {
    model: MODELS.analyst,
    max_tokens: TOKEN_LIMITS.analyst,
    thinking: { type: 'adaptive' },
    output_config: { effort: ANALYST_EFFORT },
    system: systemBlocks,
    messages: [{ role: 'user', content: userPrompt }],
  } as unknown as Anthropic.Messages.MessageStreamParams;

  const client = getAnthropicClient();
  let report = '';
  const stream = client.messages.stream(
    params,
    signal ? { signal } : undefined
  );
  stream.on('text', (delta) => {
    report += delta;
    onText?.(delta);
  });
  await stream.finalMessage();
  return report;
}
