'use client';

/**
 * Inline note anchoring view — §18, Stage E. The submitted manuscript with the
 * analyst's notes pinned in the margin beside the exact lines they quote.
 * Clicking a note (or its highlighted span) links the two. Quotes the resolver
 * can't locate are shown as honest "general notes", never dropped.
 */
import { useRef, useState } from 'react';

import { resolveAnchors } from '@/lib/anchor';

export function AnchoredView({ report, text }: { report: string; text: string }) {
  const [active, setActive] = useState<number | null>(null);
  const markRefs = useRef<Record<number, HTMLElement | null>>({});

  if (!text.trim()) {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--ink-soft)', padding: '2rem' }}>
        No submitted text is available to display.
      </p>
    );
  }

  const { segments, notes, orphans } = resolveAnchors(report, text);

  const activate = (i: number): void => {
    setActive(i);
    markRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const countLine = notes.length
    ? `${notes.length} note${notes.length === 1 ? '' : 's'} pinned to the text${
        orphans.length ? ` · ${orphans.length} general` : ''
      }`
    : orphans.length
      ? 'Notes could not be pinned to specific lines — shown as general notes'
      : 'No line-anchored notes in this reading';

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '.62rem',
          letterSpacing: '.06em',
          color: 'var(--ink-soft)',
          marginBottom: '1.25rem',
        }}
      >
        {countLine}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        {/* manuscript with anchored spans */}
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '.92rem',
            lineHeight: 1.85,
            color: 'var(--ink)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {segments.map((s, i) =>
            s.anchorIndex === null ? (
              <span key={i}>{s.text}</span>
            ) : (
              <mark
                key={i}
                ref={(el) => {
                  if (s.anchorIndex !== null) markRefs.current[s.anchorIndex] = el;
                }}
                onClick={() => s.anchorIndex !== null && activate(s.anchorIndex)}
                style={{
                  background: active === s.anchorIndex ? 'rgba(168,108,16,.34)' : 'rgba(168,108,16,.14)',
                  borderBottom: `1.5px solid ${active === s.anchorIndex ? 'var(--amber)' : 'var(--amber-l)'}`,
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '.05em 0',
                  borderRadius: 2,
                }}
              >
                {s.text}
              </mark>
            )
          )}
        </div>

        {/* margin notes */}
        <div>
          {notes.map((r, i) => (
            <div
              key={i}
              onClick={() => activate(i)}
              style={{
                background: active === i ? 'var(--warm-mid)' : 'var(--cream)',
                borderLeft: `3px solid ${active === i ? 'var(--amber)' : 'var(--teal)'}`,
                borderRadius: '0 8px 8px 0',
                padding: '.7rem .9rem',
                marginBottom: '.7rem',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.55rem',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--teal)',
                  marginBottom: '.35rem',
                }}
              >
                Note {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '.8rem', lineHeight: 1.55, color: 'var(--ink-mid)' }}>{r.note}</div>
            </div>
          ))}

          {orphans.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule-l)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.55rem',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft)',
                  marginBottom: '.6rem',
                }}
              >
                General notes (not pinned to a line)
              </div>
              {orphans.map((o, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: '3px solid var(--rule)',
                    borderRadius: '0 8px 8px 0',
                    padding: '.55rem .9rem',
                    marginBottom: '.55rem',
                    fontSize: '.78rem',
                    lineHeight: 1.55,
                    color: 'var(--ink-soft)',
                  }}
                >
                  {o.note}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
