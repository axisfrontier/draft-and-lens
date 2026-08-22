import { describe, expect, it } from 'vitest';

import { buildGoalProgressSystem, buildGoalProgressUser } from '../../src/prompts/goal-progress';

/**
 * The rules this prompt states are the ones `validateGoalNotes` cannot check.
 * Silence, voice and register have no code guard behind them — the only place
 * they can be lost is here, which is why they are pinned.
 */
describe('buildGoalProgressSystem', () => {
  const sys = buildGoalProgressSystem();

  it('makes silence the common answer, not a permitted exception', () => {
    expect(sys).toMatch(/SILENCE IS THE COMMON ANSWER/);
    expect(sys).toMatch(/correct and expected/);
  });

  it('keeps the brain off the writing itself', () => {
    // It restates the reading. A second opinion on the prose, formed without
    // the diagnostic, is what this must never become.
    expect(sys).toMatch(/RESTATE, NEVER JUDGE/);
    expect(sys).toMatch(/never assess the writing yourself/i);
  });

  it('forbids deciding whether the goal was achieved', () => {
    expect(sys).toMatch(/never decide whether the goal was achieved/i);
    expect(sys).toMatch(/NEVER SCORE/);
  });

  it('keeps the editor from naming its own machinery', () => {
    // "The report points to…" is the product describing its own documents to
    // the person it is talking to — the standing voice rule in CLAUDE.md.
    expect(sys).toMatch(/YOU WROTE THE REPORT/);
    expect(sys).toMatch(/Never mention it/);
  });

  it('requires a verbatim quote behind every note', () => {
    expect(sys).toMatch(/QUOTE OR DROP IT/);
    expect(sys).toMatch(/VERBATIM sentence/);
  });
});

describe('buildGoalProgressUser', () => {
  it('carries the goal in the writer’s own words, tagged by id', () => {
    const u = buildGoalProgressUser('THE REPORT TEXT', [{ id: 'g1', goal: 'tighter prose' }]);
    expect(u).toContain('[g1] "tighter prose"');
    expect(u).toContain('THE REPORT TEXT');
  });
});
