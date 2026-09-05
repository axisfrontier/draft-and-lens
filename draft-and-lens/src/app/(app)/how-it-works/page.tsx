'use client';

import { Suspense, useEffect, useState } from 'react';

import { closeOrGoBack } from '@/lib/leave-page';

/**
 * "How it works" — the merge of /how-i-read and /how-i-remember.
 *
 * Two pages, two nav entries and one question split across them: what happens
 * when you send me something, and what happens when you keep sending. A writer
 * deciding whether to come back needed both halves and had no reason to think
 * the second link was anything other than a variation on the first.
 *
 * THE MERGE CHANGED NO COPY. Both tabs carry their page's text verbatim; that
 * was a structural change and nothing was rewritten for it. The one thing that
 * did not survive is each page's own eyebrow ("How I read", "How I remember") —
 * those were page identity, and the tab labels are that now.
 *
 * ADDED 2026-09-05, approved by Nenad: three sections on the "A reading" tab —
 * "I question the ambition itself", "I tell you what I read it against" and
 * "When nothing fits". They are the page's account of the 2026-09-01 merge,
 * which folded the interrogated read into every reading; before them, the one
 * page that explains the product said nothing about the thing most likely to
 * surprise a writer. PURELY ADDITIVE — not one pre-existing sentence changed.
 *
 * They sit after the short-story section because that is where the tradition
 * decision is established and the best-in-class comparison is its next step.
 * Their headings are declarative among conditional ones ("If you send me…") on
 * purpose: these describe what EVERY reading does, not what one kind of
 * submission gets.
 *
 * "read it against", never "hold it against" — that idiom is banned across the
 * app by the 2026-08-23 ruling, with one pinned exemption for the no-match line
 * (`tests/lib/reading-standard.test.ts`). This copy takes no shelter under it.
 * "I question the ambition itself" is the approved no-match line's own opening,
 * verbatim, because a writer meets those exact words atop a real reading. The
 * excerpt case is disclosed here even though the page had never mentioned
 * excerpts, because the reading now tells excerpt-submitters the comparison was
 * withheld and this page must not read as though it always happens.
 *
 * TAB STATE LIVES IN THE URL, and is written with replaceState rather than
 * pushState. Close must still return the writer to the reading they came from,
 * and pushing an entry per tab click would leave them pressing Close through
 * their own browsing of this page.
 */

type Tab = 'reading' | 'over-time';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'reading', label: 'A reading' },
  { id: 'over-time', label: 'Over time' },
];

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
const tabRow = {
  display: 'flex', gap: '2rem', borderBottom: '1px solid var(--rule)',
  margin: '0 0 2rem',
} as const;

function tabStyle(active: boolean): React.CSSProperties {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0 0 .7rem', margin: 0,
    fontFamily: 'var(--font-mono)', fontSize: '.72rem',
    letterSpacing: '.18em', textTransform: 'uppercase',
    color: active ? 'var(--amber-d)' : 'var(--ink-faint)',
    // Sits ON the row's own rule rather than under it, so the active tab reads
    // as attached to the panel below it.
    borderBottom: `2px solid ${active ? 'var(--amber-d)' : 'transparent'}`,
    marginBottom: -1,
  };
}

function HowItWorks(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('reading');

  // Read once on mount rather than through useSearchParams: this page is fully
  // client-rendered, and the hook would need its own Suspense boundary to say
  // the same thing. /how-i-remember redirects here carrying ?tab=over-time, so
  // an old link still lands on the half it named.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab');
    if (wanted === 'over-time' || wanted === 'reading') setTab(wanted);
  }, []);

  function choose(next: Tab): void {
    setTab(next);
    // replaceState, never pushState — see the file header.
    const url = next === 'reading' ? '/how-it-works' : `/how-it-works?tab=${next}`;
    window.history.replaceState(null, '', url);
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    if (next) choose(next.id);
  }

  return (
    <main style={wrap}>
      <button type="button" onClick={closeOrGoBack} style={closeBtn}>← Close</button>

      <div style={eyebrow}>How it works</div>

      <div style={tabRow} role="tablist" aria-label="How it works" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => choose(t.id)}
            style={tabStyle(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reading' && (
        <div role="tabpanel" id="panel-reading" aria-labelledby="tab-reading">
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
            settle that first, and then I read your work against its own standard rather than a general
            one. The same paragraph, read as minimalism and read as gothic, gets two different readings
            from me, and both of them are honest.
          </p>

          <h2 style={h2}>I question the ambition itself</h2>
          <p style={p}>
            Most readings ask how well you did the thing you set out to do. I ask the question
            underneath that one: whether it was the right thing to be doing with this material. A
            piece can be made with real care and still be reaching for something smaller than what
            it had in its hands, and nothing at the line level will fix that, because the line level
            isn&apos;t where it went wrong. This is the question a reading normally leaves alone,
            partly because it&apos;s the one most likely to be unwelcome. I&apos;d rather raise it
            and be wrong than leave you polishing something that didn&apos;t need polishing.
          </p>

          <h2 style={h2}>I tell you what I read it against</h2>
          <p style={p}>
            Settling the tradition is only half of it. Once I know what kind of writing this is, I
            go to the work that shows what that tradition can do at full stretch, and I read yours
            in its light — not to mark you against it, but so the distance between where you are and
            what the form is capable of is something you can see for yourself rather than something
            I assert. Every reading names that standard, at the top, before I&apos;ve said a word
            about your pages. You should be able to disagree with my choice of it, and you
            can&apos;t do that if I don&apos;t tell you what it was.
          </p>

          <h2 style={h2}>When nothing fits</h2>
          <p style={p}>
            Sometimes nothing does. Thirty-five lenses is a lot of ways to read and it is still not
            all of them — work can sit between traditions, or in one I don&apos;t hold a lens for.
            When that happens I say so at the top of the reading, and I read the work against itself
            at its fullest instead. What I won&apos;t do is quietly pick the nearest thing and let
            you believe it was a match. I keep the comparison back on an excerpt too, for a
            different reason: a chapter set beside a finished book isn&apos;t a fair reading, so
            I&apos;d rather tell you the standard is missing than reach for one that doesn&apos;t
            fit what you sent.
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
            raised last time, I&apos;ll say so plainly — not as praise, just as what happened. Where I
            can see what changed, I&apos;ll say so. This only works from what I actually have: if there
            is no earlier reading, I have no memory of you, and I won&apos;t pretend otherwise or
            invent a past we didn&apos;t have.
          </p>

          <h2 style={h2}>If you send me chapters of the same book</h2>
          <p style={p}>
            Tell me they belong together and I start keeping a ledger — names, ages, physical details,
            relationships, whatever the book has established as fact. Each new chapter is read against
            it. If chapter nine gives someone green eyes and chapter two gave them brown, I raise it,
            and I tell you which chapters they were so you can go and look. I only do this for complete
            chapters: a draft mid-revision isn&apos;t something the rest of a book should answer to. And when
            I&apos;m not certain — when a discrepancy might be a flashback, or deliberate — I say so,
            and I name the innocent explanation before the awkward one.
          </p>

          <h2 style={h2}>If you keep coming back, with different work</h2>
          <p style={p}>
            Then I start to notice things that no single reading can see. When the same habit turns up
            in more than one piece — the narration stepping in to say what the scene has already said,
            an abstraction standing where the concrete work was needed — I&apos;ll name it, once, as a
            pattern rather than as a note about this draft. I won&apos;t do that from one piece, however
            clearly it shows: a habit needs more than one work behind it before it is a habit rather
            than a day. And if I get it wrong, you tell me it isn&apos;t true of your work and I stop
            saying it — permanently, not until the next reading.
          </p>

          <h2 style={h2}>If you only have a paragraph and a question</h2>
          <p style={p}>
            Send it and ask. I&apos;ll tell you how the writing itself is working — rhythm, verb
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
        </div>
      )}

      {tab === 'over-time' && (
        <div role="tabpanel" id="panel-over-time" aria-labelledby="tab-over-time">
          <h1 style={h1}>What happens when you keep sending me work</h1>

          <p style={p}>
            One reading can tell you what a piece is doing. It can&apos;t tell you what you do — that
            only shows up across work, over time, and it&apos;s the part of an editor&apos;s attention
            that takes years to earn from a person. Everything below is what I remember between
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

          <h2 style={h2}>I remember what you told me you were trying to do</h2>
          <p style={p}>
            Tell me what you want — for a book, or for your writing in general — and I&apos;ll keep it
            in mind. Every reading thereafter is measured against it and the tradition it&apos;s written
            in: for example, you said you wanted this to feel more urgent, and here is how much of that
            is coming through and where. I won&apos;t reduce it to a score or a verdict — I&apos;ll tell
            you what I can see, specifically, and where. If a reading gives me nothing real to say about what you
            wanted, I&apos;ll say nothing about it. Your goal never replaces the standard your work answers to;
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
        </div>
      )}
    </main>
  );
}

export default function HowItWorksPage(): React.ReactElement {
  // Suspense costs nothing here and keeps the page safe to render from a
  // static shell if this ever stops being a purely client-side route.
  return (
    <Suspense fallback={null}>
      <HowItWorks />
    </Suspense>
  );
}
