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
    <main className="min-h-screen bg-paper p-8 text-ink">
      <a href="/" className="font-mono text-xs uppercase tracking-widest text-amber-d">
        ← Back to reading
      </a>
      <h1 className="mt-4 font-serif text-2xl">Glossary</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        The craft terms a reading uses, in plain language. You’ll also meet these underlined inside
        your reading — tap any one to see what it means without leaving the page.
      </p>

      <dl className="mt-8 max-w-2xl">
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
