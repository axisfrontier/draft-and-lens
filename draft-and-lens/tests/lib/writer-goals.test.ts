import { describe, expect, it } from 'vitest';

import {
  MAX_GOALS_IN_CONTEXT,
  MAX_GOAL_LENGTH,
  normaliseGoal,
  selectGoalsForReading,
  type WriterGoal,
} from '../../src/lib/writer-goals';

/**
 * A goal is the writer's claim about themselves, which is the inverse of a
 * named pattern. Nearly everything pinned here is therefore about the product
 * NOT interfering: not rewording it, not inventing one, not holding a reading
 * against a goal set for a different book.
 */

function goal(over: Partial<WriterGoal> & { id: string }): WriterGoal {
  return {
    goal: `goal ${over.id}`,
    manuscriptId: null,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...over,
  };
}

describe('normaliseGoal', () => {
  it('keeps the writer’s own words exactly', () => {
    // No capitalisation, no full stop, no house style. The one field the
    // product must have no opinions about.
    expect(normaliseGoal('i want this to feel more urgent')).toBe(
      'i want this to feel more urgent'
    );
  });

  it('collapses stray whitespace from a paste', () => {
    expect(normaliseGoal('  I want\n\nthe ending   to earn it  ')).toBe(
      'I want the ending to earn it'
    );
  });

  it('rejects an empty optional field rather than storing a goal that says nothing', () => {
    expect(normaliseGoal('')).toBeNull();
    expect(normaliseGoal('   \n  ')).toBeNull();
    expect(normaliseGoal(undefined)).toBeNull();
    expect(normaliseGoal(42)).toBeNull();
  });

  it('cuts to what the CHECK constraint accepts rather than refusing the goal', () => {
    const long = 'a'.repeat(MAX_GOAL_LENGTH + 200);
    expect(normaliseGoal(long)).toHaveLength(MAX_GOAL_LENGTH);
  });
});

describe('selectGoalsForReading', () => {
  const standing = goal({ id: 's1', createdAt: '2026-08-01T00:00:00Z' });
  const thisBook = goal({ id: 'b1', manuscriptId: 'm1', createdAt: '2026-07-01T00:00:00Z' });
  const otherBook = goal({ id: 'b2', manuscriptId: 'm2', createdAt: '2026-08-10T00:00:00Z' });

  it('never holds a reading against a goal set for a different book', () => {
    // The failure this exists to prevent: "you said you wanted the ending to
    // earn its ambiguity" said about someone else's novel entirely.
    const picked = selectGoalsForReading([standing, thisBook, otherBook], 'm1');
    expect(picked.map((g) => g.id)).toEqual(['b1', 's1']);
  });

  it('holds a standalone piece against standing goals only', () => {
    const picked = selectGoalsForReading([standing, thisBook, otherBook], null);
    expect(picked.map((g) => g.id)).toEqual(['s1']);
  });

  it('puts the goal for this book ahead of the standing one', () => {
    // Most specific first, even though the standing goal is newer: it is the
    // goal they set while looking at this work.
    const picked = selectGoalsForReading([standing, thisBook], 'm1');
    expect(picked[0]?.id).toBe('b1');
  });

  it('takes the newest first within a scope', () => {
    const older = goal({ id: 'old', createdAt: '2026-01-01T00:00:00Z' });
    const newer = goal({ id: 'new', createdAt: '2026-08-20T00:00:00Z' });
    expect(selectGoalsForReading([older, newer], null).map((g) => g.id)).toEqual([
      'new',
      'old',
    ]);
  });

  it('caps how many reach a reading', () => {
    // A reading held against six ambitions at once is held against none.
    const many = Array.from({ length: 8 }, (_, i) =>
      goal({ id: `g${i}`, createdAt: `2026-08-0${i + 1}T00:00:00Z` })
    );
    expect(selectGoalsForReading(many, null)).toHaveLength(MAX_GOALS_IN_CONTEXT);
  });

  it('returns nothing when the writer has set no goals', () => {
    // The ordinary case, and the one the whole feature must stay silent for.
    expect(selectGoalsForReading([], 'm1')).toEqual([]);
  });
});
