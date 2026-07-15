'use client';

/**
 * Glossary reference — §19. The full A–Z of craft terms with their longer
 * definitions. The same terms appear inline as hover/tap tooltips throughout a
 * reading; this page is the place to browse or grow into them.
 */
import { GLOSSARY } from './glossary-data';

export function GlossaryPage() {
  const terms = Object.keys(GLOSSARY).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return (
    <main style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}>
      <a href="/" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Close</a>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)', marginBottom: '.4rem' }}>Reference</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '.5rem' }}>Glossary</h1>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '2rem' }}>
        The craft terms a reading uses, in plain language. You&rsquo;ll also meet these underlined inside
        your reading — tap any one to see what it means without leaving the page.
      </p>

      <dl>
        {terms.map((key) => {
          const entry = GLOSSARY[key];
          if (!entry) return null;
          return (
            <div key={key} style={{ borderBottom: '1px solid var(--rule-l)', padding: '1rem 0' }}>
              <dt
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                }}
              >
                {key}
              </dt>
              <dd
                style={{
                  marginTop: '.35rem',
                  fontSize: '.85rem',
                  lineHeight: 1.7,
                  color: 'var(--ink-mid)',
                }}
              >
                {entry.full}
              </dd>
            </div>
          );
        })}
      </dl>
    </main>
  );
}
