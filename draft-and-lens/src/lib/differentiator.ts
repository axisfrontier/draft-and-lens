import 'server-only';

/**
 * Differentiator messaging — the escalation (2026-08-02 handover §6, line 36).
 *
 * The subtle half of §6 has been live since Mentor Part B: where a revision
 * answered an earlier note, the reading says so plainly, demonstrating
 * persistence without ever claiming it. This is the other half — the one place
 * the product breaks toward directness and names its own method.
 *
 * TWO CONSTRAINTS DEFINE IT, and only one of them is enforceable here.
 *
 * 1. ONCE, NOT REPEATED — enforced, in the schema. Nenad's ruling 2026-08-20:
 *    once per WRITER, one showing per account, ever. See user_milestones.
 *
 * 2. "Only works if the feedback right after it is sharp and specific enough
 *    to validate the confidence in the same breath" (handover §6).
 *    **THIS IS NOT ENFORCED AND CANNOT BE, and nothing below pretends
 *    otherwise.** What can be checked deterministically is that the MEMORY is
 *    real — a genuine revision of a stored work, with actual prior notes
 *    retrieved from it. What cannot be checked is whether the reading that
 *    follows is any good. There is no measure of "sharp and specific" available
 *    at runtime that is not itself a guess, and a wrong guess here would let
 *    the product make its loudest claim over its weakest reading.
 *
 *    So the gate below is a MEMORY gate wearing no disguise. If the line ever
 *    lands next to a limp reading, that is this gap and not a bug. The
 *    mitigation is editorial, not technical: the copy must be modest enough
 *    that the surrounding reading can carry it. Which is a reason for Nenad to
 *    read the final wording against a mediocre reading, not only a good one.
 */

/**
 * FINAL COPY. Approved by Nenad 2026-08-21, re-confirmed word-for-word and
 * marked final 2026-08-23. Not a draft, not a placeholder, not open.
 *
 * DO NOT EDIT — not for tone, not for length, not while touching something
 * nearby. It is pinned character-for-character by a test in
 * `tests/lib/differentiator.test.ts`, which will fail on any change including
 * a swapped dash or apostrophe. If that test fails, the fix is to restore this
 * string, not to update the test. Changing it needs Nenad, and then both.
 *
 * The line fires ONCE PER ACCOUNT for the life of that account, so there is no
 * next reading to get it right — which is why it is pinned rather than trusted.
 *
 * Does what §6 asks and no more: names the method once, in the editor's own
 * voice, in the first person, with no comparison and no competitor. It claims
 * only that this reading was made against what came before — which the writer
 * has just seen demonstrated a paragraph above, rather than being told about
 * here.
 */
export const DIFFERENTIATOR_COPY =
  "I read this differently from the first time — against what you sent before, not on its own. That's what I mean by a reading.";

export interface DifferentiatorInput {
  /** resolveRevision returned 'revised' — genuinely changed text of a stored work. */
  isGenuineRevision: boolean;
  /** getPriorRevisionNotes returned real stored notes, not null. */
  hasPriorNotes: boolean;
}

/**
 * Does this reading have the memory behind it that the line claims?
 *
 * Both halves are required and neither is a proxy for the other. A revision
 * with no retrievable prior notes is a revision the reading could not actually
 * have read against — the analyst was handed null, by the no-fabrication law —
 * so the line would be asserting something that did not happen.
 *
 * Deliberately dull and total: every input is a fact the caller already holds,
 * which keeps this testable without a database and keeps the claim auditable.
 */
export function qualifiesForDifferentiator(input: DifferentiatorInput): boolean {
  return input.isGenuineRevision && input.hasPriorNotes;
}
