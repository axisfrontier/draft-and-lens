import { describe, expect, it } from 'vitest';

import { excerptForReading } from '../../src/ai/read-window';

/**
 * The claim this module makes is not about any particular window. It is that
 * for EVERY window, at EVERY length, the text is either whole or declared cut
 * — never silently cut. Brain 1's own window is exercised in
 * tests/brains/diagnostician.test.ts; this pins the property itself, so a
 * caller adopting a different window inherits a guarantee rather than a habit.
 */

function prose(chars: number): string {
  const s = 'The door was open and she did not close it behind her. ';
  return s.repeat(Math.ceil(chars / s.length)).slice(0, chars);
}

const WINDOWS = [200, 1_000, 4_000, 6_000, 12_000, 28_000];
const LENGTHS = [0, 1, 199, 200, 201, 999, 1_000, 1_001, 5_999, 6_000, 6_001, 12_000, 12_001, 40_000];

describe('excerptForReading', () => {
  it('is whole or declared, never silently cut — every window, every length', () => {
    for (const w of WINDOWS) {
      for (const n of LENGTHS) {
        const t = prose(n);
        const out = excerptForReading(t, w);
        const whole = out === t;
        const declared = out.includes('NOT THE WHOLE WORK');
        expect(whole !== declared, `window=${w} length=${n}`).toBe(true);
      }
    }
  });

  it('sends the text whole whenever it fits, to the exact boundary', () => {
    for (const w of WINDOWS) {
      expect(excerptForReading(prose(w), w)).toBe(prose(w));
      expect(excerptForReading(prose(w - 1), w)).toBe(prose(w - 1));
    }
  });

  it('cuts one character past the window and states the amount correctly', () => {
    const out = excerptForReading(prose(6_001), 6_000);
    expect(out).toContain('NOT THE WHOLE WORK');
    expect(out).toContain('1 characters have been removed');
  });

  it('states the omitted count correctly at scale', () => {
    expect(excerptForReading(prose(20_800), 12_000)).toContain(
      `${(20_800 - 12_000).toLocaleString()} characters have been removed`
    );
  });

  it('keeps the real opening and the real ending', () => {
    const t = prose(30_000);
    const out = excerptForReading(t, 12_000);
    expect(out).toContain(t.slice(0, 1_000));
    expect(out).toContain(t.slice(-1_000));
  });

  it('names the cuts as cuts, so an edge cannot be read as the writer', () => {
    const out = excerptForReading(prose(30_000), 12_000);
    expect(out).toContain('Never read a cut edge as a flaw in the writing');
    expect(out).toContain('[OPENING OF WORK]');
    expect(out).toContain('[CLOSING OF WORK]');
  });

  it('stays bounded by its window rather than growing with the work', () => {
    for (const w of WINDOWS) {
      const out = excerptForReading(prose(500_000), w);
      const body = out.replace(/\[[^\]]*\]/g, '').replace(/\n/g, '');
      expect(body.length).toBeLessThanOrEqual(w);
    }
  });

  it('handles an empty submission without throwing', () => {
    expect(excerptForReading('', 12_000)).toBe('');
  });
});
