import { describe, expect, it } from 'vitest';

import {
  INTERROGATE_ANALYSIS_LIVE,
  INTERROGATE_REPORT_LINE,
  INTERROGATE_REPORT_LINE_NO_MATCH,
  READING_DEPTH_DEFAULT,
  READING_DEPTH_PILLS,
  READING_DEPTH_SUBLABEL,
  interrogateHelperLine,
  interrogateReportLine,
} from '../../src/lib/interrogate';

/**
 * Two jobs here, and the first is the more important one.
 *
 * 1. THE GATE. Architecture v6, Law — Mentoring and interrogation are never
 *    faked. While the interrogated read does not actually run, nothing may tell
 *    a writer that it did. These tests fail the moment a claim escapes the
 *    flag, which is the failure that matters: it would be the product asserting
 *    something about a reading that did not happen.
 *
 * 2. THE COPY. Every string here was approved by Nenad on 2026-08-24, in full.
 *    Pinned exactly, the same discipline differentiator.test.ts applies to the
 *    method line — approved copy should not drift silently.
 */

describe('the gate on interrogate claims', () => {
  it('stays shut until the analysis behind it is real', () => {
    // If this fails, the flag was flipped. That is only correct once §21c
    // best-in-class research has landed AND the analyst is genuinely running
    // the interrogated read — not merely because the UI looks finished.
    expect(INTERROGATE_ANALYSIS_LIVE).toBe(false);
  });

  it('says nothing in the reading while the gate is shut, even when asked for', () => {
    // Every combination, because each one is a different claim: a matched
    // standard, no match at all, and an excerpt where the standard is withheld.
    expect(interrogateReportLine('push', true, 'complete')).toBeNull();
    expect(interrogateReportLine('push', false, 'complete')).toBeNull();
    expect(interrogateReportLine('push', false, 'excerpt')).toBeNull();
  });

  it('promises nothing in the panel while the gate is shut, either form', () => {
    expect(interrogateHelperLine('push', 'complete', false)).toBeNull();
    expect(interrogateHelperLine('push', 'excerpt', false)).toBeNull();
    expect(interrogateHelperLine('push', 'complete', true)).toBeNull();
  });
});

describe('the control itself — described, never performed', () => {
  it('defaults to the ordinary reading, so the mode is never the unprompted default', () => {
    // §21b: opt-in only. A default of 'push' would make the interrogated read
    // the baseline, which is the one thing the architecture forbids outright.
    expect(READING_DEPTH_DEFAULT).toBe('read');
  });

  it('offers exactly the two approved pills, in the approved order', () => {
    expect(READING_DEPTH_PILLS.map((p) => p.value)).toEqual(['read', 'push']);
    expect(READING_DEPTH_PILLS.map((p) => p.label)).toEqual(['Read it', 'Push harder']);
  });

  it('carries the approved sub-label', () => {
    expect(READING_DEPTH_SUBLABEL).toBe('How should I read it?');
  });
});

describe('approved copy, pinned', () => {
  it('the report line reads exactly as approved', () => {
    expect(INTERROGATE_REPORT_LINE).toBe('This is a Push harder reading.');
  });

  it('the no-match line reads exactly as approved', () => {
    expect(INTERROGATE_REPORT_LINE_NO_MATCH).toBe(
      "I'll question the ambition itself, not just how far you got with it. This one doesn't map cleanly onto any of my thirty-five lenses, so I won't hold it against a specific standard — just against itself, at its fullest."
    );
  });

  it('never says "hold against" anywhere', () => {
    // The 2026-08-23 rejection: in British English "hold something against
    // someone" reads as resentment, the opposite of the intent. It was the
    // reason the wider hold sweep was commissioned; it must not come back.
    const strings = [
      INTERROGATE_REPORT_LINE,
      READING_DEPTH_SUBLABEL,
      ...READING_DEPTH_PILLS.map((p) => p.label),
    ];
    for (const s of strings) expect(s.toLowerCase()).not.toContain('hold');
  });

  it('exempts the no-match line, deliberately — do not "fix" this', () => {
    // INTERROGATE_REPORT_LINE_NO_MATCH contains "hold it against", and it is
    // NOT in the list above. That is not an oversight.
    //
    // What was rejected on 2026-08-23 was "I'll hold it against what you said
    // you're working on" — holding a work against a PERSON'S STATED GOALS,
    // where the idiom reads as resentment. The approved line holds a work
    // against a STANDARD, and negates it: "I won't hold it against a specific
    // standard — just against itself". That is the comparison sense.
    //
    // Nenad approved this wording on 2026-08-26 with the earlier rejection on
    // the record. RAISED WITH HIM AGAIN at build time because the construction
    // is one word from the banned one; if he changes his mind, this test and
    // the pinned copy above move together.
    expect(INTERROGATE_REPORT_LINE_NO_MATCH.toLowerCase()).toContain('hold it against');
  });
});

/**
 * What the helper says ONCE the gate opens.
 *
 * These are the tests that will start earning their keep on the day the flag
 * flips, and they are written now so that flipping it is a one-line change
 * with a safety net rather than a one-line change and a hope. They assert the
 * shape the copy must keep, not the flag's current value.
 */
describe('the helper line, when the gate eventually opens', () => {
  it('is silent on the default depth regardless of the flag', () => {
    // The panel stays quiet in the ordinary case — this one is independent of
    // the gate, so it is a real assertion today.
    expect(interrogateHelperLine('read', 'complete', false)).toBeNull();
    expect(interrogateHelperLine('read', 'excerpt', true)).toBeNull();
  });
});
