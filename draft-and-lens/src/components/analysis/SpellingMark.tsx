'use client';

/**
 * A single flagged misspelling in the manuscript view — highlighted inline,
 * with a hover popup offering the correction.
 *
 * COLOUR CHOICE: this uses --error where the rest of the product deliberately
 * avoids red. That is intentional and narrow. Tradition Alignment avoids red
 * because craft is not right-or-wrong; a misspelling IS wrong by construction —
 * every entry in MISSPELLINGS is a non-word in English (see spelling.ts). Red
 * is also the one convention every writer already reads instantly. The three
 * ambers in this view are taken: anchor spans, glossary terms, and the active
 * note. A fourth would be unreadable.
 *
 * HOVER DISMISS: closing is delayed ~260ms and the popup itself keeps the
 * hover alive, so the cursor can travel from word to popup without it
 * vanishing mid-journey. That is the standard pattern and the reason no manual
 * close button is needed. Focus/blur and Enter/Space mirror it for keyboard.
 */
import { useEffect, useRef, useState } from 'react';

import type { SpellingFlag } from '@/lib/spelling';

/** Grace period before a hover-out closes the popup — long enough to cross the gap. */
const CLOSE_DELAY_MS = 260;

export function SpellingMark({
  flag,
  accepted,
  onAccept,
  children,
}: {
  flag: SpellingFlag;
  accepted: boolean;
  onAccept: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = (): void => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = (): void => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  // A pending timer must not fire into an unmounted component.
  useEffect(() => cancelClose, []);

  const accept = (): void => {
    cancelClose();
    setOpen(false);
    onAccept();
  };

  // Once accepted the word is settled: it keeps a quiet green underline so the
  // writer can see what they changed, but it no longer offers a popup.
  if (accepted) {
    return (
      <span
        style={{
          borderBottom: '1.5px solid var(--green)',
          color: 'inherit',
          padding: '.05em 0',
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={`Possible misspelling: ${flag.found}. Suggested correction: ${flag.suggestion}.`}
        onFocus={() => { cancelClose(); setOpen(true); }}
        onBlur={scheduleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accept(); }
          if (e.key === 'Escape') { cancelClose(); setOpen(false); }
        }}
        style={{
          borderBottom: '2px dotted var(--error)',
          cursor: 'pointer',
          padding: '.05em 0',
        }}
      >
        {children}
      </span>

      {open && (
        <span
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            width: 'max-content',
            maxWidth: 240,
            background: 'var(--black-band)',
            color: 'var(--paper-dark)',
            fontFamily: 'var(--font-sans)',
            fontSize: '.72rem',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 'normal',
            textTransform: 'none',
            whiteSpace: 'normal',
            padding: '.5rem .65rem',
            borderLeft: '2px solid var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: '.5rem',
          }}
        >
          <span style={{ opacity: 0.85 }}>Did you mean</span>
          <button
            type="button"
            onClick={accept}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '.74rem',
              fontWeight: 600,
              background: 'var(--paper)',
              color: 'var(--ink)',
              border: 'none',
              borderRadius: 3,
              padding: '.2rem .45rem',
              cursor: 'pointer',
            }}
          >
            {flag.suggestion}
          </button>
        </span>
      )}
    </span>
  );
}
