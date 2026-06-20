'use client';

/** Character bible — Stage E. Collapsible panel, closed by default. Plain text
 *  built from the submitted work by Brain 5. Renders nothing if none was made. */
import { useState } from 'react';

export function BiblePanel({ bible }: { bible: string }) {
  const [open, setOpen] = useState(false);
  if (!bible.trim()) return null;

  return (
    <div style={{ borderBottom: '1px solid var(--rule-l)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '.6rem',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--amber-d)',
            }}
          >
            Character bible
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '.52rem',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              padding: '.2rem .5rem',
              background: 'rgba(168,108,16,.1)',
              color: 'var(--amber-d)',
              border: '1px solid rgba(168,108,16,.2)',
            }}
          >
            Auto-generated
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--rule)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: '1.5rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '.6rem',
              letterSpacing: '.08em',
              color: 'var(--ink-faint)',
              marginBottom: '1rem',
              fontStyle: 'italic',
            }}
          >
            Built from the submitted text. Cross-referenced against the analysis for consistency.
          </p>
          <div
            style={{
              fontSize: '.88rem',
              lineHeight: 1.85,
              color: 'var(--ink-mid)',
              whiteSpace: 'pre-wrap',
              maxWidth: 660,
            }}
          >
            {bible}
          </div>
        </div>
      )}
    </div>
  );
}
