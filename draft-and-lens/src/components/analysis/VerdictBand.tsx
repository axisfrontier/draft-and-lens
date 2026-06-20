/** Verdict band — Stage E (§ report header). Mirrors the prototype's verdict-row. */
import { verdictColour, type Verdict } from './report';

export function VerdictBand({ verdict }: { verdict: Verdict }) {
  const colour = verdictColour(verdict.ruling);
  const hasDetail = verdict.detail.trim() !== '';
  return (
    <div
      style={{
        display: 'flex',
        borderTop: '1px solid var(--rule)',
        borderBottom: '1px solid var(--rule)',
        padding: '1.1rem 0',
      }}
    >
      <div style={{ width: 4, background: colour, flexShrink: 0, alignSelf: 'stretch' }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          paddingLeft: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: colour,
          }}
        >
          {verdict.ruling}
        </div>
        {hasDetail && (
          <div style={{ width: 1, background: '#3a3628', alignSelf: 'stretch', flexShrink: 0 }} />
        )}
        {hasDetail && (
          <div style={{ fontSize: '.82rem', lineHeight: 1.6, color: 'var(--ink-soft)', maxWidth: 560 }}>
            {verdict.detail}
          </div>
        )}
      </div>
    </div>
  );
}
