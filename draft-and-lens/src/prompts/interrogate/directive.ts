import 'server-only';

import type { ReadingDepth } from '../../lib/interrogate';
import type { LensId } from '../lenses/types';
import { BEST_IN_CLASS } from './best-in-class';

/**
 * Push harder — the analyst half of Interrogate mode (Architecture §21b).
 *
 * WHAT THE MODE ADDS, and nothing else: the question the ordinary reading
 * leaves alone — whether the ambition was the right one — and, where the work's
 * tradition matches a lens, the standard that tradition sets for itself.
 *
 * THE APPROVED COPY IS THE SPEC. Three helper lines were approved before any of
 * this existed, and each promises a different reading. What is built here is
 * what each one says, and no more:
 *   • complete + matched — "whether the ambition was the right one … and show
 *     you what this tradition can do" → both halves.
 *   • excerpt — "what I won't do on an excerpt is set it beside the strongest
 *     work in the tradition" → the ambition half only. Ruled 2026-08-23; the
 *     standard is a whole-work standard and a passage judged against a finished
 *     book is not a fair reading.
 *   • no match — "doesn't map cleanly onto any of my thirty-five lenses, so I
 *     won't hold it against a specific standard — just against itself, at its
 *     fullest" → the ambition half, and the work's own ceiling instead of a
 *     tradition's. Approved 2026-08-26.
 * A promise the prompt does not keep is the failure INTERROGATE_ANALYSIS_LIVE
 * exists to prevent, so these three cases are separated here rather than left
 * to the model to infer from a lens id that may be null.
 *
 * WHY IT ATTACHES TO THE SYSTEM PROMPT and adds no report section: Nenad's
 * ruling, 2026-08-26, following AMBITION_AGAINST_EXECUTION. The question is as
 * live under VOICE AND NARRATOR as under TRADITION ALIGNMENT, and that heading
 * is not stable across modes — script calls it GENRE ALIGNMENT and stage play
 * does not have it at all.
 *
 * THE DISPOSITION IS UNCHANGED. Push harder is a harder reading, not a colder
 * one. The Mentor addendum's Part A still governs every word of it: developmental,
 * never directive; a reading, never a rewrite.
 *
 * THREE GUARDS ADDED 2026-08-28, EACH FROM A DEFECT IN THE FIRST REAL READING.
 * The tone risk §21b was built to catch did not materialise — the standard framed
 * questions and stayed a horizon. These three did, and none was visible to unit
 * tests, because each is a property of the prose the analyst wrote rather than of
 * the prompt it was sent. Verbatim evidence for all three is in SESSION_LOG.md
 * under the 2026-08-27 entry.
 *   • The four-word rule in `standardBlock`. "Do not quote these sentences back"
 *     was already there and the analyst drifted past it, returning Carver's
 *     "it lands, which is different" almost intact. A ban it can measure itself
 *     against replaces one it has to interpret.
 *   • Staying inside the matched tradition, also in `standardBlock`. The analyst
 *     matched `carver`, then moved the yardstick to Trevor — a sharper call, and
 *     a standard nobody researched. §21c's guarantee is that the comparison is
 *     always one of the thirty-five, so the substitution had to be closed even
 *     though the literary instinct behind it was sound.
 *   • Not narrating the reading, in `AMBITION_INTERROGATED` so all three cases
 *     get it. Push pressure made the reading self-conscious ("the reading's
 *     honest verdict is"), which is the machinery talk the editor's voice rule
 *     in CLAUDE.md forbids. Scoped here rather than to the whole analyst: it has
 *     only ever been seen under this mode. Promote it if an ordinary reading
 *     does it too.
 */

/** The ambition question. Every push-harder read gets this, matched or not. */
const AMBITION_INTERROGATED = `THE AMBITION ITSELF — MANDATORY, THIS READING ONLY:

The writer has asked to be pushed harder. The ordinary reading takes the work's ambition as given and asks how well it was executed. This reading does not. Ask the prior question: was this ambition the right one for this material?

That question has real answers in both directions, and you must be open to all of them: the ambition is right and the execution has not caught up; the ambition is smaller than the material deserves, and the work is settling for less than it has; the ambition is larger than this material can carry, and the strain shows; or the ambition and the material are correctly matched, which is worth saying plainly when it is true.

THIS IS NOT PERMISSION TO BE HARSH. It is permission to raise a question the ordinary reading holds back. The register does not change — developmental, specific, in the tradition's own vocabulary. A writer who asked to be pushed has asked for more exactness, not for severity, and a harsher tone would be answering a request they did not make.

EVIDENCE-GATED, like everything else: raise it only where you can quote the passage that shows it (⟦…⟧). Never speculate about intent beyond what the prose makes visible.

DO NOT NARRATE THE READING — MANDATORY: never make "the reading" the subject of a sentence and never announce its honesty, its verdicts, its duties or its difficulty. "The reading's honest verdict is", "the craft question the reading must answer honestly", "this reading will now push harder" — all wrong, and the first is wrong twice over, because a reading that advertises its own honesty invites the writer to wonder about the readings that did not. Say the thing instead of introducing it: the sentence that follows such a preamble is almost always the real note, and it is stronger with the preamble deleted. Name the question the WORK raises as much as you like — that is the reading doing its job. Just never describe the reading doing it.`;

/** What replaces the standard when nothing in the lens set fits the work. */
const NO_STANDARD = `NO BEST-IN-CLASS STANDARD FOR THIS WORK — DELIBERATE, NOT AN OMISSION:

This work's tradition did not match any of the thirty-five voices whose standards have been researched. Do NOT improvise one, and do NOT reach for the nearest tradition that half-fits — a standard from the wrong tradition is worse than none, because the writer cannot tell it is the wrong one.

Hold the work against ITSELF at its fullest instead: what would this piece be if it were doing everything it is already trying to do, as well as it could be done? That is a real standard and an exacting one. Say nothing about lenses, matching, or what could not be found — the writer has already been told, in the terms they chose, and repeating it here would be the reading explaining its own machinery.`;

/**
 * What replaces the standard on an excerpt — a different reason from a missing
 * match, and the analyst is told which one is true. Both suppress; only one of
 * them means nothing fitted.
 */
const EXCERPT_NO_STANDARD = `NO BEST-IN-CLASS STANDARD ON AN EXCERPT — DELIBERATE, NOT AN OMISSION:

This submission is an excerpt, so the standard its tradition sets for itself is withheld — it is a whole-work standard, and a passage held against a finished book is not a fair reading. This is true whether or not the tradition matched; do not reach for one anyway.

Hold the pages against what THEY are reaching for instead: at their fullest, doing everything they are already trying to do, as well as it could be done. The writer has already been told why the comparison is not being made, in the terms they chose. Do not explain it again in the reading.

`;

/** The standard for a matched tradition — whole works only. */
function standardBlock(lens: LensId): string {
  return `BEST-IN-CLASS FOR THIS TRADITION — WHAT THE STRONGEST WORK REACHES FOR:

${BEST_IN_CLASS[lens]}

HOW TO USE IT. This frames questions; it never delivers verdicts. Asking whether the piece is reaching for what the tradition's strongest work reaches for is the move. "This lacks X" is not: it converts a standard into a score, which is the one thing this mode must never become.

TRANSLATE IT INTO THIS WORK BEFORE YOU WRITE A WORD OF IT. The question you ask must be built from THIS story's own nouns — its objects, its characters, its scenes — not from the standard's vocabulary with a question mark added. Converting the standard into a question while keeping its wording is the specific failure, because the sentence still arrives in the standard's voice rather than the work's, and the writer receives a rubric wearing a question mark.
Illustrating the difference on an invented work — a story about clearing a dead man's flat; NOT the submission you are reading, and none of its details belong in your reading:
  • WRONG — the standard, rephrased: "Does each image carry double weight, surface meaning and something deeper simultaneously?"
  • RIGHT — the same demand, in that work's terms: "The unpaid gas bill is doing two jobs at once. Is the cat? Is the spare key?"
The right version is harder to write and it is the only one worth writing: it could only have been produced by someone who actually read the work.

It is a horizon, not a threshold. The work is not failing because it is not yet the strongest example of its tradition — almost nothing is. Name the specific distance between what this work is doing and what the tradition can do, in the tradition's own vocabulary, and name what the work would have to reach for to close it. Where the work is already there, say so with the same specificity.

Do NOT name this as a checklist or present it as an external authority the reading is deferring to. It is what you already know about the tradition, made explicit so the reading can use it.

NEVER REPRODUCE THE WORDING ABOVE — MANDATORY, AND MEASURABLE SO IT CANNOT BE DRIFTED PAST: do not reuse more than three consecutive words from this standard anywhere in the reading. Not as a quotation, not as a sentence of your own that happens to land on the same phrasing, and not with the ends trimmed off. Before writing any sentence about what the tradition's strongest work does, check it against the text above word by word; if a run of four or more words matches, rewrite it in the vocabulary of THIS work — its own objects, scenes and sentences. The standard is a brief to read from, never a phrase-book to write from. A writer who received these sentences back would be reading a rubric, which is precisely what this mode must never hand them.

STAY INSIDE THE MATCHED TRADITION — MANDATORY: the standard above is the ONLY standard this reading may hold the work against. It is the one whose demands have actually been researched, and it was matched to this work deliberately. You may refine WITHIN it — naming which region, decade or temperature of the tradition this work belongs to, and reading it at that precision — and you may mention other writers as lineage or context. What you must NOT do is transfer the comparison to a writer outside this tradition and make THEM the measure: "the tradition this story is working in — [other author], specifically" is the failure, and so is any sentence that moves the yardstick off the matched tradition and onto a name that arrived from your own reading rather than from the standard above. That substitution is invisible to the writer and it silently swaps a vetted standard for an unvetted one. If the match feels approximate, say so plainly in the work's own terms and keep reading against the standard you were given.`;
}

/**
 * The push-harder block appended to the analyst system prompt, or '' for an
 * ordinary reading.
 *
 * Returns '' for an ordinary reading, whatever else it is passed.
 *
 * `lens` is Brain 1's match and is null far more often than not — the
 * diagnostic vocabulary is open and the lens set is thirty-five voices, so no
 * match is an ordinary outcome rather than a failure.
 */
export function buildInterrogateDirective(
  depth: ReadingDepth,
  lens: LensId | null,
  submissionType?: 'complete' | 'excerpt'
): string {
  // The guard lives with the thing it guards. The caller checks too, but a
  // second caller that forgets would silently interrogate every reading — the
  // one outcome §21b forbids outright, since the mode is opt-in by design.
  if (depth !== 'push') return '';
  // Order matters. An excerpt is suppressed whether or not the lens matched —
  // the ruling is about the submission, not the match — and it must be told the
  // TRUE reason: an excerpt with a match that was sent NO_STANDARD would read
  // that nothing fitted its tradition, which is a lie the reading could repeat.
  const second =
    submissionType === 'excerpt' ? EXCERPT_NO_STANDARD : !lens ? NO_STANDARD : standardBlock(lens);
  return `\n\n${AMBITION_INTERROGATED}\n\n${second}`;
}
