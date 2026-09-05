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
 * RETENTION, stated correctly. Anthropic does NOT retain prompts or outputs by
 * default; where a feature must store them they are deleted within 30 days. The
 * exception is Covered Models, which require 30-day retention — currently Claude
 * Fable 5.1, Mythos 5.1, Fable 5 and Mythos 5, none of which this product uses
 * (see `src/ai/config.ts`). An earlier draft of the privacy policy described a
 * "brief retention then deletion" window; that framing was wrong and was
 * corrected on 2026-07-26. Do not reintroduce it.
 *
 * VERIFIED 2026-09-05 against Anthropic's live Commercial Terms §B ("Anthropic
 * may not train models on Customer Content from Services" — unqualified; the
 * trust-and-safety and legal exceptions attach to RETENTION, not to training)
 * and the live API data-retention documentation. Every claim above holds, and
 * nothing on `/privacy` or the homepage is inaccurate.
 *
 * ⚠ ONE THING IS NOT SETTLED, and it is a DELIBERATE DEFERRAL rather than an
 * oversight — do not re-raise it as a fresh audit finding. Anthropic may retain
 * inputs and outputs for UP TO 2 YEARS where content is flagged by their
 * automated trust-and-safety systems (classification scores up to 7 years).
 * `/privacy` does not disclose this. Because this product deliberately permits
 * dark and transgressive literary work near the acceptable-use boundary, a
 * false-positive flag is a real if rare possibility, so the exposure is more
 * than theoretical. Wording to disclose it was drafted on 2026-07-26 and Nenad
 * is taking it to a solicitor himself (ruled 2026-09-05). It is tracked as a
 * pre-launch blocker in `DraftAndLens_GoLive_Compliance_Checklist.md`, item 1c.
 * `/privacy` is NOT to be reworded or restamped until that advice lands.
 *
 * Last reviewed: 2026-09-05. Previous review 2026-07-26, recorded in
 * `DraftAndLens_Anthropic_Terms_Record.md`. Third-party terms change: re-check
 * against the live documentation immediately before paid launch.
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
