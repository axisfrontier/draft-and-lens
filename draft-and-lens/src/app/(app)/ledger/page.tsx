'use client';

/**
 * Continuity ledger — index (design §6b, ruling 3: its own route).
 *
 * Deliberately NOT nested inside account/works: a work is one text with its
 * revisions, a manuscript is the chapter grouping the ledger hangs off, and
 * conflating them in the URL would make the ledger look like a sub-view of the
 * library rather than its own surface.
 *
 * Client-only; talks to the server through /api/ledger and imports nothing
 * from src/prompts or src/ai (IP boundary).
 */
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface Manuscript {
  manuscriptId: string;
  title: string | null;
  format: string | null;
  createdAt: string;
  chapters: number;
}

export default function LedgerIndexPage() {
  const { isSignedIn } = useAuth();
  const [manuscripts, setManuscripts] = useState<Manuscript[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSignedIn !== true) return;
    fetch('/api/ledger')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your manuscripts.'))))
      .then((d: { manuscripts: Manuscript[] }) => setManuscripts(d.manuscripts))
      .catch((e: Error) => setError(e.message));
  }, [isSignedIn]);

  return (
    <main className="min-h-screen bg-paper p-8 text-ink">
      <div className="font-mono text-xs uppercase tracking-widest text-amber-d">Continuity</div>
      <h1 className="mt-2 font-serif text-2xl">What your book has established</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Names, descriptions, ages and relationships, accumulated as each chapter is read — a
        character sheet nobody had to maintain. Lock anything the book must hold to.
      </p>

      {isSignedIn !== true && (
        <p className="mt-8 text-sm text-ink-soft">Sign in (top right) to see your ledger.</p>
      )}

      {error !== '' && (
        <p className="mt-6 rounded border border-ink-soft px-3 py-2 text-sm text-ink">{error}</p>
      )}

      {isSignedIn === true && error === '' && manuscripts === null && (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      )}

      {manuscripts !== null && manuscripts.length === 0 && (
        <div className="mt-8 max-w-2xl text-sm text-ink-soft">
          <p>No manuscripts yet.</p>
          <p className="mt-2">
            A manuscript is a group of chapters read as one book. Once chapters are grouped, what
            they establish collects here.
          </p>
        </div>
      )}

      {manuscripts !== null && manuscripts.length > 0 && (
        <ul className="mt-8 max-w-2xl">
          {manuscripts.map((m) => (
            <li
              key={m.manuscriptId}
              style={{ borderBottom: '1px solid var(--rule-l)', padding: '1rem 0' }}
            >
              <a
                href={`/ledger/${m.manuscriptId}`}
                className="font-serif text-lg text-ink no-underline hover:underline"
              >
                {m.title || 'Untitled manuscript'}
              </a>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft">
                {m.chapters} {m.chapters === 1 ? 'chapter' : 'chapters'}
                {m.format ? ` · ${m.format}` : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
