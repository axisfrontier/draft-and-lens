import 'server-only';

/**
 * Pattern extractor prompt — Gap 2, the structured half.
 *
 * IT READS THE REPORT, NOT THE MANUSCRIPT. That is the design, not an
 * optimisation. The reading has already judged the work under its confirmed
 * tradition, with every guard the corpus imposes; asking a second brain to
 * judge the prose again would be a second opinion nobody asked for, formed
 * without the diagnostic, and free to contradict the reading the writer just
 * read. This brain has one job: notice which of the corpus's named failures
 * the READING ITSELF claims, and hand back the sentence where it claims it.
 *
 * SO IT MAY ONLY RESTATE, NEVER JUDGE. Every candidate must carry a verbatim
 * sentence from the report, and one that cannot quote is dropped by the caller
 * rather than trusted. Same discipline as the continuity extractor, and for
 * the same reason: the value of the output is entirely in it being traceable.
 *
 * THE VOCABULARY IS CLOSED. Seven keys, each a failure the LearnedCorpus names
 * with its own principle. The model chooses one or returns nothing — free text
 * would make the same habit unmatchable across differently-worded readings,
 * and would let generic craft advice in through the side door.
 */

/** Every key, with the corpus's own definition — the model gets these verbatim. */
const VOCABULARY = `restatement (Principle 2) — the reading says the narrator explains, announces or states something the work had already made clear. Includes a character speaking their subtext aloud, and a final sentence that states the theme.

narrated_not_accumulated (Principle 5) — the reading says a development is told rather than earned: the reader is handed a conclusion without the experience that produces it. A character change delivered in a single speech rather than across pressured moments.

shrinking (Principle 7) — the reading says the narrator replaced an image's register with something smaller, flatter or wrong, rather than adding a dimension the image could not reach.

floating_abstraction (Principle 11) — the reading says an abstract phrase replaced concrete work the scene needed, announced significance the images had already earned, or gestured vaguely where specificity was available. NOT abstraction as such: the corpus defends load-bearing abstraction, and a reading praising an abstraction is not this.

unearned_ambiguity (Principle 13) — the reading says the reader is confused because the writing failed to commit, as distinct from ambiguity produced by precision, which the corpus calls a craft achievement.

borrowed_phrase (Principle 4) — the reading says generic, borrowed or received material sits against specific, hard-won material and loses the argument.

withheld_payoff (Principle 22) — the reading says the work ends without the emotional specificity its tradition's contract requires.`;

export interface PatternPromptContext {
  /** The confirmed tradition for this reading. Never guessed here. */
  tradition: string;
}

export function buildPatternExtractorSystem(ctx: PatternPromptContext): string {
  return `You are reading an editorial report that has already been written about a piece of writing. You are NOT reading the writing itself and you are not forming an opinion about it.

Your only job: identify which of the named craft tendencies below THE REPORT ITSELF claims about this piece, and quote the sentence where it does so.

THE CONFIRMED TRADITION OF THIS WORK IS: ${ctx.tradition}

THE VOCABULARY — these are the only things you may return:

${VOCABULARY}

RULES, ALL MANDATORY:

1. RESTATE, NEVER JUDGE. You may only report what the report already says. If the report does not claim one of these tendencies, it is not present. Never infer one from the writing, from your own reading of the quotes, or from what the report implies but does not say.

2. QUOTE OR DROP IT. Every tendency you return must carry a VERBATIM sentence from the report — copied exactly, not paraphrased, not stitched together from two places. If you cannot quote a sentence that plainly makes the claim, do not return that tendency.

3. TRADITION BINDS TWO OF THEM. \`withheld_payoff\` and \`borrowed_phrase\` are failures in some traditions and primary instruments in others. Return either ONLY if it is a failure in ${ctx.tradition}. Withheld emotional resolution is a broken contract in contemporary literary realism and is the instrument in crime, noir and much horror; a borrowed phrase only loses an argument where a juxtaposition is making one. If the tradition does not make it a failure, do not return it, however clearly the report describes it.

4. PRAISE IS NOT A TENDENCY. Reports name what a work does WELL as often as what it does badly. A report admiring load-bearing abstraction, earned ambiguity, or restraint that carries weight is describing a success — return nothing for it.

5. AT MOST THREE, and fewer is normal. A report claiming one tendency clearly is worth more than three claimed thinly. Returning an empty list is a correct and common answer.

Return ONLY JSON:
{"tendencies": [{"tendency": "<one key from the vocabulary>", "evidence": "<verbatim sentence from the report>"}]}`;
}

export function buildPatternExtractorUser(report: string): string {
  return `THE REPORT:\n\n${report}`;
}
