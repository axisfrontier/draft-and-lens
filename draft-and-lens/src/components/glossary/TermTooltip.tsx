'use client';

/**
 * Inline glossary term — §19. A craft term in a reading, dotted-underlined, with
 * a plain-language tooltip on hover / tap / focus. This is what makes the writer
 * able to meet any craft term and learn it without leaving the reading.
 */
import { useState } from 'react';

export function TermTooltip({ term, gloss }: { term: string; gloss: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          borderBottom: '1.5px dashed var(--amber)',
          color: 'var(--amber-d)',
          cursor: 'help',
        }}
      >
        {term}
      </span>
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            width: 'max-content',
            maxWidth: 260,
            background: 'var(--black-band)',
            color: 'var(--paper-dark)',
            fontFamily: 'var(--font-sans)',
            fontSize: '.72rem',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 'normal',
            textTransform: 'none',
            padding: '.5rem .65rem',
            borderLeft: '2px solid var(--amber)',
            whiteSpace: 'normal',
            pointerEvents: 'none',
          }}
        >
          {gloss}
        </span>
      )}
    </span>
  );
}
