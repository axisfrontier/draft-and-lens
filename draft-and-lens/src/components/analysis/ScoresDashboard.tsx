/**
 * Editorial Dashboard — Stage E. The radar (craft balance) plus the
 * tradition-alignment bars, in the prototype's two-column data-section.
 * Renders nothing if Brain 3 (scorer) returned nothing.
 */
import { TermTooltip } from '../glossary/TermTooltip';

import { RadarChart } from './RadarChart';
import type { Scores } from './types';

/**
 * The six alignment dimensions, each with a plain-language gloss (Principle 27 —
 * a craft term is glossed in the same breath it is used).
 *
 * The glosses live here rather than in GLOSSARY because that file is the
 * detection set: adding a term there underlines every occurrence of it
 * throughout a reading. "Form" and "Register" are ordinary enough words that
 * doing so would litter the prose. `TermTooltip` takes the gloss as a prop, so
 * these read identically to a glossed term in the reading without changing
 * what gets auto-detected anywhere else.
 *
 * Each gloss says what THIS ROW assesses, not what the craft term means in
 * general — the reader's question here is "what is being judged?".
 */
const ALIGN_DIMS: ReadonlyArray<{ key: string; label: string; gloss: string }> = [
  {
    key: 'register',
    label: 'Register',
    gloss: 'Whether the tone and texture of the writing suit the tradition this work belongs to.',
  },
  {
    key: 'narrator',
    label: 'Narrator/Voice',
    gloss: 'Whether the narrating voice does what this tradition needs it to do.',
  },
  {
    key: 'form',
    label: 'Form',
    gloss: 'Whether the shape the work takes — its structure and conventions — fits its tradition.',
  },
  {
    key: 'tradition_rules',
    label: 'Tradition Rules',
    gloss: 'Whether the work meets the particular expectations its tradition sets.',
  },
  {
    key: 'specificity',
    label: 'Specificity',
    gloss: 'Whether the detail is concrete enough to carry weight, rather than general or abstract.',
  },
  {
    key: 'earned',
    label: 'Earned Weight',
    gloss: 'Whether emotional or thematic weight is built by the writing, rather than asserted.',
  },
];

function scoreLabel(s: number): string {
  if (s >= 9) return 'Fully earned';
  if (s >= 7) return 'Landing well';
  if (s >= 5) return 'Developing';
  if (s >= 3) return 'Needs attention';
  return 'Not yet landing';
}

/**
 * Status dot colour. Two states only, and deliberately NO red: this is a read,
 * not a mark scheme — a dimension still developing is in progress, not wrong.
 * Amber carries "still coming", the same way it does elsewhere in the product.
 * The split sits at 7, where `scoreLabel` turns from "landing"/"earned" to
 * "developing"/"needs attention".
 */
function statusColour(s: number): string {
  return s >= 7 ? 'var(--green)' : 'var(--amber)';
}

const labelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '.72rem',
  letterSpacing: '.2em',
  textTransform: 'uppercase' as const,
  color: 'var(--amber-d)',
  marginBottom: '1.25rem',
  paddingBottom: '.5rem',
  borderBottom: '1px solid var(--rule)',
};

const captionStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '.62rem',
  letterSpacing: '.06em',
  color: 'var(--ink-faint)',
  fontStyle: 'italic' as const,
  marginBottom: '2.25rem',
};

export function ScoresDashboard({
  scores,
  tradition,
  id,
}: {
  scores: Scores | null;
  tradition?: string;
  id?: string;
}) {
  if (!scores || !scores.scores) return null;
  const craft = scores.scores;
  const alignment = scores.alignment ?? {};

  return (
    <details className="dl-collapsible" id={id} style={{ marginTop: '0', scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
      {/* header — also the disclosure control */}
      <summary style={{ padding: '2.5rem 0 1rem', borderBottom: '1px solid var(--rule)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <span className="dl-chevron" aria-hidden="true" style={{ fontSize: '.7rem', color: 'var(--amber-d)' }}>▸</span>
        <span>
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
            Editorial dashboard
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
            Craft balance
          </div>
        </span>
      </summary>

      {/* data-section grid: radar (left) + alignment bars (right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '3rem',
          alignItems: 'start',
          marginTop: '.5rem',
          marginBottom: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid var(--rule-l)',
        }}
      >
        <div>
          <div style={labelStyle}>Relative balance</div>
          <div style={captionStyle}>Shape shows where craft is balanced or skewed</div>
          <RadarChart scores={craft} />
        </div>

        <div>
          <div style={labelStyle}>Tradition alignment</div>
          <div style={captionStyle}>
            {tradition
              ? `A read, not a grade — how each element is serving ${tradition}`
              : "A read, not a grade — how each element is serving this work's tradition"}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '.85rem',
            }}
          >
            {ALIGN_DIMS.map((d) => {
              const s = alignment[d.key] ?? 0;
              return (
                <div key={d.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '.3rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '.72rem',
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      <TermTooltip term={d.label} gloss={d.gloss} />
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '.45rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '.62rem',
                        letterSpacing: '.04em',
                        textTransform: 'uppercase',
                        textAlign: 'right',
                        color: 'var(--ink)',
                        flexShrink: 0,
                      }}
                    >
                      {/* Decorative reinforcement only — the adjacent text already
                          states the status, so this is hidden from screen readers
                          rather than read out as a second, wordless signal. */}
                      <span
                        aria-hidden="true"
                        style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: statusColour(s), flexShrink: 0,
                        }}
                      />
                      {scoreLabel(s)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </details>
  );
}
