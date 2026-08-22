import { describe, expect, it } from 'vitest';

import {
  AUTO_MIN_OVERLAP,
  AUTO_MIN_SHARED,
  MIN_OVERLAP,
  MIN_SHARED_ENTITIES,
  entityOverlap,
  extractEntities,
  sharedEntities,
  classifyMatch,
  type ManuscriptCandidate,
} from '../../src/lib/manuscript-match';

describe('extractEntities', () => {
  it('picks up sentence-internal proper nouns', () => {
    const e = extractEntities('The door opened and Sarah stepped through. Behind her came Marcus.');
    expect(e.has('sarah')).toBe(true);
    expect(e.has('marcus')).toBe(true);
  });

  /**
   * Dialogue defeats the not-first-word rule: the word opening a quoted line
   * is capitalised and, to a crude sentence split, not sentence-initial. Live,
   * this proposed grouping an unrelated chapter into a real manuscript on
   * sharedEntities ["one","the"] — shown to the writer as "both mention one,
   * the".
   */
  it('does not mistake function words in dialogue for names', () => {
    const e = extractEntities(
      `Sarah stood aside. "The slates are the least of it," he said. "It's that kind of lane."\n` +
        `"One more thing," said Eileen. "There is no roof left to speak of."`
    );
    for (const noise of ['the', 'it', 'one', 'there', 'no']) {
      expect(e.has(noise), `"${noise}" was counted as a name`).toBe(false);
    }
    // The real names in the same passage must survive the filter.
    expect(e.has('eileen')).toBe(true);
  });

  it('does not mistake contractions for names', () => {
    const e = extractEntities(`He waited. "You'll see," said Mallory. "It'll keep. I'm certain. Don't ask."`);
    for (const noise of ["you'll", "it'll", "i'm", "don't"]) {
      expect(e.has(noise), `"${noise}" was counted as a name`).toBe(false);
    }
    expect(e.has('mallory')).toBe(true);
  });

  it('keeps apostrophe names, which the contraction rule must not eat', () => {
    const e = extractEntities("She met O'Connor at the gate. Later D'Arcy arrived with O'Brien.");
    expect(e.has("o'connor")).toBe(true);
    expect(e.has("d'arcy")).toBe(true);
    expect(e.has("o'brien")).toBe(true);
  });

  it('ignores sentence-initial capitals — the whole point of the guard', () => {
    const e = extractEntities('The house was cold. Behind it, nothing. However, she waited.');
    expect(e.has('the')).toBe(false);
    expect(e.has('behind')).toBe(false);
    expect(e.has('however')).toBe(false);
  });

  it('treats a possessive as the same entity', () => {
    const withPossessive = extractEntities('It was Sarah’s coat.');
    const plain = extractEntities('It was Sarah coat.');
    expect(withPossessive.has('sarah')).toBe(true);
    expect(plain.has('sarah')).toBe(true);
  });

  it('drops weekdays and months, which otherwise fake overlap between novels', () => {
    const e = extractEntities('It rained on Tuesday. They left in March. God knows why.');
    expect(e.has('tuesday')).toBe(false);
    expect(e.has('march')).toBe(false);
    expect(e.has('god')).toBe(false);
  });

  it('returns an empty set for text with no interior capitals', () => {
    expect(extractEntities('the door opened and nobody came through it').size).toBe(0);
  });

  it('does not crash on empty or punctuation-only input', () => {
    expect(extractEntities('').size).toBe(0);
    expect(extractEntities('... !!! ???').size).toBe(0);
  });
});

describe('entityOverlap', () => {
  it('is 1 when the smaller set is fully contained in the larger', () => {
    const small = new Set(['sarah', 'marcus']);
    const large = new Set(['sarah', 'marcus', 'dell', 'katherine']);
    expect(entityOverlap(small, large)).toBe(1);
  });

  it('is symmetric', () => {
    const a = new Set(['sarah', 'marcus', 'dell']);
    const b = new Set(['sarah', 'tom']);
    expect(entityOverlap(a, b)).toBe(entityOverlap(b, a));
  });

  it('is 0 when either side is empty', () => {
    expect(entityOverlap(new Set(), new Set(['sarah']))).toBe(0);
    expect(entityOverlap(new Set(['sarah']), new Set())).toBe(0);
  });

  it('does not punish asymmetric sizes the way Dice would — the reason for this metric', () => {
    // A short later chapter against a long first chapter: 2 of 2 shared.
    const laterChapter = new Set(['sarah', 'marcus']);
    const firstChapter = new Set([
      'sarah', 'marcus', 'dell', 'katherine', 'tom', 'hollis', 'wren', 'ash',
    ]);
    expect(entityOverlap(laterChapter, firstChapter)).toBe(1);
    // Dice on the same pair would be 2*2/(2+8) = 0.4 — below a naive threshold.
  });
});

describe('sharedEntities', () => {
  it('returns the intersection, sorted', () => {
    const a = new Set(['marcus', 'sarah', 'dell']);
    const b = new Set(['sarah', 'dell', 'tom']);
    expect(sharedEntities(a, b)).toEqual(['dell', 'sarah']);
  });
});

/**
 * These tested `suggestManuscript`, a one-line wrapper with no caller in the
 * product — the 2026-08-22 audit found it dead and it was deleted. The
 * behaviour it covered is real and worth keeping, so the tests now go through
 * `classifyMatch`, which is what `/api/ledger/suggest` actually calls.
 *
 * `suggest()` below reproduces exactly what the wrapper did: the top-ranked
 * candidate, or null. The assertions are unchanged.
 */
describe('suggesting a manuscript (through classifyMatch, as the route does)', () => {
  const salthouse: ManuscriptCandidate = {
    id: 'ms-1',
    title: 'The Salt House',
    entities: new Set(['sarah', 'marcus', 'dell', 'katherine']),
  };

  const suggest = (text: string, candidates: readonly ManuscriptCandidate[]) =>
    classifyMatch(text, candidates, null).suggestion;

  it('returns null when there are no candidates — the first upload', () => {
    expect(suggest('Sarah met Marcus by the door.', [])).toBeNull();
  });

  it('suggests the manuscript when several names line up', () => {
    const s = suggest(
      'The room was empty. Then Sarah arrived, and Marcus followed her in.',
      [salthouse]
    );
    expect(s).not.toBeNull();
    expect(s?.manuscriptId).toBe('ms-1');
    expect(s?.sharedEntities).toEqual(['marcus', 'sarah']);
  });

  it('NEVER suggests on a single shared name — the §2 risk-A failure', () => {
    // Two unrelated novels both containing a Sarah must not be merged.
    const other = suggest(
      'The wind rose. Then Sarah closed the shutters against it.',
      [salthouse]
    );
    expect(other).toBeNull();
  });

  it('returns null when nothing is shared', () => {
    const s = suggest(
      'The engine died. Then Priya swore, and Okonkwo laughed at her.',
      [salthouse]
    );
    expect(s).toBeNull();
  });

  it('picks the better-matching manuscript when two could plausibly match', () => {
    const weak: ManuscriptCandidate = {
      id: 'ms-2',
      title: 'Other Book',
      // Shares sarah + marcus, but among many others, so the overlap is lower
      // when scored from the larger side.
      entities: new Set(['sarah', 'marcus', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6']),
    };
    const strong: ManuscriptCandidate = {
      id: 'ms-3',
      title: 'Strong Match',
      entities: new Set(['sarah', 'marcus', 'dell']),
    };
    const s = suggest(
      'She waited. Then Sarah spoke, Marcus answered, and Dell said nothing.',
      [weak, strong]
    );
    expect(s?.manuscriptId).toBe('ms-3');
    expect(s?.score).toBe(1);
  });

  it('returns null for text with no extractable entities', () => {
    expect(suggest('the door opened and nobody came', [salthouse])).toBeNull();
  });

  it('exposes its thresholds as tunable constants rather than magic numbers', () => {
    expect(MIN_SHARED_ENTITIES).toBeGreaterThanOrEqual(2);
    expect(MIN_OVERLAP).toBeGreaterThan(0);
    expect(MIN_OVERLAP).toBeLessThanOrEqual(1);
  });
});

describe('classifyMatch — silent auto-grouping bar', () => {
  // A strong, unambiguous match: 4 shared names, all unique to this manuscript,
  // no rival, formats agree.
  const strong: ManuscriptCandidate = {
    id: 'ms-strong',
    title: 'The Salt House',
    format: 'story',
    entities: new Set(['sarah', 'marcus', 'dell', 'katherine']),
  };
  const text = 'She waited. Then Sarah spoke, Marcus answered, Dell left, and Katherine watched.';

  it('auto-groups an obvious same-book match', () => {
    const c = classifyMatch(text, [strong], 'story');
    expect(c.band).toBe('auto');
    expect(c.failedCriteria).toEqual([]);
  });

  it('returns none when nothing matches', () => {
    const c = classifyMatch('The engine died. Then Priya swore at Okonkwo.', [strong], 'story');
    expect(c.band).toBe('none');
    expect(c.suggestion).toBeNull();
  });

  it('CONFIRMS rather than auto-groups on only two shared names', () => {
    const c = classifyMatch('She waited. Then Sarah spoke and Marcus answered.', [strong], 'story');
    expect(c.band).toBe('confirm');
    expect(c.failedCriteria).toContain('shared-names');
  });

  it('CONFIRMS when the shared names are not distinctive — the shared-Sarah case', () => {
    // Every shared name also appears in another manuscript, so none is evidence
    // for this one in particular.
    const other: ManuscriptCandidate = {
      id: 'ms-other',
      title: 'Unrelated Novel',
      format: 'story',
      entities: new Set(['sarah', 'marcus', 'dell', 'katherine', 'x1', 'x2', 'x3', 'x4']),
    };
    const c = classifyMatch(text, [strong, other], 'story');
    expect(c.band).toBe('confirm');
    expect(c.failedCriteria).toContain('distinctiveness');
  });

  it('CONFIRMS when a rival manuscript also matches well', () => {
    const rival: ManuscriptCandidate = {
      id: 'ms-rival',
      title: 'Also Plausible',
      format: 'story',
      entities: new Set(['sarah', 'marcus', 'dell', 'katherine']),
    };
    const c = classifyMatch(text, [strong, rival], 'story');
    expect(c.band).toBe('confirm');
    expect(c.failedCriteria).toContain('close-rival');
  });

  it('CONFIRMS when formats disagree — a script never silently joins a novel', () => {
    const c = classifyMatch(text, [strong], 'script');
    expect(c.band).toBe('confirm');
    expect(c.failedCriteria).toContain('format');
  });

  it('fails format closed when the manuscript format is unknown', () => {
    const noFormat: ManuscriptCandidate = { ...strong, format: null };
    const c = classifyMatch(text, [noFormat], 'story');
    expect(c.band).toBe('confirm');
    expect(c.failedCriteria).toContain('format');
  });

  it('auto thresholds are strictly stricter than the propose thresholds', () => {
    expect(AUTO_MIN_SHARED).toBeGreaterThan(MIN_SHARED_ENTITIES);
    expect(AUTO_MIN_OVERLAP).toBeGreaterThan(MIN_OVERLAP);
  });
});
