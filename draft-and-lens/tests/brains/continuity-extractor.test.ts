import { describe, expect, it } from 'vitest';

import { validateFacts } from '../../src/ai/brains/continuity-extractor';

/**
 * `validateFacts` is where precision-over-recall (§1.1) stops being a prompt
 * instruction and becomes a guarantee. Anything that survives here is stored as
 * fact and may later be shown to a writer as evidence their book contradicts
 * itself — so every rejection path is pinned, and the bias is always toward
 * dropping rather than keeping.
 */

const TEXT = `The storm had been building since noon. At the window stood Sarah, and her green eyes narrowed against the light. Her brother Tom said, "your eyes are grey, they always were." She was thirty-four that spring.`;

const good = {
  entity: 'character:sarah',
  category: 'physical',
  attribute: 'eye_colour',
  value: 'green',
  mutability: 'immutable',
  register: 'narration_omniscient',
  povCharacter: null,
  evidenceQuote: 'her green eyes narrowed',
  confidence: 0.9,
};

describe('validateFacts — accepts well-formed facts', () => {
  it('keeps a fact whose quote is present in the text', () => {
    const r = validateFacts({ facts: [good] }, TEXT);
    expect(r.facts).toHaveLength(1);
    expect(r.facts[0]?.entity).toBe('character:sarah');
    expect(r.rejected).toHaveLength(0);
  });

  it('normalises entity and attribute casing', () => {
    const r = validateFacts(
      { facts: [{ ...good, entity: 'Character:Sarah', attribute: 'Eye_Colour' }] },
      TEXT
    );
    expect(r.facts[0]?.entity).toBe('character:sarah');
    expect(r.facts[0]?.attribute).toBe('eye_colour');
  });

  it('tolerates line-wrapping and smart quotes in the evidence span', () => {
    const wrapped = validateFacts(
      { facts: [{ ...good, evidenceQuote: 'her green\n   eyes   narrowed' }] },
      TEXT
    );
    expect(wrapped.facts).toHaveLength(1);
    const curly = validateFacts(
      { facts: [{ ...good, evidenceQuote: '“your eyes are grey', register: 'dialogue' }] },
      TEXT
    );
    expect(curly.facts).toHaveLength(1);
  });

  it('keeps a low-confidence fact — uncertainty is demoted, not discarded', () => {
    const r = validateFacts({ facts: [{ ...good, confidence: 0.4 }] }, TEXT);
    expect(r.facts).toHaveLength(1);
    expect(r.facts[0]?.confidence).toBe(0.4);
  });

  it('accepts a null register rather than forcing a guess', () => {
    const r = validateFacts({ facts: [{ ...good, register: null }] }, TEXT);
    expect(r.facts).toHaveLength(1);
    expect(r.facts[0]?.register).toBeNull();
  });
});

describe('validateFacts — rejects anything unsafe to store', () => {
  it('REJECTS a paraphrased quote — the load-bearing check', () => {
    // Plausible, close to the text, and not in it. This is the failure mode
    // that would otherwise cite words the writer never wrote.
    const r = validateFacts(
      { facts: [{ ...good, evidenceQuote: 'her green eyes narrowed at the light' }] },
      TEXT
    );
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toBe('quote-not-found-in-text');
  });

  it('REJECTS a fact with no quote at all', () => {
    const r = validateFacts({ facts: [{ ...good, evidenceQuote: '' }] }, TEXT);
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toBe('no-quote');
  });

  it('REJECTS a category outside the four v1 categories', () => {
    const r = validateFacts({ facts: [{ ...good, category: 'plot' }] }, TEXT);
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toContain('bad-category');
  });

  it('REJECTS volatile mutability rather than coercing it', () => {
    const r = validateFacts({ facts: [{ ...good, mutability: 'volatile' }] }, TEXT);
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toContain('bad-mutability');
  });

  it('REJECTS an unrecognised register', () => {
    const r = validateFacts({ facts: [{ ...good, register: 'narrator' }] }, TEXT);
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toContain('bad-register');
  });

  it('REJECTS a fact below the confidence floor', () => {
    const r = validateFacts({ facts: [{ ...good, confidence: 0.1 }] }, TEXT);
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toBe('below-confidence-floor');
  });

  it('REJECTS missing required fields', () => {
    const r = validateFacts({ facts: [{ ...good, value: '  ' }] }, TEXT);
    expect(r.facts).toHaveLength(0);
    expect(r.rejected[0]?.reason).toBe('missing-required-field');
  });

  it('survives malformed brain output without throwing', () => {
    expect(validateFacts(null, TEXT).facts).toHaveLength(0);
    expect(validateFacts({}, TEXT).facts).toHaveLength(0);
    expect(validateFacts({ facts: 'nope' }, TEXT).facts).toHaveLength(0);
    expect(validateFacts({ facts: [null, 42, 'x'] }, TEXT).facts).toHaveLength(0);
  });

  it('keeps the good facts from a batch that also contains bad ones', () => {
    const r = validateFacts(
      { facts: [good, { ...good, evidenceQuote: 'invented text' }, { ...good, category: 'plot' }] },
      TEXT
    );
    expect(r.facts).toHaveLength(1);
    expect(r.rejected).toHaveLength(2);
  });
});
