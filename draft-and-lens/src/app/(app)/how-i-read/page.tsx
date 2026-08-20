'use client';

import { closeOrGoBack } from '@/lib/leave-page';

/**
 * "How I read" — Depth & Scenarios spec, Part 2.
 *
 * The problem it solves: a writer's first reading shows them one reading. It
 * does not show them the tradition pipeline behind it, the ledger that starts
 * accumulating the moment they group a chapter, or the memory that only exists
 * once they revise. Everything the product can do that is worth staying for is
 * invisible on day one.
 *
 * Written entirely in the editor's first person — the standing voice rule in
 * CLAUDE.md — and in scenarios rather than features, because "if you send me a
 * chapter and then send me the next one" is a thing a writer can picture and
 * "continuity ledger" is not.
 *
 * SCENARIO 5 IS DELIBERATELY ABSENT. The spec lists six scenarios; five are
 * here. The missing one is cross-submission pattern recognition — Part 1,
 * Gap 2 — which is NOT BUILT: it needs the writer_patterns table and its
 * migration. Describing it here would have this page tell writers I notice
 * things across their work when I demonstrably do not, which is the single
 * claim this product cannot afford to make falsely. It goes in when Gap 2
 * ships, and not before.
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

export default function HowIReadPage() {
  return (
    <main style={wrap}>
      <button type="button" onClick={closeOrGoBack} style={closeBtn}>← Close</button>

      <div style={eyebrow}>How I read</div>
      <h1 style={h1}>What happens when you send me something</h1>

      <p style={p}>
        I read the way an editor reads — against a tradition, not against a rubric. I&apos;m not
        looking for errors. I&apos;m looking for where the writing is doing something and where it
        isn&apos;t, and why.
      </p>
      <p style={p}>
        What I can do depends on what you send me and how often you come back. A first reading is
        one thing. Ten readings of the same work in revision is something else.
      </p>

      <h2 style={h2}>If you send me a short story, and it&apos;s the first thing I&apos;ve seen</h2>
      <p style={p}>
        Before I say anything about the writing, I work out what kind of writing it is — the
        tradition it belongs to and the standards that tradition actually answers to. That decision
        shapes everything after it. Flat, affectless narration is a failure in one tradition and the
        whole instrument in another; withheld interiority is evasion here and precision there. I
        settle that first, and then I hold your work to its own standard rather than to a general
        one. The same paragraph, read as minimalism and read as gothic, gets two different readings
        from me, and both of them are honest.
      </p>

      <h2 style={h2}>If you send me a script</h2>
      <p style={p}>
        I read for different things, because a script is doing different work. I map how it builds —
        scene by scene, sequence by sequence — and I read the action lines as writing, not as
        stage directions: whether they carry the register the film needs, whether the world is
        specific enough to shoot. I look at what your protagonist wants against what they need, and
        whether the opposition is a real force or a placeholder. What I won&apos;t do is measure your
        script against a beat sheet and tell you page 30 is late.
      </p>

      <h2 style={h2}>If you revise it and send it back</h2>
      <p style={p}>
        Then I read it against the version before it, not on its own. I&apos;ll tell you at the top
        that this is a revision I&apos;m responding to, and where you&apos;ve changed something I
        raised last time, I&apos;ll say so plainly — not as praise, just as what happened. If a note
        I gave you didn&apos;t land, I&apos;ll say that too. This only works from what I actually
        have: if there is no earlier reading, I have no memory of you, and I won&apos;t pretend
        otherwise or invent a past we didn&apos;t have.
      </p>

      <h2 style={h2}>If you send me chapters of the same book</h2>
      <p style={p}>
        Tell me they belong together and I start keeping a ledger — names, ages, physical details,
        relationships, whatever the book has established as fact. Each new chapter is read against
        it. If chapter nine gives someone green eyes and chapter two gave them brown, I raise it,
        and I show you both passages so you can see what I saw rather than take my word for it. I
        only do this for complete chapters: a draft mid-revision isn&apos;t something to hold the
        rest of a book to. And when I&apos;m not certain — when a discrepancy might be a flashback,
        or deliberate — I say so, and I say what would settle it.
      </p>

      <h2 style={h2}>If you only have a paragraph and a question</h2>
      <p style={p}>
        Send it and ask. I&apos;ll tell you how the writing itself is holding up — rhythm, verb
        load, where a sentence goes slack — in a few paragraphs, in seconds, rather than putting a
        full reading around eighty words. There are things I won&apos;t do at that size, and
        I&apos;ll tell you rather than fake them: I can&apos;t identify a tradition from a
        paragraph, I won&apos;t score it, and if your question actually needs the whole chapter —
        whether it fits, whether the book coheres now — I&apos;ll ask you for the chapter instead of
        half-answering from the fragment.
      </p>

      <h2 style={h2}>What I don&apos;t do</h2>
      <p style={p}>
        I don&apos;t rewrite. I don&apos;t generate prose. I don&apos;t tell you what your work
        should be — only what it is, and where it could be more fully itself.
      </p>
    </main>
  );
}
