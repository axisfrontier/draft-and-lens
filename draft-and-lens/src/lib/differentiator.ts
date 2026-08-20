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
 * PLACEHOLDER COPY — NOT FINAL, NOT APPROVED, AND NOT TO BE SHIPPED AS IS.
 *
 * The handover's own draft is marked "(draft, not final copy)" and its closing
 * instruction is explicit: do not guess at how prominent this should be, flag
 * before escalating to anything more visible. This exists so the mechanism can
 * be built and tested end to end; the wording is Nenad's and comes back for
 * approval before the migration that switches it on is applied.
 *
 * What it has to do, per §6: name the method once, in the product's own voice,
 * without comparison and without naming a competitor — the claim is that this
 * reading was made against what came before it, which the reader has just seen
 * demonstrated a paragraph earlier.
 */
export const DIFFERENTIATOR_PLACEHOLDER_COPY =
  'A note on how I read, once and then not again: I read this against your last draft, not on its own. That is the whole difference between a reading and a report — and you have just seen it, above, rather than been told it here.';

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
