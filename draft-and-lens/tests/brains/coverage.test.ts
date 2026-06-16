import { describe, expect, it } from 'vitest';

import { computeCoverage, FREE_WORD_LIMIT } from '../../src/ai/orchestrator';

/**
 * The partial-read law (Architecture §13) depends on coverage being computed
 * correctly: under the limit reads the whole text; over it truncates on a word
 * boundary and flags the read boundary so no brain concludes beyond what it saw.
 */
describe('computeCoverage', () => {
  it('does not truncate a short work', () => {
    const text = 'one two three four five';
    const c = computeCoverage(text, FREE_WORD_LIMIT);
    expect(c.truncated).toBe(false);
    expect(c.wordsRead).toBe(5);
    expect(c.wordsTotal).toBe(5);
    expect(c.fractionRead).toBe(1);
    expect(c.readText).toBe(text);
  });

  it('truncates an over-limit work on a word boundary and reports the boundary', () => {
    const total = 25;
    const limit = 10;
    const text = Array.from({ length: total }, (_, i) => `w${i + 1}`).join(' ');
    const c = computeCoverage(text, limit);
    expect(c.truncated).toBe(true);
    expect(c.wordsRead).toBe(limit);
    expect(c.wordsTotal).toBe(total);
    expect(c.readText.split(/\s+/)).toHaveLength(limit);
    // The read text is a clean prefix — never includes unseen words.
    expect(c.readText).toBe('w1 w2 w3 w4 w5 w6 w7 w8 w9 w10');
    expect(c.fractionRead).toBeCloseTo(limit / total);
  });

  it('treats exactly-at-limit as not truncated', () => {
    const text = Array.from({ length: 10 }, (_, i) => `w${i + 1}`).join(' ');
    const c = computeCoverage(text, 10);
    expect(c.truncated).toBe(false);
    expect(c.wordsRead).toBe(10);
  });
});
