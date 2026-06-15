import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

/**
 * Server-only Anthropic client. API key from environment — never imported by client code.
 * Last reviewed: 2026-06-07
 */
function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }
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
