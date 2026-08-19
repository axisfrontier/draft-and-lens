import { describe, expect, it } from 'vitest';

import type { LedgerFact } from '../../src/lib/continuity';
import type { NarrativeFrame } from '../../src/lib/detection-gates';
import { findStateLockViolations } from '../../src/lib/state-locks';

const fact = (o: Partial<LedgerFact>): LedgerFact =>
  ({
    factId: 'f1',
    entity: 'character:sarah',
    category: 'physical',
    attribute: 'state',
    value: 'dead',
    mutability: 'immutable',
    register: 'narration_omniscient',
    povCharacter: null,
    evidenceQuote: 'a quote',
    readingId: 'r1',
    sequenceIndex: 1,
    confidence: 0.9,
    source: 'extracted',
    lockKind: null,
    lockFromSequence: null,
    reconciledAt: null,
    createdAt: '2026-08-19T00:00:00Z',
    ...o,
  }) as LedgerFact;

const LOCK = fact({
  factId: 'lock', source: 'writer', lockKind: 'state', lockFromSequence: 12, value: 'dead',
});
const UNKNOWN: NarrativeFrame = { nonLinear: null, unreliableNarrator: null, multiplePov: null };
const LINEAR: NarrativeFrame = { nonLinear: false, unreliableNarrator: null, multiplePov: null };
const NONLINEAR: NarrativeFrame = { nonLinear: true, unreliableNarrator: null, multiplePov: null };

describe('findStateLockViolations', () => {
  it('raises a later narration appearance against a state lock', () => {
    const v = findStateLockViolations([LOCK, fact({ factId: 'a', sequenceIndex: 18 })], UNKNOWN);
    expect(v).toHaveLength(1);
    expect(v[0]!.lockFactId).toBe('lock');
    expect(v[0]!.appearanceFactId).toBe('a');
  });

  it('is only a question while the timeline is unknown — 1a, unknown-and-demote', () => {
    const v = findStateLockViolations([LOCK, fact({ factId: 'a', sequenceIndex: 18 })], UNKNOWN);
    expect(v[0]!.tier).toBe('worth_checking');
    expect(v[0]!.explanation).toMatch(/flashback/i);
  });

  it('does not reach the locked tier in a non-linear manuscript', () => {
    const v = findStateLockViolations([LOCK, fact({ factId: 'a', sequenceIndex: 18 })], NONLINEAR);
    expect(v[0]!.tier).toBe('worth_checking');
  });

  it('reaches the locked tier only when the book is known linear', () => {
    const v = findStateLockViolations([LOCK, fact({ factId: 'a', sequenceIndex: 18 })], LINEAR);
    expect(v[0]!.tier).toBe('locked');
    // Even here the innocent explanation is offered first — a memory is still
    // ordinary and the ledger cannot see one.
    expect(v[0]!.explanation).toMatch(/flashback|memory|dream/i);
  });

  it('ignores appearances at or before the lock point', () => {
    const before = findStateLockViolations(
      [LOCK, fact({ factId: 'a', sequenceIndex: 11 }), fact({ factId: 'b', sequenceIndex: 12 })],
      UNKNOWN
    );
    expect(before).toHaveLength(0);
  });

  it('ignores dialogue and documents — a person talking about her is not the book (§5.2)', () => {
    const v = findStateLockViolations(
      [
        LOCK,
        fact({ factId: 'a', sequenceIndex: 18, register: 'dialogue' }),
        fact({ factId: 'b', sequenceIndex: 19, register: 'document' }),
        fact({ factId: 'c', sequenceIndex: 20, register: 'interiority' }),
      ],
      UNKNOWN
    );
    expect(v).toHaveLength(0);
  });

  it('reports ONE violation per lock, citing the earliest appearance', () => {
    // Six later chapters naming a dead character is one thing to look at, not
    // six; repeating it per chapter would read as the tool malfunctioning.
    const v = findStateLockViolations(
      [
        LOCK,
        fact({ factId: 'late', sequenceIndex: 30 }),
        fact({ factId: 'early', sequenceIndex: 14 }),
        fact({ factId: 'mid', sequenceIndex: 20 }),
      ],
      UNKNOWN
    );
    expect(v).toHaveLength(1);
    expect(v[0]!.appearanceFactId).toBe('early');
  });

  it('respects a writer dismissal on either side (§5.5)', () => {
    const dismissedLock = findStateLockViolations(
      [fact({ ...LOCK, reconciledAt: '2026-08-19T00:00:00Z' }), fact({ factId: 'a', sequenceIndex: 18 })],
      UNKNOWN
    );
    expect(dismissedLock).toHaveLength(0);

    const dismissedAppearance = findStateLockViolations(
      [LOCK, fact({ factId: 'a', sequenceIndex: 18, reconciledAt: '2026-08-19T00:00:00Z' })],
      UNKNOWN
    );
    expect(dismissedAppearance).toHaveLength(0);
  });

  it('ignores rule locks, which are chronology-free and checked elsewhere', () => {
    const ruleLock = fact({ factId: 'rl', source: 'writer', lockKind: 'rule', lockFromSequence: null });
    expect(findStateLockViolations([ruleLock, fact({ factId: 'a', sequenceIndex: 18 })], UNKNOWN)).toHaveLength(0);
  });

  it('does not raise a lock against another lock the writer wrote', () => {
    const other = fact({ factId: 'lock2', source: 'writer', lockKind: 'state', lockFromSequence: 20 });
    expect(findStateLockViolations([LOCK, other], UNKNOWN)).toHaveLength(0);
  });
});
