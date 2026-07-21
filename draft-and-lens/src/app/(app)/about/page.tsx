'use client';
export default function AboutPage() {
  return (
    <main style={{ maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' }}>
      <button type="button" onClick={() => window.close()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Close</button>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)', marginBottom: '.4rem' }}>
        About
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '1.5rem' }}>
        A reading, not a rewrite
      </h1>

      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' }}>
        Most tools that touch your writing do one of two things. They generate text for you, or they grade you against a single rulebook — the same three-act template, the same beat sheet, applied to every script and every story regardless of what it is trying to be. Draft &amp; Lens does neither. It reads.
      </p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' }}>
        It reads your work on its own terms
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' }}>
        Before it says a single word about your work, Draft &amp; Lens establishes what kind of work it is — the tradition it belongs to and the standards that tradition actually answers to. A spare, oblique realist story and a heightened, mythic one are not held to the same rules, because they are not trying to do the same thing. A note that would be right for one is wrong for the other. This is the difference between feedback that fits your draft and feedback that could be pasted onto anyone&apos;s.
      </p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' }}>
        It lets you be read by the people who built the form
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' }}>
        Beyond the core analysis, your work can be read through the minds of master directors, novelists, screenwriters, and showrunners — each one a distinct way of seeing, not a tone setting on the same engine. They notice different things, value different things, and disagree with each other, the way real mentors do. You are not given a score. You are given a reading.
      </p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' }}>
        It never rewrites your work
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' }}>
        Draft &amp; Lens will show you the direction, name the craft problem, and point to where the work is reaching for something it hasn&apos;t yet caught — but it will not write your draft for you, and it will decline if you ask. The voice on the page stays yours. It is a partner to your writing, not a replacement for it.
      </p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 .75rem' }}>
        It bills honestly
      </h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-mid)', marginBottom: '1.25rem' }}>
        No credits. No tokens. No &ldquo;use it or lose it&rdquo; anxiety about spending an allowance every time you want to be read. You are paying to be understood, not metered by the word. A genuinely useful reading is free; the paid tiers simply give serious writers room to work — deeper drafts, all the lenses, and a place to keep their work and its revisions together.
      </p>

      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85, color: 'var(--ink-soft)', fontStyle: 'italic', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--rule-l)' }}>
        Draft &amp; Lens is for writers who want their work taken seriously — read closely, on its own terms, and answered honestly.
      </p>
    </main>
  );
}
