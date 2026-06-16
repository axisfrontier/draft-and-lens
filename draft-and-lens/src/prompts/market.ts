import 'server-only';

import { KNOWN_WORK_CHECK } from './fragments/known-work';

/**
 * Brain 4 — Market/studio matching prompts. Ported verbatim from
 * DraftAndLens.html runStudioMatching(). Last reviewed: 2026-06-15.
 */

export const MARKET_SYSTEM = 'You are a film and literary industry expert. Return only valid JSON.';

export function buildMarketPrompt(modeLabel: string, excerpt: string): string {
  return `You are a literary and film industry expert. Based on the submitted ${modeLabel}, identify the 4 to 6 best-matched studios, publishers, or streaming platforms that would be most likely to develop or acquire this specific work.

${KNOWN_WORK_CHECK}

For each studio/publisher/platform, provide:
- name: the studio/publisher name
- type: their type (e.g. "Indie Studio · Theatrical", "Literary Publisher", "Streaming Original")
- match: one of "Strong Match", "Good Match", "Possible Match"
- rationale: 2-3 sentences explaining WHY this specific work fits this specific company — reference the work's actual content, tone, and market position
- contact: brief contact/submission info with website URL if known

Return ONLY valid JSON, no markdown, no backticks:
{"knownWork":"","studios":[{"name":"...","type":"...","match":"...","rationale":"...","contact":"..."},...]}

SUBMITTED TEXT:
${excerpt}`;
}
