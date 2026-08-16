'use client';

/**
 * Continuity ledger — one manuscript (design §6b, locks §5.7).
 *
 * Shows what the book has established, grouped by subject, and lets the writer
 * lock what must never change. Phase 2 only: this page never says two passages
 * disagree, because detection does not exist yet (§10 phase 4).
 *
 * LANGUAGE (§5.6). Nothing here calls anything an error, a mistake or wrong.
 * The ledger reports what the text established and where; judgement belongs to
 * the writer. That discipline matters more here than anywhere, because this is
 * the surface where a writer decides whether the tool is worth trusting.
 *
 * Client-only; imports nothing from src/prompts or src/ai (IP boundary).
 */
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

type LockKind = 'rule' | 'state';

interface LedgerFact {
  factId: string;
  entity: string;
  category: string;
  attribute: string;
  value: string;
  mutability: string;
  register: string | null;
  evidenceQuote: string | null;
  sequenceIndex: number | null;
  source: string;
  lockKind: LockKind | null;
  lockFromSequence: number | null;
}

interface LedgerEntity {
  entity: string;
  facts: LedgerFact[];
}

/** Plain-language glosses, per Principle 27 — a craft term is explained in the
 *  same breath it is used. These say what the row means to the writer, not
 *  what the term means in the abstract. */
const REGISTER_GLOSS: Record<string, string> = {
  narration_omniscient: 'stated by the narration',
  narration_pov: 'stated within a character’s viewpoint',
  interiority: 'a character believed it',
  dialogue: 'a character said it',
  document: 'from a letter, diary or document in the story',
};

/** `character:sarah` reads badly on a page. */
function displayEntity(entity: string): string {
  const [kind, ...rest] = entity.split(':');
  const name = rest.join(':') || kind || entity;
  const titled = name.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return kind && rest.length > 0 && kind !== 'character' ? `${titled} (${kind})` : titled;
}

function displayAttribute(attribute: string): string {
  return attribute.replace(/_/g, ' ');
}

export default function LedgerDetailPage({ params }: { params: { manuscriptId: string } }) {
  const { isSignedIn } = useAuth();
  const [entities, setEntities] = useState<LedgerEntity[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [lockingFact, setLockingFact] = useState<string | null>(null);
  const [stateChapter, setStateChapter] = useState('');

  const load = useCallback(() => {
    fetch(`/api/ledger/${params.manuscriptId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load this ledger.'))))
      .then((d: { entities: LedgerEntity[] }) => setEntities(d.entities))
      .catch((e: Error) => setError(e.message));
  }, [params.manuscriptId]);

  useEffect(() => {
    if (isSignedIn !== true) return;
    load();
  }, [isSignedIn, load]);

  async function act(body: Record<string, unknown>, method: 'PATCH' | 'DELETE', factId: string) {
    setBusy(factId);
    setError('');
    try {
      const res = await fetch(`/api/ledger/${params.manuscriptId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(d?.error ?? 'That did not work.');
      } else {
        load();
      }
    } catch {
      setError('That did not work.');
    }
    setBusy(null);
    setLockingFact(null);
    setStateChapter('');
  }

  const locks = (entities ?? []).flatMap((e) => e.facts).filter((f) => f.lockKind);

  return (
    <main className="min-h-screen bg-paper p-8 text-ink">
      <a
        href="/ledger"
        className="font-mono text-xs uppercase tracking-widest text-amber-d no-underline"
      >
        ← All manuscripts
      </a>
      <h1 className="mt-4 font-serif text-2xl">What this book has established</h1>

      {isSignedIn !== true && (
        <p className="mt-8 text-sm text-ink-soft">Sign in (top right) to see this ledger.</p>
      )}

      {error !== '' && (
        <p className="mt-6 max-w-2xl rounded border border-ink-soft px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      {isSignedIn === true && entities === null && error === '' && (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      )}

      {locks.length > 0 && (
        <section className="mt-6 max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-widest text-amber-d">
            Locked — what this book must hold to
          </div>
          <ul className="mt-2">
            {locks.map((f) => (
              <li key={f.factId} className="py-1 text-sm text-ink">
                {displayEntity(f.entity)} · {displayAttribute(f.attribute)}:{' '}
                <strong className="font-medium">{f.value}</strong>
                {f.lockKind === 'state' && f.lockFromSequence !== null && (
                  <span className="text-ink-soft"> — from chapter {f.lockFromSequence}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {entities !== null && entities.length === 0 && (
        <div className="mt-8 max-w-2xl text-sm text-ink-soft">
          <p>Nothing tracked yet.</p>
          <p className="mt-2">
            Facts collect here as complete chapters are read. Nothing is inferred from an excerpt —
            a draft mid-revision isn’t something to hold the rest of the book to.
          </p>
        </div>
      )}

      {entities !== null &&
        entities.map((group) => (
          <section key={group.entity} className="mt-8 max-w-2xl">
            <h2 className="font-serif text-lg text-ink">{displayEntity(group.entity)}</h2>
            <ul className="mt-2">
              {group.facts.map((f) => (
                <li
                  key={f.factId}
                  style={{ borderBottom: '1px solid var(--rule-l)', padding: '.75rem 0' }}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink">
                      <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                        {displayAttribute(f.attribute)}
                      </span>{' '}
                      <strong className="font-medium">{f.value}</strong>
                      {f.lockKind && (
                        <span
                          className="ml-2 font-mono text-[.6rem] uppercase tracking-wider"
                          style={{ color: 'var(--amber-d)' }}
                        >
                          {f.lockKind === 'state'
                            ? `locked from ch. ${f.lockFromSequence}`
                            : 'locked'}
                        </span>
                      )}
                    </span>

                    <span className="flex shrink-0 gap-2">
                      {f.lockKind ? (
                        <button
                          type="button"
                          disabled={busy === f.factId}
                          onClick={() => act({ factId: f.factId, action: 'unlock' }, 'PATCH', f.factId)}
                          className="rounded border border-ink-soft px-2 py-0.5 text-xs text-ink hover:bg-cream"
                        >
                          Unlock
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === f.factId}
                          onClick={() => setLockingFact(lockingFact === f.factId ? null : f.factId)}
                          className="rounded border border-ink-soft px-2 py-0.5 text-xs text-ink hover:bg-cream"
                        >
                          Lock
                        </button>
                      )}
                      {f.source === 'writer' && (
                        <button
                          type="button"
                          disabled={busy === f.factId}
                          onClick={() => act({ factId: f.factId }, 'DELETE', f.factId)}
                          className="rounded border border-ink-soft px-2 py-0.5 text-xs text-ink hover:bg-cream"
                        >
                          Remove
                        </button>
                      )}
                    </span>
                  </div>

                  {/* Why this is here — the diagnosis path (§6b): the writer can
                      see what the reading actually took this from. */}
                  {f.evidenceQuote && (
                    <div className="mt-1 text-xs italic text-ink-soft">
                      “{f.evidenceQuote}”
                      {f.sequenceIndex !== null && ` — chapter ${f.sequenceIndex}`}
                      {f.register && REGISTER_GLOSS[f.register] && (
                        <span> · {REGISTER_GLOSS[f.register]}</span>
                      )}
                    </div>
                  )}

                  {lockingFact === f.factId && (
                    <div
                      className="mt-2 rounded p-2 text-xs"
                      style={{ background: 'var(--cream)' }}
                    >
                      <div className="text-ink-soft">
                        A <strong>rule</strong> holds everywhere in the book. A <strong>state</strong>{' '}
                        holds from a chapter onward.
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            act(
                              { factId: f.factId, action: 'lock', lockKind: 'rule' },
                              'PATCH',
                              f.factId
                            )
                          }
                          className="rounded border border-ink-soft px-2 py-0.5 text-ink hover:bg-paper"
                        >
                          Lock as rule
                        </button>
                        <span className="text-ink-soft">or from chapter</span>
                        <input
                          type="number"
                          min={1}
                          value={stateChapter}
                          onChange={(e) => setStateChapter(e.target.value)}
                          className="w-16 rounded border border-ink-soft px-1 py-0.5"
                        />
                        <button
                          type="button"
                          disabled={stateChapter === ''}
                          onClick={() =>
                            act(
                              {
                                factId: f.factId,
                                action: 'lock',
                                lockKind: 'state',
                                lockFromSequence: Number(stateChapter),
                              },
                              'PATCH',
                              f.factId
                            )
                          }
                          className="rounded border border-ink-soft px-2 py-0.5 text-ink hover:bg-paper disabled:opacity-40"
                        >
                          Lock from here
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}
