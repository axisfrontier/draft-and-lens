/**
 * The action-oriented callouts that close a reading — Stage E.
 * Where To Begin, Action Plan, and the numbered "What To Fix Next" list, each
 * in the prototype's dark black-band box. Mirrors renderLiveReport's tail.
 */
import type { ReactNode } from 'react';

import { FormattedBody } from './FormattedBody';
import type { ParsedReport } from './report';

function DarkBox({
  title,
  borderColour,
  children,
}: {
  title: string;
  borderColour: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: '2rem',
        background: 'var(--black-band)',
        padding: '2rem',
        borderLeft: `3px solid ${borderColour}`,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--paper)',
          letterSpacing: '-.01em',
          marginBottom: '1rem',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export function CraftDirectives({ parsed }: { parsed: ParsedReport }) {
  const { whereToBegin, actionPlan, craftDirectives } = parsed;

  const dirLines = craftDirectives
    ? craftDirectives.body
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => /^\d+\./.test(l))
    : [];

  const hasWhere = whereToBegin !== null && whereToBegin.body.trim() !== '';
  const hasAction = actionPlan !== null && actionPlan.body.trim() !== '';

  if (!hasWhere && !hasAction && dirLines.length === 0) return null;

  return (
    <>
      {hasWhere && whereToBegin && (
        <DarkBox title="Where To Begin" borderColour="var(--teal)">
          <div style={{ color: '#f0ead8' }}>
            <FormattedBody text={whereToBegin.body.trim()} onDark />
          </div>
        </DarkBox>
      )}

      {hasAction && actionPlan && (
        <DarkBox title="Action Plan" borderColour="var(--amber)">
          <div style={{ color: '#f0ead8' }}>
            <FormattedBody text={actionPlan.body.trim()} onDark />
          </div>
        </DarkBox>
      )}

      {dirLines.length > 0 && (
        <DarkBox title="What To Fix Next" borderColour="var(--amber-d)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {dirLines.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '.6rem',
                    color: 'var(--amber-l)',
                    minWidth: '1.5rem',
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '.88rem', lineHeight: 1.6, color: '#f0ead8' }}>
                  {line.replace(/^\d+\.\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        </DarkBox>
      )}
    </>
  );
}
