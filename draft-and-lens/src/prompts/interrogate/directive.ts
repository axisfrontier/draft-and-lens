import 'server-only';

import type { LensId } from '../lenses/types';
import { BEST_IN_CLASS } from './best-in-class';

/**
 * The interrogated read — now EVERY reading (Architecture §21b, merged 2026-09-01).
 *
 * This was an opt-in mode until 2026-09-01, when Nenad ruled it merged into
 * every reading and the READ IT / PUSH HARDER toggle removed. Nothing here is
 * conditional on a request any more, because there is no longer a request to
 * make: this is what a reading IS.
 *
 * ── PRESERVED VERBATIM FROM `INTERROGATE_ANALYSIS_LIVE`, NOW RETIRED ────────
 *
 * The flag that used to gate this is gone: when every reading is interrogated
 * there is no false claim left for it to stop, and a permanent `false` is the
 * orphaned-flag drift AUDIT_CHECKLIST.md exists to catch. Its reasoning is the
 * clearest statement in the repo of the v6 law in practice, and is kept here
 * word for word rather than paraphrased, because it still governs this file:
 *
 *   WHY THE CLAIMS ARE BEHIND A FLAG. Architecture v6, Law — Mentoring and
 *   interrogation are never faked: "No feature may simulate or fabricate mentor
 *   output … or interrogate output (a best-in-class standard) without the genuine
 *   input behind it. Where a capability cannot run, it is *described*, never
 *   performed."
 *
 *   A visible, selectable toggle DESCRIBES — a writer sees the capability exists.
 *   Two strings here PERFORM, and both would be false today:
 *     • the helper line promises what this submission will do;
 *     • the report line asserts that the reading in front of them is one.
 *   Both are therefore gated on INTERROGATE_ANALYSIS_LIVE, which stays false
 *   until the analysis behind them is real.
 *
 * WHAT THAT REASONING NOW REQUIRES, since the toggle it relied on is gone. The
 * toggle was the thing that DESCRIBED; without it, a reading that could not run
 * the comparison would neither perform it nor describe it — it would simply be
 * silent, and two readings differing in method would be indistinguishable to
 * the writer. That is the second clause of the law breaking, not the first:
 * nothing is fabricated (NO_STANDARD forbids improvising a standard), but
 * nothing is described either. So the description moved into the reading
 * itself — see `readingStandardLine` in src/lib/reading-standard.ts, which is
 * typed to return a string and never null, so no code path can be silent.
 * Nenad's ruling, 2026-09-01, Option B of five.
 *
 * ── WHAT THE READING DOES, and nothing else ────────────────────────────────
 *
 * The question a reading would otherwise leave alone — whether the ambition was
 * the right one — and, where the work's tradition matches a lens, the standard
 * that tradition sets for itself.
 *
 * THE APPROVED COPY IS STILL THE SPEC. Three helper lines were approved before
 * any of this existed, and each promised a different reading. The helper lines
 * themselves are gone with the toggle — they sat under pills nobody chooses any
 * more — but what they promised is what is built here, and no more. They remain
 * the specification even though they are no longer shown:
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
 * A promise the prompt does not keep is the failure the retired flag existed to
 * prevent, and the reason it is still prevented is that these three cases are
 * separated HERE rather than left to the model to infer from a lens id that may
 * be null. That separation is now the whole guarantee — there is no flag behind
 * it any more.
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
 *
 * TIGHTENED 2026-08-31, and the register work does NOT live here. Nenad's
 * review found the interrogated notes too long, too dense and too academic —
 * "a critical essay rather than a person giving you notes across a desk". The
 * A/B that followed found the cause was not this mode: an ordinary reading of
 * the same story came back LONGER (3,577 words against push's 3,314) and just
 * as third-person. The register is the analyst's house style, so the fix is
 * `HOW THESE NOTES ARE WRITTEN` in `analyst.ts`, which governs the whole
 * reading. Repeating it here would duplicate it and would leave the
 * interrogated notes in a different voice from the prose around them, which is
 * worse than the state it set out to fix.
 *
 * What changed here is only length: every block above says the same thing in
 * fewer words. Every guard is intact, and the phrasing the tests pin is
 * deliberately unchanged — those exact sentences are what closed the quoting
 * leak, and rewording them for style would have cost their provenance for
 * nothing.
 *
 * ONE ADDITION, approved by Nenad on review: `DO NOT DEFER TO IT IN THE PROSE`
 * in `standardBlock`. The second reading opened a section by citing Chekhov —
 * inside the researched set, so the stay-in-set rule was satisfied, but still
 * the reading deferring to an external authority. It was logged as flagged and
 * not fixed; it is fixed now.
 *   • Not narrating the reading, in `AMBITION_INTERROGATED` so all three cases
 *     get it. Push pressure made the reading self-conscious ("the reading's
 *     honest verdict is"), which is the machinery talk the editor's voice rule
 *     in CLAUDE.md forbids. Scoped here rather than to the whole analyst: it has
 *     only ever been seen under this mode. Promote it if an ordinary reading
 *     does it too.
 */

/** The ambition question. Every reading gets this, matched or not. */
const AMBITION_INTERROGATED = `THE AMBITION ITSELF — MANDATORY:

Do not take the ambition as given. Asking how well it was executed is only half the job. The prior question is the one to ask here: was this ambition the right one for this material?

Real answers run in every direction and you must stay open to all of them. The ambition is right and the execution has not caught up. It is smaller than the material deserves, and the work is settling. It is larger than this material can carry, and the strain shows. Or it is correctly matched, which is worth saying plainly when it is true.

THIS IS NOT PERMISSION TO BE HARSH. It is permission to raise a question a gentler reading would hold back. A writer wants more exactness, not more severity — and a harsher tone answers a request nobody made.

EVIDENCE-GATED, like everything else: raise it only where you can quote the passage that shows it (⟦…⟧). Never speculate about intent beyond what the prose makes visible.

DO NOT NARRATE THE READING — MANDATORY: never make "the reading" the subject of a sentence, and never announce its honesty, its verdicts, its duties or its difficulty. "The reading's honest verdict is", "the craft question the reading must answer" — both wrong, and the first twice over, because a reading that advertises its own honesty invites the writer to wonder about the ones that did not. Say the thing instead of introducing it. Name the question the WORK raises as much as you like; just never describe the reading doing it.`;

/** What replaces the standard when nothing in the lens set fits the work. */
const NO_STANDARD = `NO BEST-IN-CLASS STANDARD FOR THIS WORK — DELIBERATE, NOT AN OMISSION:

This work's tradition matched none of the thirty-five researched voices. Do NOT improvise one, and do NOT reach for the nearest tradition that half-fits — a standard from the wrong tradition is worse than none, because the writer cannot tell it is the wrong one.

Hold the work against ITSELF at its fullest: what would this piece be if it did everything it is already trying to do, as well as it could be done? That is a real standard and an exacting one. Say nothing about lenses, matching, or what could not be found — the writer has already been told, at the top of this reading.`;

/**
 * What replaces the standard on an excerpt — a different reason from a missing
 * match, and the analyst is told which one is true. Both suppress; only one of
 * them means nothing fitted.
 */
const EXCERPT_NO_STANDARD = `NO BEST-IN-CLASS STANDARD ON AN EXCERPT — DELIBERATE, NOT AN OMISSION:

This submission is an excerpt, so the standard its tradition sets for itself is withheld — that is a whole-work standard, and a passage held against a finished book is not a fair reading. True whether or not the tradition matched; do not reach for one anyway.

Hold the pages against what THEY are reaching for: at their fullest, doing everything they are already trying to do, as well as it could be done. The writer has already been told why the comparison is not being made. Do not explain it again in the reading.

`;

/** The standard for a matched tradition — whole works only. */
function standardBlock(lens: LensId): string {
  return `BEST-IN-CLASS FOR THIS TRADITION — WHAT THE STRONGEST WORK REACHES FOR:

${BEST_IN_CLASS[lens]}

IT FRAMES QUESTIONS, NEVER VERDICTS. Ask whether the piece is reaching for what the tradition's strongest work reaches for. "This lacks X" turns a standard into a score, which is the one thing this mode must never become.

It is a horizon, not a threshold. The work is not failing because it is not yet the strongest example of its tradition — almost nothing is. Name the specific distance between what this work does and what the tradition can do, and name what it would take to close it. Where the work is already there, say so with the same specificity.

TRANSLATE IT INTO THIS WORK BEFORE YOU WRITE A WORD OF IT. The question you ask must be built from THIS story's own nouns — its objects, its characters, its scenes — not the standard's vocabulary with a question mark added: that arrives in the standard's voice and hands the writer a rubric. Illustrated on an invented work, a story about clearing a dead man's flat — NOT the submission you are reading, and none of its details belong in your reading:
  • WRONG — the standard, rephrased: "Does each image carry double weight, surface meaning and something deeper simultaneously?"
  • RIGHT — the same demand, in that work's terms: "The unpaid gas bill is doing two jobs at once. Is the cat? Is the spare key?"
The right version is harder to write and it is the only one worth writing. It could only have come from someone who actually read the work.

NEVER REPRODUCE THE WORDING ABOVE — MANDATORY, AND COUNTABLE SO IT CANNOT BE DRIFTED PAST: do not reuse more than three consecutive words from this standard anywhere in the reading. Not as a quotation, not as a sentence of your own that happens to land on the same phrasing, not with the ends trimmed off. Check each sentence you write about the tradition against the text above word by word; if four or more words match, rewrite it in this work's own objects and scenes. The standard is a brief to read from, never a phrase-book to write from.

STAY INSIDE THE MATCHED TRADITION — MANDATORY: the standard above is the ONLY standard this reading may hold the work against. It is the one whose demands have been researched, and it was matched to this work deliberately. You may refine WITHIN it — naming which region, decade or temperature of the tradition this work belongs to — and you may mention other writers as lineage. You must NOT transfer the comparison to a writer outside this tradition and make THEM the measure: "the tradition this story is working in — [other author], specifically" is the failure. That substitution is invisible to the writer and silently swaps a vetted standard for an unvetted one. If the match feels approximate, say so plainly in the work's own terms and keep reading against the standard you were given.

DO NOT DEFER TO IT IN THE PROSE — MANDATORY: never present the standard, or any writer named in it, as an authority the reading is answering to. Opening a note by citing what a named master said and measuring the writer against it is the failure, even when that master is inside the researched set. This is what you already know about the tradition, made usable — not a citation.`;
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
  lens: LensId | null,
  submissionType?: 'complete' | 'excerpt'
): string {
  // The `depth !== 'push'` guard that used to open this function is gone with
  // the toggle (2026-09-01). It existed because interrogating a reading nobody
  // asked to be interrogated was the one outcome §21b forbade outright; the
  // merge makes that the intended outcome, so a guard against it would now be a
  // guard against the feature. Nothing replaces it — this function returns the
  // directive for every reading, and the only branch left is WHICH standard.
  //
  // Order matters. An excerpt is suppressed whether or not the lens matched —
  // the ruling is about the submission, not the match — and it must be told the
  // TRUE reason: an excerpt with a match that was sent NO_STANDARD would read
  // that nothing fitted its tradition, which is a lie the reading could repeat.
  const second =
    submissionType === 'excerpt' ? EXCERPT_NO_STANDARD : !lens ? NO_STANDARD : standardBlock(lens);
  return `\n\n${AMBITION_INTERROGATED}\n\n${second}`;
}
