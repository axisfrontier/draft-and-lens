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

export function ContinuitySection({ flags }: { flags: readonly ContinuityFlag[] }) {
  if (flags.length === 0) return null;

  // Contradictions first: they are the ones a writer must act on, and burying
  // them under a run of softer questions inverts the severity the two-pass
  // design worked to establish.
  const ordered = [...flags].sort((a, b) => {
    const rank = (f: ContinuityFlag) => (f.outcome === 'contradiction' ? 0 : 1);
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
        const hard = flag.outcome === 'contradiction';
        const accent = hard ? 'var(--red)' : 'var(--amber)';
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
              {hard ? 'Contradiction' : 'Worth checking'}
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

            {/* Shown only on the soft tier. On a confirmed contradiction the
                second pass found no innocent explanation, so its text says so
                and printing it under the reasoning would just repeat the
                finding in weaker words. */}
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
          </div>
        );
      })}
    </div>
  );
}
