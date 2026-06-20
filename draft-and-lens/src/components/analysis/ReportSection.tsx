'use client';

/** One numbered, collapsible report section — Stage E. Mirrors the prototype. */
import { useState } from 'react';

import { FormattedBody } from './FormattedBody';

export function ReportSection({
  index,
  heading,
  body,
  defaultOpen,
  tinted,
}: {
  index: number;
  heading: string;
  body: string;
  defaultOpen: boolean;
  tinted: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const num = String(index + 1).padStart(2, '0');

  return (
    <div
      style={{
        borderBottom: '1px solid var(--rule-l)',
        background: tinted ? 'var(--cream)' : 'transparent',
        margin: tinted ? '0 -2rem' : 0,
        padding: tinted ? '0 2rem' : 0,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--rule-l)',
              width: '2.5rem',
            }}
          >
            {num}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '.9rem',
              fontWeight: 700,
              letterSpacing: '.01em',
              color: 'var(--ink)',
            }}
          >
            {heading}
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--rule)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: '1.75rem' }}>
          <FormattedBody text={body} />
        </div>
      )}
    </div>
  );
}
