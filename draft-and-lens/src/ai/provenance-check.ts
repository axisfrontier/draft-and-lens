import 'server-only';

import { callJsonBrain } from './brains/_shared';
import { MODELS, TOKEN_LIMITS } from './config';

/**
 * The soft half of the lens-voice gate — "I think I've read this before".
 *
 * WHY IT IS NOT PART OF THE MODERATION CALL, though that call already exists,
 * already runs before the pipeline, and already reads the opening 6,000 chars.
 * The two gates have OPPOSITE failure postures and must not share a request.
 * Moderation fails CLOSED: an unverifiable submission is refused, because the
 * cost of letting the prohibited set through is unbounded. This fails OPEN: a
 * miss is explicitly accepted (Nenad, 2026-08-21 — "literary commentary on
 * submitted text carries no meaningful legal exposure"), and the cost of a
 * wrong refusal is an innocent writer accused of plagiarism. Folding a
 * fail-open question into a fail-closed call means one parse error either
 * blocks a legitimate submission or silently disarms the safety gate,
 * depending which default wins. They stay separate.
 *
 * Cost is a small JSON call on the opening only, issued concurrently with
 * moderation, so it adds no wall-clock to a submission.
 *
 * NO AUTHOR LIST AND NO NAMING. The model is asked whether it recognises the
 * passage — not who wrote it, and it is told not to say. A name would invite
 * the product to repeat it back, and "this is Carver" is a claim it cannot
 * actually support; "I think I recognise this" is a true statement about its
 * own state. That distinction is the whole design.
 */

export type ProvenanceResult =
  /** Nothing recognised, or the check could not run. Proceed. */
  | { status: 'clear' }
  /** High-confidence recognition. Ask the writer; never accuse. */
  | { status: 'recognised' };

interface ProvenanceVerdict {
  recognised: boolean;
  confidence: number;
}

/** The opening is enough — published prose is recognisable from its first page. */
const EXCERPT_CHARS = 6000;

/**
 * Deliberately high. The asymmetry is the design: a miss costs a reading that
 * should not have happened; a false positive costs a writer being told their
 * own work is somebody else's.
 */
const CONFIDENCE_FLOOR = 0.85;

const SYSTEM =
  'You are a provenance check for a literary editorial tool. You are shown the opening of a ' +
  'submission. Answer ONE question: do you recognise this specific text as an existing, ' +
  'previously published work?\n\n' +
  'This is NOT a question about quality, style, or influence. Prose that reads like a known ' +
  'author is not a match — writers work in traditions, and imitation is how craft is learned. ' +
  'Only say yes if you believe you have encountered THIS TEXT, in these words.\n\n' +
  'Do NOT name the work or the author. You are not being asked who wrote it, and naming it ' +
  'would be a claim you cannot support.\n\n' +
  'The cost of a wrong yes is a writer being told their own work is somebody else\'s. When in ' +
  'any doubt at all, say no.\n\n' +
  'Return ONLY JSON: {"recognised": boolean, "confidence": number between 0 and 1}';

/**
 * Fails open in every direction — model error, unparseable JSON, missing
 * fields, low confidence. Every one of those returns 'clear' and the reading
 * proceeds, which is the accepted miss.
 */
export async function checkProvenance(text: string): Promise<ProvenanceResult> {
  try {
    const verdict = await callJsonBrain<ProvenanceVerdict>({
      model: MODELS.moderation,
      maxTokens: TOKEN_LIMITS.moderation,
      brain: 'provenance',
      system: SYSTEM,
      user: text.slice(0, EXCERPT_CHARS),
    });
    if (!verdict || typeof verdict.recognised !== 'boolean') return { status: 'clear' };
    if (!verdict.recognised) return { status: 'clear' };
    const confidence = typeof verdict.confidence === 'number' ? verdict.confidence : 0;
    return confidence >= CONFIDENCE_FLOOR ? { status: 'recognised' } : { status: 'clear' };
  } catch {
    return { status: 'clear' };
  }
}
