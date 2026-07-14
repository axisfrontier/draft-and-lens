import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

export { LENS_IDS, type LensId, type LensMeta, type LensCategory } from './types';
export { LENS_META } from './meta';
export { LENS_SYSTEM_PROMPTS } from './prompts';

import type { LensId } from './types';
import { LENS_SYSTEM_PROMPTS } from './prompts';

/** Port of getLensSystemPrompt() — tradition is locked from Brain 1. */
export function getLensSystemPrompt(
  id: LensId,
  tradition?: string,
  register?: string,
  ambition?: string
): string {
  const base = LENS_SYSTEM_PROMPTS[id];
  if (!tradition) return base;
  return (
    base +
    `\n\nCONFIRMED TRADITION: ${tradition}\nREGISTER: ${register ?? ''}\nAMBITION: ${ambition ?? ''}\n\nApply your specific craft intelligence to this tradition. Do not re-identify it.`
  );
}
