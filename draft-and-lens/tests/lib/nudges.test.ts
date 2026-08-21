import { describe, expect, it } from 'vitest';

import { selectNudge } from '../../src/lib/nudges';

/**
 * A nudge burns the writer's only sighting of that line for the life of their
 * account, so what matters most here is when nothing is returned. Showing the
 * wrong one is not recoverable by a later reading getting it right.
 */
describe('selectNudge', () => {
  const base = { priorSubmissions: 5, factsExtracted: 0, differentiatorShown: false };

  it('says nothing on an ordinary reading', () => {
    expect(selectNudge(base)).toBeNull();
  });

  it('never appears beside the method line', () => {
    // Both are quiet italic asides in the same peripheral vision. Two in one
    // reading is the clutter the one-per-reading rule exists to prevent, and
    // the method line is the more important of the two.
    expect(selectNudge({ ...base, differentiatorShown: true })).toBeNull();
    expect(
      selectNudge({ priorSubmissions: 0, factsExtracted: 4, differentiatorShown: true })
    ).toBeNull();
  });

  it('names the ledger when this chapter actually contributed facts', () => {
    const n = selectNudge({ ...base, factsExtracted: 3 });
    expect(n?.milestone).toBe('nudge_ledger_tracking');
  });

  it('prefers what happened over what might happen', () => {
    // A first reading that also grouped a chapter gets the ledger line, not
    // the revision-memory one: the spec's rule is that a nudge fires when the
    // feature "was actually used or is directly applicable", and the first of
    // those is the stronger claim.
    const n = selectNudge({ priorSubmissions: 0, factsExtracted: 2, differentiatorShown: false });
    expect(n?.milestone).toBe('nudge_ledger_tracking');
  });

  it('offers revision memory on a first reading', () => {
    const n = selectNudge({ priorSubmissions: 0, factsExtracted: 0, differentiatorShown: false });
    expect(n?.milestone).toBe('nudge_revision_memory');
  });

  it('offers the compounding line on the third submission only', () => {
    // priorSubmissions is counted BEFORE this reading is stored, so two prior
    // means this is the third. Second and fourth get nothing.
    expect(selectNudge({ ...base, priorSubmissions: 2 })?.milestone).toBe('nudge_keep_sending');
    expect(selectNudge({ ...base, priorSubmissions: 1 })).toBeNull();
    expect(selectNudge({ ...base, priorSubmissions: 3 })).toBeNull();
  });

  it('returns at most one nudge, always', () => {
    // Not a behaviour so much as the shape of the contract: the return type
    // cannot express two, which is what makes one-per-reading structural
    // rather than a rule someone has to remember.
    const n = selectNudge({ priorSubmissions: 0, factsExtracted: 9, differentiatorShown: false });
    expect(n === null || typeof n.text === 'string').toBe(true);
  });
});
