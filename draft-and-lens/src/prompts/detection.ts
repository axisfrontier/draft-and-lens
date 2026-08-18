import 'server-only';

/**
 * Detection prompts — §9 Stage 3, two-pass (Nenad's ruling 2b, 2026-08-17).
 *
 * SCOPE: mechanical facts only. See the boundary comment in
 * src/lib/detection-gates.ts — it is the authority, and this file must not
 * widen it. Nothing here asks about pacing, intent, craft or meaning.
 *
 * WHY TWO PASSES AND NOT ONE STRICTER PASS.
 * A single call is asked "is this a contradiction?" and a model asked that
 * question tends to answer it — the framing invites confirmation, and a
 * plausible-sounding yes is exactly the failure §1.1 exists to prevent. The
 * second pass is not a repeat of the first at higher effort. It is given the
 * OPPOSITE job: find the innocent explanation. A candidate survives only if
 * someone actively looking for a reason it is fine cannot find one.
 *
 * That asymmetry is the whole point. Two passes asking the same question would
 * mostly agree with each other and buy nothing but cost.
 */

/** Pass 1 — does this look like the same claim, contradicted? */
export const DETECTION_ADJUDICATE_SYSTEM = `You compare two factual claims taken from different chapters of the same manuscript and decide whether they are genuinely incompatible.

You are checking MECHANICAL FACTS ONLY: names and their spelling, stated ages and dates, physical description, explicit stated rules of the world, and direct factual claims. You are NOT judging pacing, narrative technique, whether something is deliberate, or anything about craft. If the question in front of you is not a plain question of fact, answer "not_contradiction".

WHAT INCOMPATIBLE MEANS
Two claims are incompatible when both cannot be true of the same subject at the same point in the story. Not merely different — incompatible.

  Green eyes and brown eyes: incompatible.
  "Thirty-five" and "in her mid-thirties": COMPATIBLE. Different precision, same fact.
  "Tall" and "six foot two": COMPATIBLE. One is a description of the other.
  Katherine and Kathryn: incompatible IF it is the same person's name spelled two ways.
  A baker and a sailor: not necessarily incompatible — people change jobs, and a story showing that change is doing its work.

GRANULARITY IS NOT DISAGREEMENT. This is the mistake to avoid above all others. A vaguer statement and a precise one that could describe the same reality are compatible. Only call them incompatible when no single reality satisfies both.

RETURN ONLY JSON:
{"verdict":"contradiction"|"not_contradiction","reasoning":"one or two plain sentences","confidence":0.0-1.0}

reasoning is shown to the writer when this survives, so write it as an editor would say it aloud: what the two passages each establish, and why they cannot both stand. Never use the words error, mistake, or wrong.`;

/** Pass 2 — independent, adversarial. Its job is to EXCUSE the pair. */
export const DETECTION_VERIFY_SYSTEM = `A candidate contradiction has been identified between two claims in a manuscript. Your job is the opposite of finding it: work out whether there is an innocent explanation.

You are not re-checking whether the two statements differ. Assume they differ. The question is whether that difference has an ordinary explanation that means it is NOT the book contradicting itself.

EXPLANATIONS THAT MAKE A DIFFERENCE INNOCENT — look for each of these specifically:

1. DIFFERENT SPEAKER OR AUTHORITY. One is a character's claim, a belief, a rumour or a document, and the other is the narration. Characters are wrong, mistaken and lying constantly; that is ordinary fiction, not an inconsistency.

2. GRANULARITY. The two are the same fact at different precision — "thirty-five" and "mid-thirties", "tall" and "six foot two", "the north" and "Aberdeen". No contradiction exists.

3. LEGITIMATE CHANGE OVER TIME. The property can change and the story may be showing it changing — a job, a home, a marital status, a hair colour someone dyed. Ask whether the text treats it as a development.

4. THE TEXT CORRECTS ITSELF. One statement is explicitly revised, retracted or clarified by the manuscript — a character corrects themselves, the narration says "she had been wrong about that".

5. A DIFFERENT MOMENT IN TIME. A flashback, a memory, a dream, a time skip, a prologue set decades earlier. An age that differs is the most ordinary case of this there is.

6. A DIFFERENT SUBJECT. The two claims are about different people, places or things that share a name or were matched in error.

ON IDENTITY, WHEN THE NAMES DIFFER
This section applies ONLY when the two claims name the subject differently. If both name the subject the same way, identity is settled: it is not one of the explanations available to you, and it is not a reason to soften a verdict. Say nothing about whether they are the same person.

These two claims were matched under the same subject by an earlier step that read the whole chapter. Treat that as ONE SIGNAL — neither authoritative nor to be distrusted by default.

Read the passages and judge as a careful reader would. All of these are ordinary:
  - the same person under a nickname, a shortening, or a formal-versus-familiar form (Katherine / Kate / Kathy; Mrs Dell / Ms Dell)
  - one person whose name the narration spells inconsistently — which IS a real finding, and the kind this feature exists to catch
  - two genuinely distinct characters who share or resemble a name

The passages usually settle it. One person doing one continuous thing across both is the same person; two people in the same scene, or attached to different histories, relationships or places, are not. If the surrounding text genuinely does not settle it, say uncertain — do not resolve it by trusting the match, and do not resolve it by doubting the match.

HOW TO ANSWER
If you find a real, specific explanation grounded in what the quotes actually show — say so, name which one, and the candidate is dismissed.
If you find no explanation and both statements genuinely stand as the book's own claims about the same thing at the same time — say so, and it is confirmed.
If an explanation is plausible but you cannot tell from the quotes whether it applies — say THAT. Do not resolve it either way. Uncertainty is a real answer here and it is not a failure: it becomes a quieter flag phrased as a question, which is the honest thing to show a writer.

Default toward finding an explanation. A missed contradiction costs the writer nothing; a false one tells them their book is broken when it is not.

RETURN ONLY JSON:
{"verdict":"confirmed"|"dismissed"|"uncertain","explanation":"which explanation applies, or why none does","confidence":0.0-1.0}

explanation is shown to the writer. On "uncertain" it must state BOTH sides — why it might be a real contradiction and why it might not — because that is the entire content of the flag they will see.`;

export function buildAdjudicatePrompt(args: {
  entity: string;
  attribute: string;
  a: { value: string; quote: string; chapter: number | null; register: string | null };
  b: { value: string; quote: string; chapter: number | null; register: string | null };
  /** What the deterministic gates know and the model cannot see — chiefly
   *  whether the manuscript's timeline is known linear. Without this, pass 1
   *  fills the gap with an assumption ("years must have passed"), which
   *  resolves the exact uncertainty the gates flagged. */
  unknowns?: readonly string[];
}): string {
  const side = (s: typeof args.a, label: string) =>
    `${label}\n  states: ${s.value}\n  from chapter ${s.chapter ?? 'unknown'} (${s.register ?? 'register unknown'})\n  quote: "${s.quote}"`;
  const unknowns = args.unknowns?.length
    ? `\n\nWHAT IS NOT KNOWN ABOUT THIS MANUSCRIPT:\n${args.unknowns.map((u) => `  - ${u}`).join('\n')}\n\nDo not assume any of these away. If your answer depends on one of them being true, the claims are not clearly compatible — say so rather than picking the convenient reading.`
    : '';
  return `SUBJECT: ${args.entity}
PROPERTY: ${args.attribute}

${side(args.a, 'FIRST')}

${side(args.b, 'SECOND')}${unknowns}

Are these two claims incompatible?`;
}

export function buildVerifyPrompt(args: {
  entity: string;
  attribute: string;
  a: { value: string; quote: string; chapter: number | null; register: string | null };
  b: { value: string; quote: string; chapter: number | null; register: string | null };
  adjudication: string;
  /** The passage around each quote. Identity questions — is this the same
   *  person under two spellings? — cannot be answered from a quoted span
   *  alone; a reader answers them by reading around the line. */
  aContext?: string | null;
  bContext?: string | null;
  /** Explanations the deterministic gates have already ELIMINATED. Without
   *  this, pass 2 hedges on a flashback in a manuscript known to be linear —
   *  offering an explanation the data has already ruled out, which turns a
   *  clear contradiction into a needlessly soft "worth checking". */
  ruledOut?: readonly string[];
}): string {
  const side = (s: typeof args.a, label: string) =>
    `${label}\n  states: ${s.value}\n  from chapter ${s.chapter ?? 'unknown'} (${s.register ?? 'register unknown'})\n  quote: "${s.quote}"`;
  const ruled = args.ruledOut?.length
    ? `\n\nALREADY RULED OUT — do not offer these as explanations:\n${args.ruledOut.map((r) => `  - ${r}`).join('\n')}`
    : '';
  const ctx =
    args.aContext || args.bContext
      ? `\n\nTHE PASSAGES THEY COME FROM:\n\nAround the FIRST:\n${args.aContext ?? '(not available)'}\n\nAround the SECOND:\n${args.bContext ?? '(not available)'}`
      : '';
  return `SUBJECT: ${args.entity}
PROPERTY: ${args.attribute}

${side(args.a, 'FIRST')}

${side(args.b, 'SECOND')}${ctx}${ruled}

A first pass judged these incompatible, reasoning: "${args.adjudication}"

Is there an innocent explanation for the difference?`;
}
