import { describe, expect, it } from 'vitest';

import {
  extractContext,
  findCandidatePairs,
  gatePair,
  type GateFact,
  type NarrativeFrame,
} from '../../src/lib/detection-gates';

/**
 * These gates decide what a writer is ever told about their own book, so every
 * path is pinned. The distinction that matters most: `not_a_candidate` is a
 * REAL answer with a reason attached, never a quiet discard — 2c's requirement
 * that "correctly not flagged" and "silently dropped" stay distinguishable.
 */

const fact = (over: Partial<GateFact> = {}): GateFact => ({
  factId: 'f1',
  entity: 'character:sarah',
  attribute: 'eye_colour',
  value: 'green',
  category: 'physical',
  mutability: 'immutable',
  register: 'narration_omniscient',
  povCharacter: null,
  confidence: 0.95,
  sequenceIndex: 1,
  reconciledAt: null,
  ...over,
});

/** Nothing known — the honest default, and NOT permission (ruling 1a). */
const UNKNOWN: NarrativeFrame = { nonLinear: null, unreliableNarrator: null, multiplePov: null };
const LINEAR: NarrativeFrame = { nonLinear: false, unreliableNarrator: false, multiplePov: false };

describe('gatePair — genuine candidates', () => {
  it('two narration claims that disagree on an immutable property can reach hard', () => {
    const g = gatePair(fact(), fact({ factId: 'f2', value: 'brown', sequenceIndex: 7 }), LINEAR);
    expect(g.kind).toBe('candidate');
    if (g.kind === 'candidate') {
      expect(g.ceiling).toBe('hard');
      expect(g.demotions).toEqual([]);
    }
  });
});

describe('gatePair — true negatives, each with a reason', () => {
  it('agreement is not a contradiction', () => {
    const g = gatePair(fact(), fact({ factId: 'f2' }), LINEAR);
    expect(g).toEqual({ kind: 'not_a_candidate', reason: 'same-value' });
  });

  it('ignores trivial formatting differences when deciding agreement', () => {
    const g = gatePair(fact({ value: 'Green' }), fact({ factId: 'f2', value: ' green. ' }), LINEAR);
    expect(g.kind).toBe('not_a_candidate');
  });

  it('different claims are not compared at all', () => {
    const g = gatePair(fact(), fact({ factId: 'f2', attribute: 'hair_colour' }), LINEAR);
    expect(g).toEqual({ kind: 'not_a_candidate', reason: 'different-claim' });
  });

  it('a pair the writer already reconciled is never raised again (§5.5)', () => {
    const g = gatePair(
      fact({ reconciledAt: '2026-08-17T00:00:00Z' }),
      fact({ factId: 'f2', value: 'brown' }),
      LINEAR
    );
    expect(g).toEqual({ kind: 'not_a_candidate', reason: 'reconciled-by-writer' });
  });

  it('DIALOGUE against narration is not a contradiction — a character being wrong (§5.2)', () => {
    // The single most important true negative: without it every lie, mistake
    // and unreliable line in the manuscript becomes a reported contradiction.
    const g = gatePair(
      fact({ register: 'dialogue', value: 'grey' }),
      fact({ factId: 'f2', register: 'narration_omniscient', value: 'green' }),
      LINEAR
    );
    expect(g.kind).toBe('not_a_candidate');
    if (g.kind === 'not_a_candidate') expect(g.reason).toContain('register-incomparable');
  });

  it('interiority is a belief, not the book speaking', () => {
    const g = gatePair(
      fact({ register: 'interiority', value: 'grey' }),
      fact({ factId: 'f2', value: 'green' }),
      LINEAR
    );
    expect(g.kind).toBe('not_a_candidate');
  });

  it('an unknown register cannot contradict anything', () => {
    const g = gatePair(fact({ register: null, value: 'grey' }), fact({ factId: 'f2' , value: 'green' }), LINEAR);
    expect(g.kind).toBe('not_a_candidate');
  });
});

describe('gatePair — demotions to worth_checking, never to silence', () => {
  const expectDemoted = (g: ReturnType<typeof gatePair>, why: string) => {
    expect(g.kind).toBe('candidate');
    if (g.kind === 'candidate') {
      expect(g.ceiling).toBe('worth_checking');
      expect(g.demotions).toContain(why);
    }
  };

  it('a mutable attribute cannot reach hard — change may be the plot (§4)', () => {
    expectDemoted(
      gatePair(
        fact({ attribute: 'occupation', value: 'baker', mutability: 'slow' }),
        fact({ factId: 'f2', attribute: 'occupation', value: 'sailor', mutability: 'slow' }),
        LINEAR
      ),
      'mutable-attribute'
    );
  });

  it('two POV characters perceiving differently demotes, not drops (§5.3)', () => {
    expectDemoted(
      gatePair(
        fact({ povCharacter: 'tom', register: 'narration_pov' }),
        fact({ factId: 'f2', value: 'brown', povCharacter: 'sarah', register: 'narration_pov' }),
        LINEAR
      ),
      'cross-pov'
    );
  });

  it('an UNKNOWN timeline demotes a stated age — unknown is not permission (ruling 1a)', () => {
    expectDemoted(
      gatePair(
        fact({ category: 'age_date', attribute: 'stated_age', value: '34' }),
        fact({ factId: 'f2', category: 'age_date', attribute: 'stated_age', value: '12' }),
        UNKNOWN
      ),
      'timeline-unknown'
    );
  });

  it('a known non-linear timeline demotes a stated age (§5.4 — flashbacks)', () => {
    expectDemoted(
      gatePair(
        fact({ category: 'age_date', attribute: 'stated_age', value: '34' }),
        fact({ factId: 'f2', category: 'age_date', attribute: 'stated_age', value: '12' }),
        { ...LINEAR, nonLinear: true }
      ),
      'timeline-non-linear'
    );
  });

  it('a KNOWN LINEAR timeline lets a stated age reach hard', () => {
    const g = gatePair(
      fact({ category: 'age_date', attribute: 'stated_age', value: '34' }),
      fact({ factId: 'f2', category: 'age_date', attribute: 'stated_age', value: '12' }),
      LINEAR
    );
    expect(g.kind).toBe('candidate');
    if (g.kind === 'candidate') expect(g.ceiling).toBe('hard');
  });

  it('an unreliable narrator demotes narration itself (§5.1)', () => {
    expectDemoted(
      gatePair(fact(), fact({ factId: 'f2', value: 'brown' }), { ...LINEAR, unreliableNarrator: true }),
      'unreliable-narrator'
    );
  });

  it('low extractor confidence cannot support a hard claim', () => {
    expectDemoted(
      gatePair(fact({ confidence: 0.5 }), fact({ factId: 'f2', value: 'brown' }), LINEAR),
      'low-extraction-confidence'
    );
  });

  it('accumulates every applicable demotion rather than stopping at the first', () => {
    const g = gatePair(
      fact({ category: 'age_date', attribute: 'stated_age', value: '34', mutability: 'slow', confidence: 0.4 }),
      fact({ factId: 'f2', category: 'age_date', attribute: 'stated_age', value: '12', mutability: 'slow', confidence: 0.4 }),
      UNKNOWN
    );
    if (g.kind === 'candidate') {
      expect(g.demotions).toContain('mutable-attribute');
      expect(g.demotions).toContain('timeline-unknown');
      expect(g.demotions).toContain('low-extraction-confidence');
    }
  });
});

describe('findCandidatePairs', () => {
  it('returns nothing when every claim is unique — the common case', () => {
    const facts = [fact(), fact({ factId: 'f2', attribute: 'hair_colour', value: 'dark' })];
    expect(findCandidatePairs(facts, LINEAR)).toHaveLength(0);
  });

  it('pairs only facts making competing claims about the same thing', () => {
    const facts = [
      fact({ factId: 'a', value: 'green' }),
      fact({ factId: 'b', value: 'brown' }),
      fact({ factId: 'c', attribute: 'hair_colour', value: 'dark' }),
    ];
    const pairs = findCandidatePairs(facts, LINEAR);
    expect(pairs).toHaveLength(1);
    expect([pairs[0]?.a.factId, pairs[0]?.b.factId].sort()).toEqual(['a', 'b']);
  });

  it('produces every combination when one claim has three disagreeing values', () => {
    const facts = [
      fact({ factId: 'a', value: 'green' }),
      fact({ factId: 'b', value: 'brown' }),
      fact({ factId: 'c', value: 'blue' }),
    ];
    expect(findCandidatePairs(facts, LINEAR)).toHaveLength(3);
  });

  it('drops pairs the gates rule out, keeping the rest of the group', () => {
    const facts = [
      fact({ factId: 'a', value: 'green' }),
      fact({ factId: 'b', value: 'brown' }),
      fact({ factId: 'c', value: 'grey', register: 'dialogue' }), // never comparable
    ];
    const pairs = findCandidatePairs(facts, LINEAR);
    expect(pairs).toHaveLength(1);
    expect(pairs.every((p) => p.a.register !== 'dialogue' && p.b.register !== 'dialogue')).toBe(true);
  });
});

describe('extractContext', () => {
  const text = 'The hall was cold that morning. Katherine had never liked the house, not since the winter her mother died in it. She stood at the window a long while.';

  it('returns the passage around the quote', () => {
    const c = extractContext(text, 'Katherine had never liked the house', 40);
    expect(c).toContain('Katherine had never liked the house');
    expect(c).toContain('cold that morning');
  });

  it('marks truncation so the model knows it is a window, not the whole text', () => {
    const c = extractContext(text, 'Katherine had never liked the house', 10);
    expect(c?.startsWith('…')).toBe(true);
    expect(c?.endsWith('…')).toBe(true);
  });

  it('does not mark truncation when the window covers the whole text', () => {
    const c = extractContext(text, 'Katherine', 10_000);
    expect(c?.startsWith('…')).toBe(false);
  });

  it('anchors through whitespace and smart-quote differences', () => {
    expect(extractContext(text, 'Katherine   had  never liked', 20)).not.toBeNull();
  });

  it('returns null rather than a wrong window when the quote is absent', () => {
    // Guessing an offset would give the model context from the wrong place,
    // which is worse than giving it none.
    expect(extractContext(text, 'a line that is not in the text', 40)).toBeNull();
  });

  it('returns null on empty input', () => {
    expect(extractContext('', 'x')).toBeNull();
    expect(extractContext(text, '')).toBeNull();
  });
});
