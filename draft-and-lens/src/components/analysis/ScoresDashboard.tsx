/**
 * Editorial Dashboard — Stage E. The radar (craft balance) plus the
 * tradition-alignment bars, in the prototype's two-column data-section.
 * Renders nothing if Brain 3 (scorer) returned nothing.
 */
import { RadarChart } from './RadarChart';
import type { Scores } from './types';

const ALIGN_DIMS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'register', label: 'Register' },
  { key: 'narrator', label: 'Narrator/Voice' },
  { key: 'form', label: 'Form' },
  { key: 'tradition_rules', label: 'Tradition Rules' },
  { key: 'specificity', label: 'Specificity' },
  { key: 'earned', label: 'Earned Weight' },
];

function barColour(s: number): string {
  if (s >= 7) return 'var(--teal)';
  if (s >= 5) return 'var(--amber)';
  return 'var(--tension)';
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
  marginBottom: '.5rem',
};

export function ScoresDashboard({ scores }: { scores: Scores | null }) {
  if (!scores || !scores.scores) return null;
  const craft = scores.scores;
  const alignment = scores.alignment ?? {};

  return (
    <section style={{ marginTop: '1rem' }}>
      {/* header */}
      <div style={{ padding: '2.5rem 0 1rem', borderBottom: '1px solid var(--rule)', marginBottom: '2rem' }}>
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
          Editorial Dashboard
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
          Craft Balance
        </div>
      </div>

      {/* data-section grid: radar (left) + alignment bars (right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={labelStyle}>Relative Balance</div>
          <div style={captionStyle}>Shape shows where craft is balanced or skewed</div>
          <RadarChart scores={craft} />
        </div>

        <div>
          <div style={labelStyle}>Tradition Alignment</div>
          <div style={captionStyle}>How well each element serves the identified tradition</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '.85rem 2rem',
              marginTop: '.5rem',
            }}
          >
            {ALIGN_DIMS.map((d) => {
              const s = alignment[d.key] ?? 0;
              return (
                <div key={d.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '.72rem',
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: '#c8b898',
                      }}
                    >
                      {d.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '.9rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      {s}
                    </span>
                  </div>
                  <div style={{ height: 2, background: 'var(--rule-l)' }}>
                    <div style={{ height: '100%', width: `${s * 10}%`, background: barColour(s) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
