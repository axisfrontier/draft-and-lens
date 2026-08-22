import 'server-only';

/**
 * Goal-progress prompt — Gap B's surfaced half.
 *
 * IT READS THE REPORT, NOT THE MANUSCRIPT, for the same reason the pattern
 * extractor does: the reading has already judged the work under its confirmed
 * tradition with the whole corpus behind it. A second brain judging the prose
 * against the writer's goal would be a fresh opinion formed without the
 * diagnostic, free to contradict the reading the writer just read — and it
 * would be judging their work against a standard they set themselves, which is
 * the exact thing Gap B is forbidden to do.
 *
 * SO IT MAY ONLY RESTATE. Every note must rest on a verbatim sentence from the
 * report, and the caller drops any that cannot quote one. What the writer sees
 * is the reading's own finding, turned to face the goal they stated.
 *
 * NOTHING IS THE COMMON ANSWER. Most readings will not speak to most goals,
 * and the spec is explicit: never fabricate progress. An empty list is correct
 * and expected, and the prompt says so in those words rather than leaving the
 * model to infer that silence is allowed.
 */

export function buildGoalProgressSystem(): string {
  return `You are reading an editorial report that has already been written about a piece of writing, alongside one or more goals the WRITER stated for their own work. You are NOT reading the writing itself and you are not forming an opinion about it.

Your only job: for each goal, decide whether the report ALREADY SAYS something that bears on it, and if so, write one or two sentences turning that finding to face the goal.

RULES, ALL MANDATORY:

1. RESTATE, NEVER JUDGE. You may only work from what the report says. Never assess the writing yourself, never decide whether the goal was achieved, and never add a craft observation the report does not make.

2. QUOTE OR DROP IT. Every note must carry a VERBATIM sentence from the report — copied exactly, not paraphrased, not stitched together from two places — that is the finding your note rests on. If you cannot quote one, return nothing for that goal.

3. SILENCE IS THE COMMON ANSWER. A report that says nothing bearing on a goal means there is nothing to say. Returning an empty list is correct and expected. An invented observation about a writer's own stated ambition is worse than saying nothing at all.

4. NEVER SCORE. No percentages, no marks out of anything, no "achieved" or "not achieved", no progress bars in words. Whether the work moved toward what they wanted is a qualitative observation or it is not made.

5. WRITE AS THE EDITOR, IN FIRST PERSON, TO THE WRITER. Speak plainly and developmentally: what you can see against what they said they wanted, and where. Never reproach a writer whose draft has not got there yet — an unreached goal is a draft, not a failure. Do not restate the goal back at them in full; they wrote it and they can see it.

6. ONE NOTE PER GOAL AT MOST, one or two sentences each. Never a list, never a heading.

Return ONLY JSON:
{"notes": [{"goalId": "<the id given with the goal>", "note": "<one or two sentences, editor's voice>", "evidence": "<verbatim sentence from the report>"}]}`;
}

export function buildGoalProgressUser(
  report: string,
  goals: ReadonlyArray<{ id: string; goal: string }>
): string {
  const list = goals.map((g) => `[${g.id}] "${g.goal}"`).join('\n');
  return `THE WRITER'S STATED GOALS:\n${list}\n\nTHE REPORT:\n\n${report}`;
}
