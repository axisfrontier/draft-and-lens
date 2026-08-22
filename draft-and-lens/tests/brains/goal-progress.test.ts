import { describe, expect, it } from 'vitest';

import { validateGoalNotes } from '../../src/ai/brains/goal-progress';
import type { WriterGoal } from '../../src/lib/writer-goals';

/**
 * What survives this function is shown to a writer as what the reading said
 * about their own stated ambition. The prompt asks for restraint; this is
 * where restraint becomes a guarantee, so every rejection path is pinned and
 * the bias is always toward dropping.
 */

const REPORT = `## WHAT THE OPENING DOES
The first page moves without pausing to explain itself, and the pressure it builds is real. ⟦She left the door open behind her⟧ does more work than the paragraph that follows it.

## WHERE IT SLOWS
The third scene stops to account for its own history, and the urgency the opening earned drains out of it.`;

function goal(id: string, text: string): WriterGoal {
  return {
    id,
    goal: text,
    manuscriptId: null,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };
}

const goals = [goal('g1', 'I want this to feel more urgent')];
const evidence =
  'The first page moves without pausing to explain itself, and the pressure it builds is real.';

describe('validateGoalNotes', () => {
  it('keeps a note that quotes the reading it rests on', () => {
    const notes = validateGoalNotes(
      { notes: [{ goalId: 'g1', note: 'The opening has moved toward it; the third scene has not.', evidence }] },
      REPORT,
      goals
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]?.goal).toBe('I want this to feel more urgent');
  });

  it('drops a note that cannot quote the report', () => {
    // The paraphrase is the failure being caught: a note with no sentence
    // behind it is the model judging the prose on its own account.
    const notes = validateGoalNotes(
      {
        notes: [
          { goalId: 'g1', note: 'It feels much more urgent now.', evidence: 'The opening is urgent and alive.' },
        ],
      },
      REPORT,
      goals
    );
    expect(notes).toEqual([]);
  });

  it('tolerates a quote the model re-wrapped across lines', () => {
    const wrapped = evidence.replace(', and', ',\n   and');
    const notes = validateGoalNotes(
      { notes: [{ goalId: 'g1', note: 'The opening has moved toward it.', evidence: wrapped }] },
      REPORT,
      goals
    );
    expect(notes).toHaveLength(1);
  });

  it('drops a quote too short to be a claim', () => {
    const notes = validateGoalNotes(
      { notes: [{ goalId: 'g1', note: 'Getting there.', evidence: 'The first page' }] },
      REPORT,
      goals
    );
    expect(notes).toEqual([]);
  });

  it('drops a note about a goal nobody asked about', () => {
    // A hallucinated id is a note attached to an ambition the writer never
    // stated — worse than no note at all.
    const notes = validateGoalNotes(
      { notes: [{ goalId: 'g-invented', note: 'Good progress here.', evidence }] },
      REPORT,
      goals
    );
    expect(notes).toEqual([]);
  });

  it('refuses to score, however the score is dressed', () => {
    for (const scored of [
      'You are about 60% of the way there.',
      'I would put this at 7 out of 10 against what you wanted.',
      'On that goal I would score this draft highly.',
    ]) {
      expect(
        validateGoalNotes({ notes: [{ goalId: 'g1', note: scored, evidence }] }, REPORT, goals)
      ).toEqual([]);
    }
  });

  it('leaves ordinary numbers alone — a location is not a grade', () => {
    const notes = validateGoalNotes(
      {
        notes: [
          { goalId: 'g1', note: 'The opening has moved toward it; the third scene has not.', evidence },
        ],
      },
      REPORT,
      goals
    );
    expect(notes).toHaveLength(1);
  });

  it('returns nothing for an empty or malformed answer', () => {
    // Silence is the common answer and must survive every shape of it.
    expect(validateGoalNotes(null, REPORT, goals)).toEqual([]);
    expect(validateGoalNotes({}, REPORT, goals)).toEqual([]);
    expect(validateGoalNotes({ notes: [] }, REPORT, goals)).toEqual([]);
  });

  it('never repeats the same goal twice', () => {
    const notes = validateGoalNotes(
      {
        notes: [
          { goalId: 'g1', note: 'The opening has moved toward it.', evidence },
          { goalId: 'g1', note: 'And again, separately.', evidence },
        ],
      },
      REPORT,
      goals
    );
    expect(notes).toHaveLength(1);
  });

  it('caps how many notes reach the writer', () => {
    const three = ['g1', 'g2', 'g3'].map((id) => goal(id, `goal ${id}`));
    const notes = validateGoalNotes(
      {
        notes: three.map((g) => ({ goalId: g.id, note: `something about ${g.id}`, evidence })),
      },
      REPORT,
      three
    );
    // Three goals may reach the reading; three notes above the lenses would be
    // a report card.
    expect(notes).toHaveLength(2);
  });
});
