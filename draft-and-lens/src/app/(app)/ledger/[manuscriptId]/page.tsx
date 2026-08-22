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
import { GoalList } from '@/components/goals/GoalList';
import { closeOrGoBack } from '@/lib/leave-page';
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

interface Chapter {
  workId: string;
  title: string;
  sequenceIndex: number | null;
  updatedAt: string;
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  /** This book's character bible — moved here from the submission panel. */
  const [bible, setBible] = useState('');
  const [bibleSkip, setBibleSkip] = useState(false);
  const [bibleSaved, setBibleSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [lockingFact, setLockingFact] = useState<string | null>(null);
  const [stateChapter, setStateChapter] = useState('');
  const [addingLock, setAddingLock] = useState(false);
  const [draft, setDraft] = useState({
    entity: '',
    attribute: '',
    value: '',
    category: 'name',
    lockKind: 'rule' as LockKind,
    lockFromSequence: '',
  });

  const load = useCallback(() => {
    fetch(`/api/ledger/${params.manuscriptId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load this ledger.'))))
      .then((d: {
        entities: LedgerEntity[];
        chapters?: Chapter[];
        bible?: { bible: string | null; skip: boolean } | null;
      }) => {
        setEntities(d.entities);
        setChapters(d.chapters ?? []);
        // Null covers both "no bible written" and "migration not applied yet",
        // and both mean the same thing to this view: an empty box.
        setBible(d.bible?.bible ?? '');
        setBibleSkip(d.bible?.skip === true);
      })
      .catch((e: Error) => setError(e.message));
  }, [params.manuscriptId]);

  useEffect(() => {
    if (isSignedIn !== true) return;
    load();
  }, [isSignedIn, load]);

  /**
   * Save this book's character bible. Its own function rather than a branch in
   * act(): act() is keyed on a fact id and reloads the whole ledger, and
   * neither applies to a field that belongs to the book itself.
   */
  async function saveBible(next: { bible?: string; skip?: boolean }): Promise<void> {
    setError('');
    setBibleSaved(false);
    try {
      const res = await fetch(`/api/ledger/${params.manuscriptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bible', ...next }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(d?.error ?? "I couldn't save that. The book still has what it had.");
        return;
      }
      setBibleSaved(true);
    } catch {
      setError("I couldn't save that. The book still has what it had.");
    }
  }

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

  /**
   * Add a lock with no extracted fact behind it (§5.7). This is the path that
   * makes locking useful before extraction exists — ruling 8's whole argument
   * for moving locks into phase 2. `character:` is prefixed automatically when
   * the writer has not named a kind, so nobody has to learn the entity syntax.
   */
  async function submitNewLock() {
    setBusy('new');
    setError('');
    const entity = draft.entity.includes(':')
      ? draft.entity.trim()
      : `character:${draft.entity.trim().toLowerCase()}`;
    try {
      const res = await fetch(`/api/ledger/${params.manuscriptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity,
          category: draft.category,
          attribute: draft.attribute,
          value: draft.value,
          lockKind: draft.lockKind,
          lockFromSequence:
            draft.lockKind === 'state' && draft.lockFromSequence !== ''
              ? Number(draft.lockFromSequence)
              : undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(d?.error ?? "I couldn't add that lock.");
      } else {
        setAddingLock(false);
        setDraft({ entity: '', attribute: '', value: '', category: 'name', lockKind: 'rule', lockFromSequence: '' });
        load();
      }
    } catch {
      setError("I couldn't add that lock.");
    }
    setBusy(null);
  }

  const newLockReady =
    draft.entity.trim() !== '' &&
    draft.attribute.trim() !== '' &&
    draft.value.trim() !== '' &&
    (draft.lockKind === 'rule' || draft.lockFromSequence !== '');

  /**
   * Remove a chapter that was grouped here by mistake (§2).
   *
   * This is the safety net for whatever the auto-grouping confidence bar gets
   * wrong. The undo on the report only exists in the moment; this one is here
   * whenever the writer notices — which matters, because a wrong grouping is
   * most often spotted later, when the ledger starts showing a character who
   * belongs to a different book.
   */
  async function detachChapter(workId: string) {
    setBusy(workId);
    setError('');
    try {
      const res = await fetch('/api/ledger/detach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workId }),
      });
      if (!res.ok) setError("I couldn't take that chapter out of the book.");
      else load();
    } catch {
      setError("I couldn't take that chapter out of the book.");
    }
    setBusy(null);
  }

  const locks = (entities ?? []).flatMap((e) => e.facts).filter((f) => f.lockKind);

  return (
    <main
      // Same container as every other secondary page (glossary, about, privacy,
      // terms): centred, 760px. These two were left-flush against a full-width
      // nav, which read as broken alignment beside the rest of the app rather
      // than as a deliberate layout.
      style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}
      className="text-ink"
    >
      {/* Two exits, because they go to different places: back up to the
          manuscript list, or out of the ledger entirely to the reading this was
          opened from. Only the first existed, which left the writer one link
          from a page that also had no way out. */}
      <div className="flex items-center gap-4">
        <a
          href="/ledger"
          className="font-mono text-xs uppercase tracking-widest text-amber-d no-underline"
        >
          ← All manuscripts
        </a>
        <button
          type="button"
          onClick={closeOrGoBack}
          className="cursor-pointer border-0 bg-transparent p-0 font-mono text-xs uppercase tracking-widest text-amber-d"
        >
          ← Back to your work
        </button>
      </div>
      <h1 className="mt-4 font-serif text-2xl">What this book has established</h1>

      {/* This book's character bible. Moved off the submission panel on
          2026-08-22: it was a per-submission field, stored nowhere and re-typed
          on every chapter, when a bible is a fact about a BOOK — same cast,
          same relationships, across everything filed under it.

          A standalone piece has nowhere to put one, and that is the accepted
          cost of the move: Brain 5 still builds a bible from the text, the
          writer just cannot hand one over. */}
      {isSignedIn === true && (
        <section style={{ maxWidth: 660, marginTop: '3rem' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '.62rem',
            letterSpacing: '.18em', textTransform: 'uppercase',
            color: 'var(--amber-d)', marginBottom: '.35rem',
          }}>Character bible</div>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '.85rem', lineHeight: 1.7,
            color: 'var(--ink-soft)', margin: '0 0 1rem',
          }}>
            I build one from what you send me. Write your own here and I&apos;ll use
            it instead, on every chapter of this book.
          </p>

          <textarea
            value={bible}
            onChange={(e) => { setBible(e.target.value); setBibleSaved(false); }}
            rows={6}
            maxLength={20000}
            disabled={bibleSkip}
            placeholder="Characters, traits, relationships, voice patterns, wants, history — anything I should know."
            style={{
              width: '100%', fontFamily: 'var(--font-sans)', fontSize: '.85rem',
              lineHeight: 1.7, padding: '.6rem .8rem', background: 'var(--paper)',
              border: '1px solid var(--rule)', color: 'var(--ink)',
              outline: 'none', resize: 'vertical',
              opacity: bibleSkip ? 0.5 : 1,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '.6rem' }}>
            <button
              type="button"
              onClick={() => saveBible({ bible })}
              disabled={bibleSkip}
              style={{
                background: 'none', border: '1px solid var(--rule)', borderRadius: 4,
                padding: '.25rem .6rem', cursor: bibleSkip ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                letterSpacing: '.1em', textTransform: 'uppercase',
                color: 'var(--ink-soft)', opacity: bibleSkip ? 0.5 : 1,
              }}
            >
              Save
            </button>

            <label style={{
              display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: '.6rem',
              letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-faint)',
            }}>
              <input
                type="checkbox"
                checked={bibleSkip}
                onChange={(e) => {
                  const skip = e.target.checked;
                  setBibleSkip(skip);
                  void saveBible({ skip });
                }}
                style={{ width: 13, height: 13, accentColor: 'var(--amber-d)' }}
              />
              Don&apos;t keep one for this book
            </label>

            {bibleSaved && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                letterSpacing: '.1em', textTransform: 'uppercase',
                color: 'var(--ink-faint)',
              }}>Saved</span>
            )}
          </div>
        </section>
      )}

      {/* This book's goals (Gap B). At manuscript level rather than in the
          account, per the spec: a goal for one book belongs where the writer is
          looking at the book. Standing goals about their writing in general
          live in the account area instead. */}
      {isSignedIn === true && (
        <GoalList
          manuscriptId={params.manuscriptId}
          heading="What you're working toward here"
          blurb="Set for this book only. I hold it while I read anything filed under it — it doesn't change the standard the writing answers to, but I'll tell you what I can see against it."
        />
      )}

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

      {/* Chapters in this manuscript — the correction surface for a wrong
          grouping. Deliberately near the top: if a chapter does not belong
          here, that is the thing to fix before reading anything below it. */}
      {chapters.length > 0 && (
        <section className="mt-6 max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-widest text-amber-d">
            Chapters in this book
          </div>
          <ul className="mt-2">
            {chapters.map((ch) => (
              <li
                key={ch.workId}
                className="flex items-baseline justify-between gap-4"
                style={{ borderBottom: '1px solid var(--rule-l)', padding: '.5rem 0' }}
              >
                <span className="text-sm text-ink">
                  {ch.sequenceIndex !== null && (
                    <span className="font-mono text-xs text-ink-soft">{ch.sequenceIndex}. </span>
                  )}
                  {ch.title}
                </span>
                <button
                  type="button"
                  disabled={busy === ch.workId}
                  onClick={() => detachChapter(ch.workId)}
                  className="shrink-0 rounded border border-ink-soft px-2 py-0.5 text-xs text-ink hover:bg-cream"
                >
                  Not part of this book
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-soft">
            Removing a chapter leaves the reading untouched — it only stops it counting towards what
            this book has established.
          </p>
        </section>
      )}

      {isSignedIn === true && (
        <section className="mt-6 max-w-2xl">
          {!addingLock ? (
            <button
              type="button"
              onClick={() => setAddingLock(true)}
              className="rounded border border-ink-soft px-3 py-1.5 text-sm text-ink hover:bg-cream"
            >
              Add a lock
            </button>
          ) : (
            <div className="rounded p-3" style={{ background: 'var(--cream)' }}>
              <div className="text-sm text-ink">Something this book must hold to</div>
              <div className="mt-1 text-xs text-ink-soft">
                A <strong>rule</strong> holds everywhere — “magic always costs blood”, “Katherine is
                never spelled Kathryn”. A <strong>state</strong> holds from a chapter onward.
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <input
                  placeholder="Who or what (e.g. Sarah)"
                  value={draft.entity}
                  onChange={(e) => setDraft({ ...draft, entity: e.target.value })}
                  className="w-44 rounded border border-ink-soft px-2 py-1"
                />
                <input
                  placeholder="What about them (e.g. eye colour)"
                  value={draft.attribute}
                  onChange={(e) => setDraft({ ...draft, attribute: e.target.value })}
                  className="w-52 rounded border border-ink-soft px-2 py-1"
                />
                <input
                  placeholder="Must be (e.g. green)"
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                  className="w-40 rounded border border-ink-soft px-2 py-1"
                />
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="rounded border border-ink-soft px-2 py-1"
                >
                  <option value="name">Name</option>
                  <option value="physical">Physical description</option>
                  <option value="age_date">Age or date</option>
                  <option value="relationship">Relationship</option>
                </select>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={draft.lockKind === 'rule'}
                    onChange={() => setDraft({ ...draft, lockKind: 'rule' })}
                  />
                  Holds everywhere
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={draft.lockKind === 'state'}
                    onChange={() => setDraft({ ...draft, lockKind: 'state' })}
                  />
                  Holds from chapter
                </label>
                {draft.lockKind === 'state' && (
                  <input
                    type="number"
                    min={1}
                    value={draft.lockFromSequence}
                    onChange={(e) => setDraft({ ...draft, lockFromSequence: e.target.value })}
                    className="w-16 rounded border border-ink-soft px-1 py-1"
                  />
                )}
              </div>

              <div className="mt-3 flex gap-2 text-xs">
                <button
                  type="button"
                  disabled={!newLockReady || busy === 'new'}
                  onClick={submitNewLock}
                  className="rounded border border-ink-soft px-2.5 py-1 text-ink hover:bg-paper disabled:opacity-40"
                >
                  Add lock
                </button>
                <button
                  type="button"
                  onClick={() => setAddingLock(false)}
                  className="rounded border border-ink-soft px-2.5 py-1 text-ink hover:bg-paper"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {entities !== null && entities.length === 0 && (
        <div className="mt-8 max-w-2xl text-sm text-ink-soft">
          <p>I haven’t started tracking anything here yet.</p>
          <p className="mt-2">
            I collect facts as I read complete chapters. I take nothing from an excerpt — a draft
            mid-revision isn’t something to hold the rest of the book to.
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
