import { describe, expect, it } from 'vitest';

import { buildGoalDirective } from '../../src/prompts/fragments/goals';

/**
 * Gap B rests on one law: a goal the writer set is a lens the reading holds,
 * never the standard it judges by. The tradition decides the standard (P1) and
 * a stated ambition cannot move it — otherwise a writer could redefine what
 * counts as good in their own work, which is the one thing an editor must not
 * let them do. Everything here tests that boundary and the silence rule.
 */
describe('buildGoalDirective', () => {
  const goal = 'I want this to feel more urgent';

  it('says nothing at all when the writer has set no goals', () => {
    // The ordinary case: the whole feature must be invisible to a writer who
    // never used it, prompt included.
    expect(buildGoalDirective([])).toBe('');
    expect(buildGoalDirective(['', '   '])).toBe('');
  });

  it('carries the writer’s own words through verbatim', () => {
    expect(buildGoalDirective([goal])).toContain(goal);
  });

  it('marks the goals as real, not imagined', () => {
    // Same protection the revision directive carries: the analyst must never
    // treat supplied context as something it invented.
    expect(buildGoalDirective([goal])).toMatch(/typed by\s+them\. They are real/);
  });

  it('keeps the tradition as the standard', () => {
    const d = buildGoalDirective([goal]);
    expect(d).toMatch(/alongside the tradition, never instead of it/i);
    expect(d).toMatch(/does not\s+change what good work is here/i);
  });

  it('permits saying a goal pulls against the tradition', () => {
    // The honest case, and the one a compliance-check reading would suppress.
    expect(buildGoalDirective([goal])).toMatch(/pulls against what the\s+tradition requires/i);
  });

  it('forbids scoring in every form it tends to take', () => {
    const d = buildGoalDirective([goal]);
    expect(d).toMatch(/do not score progress/i);
    expect(d).toMatch(/met or not met/i);
    expect(d).toMatch(/percentage or a grade/i);
  });

  it('makes silence the answer when there is nothing real to say', () => {
    const d = buildGoalDirective([goal]);
    expect(d).toMatch(/SAY NOTHING ABOUT IT/);
    expect(d).toMatch(/worse than silence/i);
  });

  it('does not reproach a writer whose draft has not got there', () => {
    expect(buildGoalDirective([goal])).toMatch(/an unreached goal is a draft, not a failure/i);
  });

  it('lists several goals without inventing an order of importance', () => {
    const d = buildGoalDirective(['tighter prose', 'stop over-explaining']);
    expect(d).toContain('• "tighter prose"');
    expect(d).toContain('• "stop over-explaining"');
    expect(d).not.toMatch(/most important|primary goal/i);
  });
});
