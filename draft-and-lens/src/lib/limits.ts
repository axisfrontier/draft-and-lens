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
