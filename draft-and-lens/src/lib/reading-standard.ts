import 'server-only';

/**
 * What every reading was measured against — and it always says.
 *
 * Was `src/lib/interrogate.ts`, the UI half of an opt-in mode. The mode merged
 * into every reading on 2026-09-01 and the toggle went with it, so the file is
 * renamed rather than left describing a mode that no longer exists: a filename
 * lagging its contents is a defect this repo has already paid for once
 * (`DraftAndLens_LearnedCorpus_v2.9.md`, whose own header says 2.11).
 *
 * WHAT IS GONE, and why none of it is coming back. `INTERROGATE_ANALYSIS_LIVE`,
 * `ReadingDepth`, `READING_DEPTH_DEFAULT` / `_SUBLABEL` / `_PILLS`,
 * `interrogateHelperLine`, and `INTERROGATE_REPORT_LINE` ("This is a Push
 * harder reading.") all described a choice the writer made. There is no choice
 * now, so a line announcing which branch they picked would be announcing
 * nothing. The flag's reasoning is preserved verbatim in
 * `src/prompts/interrogate/directive.ts` — it is the clearest statement in the
 * repo of the Architecture v6 law in practice and outlived the flag itself.
 *
 * ── WHY THIS FILE EXISTS AT ALL (Nenad's ruling, 2026-09-01, Option B of five)
 *
 * The v6 law says a capability that cannot run is "*described*, never
 * performed". Under the old design the TOGGLE did the describing: a writer who
 * chose Push harder read a helper line telling them exactly what they would and
 * would not get, so a reading that found no tradition match was not a surprise.
 * Remove the toggle and that description has nowhere to live. Nothing would be
 * fabricated — `NO_STANDARD` forbids improvising a standard — but nothing would
 * be described either, and two readings that differ in method would look
 * identical to the writer. The second clause of the law breaks, not the first.
 *
 * So the description moved into the reading. Every reading now opens by saying
 * what it was held against. **`readingStandardLine` returns `string`, never
 * `string | null`** — that is the guarantee, and it is in the type rather than
 * in a convention, because "no silent fallback, ever" is exactly the kind of
 * rule that erodes the first time someone adds a fourth case.
 *
 * REJECTED, and worth knowing before reopening this. Disclosing only the
 * no-match case (Option C) makes the line a negative signal: a writer who meets
 * it twice learns it means "my work didn't fit", which is a verdict on them
 * rather than a limit of a thirty-five-voice set, and that is backwards.
 * Disclosing inside the reading's own prose (Option D) was the better design
 * and was rejected as the SOLE mechanism because it is unenforceable — a
 * property of generated text, which 2026-08-28 established will drift and which
 * no unit test can see. D remains welcome in the directive; it cannot be the
 * guarantee.
 *
 * ── THE SERVER DECIDES, ALWAYS ─────────────────────────────────────────────
 *
 * `matchedLens` is whether Brain 1 returned a lens the server validated — never
 * the client's guess, and never the writer's request, because there is no
 * longer a request to make. The client knows what was submitted; only the
 * server knows what was found.
 *
 * `server-only`, which its predecessor was NOT. `interrogate.ts` had to be
 * importable by page.tsx because the toggle and its helper line lived in the
 * browser. Nothing here is: the route picks the line and streams it as text.
 * The guard makes the decision unimportable rather than merely unimported, so
 * no future client component can quietly start deciding what a reading claims
 * about itself — which is the one thing the server must never delegate.
 */

/**
 * The line for a work whose tradition Brain 1 matched.
 *
 * APPROVED COPY, ONE WORD CHANGED. This is `HELPER_COMPLETE`, approved by Nenad
 * on 2026-08-24 as the helper shown under the Push harder pill. The helper
 * surface is gone, so it moves here. The change is "the reading normally leaves
 * alone" → "a reading normally leaves alone": the definite article pointed at
 * Draft & Lens's own ordinary reading, which no longer exists as something to
 * contrast with. The indefinite article makes it a claim about editorial
 * practice at large, which is what the product actually differentiates against.
 *
 * ⚠ THE ONE-WORD CHANGE IS NOT YET APPROVED. Flagged to Nenad 2026-09-01.
 */
const MATCHED =
  "I'll take the question a reading normally leaves alone — whether the ambition was the right one — and show you what this tradition can do.";

/**
 * The line when nothing in the lens set fitted the work.
 *
 * APPROVED COPY, VERBATIM AND UNCHANGED. Approved by Nenad 2026-08-26 as
 * `INTERROGATE_REPORT_LINE_NO_MATCH`, and it was already a report line rather
 * than a helper — the original reasoning being that "this one doesn't map
 * cleanly onto any of my thirty-five lenses" is a claim about a work nobody has
 * read yet, so it could only become true at the top of the reading. That
 * reasoning is why this string needed no relocation and no rewrite.
 *
 * THE "THIRTY-FIVE LENSES" CLAUSE STAYS. It was proposed for removal as
 * machinery talk — the editor explaining her own apparatus. Nenad overruled,
 * 2026-09-01, with the reason: there is no toggle any more to have pre-warned
 * the writer, so the reading itself has to carry the whole explanation. It was
 * fine when the writer had just chosen from a menu; it is now the only place
 * the explanation can live. Do not "fix" this later on editor's-voice grounds
 * without reading this paragraph first.
 */
const NO_MATCH =
  "I'll question the ambition itself, not just how far you got with it. This one doesn't map cleanly onto any of my thirty-five lenses, so I won't hold it against a specific standard — just against itself, at its fullest.";

/**
 * The line for an excerpt, whatever Brain 1 matched.
 *
 * APPROVED COPY, VERBATIM. This is `HELPER_EXCERPT`, approved 2026-08-24,
 * relocated from under the pills to the top of the reading. Its tense already
 * works unchanged ("I'll … What I won't do"), which is the tell that it was
 * always describing the terms of a reading rather than a control.
 *
 * IT IS A THIRD CASE, NOT A VARIANT OF NO-MATCH, and conflating them would be a
 * lie in the writer's favour and against their interest. On an excerpt the
 * standard is withheld because it is a whole-work standard (ruling 2026-08-23),
 * NOT because nothing fitted — Brain 1 may well have matched a lens. Sending
 * the no-match line here would tell a writer their work belongs to no tradition
 * when the system decided otherwise, and sending the matched line would claim a
 * comparison that never ran. Either is the fake the v6 law forbids outright.
 */
const EXCERPT =
  "I'll question the ambition itself, not just how far you got with it. What I won't do on an excerpt is set it beside the strongest work in the tradition — that's a whole-work standard, and a passage judged against a finished book isn't a fair reading.";

/**
 * What this reading was held against. Never empty, by construction.
 *
 * ORDER MATTERS, and it is the same order the directive uses for the same
 * reason: an excerpt is suppressed whether or not the lens matched, because the
 * ruling is about the submission and not the match. Checking the match first
 * would send a matched excerpt the MATCHED line, promising a comparison the
 * directive is simultaneously being told to withhold — the reading and its own
 * opening line contradicting each other.
 *
 * The writer's goals are deliberately not mentioned here. `HELPER_GOALS_SENTENCE`
 * ("I'll bear in mind what you told me you were trying to do") was approved as
 * part of the helper and is not carried over: this line says what the work was
 * measured against, and goals already reach the analyst through their own
 * directive. Two subjects in one opening line is how an opening line becomes a
 * preamble.
 */
export function readingStandardLine(
  matchedLens: boolean,
  submissionType: 'complete' | 'excerpt'
): string {
  if (submissionType === 'excerpt') return EXCERPT;
  return matchedLens ? MATCHED : NO_MATCH;
}
