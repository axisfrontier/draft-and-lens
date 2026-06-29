export default function PrivacyPage() {
  const h2: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' };
  const p: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' };
  const li: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '.4rem' };

  return (
    <main style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}>
      <a href="/" onClick={(e) => { e.preventDefault(); window.close(); }} style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Close</a>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)', marginBottom: '.4rem' }}>Legal</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '.5rem' }}>Privacy Policy</h1>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--ink-faint)', marginBottom: '2rem' }}>Last updated: 29 June 2026</p>

      <h2 style={h2}>Who we are</h2>
      <p style={p}>Draft &amp; Lens (&ldquo;D&amp;L&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides an AI-generated literary reading service. For data-protection purposes, the data controller is Nenad Kojic, contactable at <a href="mailto:hello@draftandlens.com" style={{ color: 'var(--amber-l)' }}>hello@draftandlens.com</a>. This service is for users aged 18 and over.</p>

      <h2 style={h2}>What we collect</h2>
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.25rem' }}>
        <li style={li}><strong>Your account email</strong>, used to create and access your account. We do not require your real name.</li>
        <li style={li}><strong>The writing you submit</strong> so we can generate a reading.</li>
        <li style={li}><strong>The readings we generate</strong> for you.</li>
        <li style={li}><strong>Minimal technical data</strong> necessary to operate and secure the service.</li>
      </ul>
      <p style={p}>We deliberately collect as little as possible.</p>

      <h2 style={h2}>What we do NOT do with your work</h2>
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.25rem' }}>
        <li style={li}>We do <strong>not</strong> use your submitted work to train AI models.</li>
        <li style={li}>We do <strong>not</strong> sell your work or your personal data.</li>
        <li style={li}>We do <strong>not</strong> share your work except with the processors below, strictly to operate the service.</li>
        <li style={li}>We claim <strong>no ownership</strong> of your work.</li>
      </ul>

      <h2 style={h2}>Where your work actually goes</h2>
      <p style={p}>Your text is sent to <strong>Anthropic</strong> (our AI provider) to generate your reading. Anthropic&apos;s commercial terms state they do not use API data to train their models. It is stored in <strong>your own account</strong> so the revision feature can detect genuine rewrites, and so you can return to your readings. It goes <strong>nowhere else</strong> — no analytics service, no third party, ever receives your manuscript.</p>

      <h2 style={h2}>Our processors</h2>
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.25rem' }}>
        <li style={li}><strong>Anthropic</strong> — generates the reading from your text.</li>
        <li style={li}><strong>Supabase</strong> — stores your account, works, and readings (EU/UK region).</li>
        <li style={li}><strong>Clerk</strong> — manages secure login.</li>
        <li style={li}><strong>Vercel</strong> — hosts the application.</li>
      </ul>

      <h2 style={h2}>How long we keep it</h2>
      <p style={p}>We keep your works and readings while your account is active, and for 12 months after your last activity. We retain at most 5 versions of any single work. When you delete a work or your account, it enters a 30-day recovery period, after which it is permanently deleted.</p>

      <h2 style={h2}>Your rights</h2>
      <p style={p}>Under UK GDPR you have the right to access, export, correct, or delete your data. Export and deletion are available in-app. To exercise any other right, contact <a href="mailto:hello@draftandlens.com" style={{ color: 'var(--amber-l)' }}>hello@draftandlens.com</a>. You may also complain to the Information Commissioner&apos;s Office (<a href="https://ico.org.uk" style={{ color: 'var(--amber-l)' }}>ico.org.uk</a>).</p>

      <h2 style={h2}>Contact</h2>
      <p style={p}><a href="mailto:hello@draftandlens.com" style={{ color: 'var(--amber-l)' }}>hello@draftandlens.com</a></p>

      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.8rem', color: 'var(--ink-faint)', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--rule-l)' }}>
        This policy is a working draft pending solicitor review before paid launch.
      </p>
    </main>
  );
}
