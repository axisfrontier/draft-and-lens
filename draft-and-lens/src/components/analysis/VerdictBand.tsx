import { verdictColour, type Verdict } from './report';

export function VerdictBand({ verdict }: { verdict: Verdict }) {
  const colour = verdictColour(verdict.ruling);
  const hasDetail = verdict.detail.trim() !== '';
  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch',
        background: 'var(--black-band)',
        margin: '0 -3rem',
      }}
    >
      <div style={{ width: 4, background: colour, flexShrink: 0 }} />
      <div
        style={{
          flex: 1, padding: '2rem 3rem',
          display: 'flex', alignItems: 'center', gap: '3rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.7rem',
            fontWeight: 700,
            color: 'var(--amber-l)',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {verdict.ruling}
        </div>
        {hasDetail && (
          <div style={{ width: 1, background: '#3a3628', alignSelf: 'stretch', flexShrink: 0 }} />
        )}
        {hasDetail && (
          <div style={{
            fontSize: '.88rem', lineHeight: 1.75,
            color: '#b8b0a0', fontStyle: 'italic', maxWidth: 500,
          }}>
            {verdict.detail}
          </div>
        )}
      </div>
    </div>
  );
}
