import 'server-only';

import { SCORER_SYSTEM, buildScorerPrompt } from '../../prompts/scorer';
import type { AnalysisMode, ScoreResult } from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain } from './_shared';

/**
 * Brain 3 — Scorer. Craft + tradition-alignment scores and arc beats.
 * Treatment-aware (scores dialogue as promise, never penalises the form).
 * Ported from runDashboardScores().
 */
export async function runScorer(
  text: string,
  mode: AnalysisMode,
  tradition: string
): Promise<ScoreResult | null> {
  const limit = 6000;
  const excerpt = text.length > limit ? text.slice(0, limit) + '\n[truncated]' : text;
  return callJsonBrain<ScoreResult>({
    model: MODELS.scorer,
    maxTokens: TOKEN_LIMITS.scorer,
    brain: 'scorer',
    system: SCORER_SYSTEM,
    user: buildScorerPrompt(mode, tradition, excerpt),
  });
}
