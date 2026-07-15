import 'server-only';

import { BIBLE_SYSTEM, buildBiblePrompt } from '../../prompts/bible';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callTextBrain } from './_shared';

/**
 * Brain 5 — Character bible. Records only what is explicitly in the text — no
 * fabrication. Built unless the writer supplies one or opts to skip. Ported from
 * runBibleGeneration(). Returns '' on failure (non-fatal to the pipeline).
 */
export async function runBible(text: string, modeLabel: string): Promise<string> {
  const limit = 8000;
  const excerpt = text.length > limit ? text.slice(0, limit) + '\n[truncated]' : text;
  try {
    return await callTextBrain({
      model: MODELS.bible,
      maxTokens: TOKEN_LIMITS.bible,
      brain: 'bible',
      system: BIBLE_SYSTEM,
      user: buildBiblePrompt(modeLabel, excerpt),
    });
  } catch {
    return '';
  }
}
