import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

/**
 * Server-only Anthropic client. API key from environment — never imported by client code.
 *
 * NO-TRAINING GUARANTEE (Step 3). User text reaches only (a) the Anthropic Messages
 * API — which does NOT use API inputs or outputs to train models — and (b) the
 * writer's own Supabase rows. No call here sets any training/opt-in flag (the API
 * exposes none), and nothing forwards submissions to any other service. The product
 * promise "we never train AI on your work" is therefore true by construction.
 *
 * TODO (data-protection verification, before launch): verify this no-training /
 * brief-retention wording against Anthropic's CURRENT Commercial Terms + data-usage
 * page. The public privacy claim must match their live policy, not this summary.
 * Last reviewed: 2026-06-22
 */
function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }
  // TEMP DIAGNOSTIC (2026-07-25) — remove after key-rotation issue is confirmed
  // fixed. Never logs the key itself, only shape/length, to isolate whether
  // production is running a stale/placeholder/malformed value.
  console.log(
    `[diag] ANTHROPIC_API_KEY length=${key.length} prefix=${key.slice(0, 12)} suffix=${key.slice(-4)}`
  );
  return key;
}

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: getApiKey() });
  }
  return _client;
}

/** Prompt caching helper — marks the system block for Anthropic cache (§14b). */
export function cachedSystemBlock(text: string): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: 'text',
      text,
      cache_control: { type: 'ephemeral' },
    },
  ];
}
