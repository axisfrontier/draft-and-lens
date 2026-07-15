import 'server-only';

import { MARKET_SYSTEM, buildMarketPrompt } from '../../prompts/market';
import type { MarketResult } from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain } from './_shared';

/**
 * Brain 4 — Market. Studio/publisher matching + confidence-gated known-work
 * recognition (§14). Ported from runStudioMatching().
 */
export async function runMarket(
  text: string,
  modeLabel: string
): Promise<MarketResult | null> {
  const limit = 4000;
  const excerpt = text.length > limit ? text.slice(0, limit) + '\n[truncated]' : text;
  return callJsonBrain<MarketResult>({
    model: MODELS.market,
    maxTokens: TOKEN_LIMITS.market,
    brain: 'market',
    system: MARKET_SYSTEM,
    user: buildMarketPrompt(modeLabel, excerpt),
  });
}
