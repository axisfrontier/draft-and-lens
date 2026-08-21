'use client';

import type { ContinuityFlag } from './types';

/**
 * §6a — Continuity, the in-report view of what detection found.
 *
 * Renders from STORED flags (Nenad's ruling, 2026-08-18). The live reading
 * receives them from the server, which reads them back out of the store after
 * writing them, so this component is showing the same rows a later view of the
 * same reading would load. It has no notion of a "fresh" flag versus a
 * reloaded one, and that is deliberate — there is one source of truth.
 *
 * TONE. Two tiers, and the difference between them is the whole point of the
 * two-pass design (§9). A confirmed contradiction is stated plainly, because
 * something looked for a reason it was fine and did not find one. Everything
 * else is phrased as a question and shown quietly: it reached this section
 * precisely BECAUSE the evidence did not settle it, and a soft finding
 * displayed at full volume is the false positive §1.1 exists to prevent
 * wearing different clothes.
 *
 * This section never appears empty. Rendering a "no contradictions found"
 * panel would claim a guarantee detection cannot make — it reads mechanical
 * facts only, it caps how many pairs it adjudicates per submission, and
 * silence from it means "nothing surfaced", never "your book is consistent".
 */

/** 'character:sarah' → 'Sarah'. The prefix is a storage key, not language. */
function humaniseEntity(entity: string): string {
  const bare = entity.includes(':') ? entity.slice(entity.indexOf(':') + 1) : entity;
  return bare
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** 'eye_colour' → 'eye colour'. */
function humaniseAttribute(attribute: string): string {
  return attribute.replace(/_/g, ' ').trim();
}

export function ContinuitySection({
  flags,
  onReconcile,
}: {
  flags: readonly ContinuityFlag[];
  /** §5.5 — the writer marks this pair intentional. Absent where the section
   *  is read-only, in which case no control is offered rather than one that
   *  does nothing. */
  onReconcile?: (flagId: string) => void;
}) {
  if (flags.length === 0) return null;

  // Locked first, then contradictions, then questions. A lock is the writer's
  // own declaration about their book (§6) — one side carries no extraction
  // risk at all — so it outranks anything the reader inferred. Burying either
  // under a run of softer questions would invert the severity the two-pass
  // design and the lock tier exist to establish.
  const ordered = [...flags].sort((a, b) => {
    const rank = (f: ContinuityFlag) =>
      f.outcome === 'locked' ? 0 : f.outcome === 'contradiction' ? 1 : 2;
    return rank(a) - rank(b);
  });

  return (
    <div
      id="sec-continuity"
      style={{ marginBottom: '1.75rem', scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}
    >
      <div
        style={{
          padding: '2rem 0 1.5rem',
          borderBottom: '1px solid var(--rule)',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '.72rem',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--amber-d)',
            marginBottom: '.4rem',
          }}
        >
          Continuity
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-.01em',
          }}
        >
          What the manuscript says twice
        </div>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '.9rem',
            lineHeight: 1.6,
            color: 'var(--ink-soft)',
            margin: '.6rem 0 0',
            maxWidth: '46em',
          }}
        >
          Stated facts only — names, ages and dates, physical description, and
          direct factual claims. Nothing here is a judgement about your writing.
        </p>
      </div>

      {ordered.map((flag) => {
        const locked = flag.outcome === 'locked';
        const hard = flag.outcome === 'contradiction';
        // Locked borrows the contradiction weight rather than inventing a
        // third colour: it is the firm end of the scale, and a fourth hue
        // would read as a fourth kind of problem rather than a firmer one.
        const accent = locked || hard ? 'var(--red)' : 'var(--amber)';
        return (
          <div
            key={flag.flagId}
            style={{
              borderLeft: `2px solid ${accent}`,
              paddingLeft: '1.1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '.6rem',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '.35rem',
              }}
            >
              {locked ? 'Locked' : hard ? 'Contradiction' : 'Worth checking'}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: '.4rem',
              }}
            >
              {humaniseEntity(flag.entity)} — {humaniseAttribute(flag.attribute)}
            </div>

            {flag.reasoning && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '.95rem',
                  lineHeight: 1.65,
                  color: 'var(--ink-mid)',
                  margin: 0,
                  maxWidth: '46em',
                }}
              >
                {flag.reasoning}
              </p>
            )}

            {/* Shown on the soft tier and on locks, hidden on a confirmed
                contradiction — there the second pass found no innocent
                explanation, so printing its text would repeat the finding in
                weaker words. A lock is the opposite case: §5.7 is explicit
                that the innocent reading stays available even at the locked
                tier, because the ledger cannot see a flashback and a
                character's death is the lock it handles least confidently.
                Suppressing that caveat is precisely the over-promise the
                design warns against. */}
            {!hard && flag.explanation && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '.9rem',
                  lineHeight: 1.6,
                  color: 'var(--ink-soft)',
                  margin: '.5rem 0 0',
                  maxWidth: '46em',
                }}
              >
                {flag.explanation}
              </p>
            )}

            {/* §5.5 — one click, permanent. "The tool does not have to be
                right about intent — it has to be correctable once." Deliberately
                the quietest thing in the block: it is an escape hatch, not a
                verdict the writer is being asked to give. */}
            {onReconcile && (
              <button
                type="button"
                onClick={() => onReconcile(flag.flagId)}
                style={{
                  marginTop: '.75rem', background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                  letterSpacing: '.12em', textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}
              >
                This is intentional
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
