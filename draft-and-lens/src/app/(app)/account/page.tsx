'use client';

/**
 * Your work — the library / account page (CHANGE 4). Functions so far:
 *   1 view saved works · 2 export my data · 3 delete a work (soft-delete + undo).
 * Client-only; talks to the server through /api/works[...] — imports nothing
 * from src/prompts or src/ai.
 */
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

interface Work {
  workId: string;
  title: string;
  format: string;
  updatedAt: string;
  versions: number;
}

const FORMAT_LABELS: Record<string, string> = {
  script: 'Film Script',
  treatment: 'Treatment',
  story: 'Story',
  play: 'Stage Play',
};

export default function AccountPage() {
  const { isSignedIn } = useAuth();
  const [works, setWorks] = useState<Work[] | null>(null);
  const [error, setError] = useState('');
  const [justDeleted, setJustDeleted] = useState<{ workId: string; title: string } | null>(null);

  const loadWorks = useCallback(() => {
    fetch('/api/works')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your work.'))))
      .then((d: { works: Work[] }) => setWorks(d.works))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (isSignedIn === true) loadWorks();
  }, [isSignedIn, loadWorks]);

  async function deleteWork(work: Work): Promise<void> {
    setError('');
    const res = await fetch(`/api/works/${work.workId}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Could not delete that work.');
      return;
    }
    setWorks((prev) => (prev ? prev.filter((w) => w.workId !== work.workId) : prev));
    setJustDeleted({ workId: work.workId, title: work.title });
  }

  async function undoDelete(): Promise<void> {
    if (!justDeleted) return;
    const res = await fetch(`/api/works/${justDeleted.workId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' }),
    });
    if (!res.ok) {
      setError('Could not restore that work.');
      return;
    }
    setJustDeleted(null);
    loadWorks();
  }

  return (
    <main className="min-h-screen bg-paper p-8 text-ink">
      <a href="/" className="font-mono text-xs uppercase tracking-widest text-amber-d">
        ← Back to reading
      </a>
      <h1 className="mt-4 font-serif text-2xl">Your work</h1>
      <p className="mt-1 text-sm text-ink-soft">Everything you’ve had read, saved to your account.</p>

      {isSignedIn === true && (
        <div className="mt-4">
          <a
            href="/api/export"
            className="rounded border border-ink-soft px-3 py-1.5 text-sm text-ink hover:bg-cream"
          >
            Export my data
          </a>
        </div>
      )}

      {isSignedIn !== true && (
        <p className="mt-8 text-sm text-ink-soft">Sign in (top right) to see your saved work.</p>
      )}

      {error !== '' && (
        <p className="mt-6 rounded border border-ink-soft px-3 py-2 text-sm text-ink">{error}</p>
      )}

      {/* Undo banner after a delete */}
      {justDeleted && (
        <div
          className="mt-6 flex max-w-2xl items-center justify-between gap-3 rounded px-3 py-2 text-sm text-ink-mid"
          style={{ background: 'var(--cream)', borderLeft: '3px solid var(--teal)' }}
        >
          <span>
            Deleted “{justDeleted.title}”. Recoverable for 30 days.
          </span>
          <button
            type="button"
            onClick={undoDelete}
            className="rounded border border-ink-soft px-2.5 py-1 text-xs text-ink hover:bg-paper"
          >
            Undo
          </button>
        </div>
      )}

      {isSignedIn === true && error === '' && works === null && (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      )}

      {isSignedIn === true && works !== null && works.length === 0 && !justDeleted && (
        <p className="mt-8 text-sm text-ink-soft">
          No saved work yet. Analyse something and it’ll appear here.
        </p>
      )}

      {works !== null && works.length > 0 && (
        <ul className="mt-8 max-w-2xl">
          {works.map((w) => (
            <li
              key={w.workId}
              style={{
                borderBottom: '1px solid var(--rule-l)',
                padding: '1rem 0',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--ink)' }}>
                {w.title}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '.62rem',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                  }}
                >
                  {FORMAT_LABELS[w.format] ?? w.format} · {w.versions} version
                  {w.versions === 1 ? '' : 's'} · {new Date(w.updatedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => deleteWork(w)}
                  className="rounded border border-ink-soft px-2.5 py-1 text-xs text-ink-soft hover:border-red hover:text-red"
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
