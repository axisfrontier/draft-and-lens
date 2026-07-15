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
}

const storage = new AsyncLocalStorage<CostEntry[]>();

/** Record token usage for a brain call. No-op if cost tracking isn't active for this request — never throws. */
export function recordBrainUsage(
  brain: string,
  model: string,
  usage: { input_tokens?: number; output_tokens?: number } | null | undefined
): void {
  const store = storage.getStore();
  if (!store || !usage) return;
  store.push({
    brain,
    model,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
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
