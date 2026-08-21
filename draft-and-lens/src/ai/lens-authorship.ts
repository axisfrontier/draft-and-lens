import 'server-only';

import { callJsonBrain } from './brains/_shared';
import { MODELS, TOKEN_LIMITS } from './config';

/**
 * Is the text in front of this lens the lens author's own published work?
 *
 * A NARROWER QUESTION THAN THE PROVENANCE GATE ASKS, and deliberately so. That
 * gate asks "do you recognise this?" and is forbidden from naming anyone,
 * because naming an author is a claim it cannot support and a list of authors
 * is what Nenad ruled out. This asks one binary question about ONE author who
 * is already named — the writer chose that lens — so no list is maintained and
 * nothing is enumerated. It is the same refusal to build a catalogue, applied
 * to a question the product is already in the middle of.
 *
 * THE FALSE POSITIVE HERE IS WORSE THAN A MISS, as everywhere else in this
 * area, and it has a particular flavour: a lens telling a writer "I wrote
 * this" about the writer's own prose is not merely wrong, it is the product
 * taking credit for their work. So the prompt carries the same anti-imitation
 * framing that measurably held on the provenance check — imitation is how
 * craft is learned, and prose that reads like an author is not that author —
 * and the confidence floor is high.
 *
 * FAILS OPEN in every direction: error, unparseable, missing fields, low
 * confidence. The lens simply reads the work as normal, which is what it was
 * asked to do.
 */

interface AuthorshipVerdict {
  isTheirs: boolean;
  confidence: number;
}

const EXCERPT_CHARS = 6000;

/** High, for the reason in the header. */
const CONFIDENCE_FLOOR = 0.85;

function buildSystem(authorName: string): string {
  return (
    `You are checking one thing about a passage of writing.\n\n` +
    `QUESTION: is this passage a piece of ${authorName}'s own published writing — text ${authorName} wrote and published?\n\n` +
    `This is NOT a question about style, influence or resemblance. Writers learn by working in the traditions they admire, and prose that reads like ${authorName} is almost always someone else writing well in that tradition. That is not a match.\n\n` +
    `Say yes only if you believe you have encountered THIS TEXT, in these words, as ${authorName}'s published work.\n\n` +
    `The cost of a wrong yes is telling a writer that their own work was written by somebody else. When in any doubt, say no.\n\n` +
    `Return ONLY JSON: {"isTheirs": boolean, "confidence": number between 0 and 1}`
  );
}

export async function isLensAuthorsOwnWork(text: string, authorName: string): Promise<boolean> {
  if (!text.trim() || !authorName.trim()) return false;
  try {
    const verdict = await callJsonBrain<AuthorshipVerdict>({
      model: MODELS.moderation,
      maxTokens: TOKEN_LIMITS.moderation,
      brain: 'lensAuthorship',
      system: buildSystem(authorName),
      user: text.slice(0, EXCERPT_CHARS),
    });
    if (!verdict || verdict.isTheirs !== true) return false;
    const confidence = typeof verdict.confidence === 'number' ? verdict.confidence : 0;
    return confidence >= CONFIDENCE_FLOOR;
  } catch {
    return false;
  }
}
