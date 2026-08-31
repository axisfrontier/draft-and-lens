import { describe, expect, it } from 'vitest';

import { buildDiagnosticExcerpt } from '../../src/ai/brains/diagnostician';

/**
 * Brain 1 sets tradition, register and ambition, and every brain after it is
 * told the tradition is confirmed. So what Brain 1 is shown, and what it is
 * told about what it is shown, governs the whole reading.
 *
 * Until 2026-08-31 a submission between 3,000 and 6,000 characters reached it
 * cut at character 3,000 with no label, and one reading turned that cut into a
 * numbered revision note against a story with no cut in it. The bug survived
 * because nothing could see it: the truncation is deterministic, but whether a
 * model remarks on it is not, so the visible symptom came and went while the
 * blindness stayed constant. These tests are what can see it.
 */

const CHAR = 'x';
const text = (n: number): string => CHAR.repeat(n);

/** A piece with real sentence ends, so "was it cut mid-sentence" is answerable. */
function prose(chars: number): string {
  const sentence = 'The door was open and she did not close it behind her. ';
  return sentence.repeat(Math.ceil(chars / sentence.length)).slice(0, chars);
}

describe('buildDiagnosticExcerpt', () => {
  describe('the invariant: text is either whole or labelled as cut, never silently cut', () => {
    // The bug was a BAND, not a number, so this sweeps across the boundary
    // rather than testing the old constant. Any future change to the window
    // that reintroduces a silent band fails here without anyone remembering
    // why the band mattered.
    const lengths = [
      0, 1, 200, 2_999, 3_000, 3_001, 4_500, 5_495, 5_999, 6_000, 6_001, 9_000,
      11_999, 12_000, 12_001, 15_000, 23_000, 28_000,
    ];

    it.each(lengths)('%i characters is either returned whole or declared cut', (n) => {
      const out = buildDiagnosticExcerpt(prose(n));
      const whole = out === prose(n);
      const declared = out.includes('NOT THE WHOLE WORK');
      // Exactly one of the two must hold. Both false is the bug.
      expect(whole !== declared).toBe(true);
    });

    it('never drops a character without saying so', () => {
      for (const n of lengths) {
        const out = buildDiagnosticExcerpt(prose(n));
        if (out === prose(n)) continue;
        expect(out).toMatch(/characters have been removed from the middle/);
      }
    });
  });

  describe('the band that produced the fabricated revision note', () => {
    // "The Crossing at Kalambaka" — 5,495 characters. It was cut at 3,000 and
    // the reading told the writer to repair the sentence the cut landed in.
    it('sends a 5,495-character story whole', () => {
      const story = prose(5_495);
      expect(buildDiagnosticExcerpt(story)).toBe(story);
    });

    it.each([3_001, 4_000, 5_495, 6_000])(
      '%i characters arrives whole and carries no cut notice',
      (n) => {
        const out = buildDiagnosticExcerpt(prose(n));
        expect(out).toBe(prose(n));
        expect(out).not.toContain('[OPENING OF WORK]');
      }
    );
  });

  describe('the old two-slice path, above the window', () => {
    const long = prose(23_000);
    const out = buildDiagnosticExcerpt(long);

    it('still sends an opening and a closing, both labelled', () => {
      expect(out).toContain('[OPENING OF WORK]');
      expect(out).toContain('[CLOSING OF WORK]');
    });

    it('carries the real opening and the real ending', () => {
      expect(out).toContain(long.slice(0, 1_000));
      expect(out).toContain(long.slice(-1_000));
    });

    it('states how much was removed, and states it correctly', () => {
      expect(out).toContain(`${(23_000 - 12_000).toLocaleString()} characters have been removed`);
    });

    it('tells the model a cut edge is not the writer, so it cannot be read as a flaw', () => {
      expect(out).toContain('Never read a cut edge as a flaw in the writing');
    });

    it('holds the window as its budget rather than growing with the work', () => {
      // Two 6,000-char slices plus the header — bounded, so cost does not
      // scale with manuscript length.
      expect(buildDiagnosticExcerpt(text(100_000)).length).toBeLessThan(13_000);
    });
  });

  describe('boundary behaviour', () => {
    it('sends exactly-window text whole', () => {
      const t = prose(12_000);
      expect(buildDiagnosticExcerpt(t)).toBe(t);
    });

    it('cuts one character past the window, and says so', () => {
      const out = buildDiagnosticExcerpt(prose(12_001));
      expect(out).toContain('NOT THE WHOLE WORK');
      expect(out).toContain('1 characters have been removed');
    });

    it('never returns more text than it was given', () => {
      for (const n of [12_001, 13_000, 20_000, 40_000]) {
        const out = buildDiagnosticExcerpt(prose(n));
        const body = out.replace(/\[[^\]]*\]/g, '').replace(/\n/g, '');
        expect(body.length).toBeLessThanOrEqual(n);
      }
    });

    it('handles an empty submission without throwing', () => {
      expect(buildDiagnosticExcerpt('')).toBe('');
    });
  });
});
