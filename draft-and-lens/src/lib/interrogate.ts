/**
 * Interrogate / "push harder" mode — the UI half only.
 *
 * WHAT EXISTS TODAY: the control, its label, its two pills, the helper line it
 * shows, and the line the reading carries when it was asked for. That is all.
 * None of it changes what the analyst is asked or what comes back. Architecture
 * §21b's two additions — questioning whether the ambition was worth attempting,
 * and showing best-in-class for the tradition — are NOT wired, because §21c
 * (best-in-class research, per tradition, from a craft-and-success angle) is a
 * hard prerequisite and has not started.
 *
 * WHY THE CLAIMS ARE BEHIND A FLAG. Architecture v6, Law — Mentoring and
 * interrogation are never faked: "No feature may simulate or fabricate mentor
 * output … or interrogate output (a best-in-class standard) without the genuine
 * input behind it. Where a capability cannot run, it is *described*, never
 * performed."
 *
 * A visible, selectable toggle DESCRIBES — a writer sees the capability exists.
 * Two strings here PERFORM, and both would be false today:
 *   • the helper line promises what this submission will do;
 *   • the report line asserts that the reading in front of them is one.
 * Both are therefore gated on INTERROGATE_ANALYSIS_LIVE, which stays false
 * until the analysis behind them is real. With the flag off the row behaves
 * exactly like the "Complete piece or excerpt?" row directly above it — pills
 * visible, selectable, no helper text — so nothing reads as broken.
 *
 * TO TURN IT ON, once §21c has landed and the analyst is actually running the
 * interrogated read: flip the flag. Both approved strings appear together.
 *
 * NOT SENT TO THE SERVER YET, deliberately. The choice lives in page state and
 * nothing persists it, so a reloaded reading cannot claim to be interrogated —
 * which is the same discipline the differentiator line and the nudges follow.
 * When the analysis is wired this becomes a submitted field and the SERVER
 * decides whether the report line appears, exactly as it decides for the
 * differentiator today. The client must never be the one making that call.
 *
 * COPY: approved by Nenad 2026-08-24, in full — the sub-label, both pills, both
 * forms of the helper line, and the report line. The proposal it was approved
 * from is in SESSION_LOG.md.
 */

/**
 * False until the interrogated read genuinely runs. Gates the two strings that
 * make a claim about the reading; never gates the control itself.
 */
export const INTERROGATE_ANALYSIS_LIVE = false;

/** How the writer asked to be read. Resets every submission — never sticky. */
export type ReadingDepth = 'read' | 'push';

export const READING_DEPTH_DEFAULT: ReadingDepth = 'read';

/** One rank below the numbered step headings, like "Complete piece or excerpt?" */
export const READING_DEPTH_SUBLABEL = 'How should I read it?';

export const READING_DEPTH_PILLS: ReadonlyArray<{ value: ReadingDepth; label: string }> = [
  { value: 'read', label: 'Read it' },
  { value: 'push', label: 'Push harder' },
];

/** What the reading carries at the top when it was asked for. */
export const INTERROGATE_REPORT_LINE = 'This is a Push harder reading.';

/**
 * What the reading carries instead when nothing in the lens set fitted it.
 * Approved by Nenad 2026-08-26.
 *
 * WHY IT IS A REPORT LINE AND NOT A THIRD HELPER FORM. It was approved
 * alongside the two helper lines and opens with HELPER_EXCERPT's own first
 * sentence, so its natural home looks like `interrogateHelperLine`. It cannot
 * live there. The helper renders under the pills BEFORE the writer submits,
 * and "this one doesn't map cleanly onto any of my thirty-five lenses" is a
 * claim about a work nobody has read yet — the editor would be asserting the
 * outcome of a reading that has not happened. Submission type is known in
 * advance and a match never is.
 *
 * So it goes where it becomes true: the top of the reading, chosen by the
 * server once Brain 1 has actually failed to match. The tense carries: it
 * states the terms of the reading below it, which is what an editor's opening
 * line does. Flagged to Nenad rather than reworded — the copy is approved as
 * written and this is placement, not text.
 */
export const INTERROGATE_REPORT_LINE_NO_MATCH =
  "I'll question the ambition itself, not just how far you got with it. This one doesn't map cleanly onto any of my thirty-five lenses, so I won't hold it against a specific standard — just against itself, at its fullest.";

/**
 * The goals-aware second sentence, approved 2026-08-23.
 *
 * "I'll hold it against what you said you're working on" was REJECTED and must
 * not come back: in British English "hold something against someone" reads as
 * resentment, the opposite of the intent.
 */
const HELPER_GOALS_SENTENCE = "I'll bear in mind what you told me you were trying to do.";

/**
 * The first sentence, in two forms.
 *
 * The excerpt form exists because of the 2026-08-23 ruling: on an excerpt the
 * mode still runs, but best-in-class is suppressed — it is a whole-work
 * standard. So the excerpt line must not promise the comparison it will not
 * make, and it names the reason rather than going quiet about it.
 */
const HELPER_COMPLETE =
  "I'll take the question the reading normally leaves alone — whether the ambition was the right one — and show you what this tradition can do.";

const HELPER_EXCERPT =
  "I'll question the ambition itself, not just how far you got with it. What I won't do on an excerpt is set it beside the strongest work in the tradition — that's a whole-work standard, and a passage judged against a finished book isn't a fair reading.";

/**
 * The helper line shown under the pills when "Push harder" is selected.
 *
 * Null whenever it must not be shown: the default depth (the panel stays quiet
 * in the ordinary case) and while the analysis is not live (it would promise
 * what the submission cannot deliver).
 */
export function interrogateHelperLine(
  depth: ReadingDepth,
  submissionType: 'complete' | 'excerpt' | null,
  hasGoals: boolean
): string | null {
  if (depth !== 'push') return null;
  if (!INTERROGATE_ANALYSIS_LIVE) return null;
  const first = submissionType === 'excerpt' ? HELPER_EXCERPT : HELPER_COMPLETE;
  return hasGoals ? `${first} ${HELPER_GOALS_SENTENCE}` : first;
}

/**
 * The line the reading carries, or null.
 *
 * Same gate as the helper: a reading that was not actually interrogated must
 * not say it was.
 *
 * DECIDED ON THE SERVER, from the diagnostic — the client knows what was asked
 * for but not what was found, and a reading must never claim a standard it was
 * not given. `matchedLens` is whether Brain 1 returned a lens the server
 * validated, never the client's guess.
 *
 * On an excerpt the plain line stands whatever the match was: the writer was
 * already told, in the helper line they chose from, that no standard is applied
 * to a passage. Repeating it at the top of the reading would say the same thing
 * twice and explain the machinery besides.
 */
export function interrogateReportLine(
  depth: ReadingDepth,
  matchedLens: boolean,
  submissionType: 'complete' | 'excerpt'
): string | null {
  if (depth !== 'push') return null;
  if (!INTERROGATE_ANALYSIS_LIVE) return null;
  if (submissionType !== 'excerpt' && !matchedLens) return INTERROGATE_REPORT_LINE_NO_MATCH;
  return INTERROGATE_REPORT_LINE;
}
