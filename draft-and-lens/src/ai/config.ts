import 'server-only';

/**
 * Model assignments — verbatim from DraftAndLens.html fetch calls (Architecture §03).
 * Last reviewed: 2026-06-07
 */
export const MODELS = {
  moderation: 'claude-sonnet-4-6',
  diagnostician: 'claude-sonnet-4-6',
  structuralReader: 'claude-sonnet-4-6',
  narratorVerifier: 'claude-sonnet-4-6',
  narratorCorrector: 'claude-opus-4-8',
  analyst: 'claude-opus-4-8',
  scorer: 'claude-sonnet-4-6',
  market: 'claude-sonnet-4-6',
  bible: 'claude-sonnet-4-6',
  lens: 'claude-sonnet-4-6',
  conversation: 'claude-sonnet-4-6',
} as const;

/** Analyst adaptive thinking effort — tunable (prototype default: medium). */
export const ANALYST_EFFORT = (process.env.DL_ANALYST_EFFORT ?? 'medium') as 'low' | 'medium' | 'high';

/**
 * Pick the right model + token ceiling based on word count.
 * Short pieces don't need Opus — Sonnet is fast and capable enough.
 * Opus earns its place only on longer, more complex work.
 *
 * The report structure asks for the full 13-section analysis regardless of
 * word count, so every tier's ceiling must cover 13 sections of quoted,
 * plain-language-annotated prose — not just the shortest possible reading.
 * The 3 000+ tier also spends part of its budget on adaptive extended
 * thinking, which competes with the visible report for the same ceiling.
 *
 * Tiers:
 *  < 800 words  → Sonnet, 5 000 tokens, no extended thinking
 *  800–3 000    → Sonnet, 8 000 tokens, low effort thinking
 *  3 000+       → Opus,   16 000 tokens, medium effort thinking
 */
export function adaptiveAnalystConfig(wordCount: number): {
  model: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high';
  useThinking: boolean;
} {
  if (wordCount < 800) {
    return { model: 'claude-sonnet-4-6', maxTokens: 5000, effort: 'low', useThinking: false };
  }
  if (wordCount < 3000) {
    return { model: 'claude-sonnet-4-6', maxTokens: 8000, effort: 'low', useThinking: true };
  }
  return { model: 'claude-opus-4-8', maxTokens: 16000, effort: ANALYST_EFFORT, useThinking: true };
}

export const TOKEN_LIMITS = {
  moderation: 200,
  diagnostician: 800,
  structuralReader: 2500,
  narratorVerifier: 1000,
  narratorCorrector: 6000,
  analyst: 8000,
  scorer: 800,
  market: 1200,
  bible: 1200,
  lens: 1200,
  conversation: 800,
} as const;
