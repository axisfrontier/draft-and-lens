export default function BetaGatePage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams?.next ?? '/';
  return (
    <main style={{
      minHeight: '100vh', background: 'var(--black-band)', color: 'var(--paper-dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700,
          color: 'var(--paper)', marginBottom: '.5rem', letterSpacing: '-.02em',
        }}>
          Draft<span style={{ color: 'var(--amber)' }}>&amp;</span>Lens
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '.68rem', letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'var(--label-amber)', marginBottom: '2rem',
        }}>
          Private beta &mdash; access required
        </div>
        <form method="POST" action="/api/beta-gate">
          <input type="hidden" name="next" value={next} />
          <label style={{
            fontFamily: 'var(--font-mono)', fontSize: '.68rem', letterSpacing: '.14em',
            textTransform: 'uppercase', color: 'var(--label-amber)',
            display: 'block', marginBottom: '.5rem',
          }}>
            Beta password
          </label>
          <input
            type="password"
            name="password"
            autoFocus
            style={{
              width: '100%', fontFamily: 'var(--font-sans)', fontSize: '.95rem',
              padding: '.85rem 1rem', background: 'var(--surface-input)',
              border: '1px solid var(--amber-d)', color: 'var(--paper-dark)',
              outline: 'none', borderRadius: 12, marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
          />
          {searchParams?.error && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '.68rem',
              color: 'var(--error)', marginBottom: '1rem',
            }}>
              Incorrect password. Try again.
            </div>
          )}
          <button
            type="submit"
            style={{
              width: '100%', fontFamily: 'var(--font-mono)', fontSize: '.68rem',
              letterSpacing: '.18em', textTransform: 'uppercase', padding: '.9rem',
              background: 'var(--amber)', color: 'var(--black-band)', border: 'none',
              cursor: 'pointer', fontWeight: 600, borderRadius: 12,
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
