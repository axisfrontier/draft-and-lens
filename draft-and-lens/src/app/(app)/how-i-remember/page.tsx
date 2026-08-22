'use client';

import { closeOrGoBack } from '@/lib/leave-page';

/**
 * "How I remember" — Mentor Completeness spec, Gap C.
 *
 * The companion to /how-i-read. That page answers what happens when you send
 * me something; this one answers what happens when you keep sending. The
 * paid mentor tier's whole value is in the second question, and until this
 * page existed a writer could only discover it by having already paid.
 *
 * NO COMPARISON TABLE, no feature matrix, no free-versus-paid framing — the
 * spec is explicit, and it is right: a table would make the reading
 * relationship look like a plan, and what is actually on offer is that
 * somebody remembers your work. That is felt in the description or it is not
 * felt at all.
 *
 * EVERY CLAIM HERE IS BUILT. Revision memory, named patterns, trajectory and
 * stated goals all exist and all run today. The sixth scenario on /how-i-read
 * was deliberately held back while its feature did not exist, for the reason
 * that governs this page too: a retention page describing memory the product
 * does not have is the one claim it cannot afford to make falsely.
 */

const wrap = { maxWidth: 760, margin: '4rem auto', padding: '0 2rem 6rem' } as const;
const eyebrow = {
  fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.2em',
  textTransform: 'uppercase' as const, color: 'var(--amber-d)', marginBottom: '.4rem',
} as const;
const h1 = {
  fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700,
  color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '1.5rem',
} as const;
const h2 = {
  fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700,
  color: 'var(--ink)', margin: '2.25rem 0 .75rem',
} as const;
const p = {
  fontFamily: 'var(--font-sans)', fontSize: '.95rem', lineHeight: 1.85,
  color: 'var(--ink-mid)', marginBottom: '1.25rem',
} as const;
const closeBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.12em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
  display: 'inline-block', marginBottom: '2rem',
} as const;

export default function HowIRememberPage() {
  return (
    <main style={wrap}>
      <button type="button" onClick={closeOrGoBack} style={closeBtn}>← Close</button>

      <div style={eyebrow}>How I remember</div>
      <h1 style={h1}>What happens when you keep sending me work</h1>

      <p style={p}>
        One reading can tell you what a piece is doing. It can&apos;t tell you what you do — that
        only shows up across work, over time, and it&apos;s the part of an editor&apos;s attention
        that takes years to earn from a person. Everything below is what I hold on to between
        readings, and none of it happens unless you come back.
      </p>

      <h2 style={h2}>I read your revision against the note that asked for it</h2>
      <p style={p}>
        When you send a piece back, I don&apos;t read it as though I&apos;ve never seen it. I have
        what I asked you for last time, stored in my own words, and I read the new draft against
        it. Where you&apos;ve answered something, I say so plainly — not as praise, just as what
        happened. Where the same weakness is still there, I name it again without reproach: you
        may never have seen the note, or you may have decided against it, which is your right. I
        never grade the revision, and I never hand your old notes back to you as a checklist.
      </p>

      <h2 style={h2}>I name a habit only once it is a habit</h2>
      <p style={p}>
        Send me three pieces and I start to see what one piece can&apos;t show: the narration
        stepping in to say what the scene had already said, an abstraction standing where the
        concrete work was needed, an ending stopping just short of the specificity its tradition
        asks for. When I&apos;ve seen the same thing in more than one work, I&apos;ll name it once,
        as a pattern rather than as a note about this draft. Never from a single piece, however
        clearly it shows — three revisions of one story are one piece of evidence about a writer,
        not three. And if I&apos;m wrong, you tell me it isn&apos;t true of your work and I stop
        saying it. Permanently.
      </p>

      <h2 style={h2}>I tell you whether it&apos;s moving</h2>
      <p style={p}>
        Knowing a habit exists is worth something. Knowing whether you&apos;re getting out of it is
        worth more, and it&apos;s the thing a mentor says at the fourth session that nobody can say
        at the first. So once there&apos;s enough work behind it, I&apos;ll tell you what the
        trajectory looks like — that it hasn&apos;t turned up in your last couple of pieces, or
        that it&apos;s been in every recent one, or that it simply hasn&apos;t shifted. I
        won&apos;t dress that last one up. Stable means stable, and a percentage on any of it would
        be false precision on something that isn&apos;t a number.
      </p>

      <h2 style={h2}>I hold what you told me you were trying to do</h2>
      <p style={p}>
        Tell me what you want — for a book, or for your writing in general — and I keep it. Every
        reading after that is held against it as well as against the tradition: you said you wanted
        this to feel more urgent, and here is what I can see of that, and where. I won&apos;t score
        it, I won&apos;t tell you it&apos;s met or unmet, and I won&apos;t invent progress to have
        something encouraging to say — if a draft gives me nothing real to say about what you
        wanted, I say nothing about it. Your goal never replaces the standard your work answers to;
        the tradition still decides that. But if what you want pulls against what the tradition
        needs, that&apos;s worth knowing, and I&apos;ll tell you.
      </p>

      <h2 style={h2}>What I won&apos;t pretend</h2>
      <p style={p}>
        I only know what you&apos;ve sent me. If there&apos;s no earlier reading, I have no memory
        of you and I won&apos;t invent a past we didn&apos;t have. If a habit shows up once, it
        stays a note about that draft. And everything I remember about your work is yours to
        correct or take away — a pattern you reject, a goal you set aside, a piece you delete.
        Memory you can&apos;t argue with isn&apos;t mentorship.
      </p>
    </main>
  );
}
