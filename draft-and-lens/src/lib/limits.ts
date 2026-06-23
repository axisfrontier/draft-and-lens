/**
 * Shared, non-secret limits — importable by BOTH client and server (no
 * `server-only`, no IP). Keeps the upload cap in one place so the paste box,
 * the API route, and the analyst's read window can't drift apart.
 */

/**
 * Tester-phase upload cap, in words. Chosen so that:
 *  - every reading stays UNDER the 5,000-word structural-reader threshold → the
 *    slow structural/narrator stages never run → fast (~10s) first feedback; and
 *  - the analyst's read window (≈28,000 chars) covers the whole capped piece, so
 *    nothing is silently under-read.
 * Raise this for full-length support later (with chunking), not before.
 */
export const TESTER_WORD_CAP = 4000;

/** Count whitespace-delimited words in a submission. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}
