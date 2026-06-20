import type { ReactNode } from 'react';

/**
 * Render a section body's lightweight markdown as React nodes — mirrors the
 * prototype's formatBody(): **bold**, *italic*, `> quote` callouts, and
 * blank-line-separated paragraphs. `onDark` recolours for the black callout
 * boxes. No HTML injection — every node is real JSX.
 */

/** Inline **bold** / *italic* → React nodes. */
function renderInline(text: string, onDark: boolean): ReactNode[] {
  const strongCol = onDark ? '#f0ead8' : 'var(--ink)';
  const emCol = onDark ? '#c8c0b0' : 'var(--ink-soft)';
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*([^*\n]+?)\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={key++} style={{ color: strongCol, fontWeight: 500 }}>
          {m[1]}
        </strong>
      );
    } else if (m[2] !== undefined) {
      nodes.push(
        <em key={key++} style={{ color: emCol }}>
          {m[2]}
        </em>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function FormattedBody({
  text,
  onDark = false,
}: {
  text: string;
  onDark?: boolean;
}) {
  const bodyCol = onDark ? '#b0a898' : 'var(--ink-mid)';
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {paras.map((p, i) => {
        if (p.startsWith('>')) {
          const quote = p.replace(/^>\s?/gm, '').replace(/\n/g, ' ');
          return (
            <div
              key={i}
              style={{
                margin: '1rem 0',
                padding: '.85rem 1.1rem',
                background: 'var(--warm-mid)',
                borderLeft: '2px solid var(--amber)',
                fontFamily: 'var(--font-mono)',
                fontSize: '.78rem',
                lineHeight: 1.7,
                color: 'var(--ink-soft)',
                maxWidth: 600,
              }}
            >
              {renderInline(quote, false)}
            </div>
          );
        }
        return (
          <p
            key={i}
            style={{
              fontSize: '.82rem',
              lineHeight: 1.7,
              color: bodyCol,
              marginBottom: '.85rem',
              maxWidth: 660,
            }}
          >
            {renderInline(p.replace(/\n/g, ' '), onDark)}
          </p>
        );
      })}
    </>
  );
}
