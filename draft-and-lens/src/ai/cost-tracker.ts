import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request token-usage collector for cost logging. Uses AsyncLocalStorage
 * so brain calls can record usage without any change to their return types —
 * each request gets its own isolated entry list (safe under concurrent
 * requests in the same Node process), and recording is a no-op outside a
 * tracked context, so nothing here can affect the reading pipeline.
 */

export interface CostEntry {
  brain: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /**
   * Phase 1 latency telemetry — epoch ms. Optional so any caller that records
   * usage without timing still type-checks; every in-tree call site supplies
   * them. Duration is stored rather than derived so a consumer never has to
   * recompute it from two nullable fields.
   */
  startedAtMs?: number;
  endedAtMs?: number;
  durationMs?: number;
}

/** Timing pair for a completed stage. */
export interface StageTiming {
  startedAtMs: number;
  endedAtMs: number;
}

const storage = new AsyncLocalStorage<CostEntry[]>();

/** Record token usage (and, when supplied, wall-clock timing) for a brain call.
 *  No-op if cost tracking isn't active for this request — never throws. */
export function recordBrainUsage(
  brain: string,
  model: string,
  usage: { input_tokens?: number; output_tokens?: number } | null | undefined,
  timing?: StageTiming
): void {
  const store = storage.getStore();
  if (!store || !usage) return;
  store.push({
    brain,
    model,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    ...(timing
      ? {
          startedAtMs: timing.startedAtMs,
          endedAtMs: timing.endedAtMs,
          durationMs: timing.endedAtMs - timing.startedAtMs,
        }
      : {}),
  });
}

/**
 * Record a non-LLM stage that still gates the pipeline — e.g. the
 * resolveRevision Supabase round-trip. Token counts are zero by definition;
 * the point is that its latency appears in the Phase 4 breakdown rather than
 * hiding inside "unaccounted" time. No-op outside a tracked context.
 */
export function recordStageTiming(
  stage: string,
  timing: StageTiming,
  model = 'n/a'
): void {
  const store = storage.getStore();
  if (!store) return;
  store.push({
    brain: stage,
    model,
    inputTokens: 0,
    outputTokens: 0,
    startedAtMs: timing.startedAtMs,
    endedAtMs: timing.endedAtMs,
    durationMs: timing.endedAtMs - timing.startedAtMs,
  });
}

/** Run `fn` inside a fresh cost-tracking context; returns fn's result plus every brain-call entry recorded during it. */
export async function withCostTracking<T>(
  fn: () => Promise<T>
): Promise<{ result: T; entries: CostEntry[] }> {
  const entries: CostEntry[] = [];
  const result = await storage.run(entries, fn);
  return { result, entries };
}
