'use client';
export default function TermsPage() {
  const h2: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' };
  const p: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' };

  return (
    <main style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}>
      <button type="button" onClick={() => window.close()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Close</button>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)', marginBottom: '.4rem' }}>Legal</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '.5rem' }}>Terms of Service</h1>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--ink-faint)', marginBottom: '2rem' }}>Last updated: 29 June 2026</p>

      <h2 style={h2}>1. About these terms</h2>
      <p style={p}>These terms govern your use of Draft &amp; Lens (&ldquo;D&amp;L&rdquo;). By creating an account or using the service you agree to them. This service is for users aged 18 and over.</p>

      <h2 style={h2}>2. What D&amp;L is — and is not</h2>
      <p style={p}>D&amp;L provides an AI-generated literary reading of writing you submit. It is a reading, not a rewrite — one informed perspective on your work, not professional editorial, publishing, or legal advice. Readings are AI-generated and may vary between runs. They are one perspective to weigh, not an authoritative verdict.</p>

      <h2 style={h2}>3. Your work stays yours</h2>
      <p style={p}>You retain all copyright and ownership of the work you submit. You grant us only the limited licence necessary to operate the service — to store, process, and display your work back to you, and to generate your reading. We do not claim ownership, do not use your work to train AI models, and do not sell or publish it. The licence ends when you delete the work.</p>

      <h2 style={h2}>4. Your responsibilities</h2>
      <p style={p}>You confirm you are 18 or over. You confirm you have the right to submit the work you upload. You agree to use D&amp;L lawfully and in line with our Acceptable Use Policy.</p>

      <h2 style={h2}>5. Content we don&apos;t allow</h2>
      <p style={p}>Use of D&amp;L is subject to our <a href="/acceptable-use" style={{ color: 'var(--amber-l)' }}>Acceptable Use Policy</a>. We may refuse, remove, or decline to process content that breaches it, and may suspend or terminate accounts for serious or repeated breaches.</p>

      <h2 style={h2}>6. Availability and changes</h2>
      <p style={p}>We aim to keep D&amp;L available but do not guarantee uninterrupted service. We may change, suspend, or discontinue features, and will give reasonable notice of material changes where we can.</p>

      <h2 style={h2}>7. Liability</h2>
      <p style={p}>D&amp;L is provided &ldquo;as is.&rdquo; To the fullest extent permitted by law, we are not liable for indirect or consequential losses, or for decisions you make based on a reading. Nothing in these terms limits liability that cannot lawfully be limited.</p>

      <h2 style={h2}>8. Termination</h2>
      <p style={p}>You may stop using D&amp;L and delete your account at any time. We may suspend or terminate access for breach of these terms or the Acceptable Use Policy.</p>

      <h2 style={h2}>9. Governing law</h2>
      <p style={p}>These terms are governed by the laws of England &amp; Wales.</p>

      <h2 style={h2}>10. Contact</h2>
      <p style={p}><a href="mailto:hello@draftandlens.com" style={{ color: 'var(--amber-l)' }}>hello@draftandlens.com</a></p>

      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.8rem', color: 'var(--ink-faint)', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--rule-l)' }}>
        These terms are a working draft pending solicitor review before paid launch.
      </p>
    </main>
  );
}
