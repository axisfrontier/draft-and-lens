import 'server-only';

/**
 * What the writer is told when a lens did not read the whole piece.
 *
 * THE EDITOR'S VOICE, not the lens's — this is the editor saying what happened,
 * not Carver breaking character to discuss word counts.
 *
 * IT SAYS THE OPENING AND THE ENDING, NOT "THE FIRST N WORDS", because that is
 * what actually happens: the middle is what gets dropped. Copy describing a
 * front-truncation would be a tidier sentence about something the code does not
 * do, and the whole point of this notice is that the writer knows what was
 * behind the reading (Nenad's ruling, 2026-09-01).
 */
export function partialReadNotice(wordsRead: number, wordsTotal: number): string {
  return `This one's long, so I haven't read all of it here — the opening and the ending, about ${wordsRead.toLocaleString()} words of ${wordsTotal.toLocaleString()}, but not the middle. Everything below comes from those pages.`;
}
