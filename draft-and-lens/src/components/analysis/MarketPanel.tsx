/**
 * Industry Match — Stage E. Studio/publisher/platform matches (with known-work
 * recognition), in the prototype's dark studio section. Renders nothing if
 * Brain 4 (market) returned no matches.
 */
import type { Market } from './types';

const MATCH_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  'Strong Match': { bg: 'rgba(42,80,48,.3)', border: 'rgba(42,80,48,.5)', text: '#4a9a60' },
  'Good Match': { bg: 'rgba(168,108,16,.2)', border: 'rgba(168,108,16,.4)', text: 'var(--amber-l)' },
};
const NEUTRAL_MATCH = { bg: 'rgba(74,72,64,.2)', border: 'rgba(74,72,64,.3)', text: '#9a9080' };

export function MarketPanel({ market }: { market: Market | null }) {
  if (!market) return null;
  const studios = market.studios ?? [];
  const knownWork = market.knownWork?.trim() ?? '';
  if (studios.length === 0 && !knownWork) return null;

  return (
    <section style={{ background: 'var(--black-band)', margin: '2.5rem -3rem 0', padding: '3rem 3rem 2.5rem' }}>
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
        Industry match
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--paper)',
          letterSpacing: '-.01em',
          marginBottom: '.5rem',
        }}
      >
        Where this could go
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '.6rem',
          letterSpacing: '.1em',
          color: '#8a8478',
          fontStyle: 'italic',
          marginBottom: knownWork ? '1.25rem' : '2rem',
        }}
      >
        Suggested companies whose sensibility suits this work — a starting point, not a guarantee.
      </div>

      {knownWork && (
        <div
          style={{
            fontSize: '.82rem',
            lineHeight: 1.7,
            color: '#c8b898',
            fontStyle: 'italic',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #2e2c28',
          }}
        >
          {knownWork}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {studios.map((s, i) => {
          const ms = MATCH_STYLES[s.match] ?? NEUTRAL_MATCH;
          return (
            <div key={i} style={{ background: '#1c1a16', border: '1px solid #2e2c28', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.6rem', gap: '.75rem' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--paper)' }}>
                  {s.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '.6rem',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    padding: '.2rem .5rem',
                    background: ms.bg,
                    color: ms.text,
                    border: `1px solid ${ms.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.match}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.68rem',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: '#a09080',
                  marginBottom: '.6rem',
                }}
              >
                {s.type}
              </div>
              <div style={{ fontSize: '.82rem', lineHeight: 1.7, color: '#b0a898' }}>{s.rationale}</div>
              {s.contact && (
                <div
                  style={{
                    marginTop: '.75rem',
                    paddingTop: '.75rem',
                    borderTop: '1px solid #2e2c28',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '.58rem',
                    letterSpacing: '.08em',
                    color: '#9a9080',
                    lineHeight: 1.5,
                  }}
                >
                  {s.contact}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
