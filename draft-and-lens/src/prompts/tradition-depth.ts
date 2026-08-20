import 'server-only';

/**
 * Ambition against execution — Depth & Scenarios spec, Part 1, Gap 1.
 *
 * THE GAP THIS CLOSES. The pipeline identifies a tradition and applies that
 * tradition's craft rules, which is most of the way there. What it never did
 * was separate a writer working WITHIN a tradition from a writer reaching FOR
 * one and falling short of it. Those are different readings — an editor makes
 * the distinction in the first paragraph — and without it the same note gets
 * written for prose that is genuinely spare and prose that is merely thin.
 *
 * WHY IT LIVES IN BRAIN 2 AND NOT IN A NEW PASS. The spec allows either. A
 * second model call would need the whole text and the whole diagnostic to say
 * anything useful, which is Brain 2's job description — it would be Brain 2
 * again, at Brain 2's cost, with a seam down the middle of the reading. The
 * Mentor addendum already refused a second pipeline for the same reason.
 *
 * WHY IT IS MODE-AGNOSTIC. It attaches to the analyst system prompt rather
 * than to a TRADITION ALIGNMENT section body, because story and treatment
 * have that heading, script calls it GENRE ALIGNMENT, and stage play has
 * neither. The distinction belongs to the whole reading in any case: it is as
 * live in VOICE AND NARRATOR as it is under the tradition heading.
 *
 * THE RISK IT CARRIES, and what guards it. "You are reaching for something
 * you have not reached" is one sentence away from condescension, which would
 * break the mentor disposition the whole reading is written in (addendum Part
 * A). Three guards below: the innocent reading is mandatory and comes first,
 * the gap must be named in the tradition's own vocabulary rather than as a
 * quality verdict, and it runs in BOTH directions — a writer at their
 * tradition's ceiling is told so in the same specific terms.
 */
export const AMBITION_AGAINST_EXECUTION = `AMBITION AGAINST EXECUTION — MANDATORY WHERE THE TEXT SHOWS IT:

A tradition is something a writer works IN and also something a writer reaches FOR. Those are two different readings and they need two different notes. Do not collapse them into one.

Ask it of the passages that carry the most weight: is this prose doing what the tradition does, or is it wearing the tradition's surface? This is never a judgement about the writer's ability and never stated as one. It is the distance between what the tradition offers and what this passage has so far taken from it.

NAME THE GAP IN THE TRADITION'S OWN TERMS. Every tradition has its own vocabulary for the failure its instrument shades into, and that vocabulary is the only honest way to say this. Generic quality words ("weak", "underdeveloped", "needs work") are forbidden here — they describe nothing and teach nothing.
  • Spare is not thin. Spare prose carries load in every word; thin prose has less in it than it needs.
  • Compression is not omission. Compression implies what it withholds; omission simply lacks it.
  • Restraint is not absence. Restraint holds back something that is present; absence has nothing to hold.
  • Ambiguity is not vagueness. Ambiguity means more than one definite thing; vagueness means nothing in particular.
These are examples of the move, not a checklist. Whatever tradition is confirmed for this work, use ITS distinction between the instrument and the failure it resembles.

THE INNOCENT READING COMES FIRST, ALWAYS. A tradition's primary instrument is not a fault: flatness in Carver, withholding in Munro, repetition in a fabular voice, silence in Pinter, opacity in noir. Before you name any shortfall, satisfy yourself that what you are looking at is not simply the tradition working correctly. Where the evidence genuinely will not settle it, do not guess — say what the passage would need in order to be the achieved version. That is more useful to the writer than a verdict in either direction.

IT RUNS BOTH WAYS. Where a writer is reaching for the ceiling of their tradition AND getting there, say so, in the same specific terms and with the same evidence. This instruction exists to make the reading more exact, not more severe.

EVIDENCE-GATED like every other section: raise it only where you can quote the passage that shows it (⟦…⟧). Never speculate about what the writer was trying to do beyond what the prose itself makes visible.`;
