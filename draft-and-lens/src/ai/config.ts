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
 * Output length is fixed by the report structure (13-15 numbered sections
 * plus a verdict, regardless of submission length) — a 200-word piece and
 * a 10,000-word script both owe the same full analysis. So only the model
 * and thinking effort scale with word count; the token ceiling itself must
 * stay generous at every tier, or short submissions truncate mid-report.
 */
export function adaptiveAnalystConfig(wordCount: number): {
  model: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high';
  useThinking: boolean;
} {
  if (wordCount < 800) {
    // useThinking was false until 23 Jul 2026. Tested (A/B, real analyst prompt,
    // two separate sub-800/short-tier pieces): thinking ON was 31-47% FASTER at
    // this tier, not slower - the ladder's own data showed the <800 rung as the
    // single slowest of all four tested sizes, which this setting fully
    // explains. Quality read side-by-side both times: same tradition/craft
    // catches, same verdict, no degradation - if anything a tighter report
    // (fewer output tokens for the same substance). Do not revert without a
    // fresh A/B showing a regression.
    return { model: 'claude-sonnet-4-6', maxTokens: 16000, effort: 'low', useThinking: true };
  }
  if (wordCount < 3000) {
    return { model: 'claude-sonnet-4-6', maxTokens: 16000, effort: 'low', useThinking: true };
  }
  return { model: 'claude-opus-4-8', maxTokens: 16000, effort: ANALYST_EFFORT, useThinking: true };
}

// NOTE: the analyst's token ceiling is NOT here — it is set per-tier by
// adaptiveAnalystConfig() above (16000 at every tier). Do not add an
// `analyst` entry to this map; a stray ceiling here would silently
// contradict the real one and risk truncating reports.
export const TOKEN_LIMITS = {
  moderation: 200,
  diagnostician: 800,
  structuralReader: 2500,
  narratorVerifier: 1000,
  narratorCorrector: 6000,
  scorer: 800,
  market: 1200,
  bible: 1200,
  lens: 1200,
  conversation: 800,
} as const;
