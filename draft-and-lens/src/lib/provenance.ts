import 'server-only';

/**
 * Publication apparatus — the deterministic half of the lens-voice gate.
 *
 * THE PROBLEM. A writer pastes real published prose and gets a reading of it
 * as though it were their own: the tool tells a canonical author their prose
 * is thin, or a lens is asked to read its own author. It is also the obvious
 * plagiarism surface.
 *
 * NO AUTHOR LIST, by Nenad's ruling 2026-08-21. Nothing here enumerates
 * writers or works — such a list is unmaintainable and its false positives
 * cost more than the misses it prevents. This checks for the *apparatus of
 * publication*, which is a property of the paste, not of the prose.
 *
 * WHY BYLINES, TITLE PAGES AND COPYRIGHT LINES ARE NOT ON THIS LIST, though
 * the original sketch named them. They are exactly what a writer puts on their
 * OWN manuscript. "A Novel by Jane Smith" is the single most ordinary thing to
 * find at the top of a submitted draft, and "© 2026 Jane Smith" is a writer
 * asserting their own rights. Treating either as evidence of published work
 * would fire hardest on the most careful writers — the ones who format a
 * submission properly — and the accusation lands on someone who did nothing
 * wrong. The governing asymmetry is that a false positive is far worse than a
 * miss, and a miss here is explicitly accepted.
 *
 * What survives is the apparatus a publisher adds and an author never types:
 * rights language, permissions, ISBNs, the standard fiction disclaimer. These
 * appear when someone has copied a page, not when someone has written one.
 */

export interface ApparatusHit {
  /** Short, non-identifying label for telemetry. Never the matched text. */
  signal: string;
}

/**
 * Ordered by how unambiguous each one is. Every entry has to survive the same
 * question: would a writer ever type this into their own draft? If the answer
 * is "occasionally", it does not belong here.
 */
const SIGNALS: ReadonlyArray<{ signal: string; test: RegExp }> = [
  // Rights boilerplate. Writers assert copyright; they do not write the
  // reservation formula, which is a publisher's sentence.
  { signal: 'all-rights-reserved', test: /\ball rights reserved\b/i },
  { signal: 'no-part-may-be-reproduced', test: /no part of this (?:book|publication|work) may be reproduced/i },

  // Permissions — only ever present on reprinted matter.
  { signal: 'reprinted-by-permission', test: /\b(?:reprinted|reproduced|used)\s+(?:by|with)\s+permission\b/i },

  // Prior-publication statements.
  { signal: 'first-published', test: /\b(?:first|originally)\s+published\s+(?:in|by)\b/i },

  // Trade identifiers and cataloguing.
  { signal: 'isbn', test: /\bISBN(?:-1[03])?\b[:\s]/i },
  { signal: 'library-of-congress', test: /\blibrary of congress\b/i },

  // The standard disclaimer page. Distinctive enough to be safe, and paired
  // with its follow-on clause so a writer musing "this is a work of fiction"
  // in their own prose cannot trip it.
  {
    signal: 'fiction-disclaimer',
    test: /this is a work of fiction[.,][^.]{0,80}\b(?:names|characters|incidents|resemblance)\b/i,
  },

  // Print-run apparatus.
  { signal: 'printed-in', test: /\bprinted in the (?:united states|u\.s\.a\.|uk|united kingdom)\b/i },
];

/**
 * Does this submission carry the apparatus of a published edition?
 *
 * Checks the whole text rather than an opening window: apparatus clusters at
 * the front of a scanned page but can trail at the end of a copied extract,
 * and this costs nothing to run.
 *
 * Returns the first signal matched, for the telemetry event. Never returns the
 * matched text — nothing about a declined submission is stored.
 */
export function findPublicationApparatus(text: string): ApparatusHit | null {
  if (!text) return null;
  for (const { signal, test } of SIGNALS) {
    if (test.test(text)) return { signal };
  }
  return null;
}
