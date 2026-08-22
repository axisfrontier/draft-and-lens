import 'server-only';

/**
 * Writer-goal directive (Mentor Completeness spec, Gap B). Prepended to Brain
 * 2's user prompt when the writer has told the product what they are trying to
 * do. Carries the writer's own sentences and nothing else — no prompt IP, no
 * inference, no scoring rubric.
 *
 * A LENS TO HOLD ALONGSIDE THE TRADITION, NEVER A RUBRIC. This is the whole
 * risk of the feature. The tradition decides the standard a work is judged by
 * (LearnedCorpus P1, and it is locked before this brain runs); a goal is what
 * the writer was reaching for inside it. A goal admitted as a standard would
 * let a writer redefine what counts as good in their own work, which is the
 * one thing an editor cannot let them do — and it would quietly convert every
 * reading into a compliance check against a sentence typed at upload time.
 *
 * SILENCE IS A PERMITTED ANSWER, and it has to be. The spec's rule is that
 * progress is never fabricated: where the reading has nothing to say about the
 * goal, the goal goes unmentioned. Anything else produces the failure this
 * product exists not to commit — a sentence invented to satisfy a form.
 */
export function buildGoalDirective(goals: readonly string[]): string {
  const live = goals.map((g) => g.trim()).filter(Boolean);
  if (live.length === 0) return '';

  const list = live.map((g) => `• "${g}"`).join('\n');

  return (
    'WHAT THE WRITER SAYS THEY ARE TRYING TO DO — in their own words, typed by ' +
    'them. They are real; you are not imagining them:\n' +
    list +
    '\n\nHold these alongside the tradition, never instead of it. The tradition ' +
    'is settled and it decides the standard this work answers to; a stated goal ' +
    'is what the writer was reaching for inside that standard. It does not ' +
    'change what good work is here, and a goal that pulls against what the ' +
    'tradition requires is worth saying so plainly — kindly, and without ' +
    'abandoning your reading of the work in front of you.\n' +
    'Where the work moves toward what they said they wanted, say so, and be ' +
    'specific about where. Where it does not yet, say that too, in the same ' +
    'breath and without reproach — an unreached goal is a draft, not a failure.\n' +
    'Hard limits: do not score progress, do not reduce it to met or not met, do ' +
    'not award a percentage or a grade, and do not build a section or a checklist ' +
    'around these sentences. Above all, if this draft gives you nothing real to ' +
    'say about one of them, SAY NOTHING ABOUT IT. An invented observation about a ' +
    "writer's own stated ambition is worse than silence.\n\n"
  );
}
