import 'server-only';

/** Shared report-structure language for all three mode builders (story /
 *  script / treatment). Kept in one place so the evidence-gating rule and the
 *  single revision list read identically across modes. Server-only — never
 *  reaches the client bundle (IP boundary). */

export const EVIDENCE_GATING = `EVIDENCE-GATED SECTIONS — MANDATORY. The headings below are the full menu of lenses available for this reading, not a checklist to complete. Include a section ONLY where the submitted text gives you specific, quotable evidence for it — a passage you can point to. OMIT any section you could only fill by generalising, speculating, or restating a point already made under another heading. A short reading that says only what the text earns is correct; a long reading padded to cover every heading is a failure. Do not announce or apologise for an omitted section — simply leave it out. An omitted section is not an incomplete one.

ALWAYS INCLUDE, regardless of length: OVERVIEW, WHAT IS WORKING, WHAT TO REVISE, WHERE TO GROW NEXT, and the VERDICT. Every other heading earns its place by evidence.

NEVER CROSS-REFERENCE ANOTHER SECTION — MANDATORY. Do not direct the reader elsewhere in the report ("discussed further under IMAGERY", "see REVISION NOTES", "as noted above"). Because section inclusion is evidence-gated, a section named in one of these references may not exist in the finished report — a reader sent to a section that was never written is a broken reading. Every section must be self-contained: if a point belongs in two places, make it in full where it matters most and let every other section stand on its own, with no pointer back or forward.

COMPLETE WHAT YOU INCLUDE. Any section you include must be finished in full — never end a section mid-sentence or mid-list; if a numbered list begins, it must end.

Restating one observation under a second heading — the same note reworded as "voice", then "theme", then "revision" — is the failure this instruction exists to prevent (see the DEDUPLICATION rule and Principle 2). One observation, one home.`;

export const WHAT_TO_REVISE = `The single, prioritised list of revisions this reading recommends — every actionable note in ONE place, ranked by impact, most important first. This is the ONLY revision list in the report: do not also produce an action plan, craft directives, or a separate "where to begin" — they collapse into this one list.
For each item: name the specific moment with a quoted phrase (⟦…⟧) from the text; state the revision in one line, directive register ("cut", "raise", "show"); give a one-line reason it matters to THIS work.
Mark the top two or three items with a bold **START HERE** — the highest-impact fixes. For those top items only, you may add two or three sentences that teach the move (demonstrate the technique on that one instance; never rewrite the writer's line — the teaching-the-move law). Lower-priority items stay to a single line each.
End with one line: what to PROTECT — the genuine strength the next draft must not lose. Addressed to the writer, like the rest of the reading.`;

/**
 * The closing developmental note — the mentor register's one structural
 * element (Mentor addendum, Part A).
 *
 * Deliberately NOT folded into WHAT TO REVISE, though both close the reading.
 * That list is about the draft: ranked, directive, "cut / raise / show".
 * This is about the writer, and collapsing the two would lose the distinction
 * the whole editor-and-mentor design rests on — one voice, two registers.
 * v2.10 collapsed four prescriptive tails into one list precisely so that
 * list could be unambiguous; this is not a fifth tail returning, it is the
 * other register.
 *
 * In the always-include set because the addendum is explicit that a FIRST
 * read shows it too. It is the one part of the reading that does not have to
 * earn its place by evidence about the text — it earns it by there being a
 * writer.
 */
export const WHERE_TO_GROW_NEXT = `ONE forward direction for the WRITER — not for this draft. Everything above says what this piece needs; this says what you could build next, on your own terms — and it is addressed to the writer directly, as the whole reading now is.
Draw it from what this reading has already shown: a strength that could carry further, or a habit whose opposite is worth practising. It must follow from evidence in THIS text — never from a general idea of what writers ought to do, and never a craft platitude that would fit any submission.
Developmental, never prescriptive. "You could take this toward…", never "you should do X to make this good". This is about the writer's capacity, not about the correct form of the work: warmth here must not become a softer rubric, it never prescribes a correct version, and it never rewrites a line.
Two or three sentences. No list, no headings, no quoted revision instructions — those belong above.
NEVER INVENT A HISTORY YOU DO NOT HAVE. Unless prior readings of this work are supplied to you, there is no "last time" and no "you tend to" — write developmentally about what is on the page in front of you and imply no past you were not given.`
