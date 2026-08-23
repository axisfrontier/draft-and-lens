'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The writer's goals, listed where they belong (Mentor Completeness, Gap B).
 *
 * ONE COMPONENT FOR BOTH SCOPES. Standing goals live in the account area and a
 * book's goals live in its ledger, but they are the same object with the same
 * lifecycle — the same reason the migration put them in one table. Two copies
 * of this list would be two places for the wording, the error copy and the
 * set-aside rule to drift apart.
 *
 * SET ASIDE, NEVER DISMISS. A named pattern is dismissed because it was wrong
 * about the writer; a goal is set aside because they have moved on from it, or
 * because they got there. Nothing here congratulates them for either — the
 * product does not know which it was, and guessing would be worse than
 * silence.
 */

interface Goal {
  id: string;
  goal: string;
  manuscriptId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function GoalList({
  manuscriptId = null,
  heading,
  blurb,
}: {
  /** null → the writer's standing goals; set → this book's. */
  manuscriptId?: string | null;
  heading: string;
  blurb: string;
}): React.ReactElement {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch('/api/goals')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("I couldn't reach your goals."))))
      .then((d: { goals: Goal[] }) =>
        setGoals(d.goals.filter((g) => g.manuscriptId === manuscriptId))
      )
      .catch((e: Error) => setError(e.message));
  }, [manuscriptId]);

  useEffect(load, [load]);

  async function add(): Promise<void> {
    const goal = draft.trim();
    if (!goal || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, ...(manuscriptId ? { manuscriptId } : {}) }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError("I couldn't keep that one. Try me again.");
      return;
    }
    setDraft('');
    load();
  }

  async function save(): Promise<void> {
    if (!editing || busy) return;
    const goal = editing.value.trim();
    if (!goal) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/goals/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError("I couldn't change that one. It still says what it said.");
      return;
    }
    setEditing(null);
    load();
  }

  async function setAside(id: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError("I couldn't put that one aside. I still have it.");
      return;
    }
    load();
  }

  return (
    <section style={{ maxWidth: 660, marginTop: '3rem' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '.62rem',
        letterSpacing: '.18em', textTransform: 'uppercase',
        color: 'var(--amber-d)', marginBottom: '.35rem',
      }}>{heading}</div>
      <p style={{
        fontFamily: 'var(--font-sans)', fontSize: '.85rem', lineHeight: 1.7,
        color: 'var(--ink-soft)', margin: '0 0 1rem',
      }}>{blurb}</p>

      {error !== '' && (
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '.82rem',
          color: 'var(--ink)', margin: '0 0 .75rem',
        }}>{error}</p>
      )}

      {goals !== null && goals.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 1rem', padding: 0 }}>
          {goals.map((g) => (
            <li
              key={g.id}
              style={{
                borderBottom: '1px solid var(--rule-l)', padding: '.75rem 0',
                display: 'flex', alignItems: 'baseline',
                justifyContent: 'space-between', gap: '1rem',
              }}
            >
              {editing?.id === g.id ? (
                <input
                  value={editing.value}
                  onChange={(e) => setEditing({ id: g.id, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void save();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  autoFocus
                  maxLength={500}
                  style={{
                    flex: 1, fontFamily: 'var(--font-serif)', fontSize: '.92rem',
                    padding: '.35rem .6rem', background: 'var(--paper)',
                    border: '1px solid var(--rule)', color: 'var(--ink)',
                  }}
                />
              ) : (
                <span style={{
                  fontFamily: 'var(--font-serif)', fontSize: '.92rem',
                  lineHeight: 1.7, color: 'var(--ink)',
                }}>&ldquo;{g.goal}&rdquo;</span>
              )}
              <span style={{ display: 'flex', gap: '.6rem', whiteSpace: 'nowrap' }}>
                {editing?.id === g.id ? (
                  <>
                    <button type="button" onClick={save} style={controlStyle}>Save</button>
                    <button type="button" onClick={() => setEditing(null)} style={controlStyle}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing({ id: g.id, value: g.goal })}
                      style={controlStyle}
                    >
                      Reword
                    </button>
                    <button type="button" onClick={() => setAside(g.id)} style={controlStyle}>
                      Set aside
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {goals !== null && goals.length === 0 && (
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '.85rem',
          color: 'var(--ink-soft)', margin: '0 0 1rem',
        }}>Nothing yet.</p>
      )}

      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add();
          }}
          maxLength={500}
          placeholder="In your own words."
          style={{
            flex: 1, fontFamily: 'var(--font-serif)', fontSize: '.92rem',
            padding: '.45rem .7rem', background: 'var(--paper)',
            border: '1px solid var(--rule)', color: 'var(--ink)',
          }}
        />
        <button type="button" onClick={add} disabled={busy || draft.trim() === ''} style={{
          ...controlStyle,
          opacity: busy || draft.trim() === '' ? 0.5 : 1,
        }}>
          Add
        </button>
      </div>
    </section>
  );
}

const controlStyle: React.CSSProperties = {
  background: 'none', border: '1px solid var(--rule)', borderRadius: 4,
  padding: '.25rem .6rem', cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: '.6rem',
  letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-soft)',
};
