import 'server-only';

import { callJsonBrain } from './brains/_shared';
import { MODELS, TOKEN_LIMITS } from './config';

/**
 * Content moderation gate (Code Prompt CHANGE 2).
 *
 * Runs BEFORE persistence and the main pipeline. Tuned for LITERATURE, not a
 * blunt filter: serious fiction legitimately depicts sex, violence, abuse, and
 * crime — that is allowed. Only the narrow prohibited set is blocked, with the
 * CSAM absolute on top. Err toward allowing serious work. Isolated and tunable
 * by design (the threshold is a human-in-the-loop problem, like the corpus).
 *
 * Fail-closed on classifier error: an unverifiable submission is treated as a
 * retryable error, never silently allowed.
 */

export type ModerationResult =
  | { status: 'allow' }
  | { status: 'block'; category: string }
  | { status: 'error' };

interface ModerationVerdict {
  block: boolean;
  category: string;
  reason: string;
}

/** Only the opening is needed to classify — keep the gate cheap and fast. */
const MODERATION_EXCERPT_CHARS = 6000;

const MODERATION_SYSTEM =
  'You are a content-safety gate for Draft & Lens, a tradition-aware LITERARY editorial tool. ' +
  'Writers submit fiction — film scripts, short stories, treatments, and stage plays. ' +
  'Serious literature legitimately depicts sex, violence, abuse, addiction, crime, and other dark or ' +
  'disturbing subject matter. That is literature, NOT a violation. Your job is NARROW: pass everything ' +
  'except a small prohibited set.\n\n' +
  'BLOCK the submission ONLY if it is one of:\n' +
  '1. CSAM — any sexual content involving a minor. Absolute: no literary exception, ever.\n' +
  '2. Content that is itself illegal to possess or transmit — e.g. genuine, actionable instructions for ' +
  'serious crime, or a real credible threat against real people.\n' +
  '3. Pornographic material with no literary purpose — sexual content whose only function is arousal, ' +
  'not part of a literary work.\n\n' +
  'Do NOT block:\n' +
  '- Depiction of sex, violence, abuse, or crime WITHIN a literary work.\n' +
  '- Dark, transgressive, morally complex, or upsetting fiction.\n' +
  'When uncertain, ALLOW. Err strongly toward allowing serious writing.\n\n' +
  'Return ONLY valid JSON, no prose, no markdown:\n' +
  '{"block": true or false, "category": "csam" | "illegal" | "porn" | "none", "reason": "one short sentence"}';

/** Classify a submission. Allow / block / error (error is fail-closed, retryable). */
export async function moderateSubmission(text: string): Promise<ModerationResult> {
  const excerpt =
    text.length > MODERATION_EXCERPT_CHARS ? text.slice(0, MODERATION_EXCERPT_CHARS) : text;

  let verdict: ModerationVerdict | null;
  try {
    verdict = await callJsonBrain<ModerationVerdict>({
      model: MODELS.moderation,
      maxTokens: TOKEN_LIMITS.moderation,
      brain: 'moderation',
      system: MODERATION_SYSTEM,
      user: 'SUBMISSION TO CLASSIFY:\n\n' + excerpt,
    });
  } catch {
    return { status: 'error' };
  }

  // Parse failure → fail-closed (treat as a retryable error, never silently allow).
  if (!verdict) return { status: 'error' };

  if (verdict.block === true) {
    return { status: 'block', category: verdict.category || 'unspecified' };
  }
  return { status: 'allow' };
}
