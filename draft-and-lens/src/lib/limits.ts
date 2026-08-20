/**
 * Shared, non-secret limits — importable by BOTH client and server (no
 * `server-only`, no IP). Keeps the upload cap in one place so the paste box,
 * the API route, and the analyst's read window can't drift apart.
 */

/**
 * Tester-phase upload cap, in words — and, as of the Word Cap standing
 * decision (2026-08-20), the ONLY word-count boundary anywhere in the system.
 * Above it the route rejects before any brain runs; below it every brain runs
 * at every length and scales to what it is given.
 *
 * It still holds the property that matters for coverage: the analyst's read
 * window (≈28,000 chars) covers the whole capped piece, so nothing is
 * silently under-read.
 *
 * The other reason recorded here — that the cap kept every reading under the
 * structural reader's own threshold, so the slow structural/narrator stages
 * never ran — no longer applies, and had stopped being true before it was
 * removed: that threshold was 4,000, not the 5,000 written here, so the two
 * numbers met and a submission of exactly 4,000 words ran the stages anyway.
 *
 * Raise this for full-length support later (with chunking), not before.
 */
export const TESTER_WORD_CAP = 4000;

/** Count whitespace-delimited words in a submission. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Below this, a submission is offered fragment mode instead of a full reading.
 *
 * READ THIS BEFORE MOVING IT, because it sits against a standing decision.
 * The Word Cap standing decision (2026-08-20) says the submission ceiling is
 * the only word-count boundary and that no brain gates on length internally.
 * This is NOT such a gate, and the distinction is the whole justification:
 *
 *   • It is not inside any brain. Every brain still runs at every length it is
 *     given, exactly as that decision requires — nothing is skipped, degraded,
 *     or returned null because a piece is short.
 *   • It does not silently reroute. It ASKS, which is the fragment spec's
 *     governing principle: when context is insufficient for the method to run
 *     cleanly, ask rather than proceed. The cost of a wrong guess is one click,
 *     not a wrong answer — which is what makes this a different kind of
 *     boundary from the dead zone, where being on the wrong side silently
 *     disabled a feature and produced a null nobody could see.
 *
 * WHY A NUMBER EXISTS AT ALL: a reading is a report whose always-include set
 * (shared.ts) demands an overview, at least three quoted strengths, revisions,
 * a growth note and a verdict. Thirty words cannot support that, and what came
 * back from trying was 200 seconds of pipeline ending in a Studios section —
 * confident nonsense, which the spec names as one of the two failure modes
 * that would discredit the product.
 *
 * 200 IS A PRODUCT NUMBER, NOT A DERIVED ONE. It is deliberately low: it is
 * the point below which a full reading is not honest, not the point below
 * which fragment mode is nicer. Nenad owns it and it moves in one line.
 */
export const FULL_READING_MIN_WORDS = 200;
