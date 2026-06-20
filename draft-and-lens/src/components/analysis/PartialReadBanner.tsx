/**
 * Partial-read banner — §13. Shown only when the tier word cap truncated the
 * read. Epistemic honesty: the reading covers the opening, and says so plainly.
 */
import type { Coverage } from './types';

export function PartialReadBanner({ coverage }: { coverage: Coverage | null }) {
  if (!coverage || !coverage.truncated) return null;
  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '.85rem 1.1rem',
        background: 'rgba(168,108,16,.12)',
        borderLeft: '3px solid var(--amber)',
        fontFamily: 'var(--font-sans)',
        fontSize: '.85rem',
        lineHeight: 1.6,
        color: 'var(--ink-mid)',
      }}
    >
      <strong style={{ color: 'var(--amber-d)', fontWeight: 600 }}>Partial read.</strong>{' '}
      This reading covers the first {coverage.wordsRead.toLocaleString()} of{' '}
      {coverage.wordsTotal.toLocaleString()} words — the opening only. The notes, scores, and arc
      reflect only what was read.
    </div>
  );
}
