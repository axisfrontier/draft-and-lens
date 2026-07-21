'use client';
export default function FeedbackPage() {
  return (
    <main style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}>
      <button type="button" onClick={() => window.close()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Close</button>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)', marginBottom: '.4rem' }}>
        Feedback
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '1.5rem' }}>
        Tell us what you think
      </h1>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)' }}>
        Draft &amp; Lens is actively being developed. If a reading missed something, misjudged a tradition, or surprised you in a good way, we want to hear it. Email{' '}
        <a href="mailto:hello@draftandlens.com" style={{ color: 'var(--amber-l)', textDecoration: 'underline' }}>
          hello@draftandlens.com
        </a>.
      </p>
    </main>
  );
}
