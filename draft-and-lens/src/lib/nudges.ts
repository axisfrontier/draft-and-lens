import 'server-only';

import type { Milestone } from './user-milestones';

/**
 * Contextual nudges — Depth & Scenarios spec, Part 3.
 *
 * A quiet line, at most one per reading, shown when something the writer
 * cannot see just happened or is about to become available to them. It is not
 * marketing inside the report: it names a capability at the only moment that
 * capability is true.
 *
 * WHAT KEEPS IT FROM BECOMING CLUTTER — three limits, all enforced here or in
 * the schema rather than by whoever adds the next one:
 *   • ONE PER READING, hard. selectNudge returns a single nudge or nothing.
 *   • ONCE PER WRITER, ever. Each nudge claims its own row in user_milestones,
 *     the same primary-key guarantee the differentiator line uses, so a nudge
 *     cannot reappear on a later reading even if its trigger fires again.
 *   • NEVER ALONGSIDE THE METHOD LINE. If the differentiator fired in this
 *     reading, no nudge is offered at all. Both are quiet italic asides in the
 *     writer's peripheral vision; two of them in one reading is the exact
 *     clutter the spec's one-per-reading rule exists to prevent, and the
 *     method line is the more important of the two.
 *
 * ORDER OF PRIORITY, and why it differs from the spec's table order: what
 * actually happened beats what might happen next. A writer whose chapter just
 * contributed facts to a ledger is told about the ledger, even if this is also
 * their first reading — the spec's own rule is that a nudge appears when the
 * feature "was actually used or is directly applicable", and one of those is
 * stronger evidence than the other.
 *
 * COPY: the two live lines are approved (Nenad, 2026-08-21). A third, for the
 * writer's third submission, is written and NOT shipped — see the note above
 * selectNudge's last branch.
 */

export interface NudgeContext {
  /** Submissions stored for this writer BEFORE this one. Zero on a first reading. */
  priorSubmissions: number;
  /** Facts this submission contributed to a manuscript ledger. */
  factsExtracted: number;
  /** The differentiator method line already appeared in this reading. */
  differentiatorShown: boolean;
  /** A writer pattern was named in this reading. */
  patternShown: boolean;
}

export interface Nudge {
  milestone: Milestone;
  text: string;
}

/** APPROVED — Nenad, 2026-08-21. */
const LEDGER_TRACKING: Nudge = {
  milestone: 'nudge_ledger_tracking',
  text: "I'm tracking names and details across your chapters now.",
};

/** APPROVED — Nenad, 2026-08-21. */
const REVISION_MEMORY: Nudge = {
  milestone: 'nudge_revision_memory',
  text: "If you resubmit this revised, I'll read it against what I said here.",
};

/**
 * The one nudge this reading earns, or nothing.
 *
 * Pure and total, so the whole policy is testable without a database and
 * cannot drift from what the route actually does.
 */
export function selectNudge(ctx: NudgeContext): Nudge | null {
  // One quiet aside per reading, and a nudge is the least important of the
  // three that can claim it. The method line is once-in-an-account; a named
  // pattern is an observation about the writer drawn from their whole body of
  // work. A capability hint yields to both.
  if (ctx.differentiatorShown || ctx.patternShown) return null;

  // Something that just happened, and that the writer has no other way to see.
  if (ctx.factsExtracted > 0) return LEDGER_TRACKING;

  // A first reading: the memory this product runs on does not exist yet, and
  // the writer has no reason to know it would if they came back.
  if (ctx.priorSubmissions === 0) return REVISION_MEMORY;

  // NOTHING FOR THE THIRD SUBMISSION, deliberately.
  //
  // The line written for it — "The more you send me, the more I'll notice
  // across your work." under the reserved key `nudge_keep_sending` — promises
  // cross-submission pattern recognition, which is Gap 2 and does not exist.
  // Nenad approved the other two on 2026-08-21 and did not rule on this one.
  // Firing it would spend the writer's single showing of that line on a claim
  // the product cannot keep, and a nudge shown once is shown once forever.
  //
  // To ship it the day Gap 2 lands: restore the constant and a
  // `ctx.priorSubmissions === 2` branch above this comment.
  return null;
}

/**
 * NOT IMPLEMENTED, and deliberately so — the two remaining catalogue entries.
 *
 * • "When you're ready to send the whole chapter, I'll read it properly."
 *   Belongs under the fragment redirect, which is a different surface with a
 *   different transport (/api/converse streams it, and nothing there claims
 *   milestones). It needs its own wiring, not a branch here.
 *
 * • "If you want to know how this tradition handles this problem, ask me
 *   below." Requires knowing that the reading identified an ambition-execution
 *   gap. There is no deterministic signal for that — Brain 2 writes prose, and
 *   detecting the gap by pattern-matching the report for words like "thin"
 *   would fire on readings that merely used the word. A nudge that guesses
 *   wrong claims the writer's one showing of it forever, so it stays unbuilt
 *   until there is a real signal to gate on.
 */
