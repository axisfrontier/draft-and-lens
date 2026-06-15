import 'server-only';

/**
 * Model assignments — verbatim from DraftAndLens.html fetch calls (Architecture §03).
 * Last reviewed: 2026-06-07
 */
export const MODELS = {
  diagnostician: 'claude-sonnet-4-6',
  structuralReader: 'claude-sonnet-4-6',
  narratorVerifier: 'claude-sonnet-4-6',
  narratorCorrector: 'claude-opus-4-7',
  analyst: 'claude-opus-4-7',
  scorer: 'claude-sonnet-4-6',
  market: 'claude-sonnet-4-6',
  bible: 'claude-sonnet-4-6',
  lens: 'claude-sonnet-4-6',
  conversation: 'claude-sonnet-4-6',
} as const;

/** Analyst adaptive thinking effort — tunable (prototype default: medium). */
export const ANALYST_EFFORT = (process.env.DL_ANALYST_EFFORT ?? 'medium') as 'low' | 'medium' | 'high';

export const TOKEN_LIMITS = {
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
