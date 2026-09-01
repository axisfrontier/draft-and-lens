import { describe, expect, it } from 'vitest';

import { readingStandardLine } from '../../src/lib/reading-standard';

/**
 * Every reading says what it was measured against. Replaces
 * tests/lib/interrogate.test.ts, whose central assertion was that
 * INTERROGATE_ANALYSIS_LIVE stayed `false` — a flag retired by the merge
 * (2026-09-01), because when every reading is interrogated there is no false
 * claim left for it to gate.
 *
 * WHAT CARRIES OVER, and must not be lost with the flag: the pinned approved
 * copy and the "hold against" reasoning, both below. What is deliberately gone:
 * the pill/sub-label/default assertions, which described a control that no
 * longer exists.
 */
describe('no silent fallback, ever', () => {
  const cases: ReadonlyArray<[boolean, 'complete' | 'excerpt']> = [
    [true, 'complete'],
    [false, 'complete'],
    [true, 'excerpt'],
    [false, 'excerpt'],
  ];

  it('says something on every combination there is', () => {
    // The whole ruling in one assertion. Option B: a reading that cannot say
    // what it was held against is the v6 law's second clause breaking — the
    // capability neither performed nor described, just absent.
    for (const [matched, type] of cases) {
      const line = readingStandardLine(matched, type);
      expect(line, `${matched}/${type} produced nothing`).toBeTruthy();
      expect(line.trim().length).toBeGreaterThan(40);
    }
  });

  it('gives each case its own line — no two branches share one', () => {
    // If two branches collapsed onto one string, a writer would be told
    // something true of a different reading than the one they got.
    const complete = new Set([
      readingStandardLine(true, 'complete'),
      readingStandardLine(false, 'complete'),
    ]);
    expect(complete.size).toBe(2);
    // Both excerpts get the same line, and that IS correct: the standard is
    // withheld because it is a whole-work standard, not because of the match.
    expect(readingStandardLine(true, 'excerpt')).toBe(readingStandardLine(false, 'excerpt'));
  });

  it('never tells a matched excerpt that nothing fitted its tradition', () => {
    // The bug this catches was live once in the directive and is the reason
    // excerpt is checked before the match: an excerpt WITH a match, sent the
    // no-match line, tells a writer their work belongs to no tradition when
    // the system decided otherwise. A lie the reading could then repeat.
    const excerpt = readingStandardLine(true, 'excerpt');
    expect(excerpt).not.toContain('thirty-five lenses');
    expect(excerpt).toContain('on an excerpt');
  });

  it('never claims a comparison on an excerpt that the directive withholds', () => {
    // The other half of the same trap: sending the matched line here would
    // promise a standard the analyst is simultaneously told not to apply.
    expect(readingStandardLine(true, 'excerpt')).not.toBe(
      readingStandardLine(true, 'complete')
    );
    expect(readingStandardLine(true, 'excerpt')).toContain("What I won't do");
  });
});

describe('approved copy, pinned', () => {
  it('the no-match line reads exactly as approved, thirty-five lenses and all', () => {
    // Approved verbatim 2026-08-26. The "thirty-five lenses" clause was
    // proposed for removal on 2026-09-01 as machinery talk and Nenad OVERRULED:
    // there is no toggle any more to have pre-warned the writer, so the reading
    // has to carry the explanation itself. Do not strip it.
    expect(readingStandardLine(false, 'complete')).toBe(
      "I'll question the ambition itself, not just how far you got with it. This one doesn't map cleanly onto any of my thirty-five lenses, so I won't hold it against a specific standard — just against itself, at its fullest."
    );
  });

  it('the excerpt line is the approved helper, relocated unchanged', () => {
    // HELPER_EXCERPT, approved 2026-08-24. Its tense already worked as a report
    // line, which is the tell that it always described the terms of a reading
    // rather than a control.
    expect(readingStandardLine(false, 'excerpt')).toBe(
      "I'll question the ambition itself, not just how far you got with it. What I won't do on an excerpt is set it beside the strongest work in the tradition — that's a whole-work standard, and a passage judged against a finished book isn't a fair reading."
    );
  });

  it('the matched line is the approved helper with its one flagged change', () => {
    // HELPER_COMPLETE, approved 2026-08-24, with "the reading normally leaves
    // alone" -> "a reading normally leaves alone". The definite article pointed
    // at Draft & Lens's own ordinary reading, which the merge abolished.
    //
    // ⚠ THAT ONE WORD IS NOT YET APPROVED — flagged to Nenad 2026-09-01. If he
    // rejects it, this assertion and the string move together.
    expect(readingStandardLine(true, 'complete')).toBe(
      "I'll take the question a reading normally leaves alone — whether the ambition was the right one — and show you what this tradition can do."
    );
  });

  it('exempts the no-match line from the "hold against" ban — do not "fix" this', () => {
    // CARRIED OVER VERBATIM from tests/lib/interrogate.test.ts, because the
    // reasoning survives the file that held it.
    //
    // What was rejected on 2026-08-23 was "I'll hold it against what you said
    // you're working on" — holding a work against a PERSON'S STATED GOALS,
    // where the British idiom reads as resentment. The approved line holds a
    // work against a STANDARD, and negates it: "I won't hold it against a
    // specific standard — just against itself". That is the comparison sense.
    //
    // Nenad approved this wording on 2026-08-26 with the earlier rejection on
    // the record.
    expect(readingStandardLine(false, 'complete').toLowerCase()).toContain('hold it against');
  });

  it('keeps the banned idiom out of the two lines that are not exempt', () => {
    for (const line of [
      readingStandardLine(true, 'complete'),
      readingStandardLine(false, 'excerpt'),
    ]) {
      expect(line.toLowerCase()).not.toContain('hold it against');
    }
  });

  it('never names the product or explains its machinery', () => {
    // The editor speaks in the first person and does not describe her own
    // apparatus. "thirty-five lenses" is the one sanctioned exception above.
    for (const [m, t] of [[true, 'complete'], [false, 'complete'], [true, 'excerpt']] as const) {
      const line = readingStandardLine(m, t);
      expect(line).not.toContain('Draft & Lens');
      expect(line).not.toMatch(/analysis (complete|failed)|your submission/i);
      expect(line.startsWith("I'll")).toBe(true);
    }
  });
});
