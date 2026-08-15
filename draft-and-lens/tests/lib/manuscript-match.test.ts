import { describe, expect, it } from 'vitest';

import {
  MIN_OVERLAP,
  MIN_SHARED_ENTITIES,
  entityOverlap,
  extractEntities,
  sharedEntities,
  suggestManuscript,
  type ManuscriptCandidate,
} from '../../src/lib/manuscript-match';

describe('extractEntities', () => {
  it('picks up sentence-internal proper nouns', () => {
    const e = extractEntities('The door opened and Sarah stepped through. Behind her came Marcus.');
    expect(e.has('sarah')).toBe(true);
    expect(e.has('marcus')).toBe(true);
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

describe('suggestManuscript', () => {
  const salthouse: ManuscriptCandidate = {
    id: 'ms-1',
    title: 'The Salt House',
    entities: new Set(['sarah', 'marcus', 'dell', 'katherine']),
  };

  it('returns null when there are no candidates — the first upload', () => {
    expect(suggestManuscript('Sarah met Marcus by the door.', [])).toBeNull();
  });

  it('suggests the manuscript when several names line up', () => {
    const s = suggestManuscript(
      'The room was empty. Then Sarah arrived, and Marcus followed her in.',
      [salthouse]
    );
    expect(s).not.toBeNull();
    expect(s?.manuscriptId).toBe('ms-1');
    expect(s?.sharedEntities).toEqual(['marcus', 'sarah']);
  });

  it('NEVER suggests on a single shared name — the §2 risk-A failure', () => {
    // Two unrelated novels both containing a Sarah must not be merged.
    const other = suggestManuscript(
      'The wind rose. Then Sarah closed the shutters against it.',
      [salthouse]
    );
    expect(other).toBeNull();
  });

  it('returns null when nothing is shared', () => {
    const s = suggestManuscript(
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
    const s = suggestManuscript(
      'She waited. Then Sarah spoke, Marcus answered, and Dell said nothing.',
      [weak, strong]
    );
    expect(s?.manuscriptId).toBe('ms-3');
    expect(s?.score).toBe(1);
  });

  it('returns null for text with no extractable entities', () => {
    expect(suggestManuscript('the door opened and nobody came', [salthouse])).toBeNull();
  });

  it('exposes its thresholds as tunable constants rather than magic numbers', () => {
    expect(MIN_SHARED_ENTITIES).toBeGreaterThanOrEqual(2);
    expect(MIN_OVERLAP).toBeGreaterThan(0);
    expect(MIN_OVERLAP).toBeLessThanOrEqual(1);
  });
});
