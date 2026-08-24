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
 */
export function interrogateReportLine(depth: ReadingDepth): string | null {
  if (depth !== 'push') return null;
  if (!INTERROGATE_ANALYSIS_LIVE) return null;
  return INTERROGATE_REPORT_LINE;
}
