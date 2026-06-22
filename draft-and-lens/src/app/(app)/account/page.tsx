'use client';

/**
 * Your work — the library / account page (CHANGE 4). Function 1: view what's
 * stored. Lists the signed-in writer's saved works. Later functions (rename,
 * delete, export, account-wipe) attach to this page. Client-only; talks to the
 * server through /api/works — imports nothing from src/prompts or src/ai.
 */
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (isSignedIn !== true) return;
    let active = true;
    fetch('/api/works')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your work.'))))
      .then((d: { works: Work[] }) => {
        if (active) setWorks(d.works);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [isSignedIn]);

  return (
    <main className="min-h-screen bg-paper p-8 text-ink">
      <a href="/" className="font-mono text-xs uppercase tracking-widest text-amber-d">
        ← Back to reading
      </a>
      <h1 className="mt-4 font-serif text-2xl">Your work</h1>
      <p className="mt-1 text-sm text-ink-soft">Everything you’ve had read, saved to your account.</p>

      {isSignedIn !== true && (
        <p className="mt-8 text-sm text-ink-soft">Sign in (top right) to see your saved work.</p>
      )}

      {error !== '' && (
        <p className="mt-8 rounded border border-ink-soft px-3 py-2 text-sm text-ink">{error}</p>
      )}

      {isSignedIn === true && error === '' && works === null && (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      )}

      {isSignedIn === true && works !== null && works.length === 0 && (
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
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.62rem',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  whiteSpace: 'nowrap',
                }}
              >
                {FORMAT_LABELS[w.format] ?? w.format} · {w.versions} version
                {w.versions === 1 ? '' : 's'} · {new Date(w.updatedAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
