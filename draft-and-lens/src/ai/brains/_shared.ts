import 'server-only';

import type Anthropic from '@anthropic-ai/sdk';

import { cachedSystemBlock, getAnthropicClient } from '../client';
import { recordBrainUsage } from '../cost-tracker';

/**
 * Shared brain helpers — the single place the Anthropic SDK is called for the
 * non-streaming brains. The analyst (streaming) calls the client directly.
 * Mirrors the prototype's fetch + JSON-recovery behaviour from DraftAndLens.html.
 */

/** Pull the first text block out of a completed message. */
export function extractText(msg: Anthropic.Messages.Message): string {
  const block = msg.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
  );
  return block?.text ?? '';
}

/**
 * Tolerant JSON parse — strips ```json fences and recovers the object even when
 * the model wrapped it in prose (the prototype's studio-matching recovery).
 * Returns null on failure rather than throwing.
 */
export function parseJsonLoose<T>(raw: string): T | null {
  let clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if ((start > 0 || end < clean.length - 1) && start !== -1 && end !== -1) {
    clean = clean.slice(start, end + 1);
  }
  try {
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

interface BrainCall {
  model: string;
  maxTokens: number;
  /** Short label identifying which brain this call belongs to, for cost logging. */
  brain: string;
  /** Static (cacheable) system text. */
  system: string;
  /** User message content. */
  user: string;
  /**
   * When the system has a per-request tail (e.g. the confirmed tradition), pass
   * it here: the static `system` is cached and this dynamic part is appended as a
   * second, uncached block — so the large constant prefix is reused across calls.
   */
  systemDynamic?: string;
  /** Cache the static system block (default true — Architecture §14b: caching is a law). */
  cacheSystem?: boolean;
}

function systemParam(
  call: BrainCall
): string | Anthropic.Messages.TextBlockParam[] {
  const cache = call.cacheSystem ?? true;
  if (call.systemDynamic !== undefined && call.systemDynamic !== '') {
    return [
      ...cachedSystemBlock(call.system),
      { type: 'text', text: call.systemDynamic },
    ];
  }
  return cache ? cachedSystemBlock(call.system) : call.system;
}

/** Call a brain and return raw text. Wall-clock timing is captured here so every
 *  non-streaming brain is measured at a single choke point (Phase 1 telemetry). */
export async function callTextBrain(call: BrainCall): Promise<string> {
  const client = getAnthropicClient();
  const startedAtMs = Date.now();
  const msg = await client.messages.create({
    model: call.model,
    max_tokens: call.maxTokens,
    system: systemParam(call),
    messages: [{ role: 'user', content: call.user }],
  });
  const endedAtMs = Date.now();
  recordBrainUsage(call.brain, call.model, msg.usage, { startedAtMs, endedAtMs });
  return extractText(msg);
}

/** Call a brain that must return JSON; returns null if parsing fails. */
export async function callJsonBrain<T>(call: BrainCall): Promise<T | null> {
  const text = await callTextBrain(call);
  return parseJsonLoose<T>(text);
}
