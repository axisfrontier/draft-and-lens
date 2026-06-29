export default function AcceptableUsePage() {
  const h2: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' };
  const p: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' };
  const li: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '.4rem' };

  return (
    <main style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}>
      <a href="/" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Close</a>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)', marginBottom: '.4rem' }}>Legal</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '.5rem' }}>Acceptable Use Policy</h1>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--ink-faint)', marginBottom: '2rem' }}>Last updated: 29 June 2026</p>

      <h2 style={h2}>The spirit of this policy</h2>
      <p style={p}>Draft &amp; Lens is a tool for serious writers. <strong>Serious literature engaging with dark, difficult, violent, or sexual themes is welcome here</strong> — that is the substance of much great writing, and our reading is designed for it. This policy is not about subject matter. It targets a narrow set of genuinely prohibited content.</p>

      <h2 style={h2}>What is prohibited</h2>
      <p style={p}>You must not submit:</p>
      <ol style={{ paddingLeft: '1.25rem', marginBottom: '1.25rem' }}>
        <li style={li}><strong>Child sexual abuse material (CSAM)</strong> — any sexual content involving minors. This is absolutely prohibited, with no exception, including for claimed literary purposes.</li>
        <li style={li}><strong>Content that is illegal</strong> to possess or transmit under the laws of the jurisdiction in which we operate.</li>
        <li style={li}><strong>Pornographic content with no literary purpose</strong> — material whose function is sexual gratification rather than literary work.</li>
      </ol>

      <h2 style={h2}>The distinction we draw</h2>
      <p style={p}>We distinguish between a literary work that depicts difficult or sexual subject matter (allowed) and prohibited content as defined above (not allowed). We err on the side of allowing serious creative work.</p>

      <h2 style={h2}>Your responsibility</h2>
      <p style={p}>You are responsible for ensuring the work you submit is lawful where you are, and that you have the right to submit it.</p>

      <h2 style={h2}>What happens if content breaches this policy</h2>
      <p style={p}>We may refuse to process it, decline to store it, remove it, and — for serious or repeated breaches — suspend or terminate your account.</p>

      <h2 style={h2}>Contact</h2>
      <p style={p}>Questions about this policy: <a href="mailto:hello@draftandlens.com" style={{ color: 'var(--amber-l)' }}>hello@draftandlens.com</a></p>
    </main>
  );
}
