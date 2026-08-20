import { describe, expect, it } from 'vitest';

import {
  DIFFERENTIATOR_PLACEHOLDER_COPY,
  qualifiesForDifferentiator,
} from '../../src/lib/differentiator';

/**
 * The line makes the product's loudest claim about itself, so what these tests
 * pin is when it stays silent. Showing it on a reading with no memory behind it
 * would be the product asserting something that did not happen — and since it
 * fires once per account for the life of that account, a wrong firing is not
 * recoverable by the next reading getting it right.
 */
describe('qualifiesForDifferentiator', () => {
  it('qualifies on a genuine revision with real prior notes', () => {
    expect(
      qualifiesForDifferentiator({ isGenuineRevision: true, hasPriorNotes: true })
    ).toBe(true);
  });

  it('stays silent on a first reading', () => {
    // Nothing came before it, so there is no memory to name.
    expect(
      qualifiesForDifferentiator({ isGenuineRevision: false, hasPriorNotes: false })
    ).toBe(false);
  });

  it('stays silent on a revision whose prior notes could not be retrieved', () => {
    // The load-bearing case. getPriorRevisionNotes returns null when the
    // earlier reading has no WHAT TO REVISE to lift, and the analyst is then
    // handed null by the no-fabrication law — so the reading genuinely was NOT
    // made against an earlier note, whatever the revision status says.
    expect(
      qualifiesForDifferentiator({ isGenuineRevision: true, hasPriorNotes: false })
    ).toBe(false);
  });

  it('stays silent when notes exist but this is not a revision', () => {
    // A stored work can have notes from an earlier reading while THIS
    // submission is unchanged or a forced refresh. Neither is a revision, so
    // neither earns the claim.
    expect(
      qualifiesForDifferentiator({ isGenuineRevision: false, hasPriorNotes: true })
    ).toBe(false);
  });
});

/**
 * Not a style opinion — a guard. The copy is explicitly unapproved, and the
 * thing that must never happen is it shipping as final because nobody noticed
 * it had never been signed off.
 */
describe('placeholder copy', () => {
  it('exists and is a single short passage, not a marketing block', () => {
    expect(DIFFERENTIATOR_PLACEHOLDER_COPY.length).toBeGreaterThan(40);
    expect(DIFFERENTIATOR_PLACEHOLDER_COPY.length).toBeLessThan(400);
  });

  it('names no competitor and makes no comparison', () => {
    // §6's subtle half works by demonstration; the escalation names the method,
    // never a rival. A comparison here would turn a reading into an advert.
    const forbidden = /\b(unlike|better than|other tools|competitors?|chatgpt|rivals?)\b/i;
    expect(DIFFERENTIATOR_PLACEHOLDER_COPY).not.toMatch(forbidden);
  });
});
