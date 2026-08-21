import { describe, expect, it } from 'vitest';

import {
  TENDENCIES,
  TRADITION_BOUND,
  deriveTrend,
  isNameable,
  isTendency,
} from '../../src/lib/writer-patterns';

/**
 * A named pattern is the product's largest claim about a person — not "this
 * draft does X" but "you do X, repeatedly". Getting it wrong tells a writer
 * something untrue about their own habits, so nearly everything pinned here is
 * a refusal.
 */
describe('isNameable', () => {
  const live = { confirmedCount: 3, dismissedAt: null };

  it('names a pattern seen across works, to a writer who has been here a while', () => {
    expect(isNameable(live, 5)).toBe(true);
  });

  it('never names one the writer has dismissed', () => {
    // Permanent, per §5.5's idiom. The row is kept precisely so this holds.
    expect(isNameable({ confirmedCount: 9, dismissedAt: '2026-08-21T00:00:00Z' }, 20)).toBe(false);
  });

  it('never names one seen in a single work', () => {
    // The load-bearing rule. Three revisions of one story are one piece of
    // evidence about the writer — counting readings instead of works would let
    // a single story promote a tendency into a claim about a person.
    expect(isNameable({ confirmedCount: 1, dismissedAt: null }, 10)).toBe(false);
  });

  it('waits until the writer has three submissions', () => {
    expect(isNameable(live, 2)).toBe(false);
    expect(isNameable(live, 3)).toBe(true);
  });

  it('requires every condition, not any of them', () => {
    expect(isNameable({ confirmedCount: 1, dismissedAt: null }, 2)).toBe(false);
    expect(isNameable({ confirmedCount: 5, dismissedAt: '2026-01-01T00:00:00Z' }, 99)).toBe(false);
  });
});

describe('the closed vocabulary', () => {
  it('holds exactly the seven keys the corpus names', () => {
    // Mirrors writer_patterns_tendency_chk. If these drift apart, a write that
    // type-checks fails at the database — so the list is pinned here too.
    expect([...TENDENCIES].sort()).toEqual(
      [
        'borrowed_phrase',
        'floating_abstraction',
        'narrated_not_accumulated',
        'restatement',
        'shrinking',
        'unearned_ambiguity',
        'withheld_payoff',
      ].sort()
    );
  });

  it('rejects anything outside it', () => {
    // There is no key for generic craft advice, which is what makes generic
    // craft advice unstorable rather than merely discouraged.
    expect(isTendency('dialogue_could_be_sharper')).toBe(false);
    expect(isTendency('show_dont_tell')).toBe(false);
    expect(isTendency('')).toBe(false);
    expect(isTendency(null)).toBe(false);
  });

  it('marks the two tradition-bound keys and only those', () => {
    // Withholding resolution breaks the contract in literary realism (P22) and
    // IS the instrument in noir; a borrowed phrase only loses an argument
    // where a juxtaposition is making one (P4). Asserting either outside its
    // tradition is the error P3 exists to prevent — and as a PATTERN it would
    // repeat that error across a whole body of work.
    expect(TRADITION_BOUND.has('withheld_payoff')).toBe(true);
    expect(TRADITION_BOUND.has('borrowed_phrase')).toBe(true);
    expect(TRADITION_BOUND.size).toBe(2);
    expect(TRADITION_BOUND.has('restatement')).toBe(false);
  });
});

/**
 * Trajectory (Gap A). The spec's two hard rules are the point of most of
 * these: no trend from fewer than three data points, and no positive spin on
 * stable. A wrong "improving" is the worst outcome available here — it tells a
 * writer they have fixed something they have not.
 */
describe('deriveTrend', () => {
  const W = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`); // newest first

  it('says nothing until there are three works to look across', () => {
    // With two works there is a before and an after, not a trajectory.
    expect(deriveTrend(['w0', 'w1'], W(2)).trend).toBe('insufficient_data');
    expect(deriveTrend(['w0', 'w1'], W(2)).note).toBeNull();
  });

  it('says nothing when the tendency has only been seen once', () => {
    expect(deriveTrend(['w2'], W(5)).trend).toBe('insufficient_data');
  });

  it('calls it improving only when it is absent from BOTH recent works', () => {
    // Seen in the three oldest, gone from the two newest.
    expect(deriveTrend(['w2', 'w3', 'w4'], W(5)).trend).toBe('improving');
    // Still present in the most recent — not improving, whatever the total.
    expect(deriveTrend(['w0', 'w3', 'w4'], W(5)).trend).not.toBe('improving');
    // Present in the second-newest — one clear piece is not a trajectory.
    expect(deriveTrend(['w1', 'w3', 'w4'], W(5)).trend).not.toBe('improving');
  });

  it('calls it worsening only on a body of work big enough for it to be a change', () => {
    // In each of the last three, across five works — it is doing more now.
    expect(deriveTrend(['w0', 'w1', 'w2'], W(5)).trend).toBe('worsening');
    // The same shape on exactly three works is not a change: that is simply
    // all the evidence there is, and calling it worsening invents a trajectory.
    expect(deriveTrend(['w0', 'w1', 'w2'], W(3)).trend).toBe('stable');
  });

  it('falls back to stable, and stable is not dressed up as progress', () => {
    const v = deriveTrend(['w0', 'w3'], W(5));
    expect(v.trend).toBe('stable');
    expect(v.note).not.toMatch(/better|improv|progress|well done|good/i);
    expect(v.note).toMatch(/hasn't shifted/i);
  });

  it('carries a note whenever it names a trend, and none when it does not', () => {
    for (const wids of [['w2', 'w3', 'w4'], ['w0', 'w1', 'w2'], ['w0', 'w3']]) {
      expect(deriveTrend(wids, W(5)).note).toBeTruthy();
    }
    expect(deriveTrend(['w0'], W(5)).note).toBeNull();
  });

  it('never states a number', () => {
    // The spec forbids scores and percentages — false precision on qualitative
    // data. The notes are sentences, not measurements.
    for (const wids of [['w2', 'w3', 'w4'], ['w0', 'w1', 'w2'], ['w0', 'w3']]) {
      expect(deriveTrend(wids, W(5)).note).not.toMatch(/\d/);
    }
  });
});
