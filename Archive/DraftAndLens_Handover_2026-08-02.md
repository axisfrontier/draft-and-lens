# Draft & Lens — Handover, 2 August 2026

For: next Claude Code session in ~/Projects/Draft&Lens. Read fully before acting.

## What just happened

First piece of real external beta feedback arrived, from Noel Lyons, who tested three manuscripts. It's substantive and mostly critical — not a pile-on, a genuine "here's where this doesn't earn its place yet" review. Full text preserved verbatim in the tracker below.

A structured feedback tracker was built to capture it and everything that follows from other testers: `DraftAndLens_Beta_Feedback_Tracker.md`, just downloaded — **needs to be placed in the project folder** (suggest alongside the other DraftAndLens_*.md spec files, not gitignored, since it's planning material not the legal cluster). It's organised by type (Bug / UX / Product / Positioning), severity, and status, with a raw feedback log at the bottom for pasting future testers' notes verbatim.

## The core problem, stated plainly

Noel's most important line: **"how is this any better than pasting a chapter into Claude or ChatGPT?"**

This is the existential question for the product, not a UI nitpick. Discussed and agreed: there are three real differentiators (consistency without needing to be a skilled prompter, persistent structured memory across a whole manuscript, an enforced tradition-specific framework rather than generic craft feedback) — but they aren't yet showing up sharply enough in actual output quality, or made visible to the user, for a sophisticated tester to notice. Not a reason to pivot architecture; a reason to sharpen execution and surface the differentiators properly. See item 6 below.

## Decided this session — workstreams to start

**1. Build the continuity ledger.** Explicitly agreed as the next real feature, not a bug fix. This is Noel's third want-list item (flag contradictions against earlier chapters) and it's the single thing on his list that a raw Claude chat genuinely cannot do well — no persistent state across a long manuscript in a normal chat window. This is the strongest available answer to "why not just paste into Claude." Treat as the priority build, not squeezed in alongside bug fixes.

**2. Fix the file-upload failures — .md and .docx.** Two distinct issues, don't conflate:
- `.md` (Markdown) upload isn't supported at all. Noel writes in Obsidian, which is markdown-native — this is a real, obvious audience gap, not an edge case. Should be a straightforward addition alongside whatever formats are currently accepted.
- `.docx` upload takes the user all the way to the analysis page before failing, with no clear path back to try a different format — a dead-end in onboarding. Possibly a file-size or parsing limit; Noel doesn't know why it failed and neither do we yet. Needs: (a) root-cause the actual parse failure, fix if fixable, (b) regardless of (a), the failure needs to surface *before* committing the user to a dead-end screen, with an obvious way back to try again.

**3. Spell-check — in scope, standard feature. Grammar-check — explicitly NOT in scope.** Resolves the previously-open question: spelling correction is mechanical and doesn't conflict with the no-rewrite principle, so it's a standard part of the offering. Grammar-check is deliberately excluded — it edges toward correcting/rewriting the writer's sentences, which conflicts with D&L's core "reading, not a rewrite" position. Do not build grammar-check. If tense/passive-voice/clunky-sentence flagging (also requested by Noel) is wanted later, it needs its own explicit ruling — don't infer it's included just because spell-check is.

**4. Colour and font issues — confirmed fix.** Addresses Noel's contrast complaint (light grey on black nav, small copy) directly.

**5. Explore a new visual design — one screen via Visualizer.** Goal: clean, less "generic AI" (directly responds to Noel's umber-tones comment). Build one representative feedback screen as a design exploration before committing to a full redesign. Not urgent, but worth doing alongside the above rather than bolting fixes onto the current look indefinitely.

**6. Make the real differentiators visible — via editor voice, not comparison copy.** Extensive design discussion resolved this. Decided against any direct or implied comparison to Claude/ChatGPT/competitors inside the product — reads as marketing, undermines trust, and was explicitly identified as "corny" territory to avoid. That kind of comparison belongs on the marketing site/landing page only, never in-product.

**In-product approach, agreed:**
- The product speaks in an **editor persona** (tied to the existing Editor→Mentor architecture). The persona never claims superiority directly or names competitors. Instead it **shows its method** — what it actually did to arrive at a piece of feedback — and lets specificity do the persuading.
- This works because it's true and provable, not asserted: e.g. in Mentor mode, referencing something specific from the writer's own previous submission (not "I remember you," but a concrete detail — "the caravan scene," "the pacing you were working with last time") demonstrates persistence a raw AI chat can't offer, without ever saying so directly.
- **Once, not repeated**, at the first moment it's genuinely true and demonstrable (i.e. the first time Mentor mode has real cross-session data to draw on — not on a first-time Editor-mode read, where it would be an unearned/false claim), the persona can break slightly toward directness and show its reasoning method explicitly, e.g. (draft, not final copy):
  > *A real editor doesn't rewrite your words — they notice what you were reaching for and help you get closer to it. So before I suggest anything, here's what I actually did: I traced how "x" plays against the register you've built everywhere else in this piece. That's the whole method — not a rewrite, a reading. On that basis: "x" needs to go in this direction.*
- **Confidence is earned by what immediately follows, not by the claim itself.** The line only works if the feedback right after it is sharp and specific enough to validate the confidence in the same breath — this is why it must never be said unless the following feedback is genuinely strong. An unearned confident claim next to weak feedback would be worse than no claim at all.
- **Dependency:** this only really lands once Mentor mode (persistent cross-session memory) is real — the whole mechanism relies on genuine memory to point back to. Strengthens the case for prioritising Mentor mode's build sooner rather than later, since the voice has no credibility without it.

**Not to be revisited without reason:** the "subtle in-product messaging, unclear placement" version of this idea from the original handover is superseded by the above — don't reopen that framing.

**7. Spidergram / pacing chart — needs more testing data before a fix-vs-cut decision.** Noel's complaint was "not clear what to do with the information," not that it's broken. Two live options, not mutually exclusive: (a) improve clarity/usefulness of the visualisation itself, (b) make it collapsible so it doesn't dominate the screen for users who don't find it useful, while remaining available for those who do. Don't decide fix vs. cut yet — more testers may value it differently than Noel did. Building collapsible is reasonable regardless of the eventual verdict.

## Still genuinely open (not decided, don't build without asking)

- Whether comparisons to screenwriters/A24 for a prose manuscript is a tradition/medium-detection scoping bug — worth investigating against the existing "identify tradition before applying any craft rule" principle, but root cause not yet confirmed.
- Writer comparisons too broad — Noel wants 2–3 sharp reference points, not a scattergun. Likely a prompt-tuning fix, not yet scoped.
- Speed was explicitly *not* a problem for this tester — deprioritise further latency work relative to everything above.

## Standing context this session should already know

- Product position, non-negotiable: "a reading, not a rewrite" — no rewriting, no ghostwriting, ever. (Grammar/spell-check, above, doesn't violate this — mechanical correction is not craft rewriting.)
- Principle 26: section count follows evidence, not config. Principle 27: craft terms must be glossed in plain language in the same breath. Cross-reference guard: never reference a section not included.
- **Pre-paid-launch checklist still fully outstanding** (nothing here blocks free beta, all must land before charging money): Clerk Development→Production; rotate the 3 API keys (Anthropic/Clerk/Supabase — repo was briefly public, treat as compromised until rotated); full security re-check (IP grep, RLS test, deletion-cascade test, encryption-at-rest); wire the retention-pruning trigger (`purgeExpiredDeletions` exists, not auto-called); GDPR user controls (export/per-work delete/full wipe/rename/undo-delete); solicitor review of Privacy/Terms/AUP; refund/cancellation terms confirmed with solicitor; cookie notice if solicitor advises; Stripe + pricing tiers + pricing page; stable URL per reading (`/reading/abc123`).
- IPO Class 42 trademark still not filed — oldest outstanding item, not launch-gated but shouldn't be forgotten.
- Post-launch structural speed rebuild is sequenced and parked: prompt caching → evidence charter → coarse parallelism → re-test effort levels inside the new architecture. Not urgent, not started.
- All brain prompts and lens voices still need to move server-side behind a controlled API before any public exposure beyond the current closed beta — the current MVP exposes prompts client-side, which is the key unbuilt IP/security step.

## Phase 2 idea (not scoped, not now — logged so it isn't lost)

**Write-as-you-go analysis.** Not autogeneration, not rewriting — stays fully inside the "reading, not a rewrite" principle. A section where the writer can drop in-progress text (a scene, a paragraph) and ask the AI editor to review it for quality, fit within the story, or whether it works in a specific context — live feedback while drafting, rather than only a full-manuscript read after the fact. Would need the AI editor to be flexible and context-aware about partial/in-progress content in a way the current full-reading pipeline isn't designed for. Explicitly deferred — do not build until the ledger and the current workstream list are done.

## Long-form architecture — hybrid chunking + the speed rebuild (2026-08-15, not started, logged for whenever this resumes)

A design discussion this session reached a genuinely useful refinement of the dormant long-form spec, worth capturing precisely before it's lost.

**The core idea: not all analysis needs the whole manuscript, so don't chunk everything and don't read everything at once — match each type of analysis to the scope it actually needs.**

**Naturally chunkable (per-chapter, parallelisable, fast):**
- Prose-level craft notes — sentence rhythm, imagery, dialogue quality, the close-reading-level notes (e.g. the "Mangled weather, bluff and blustery..." kind of observation). These only need the chapter they're in.
- Pacing within a chapter or scene.
- Spell-check, once built — trivially chunkable, zero cross-chapter dependency.

**Genuinely needs the whole manuscript, can't be chunked without breaking the feature:**
- The continuity ledger — its entire purpose is catching contradictions *between* chapters, so it structurally cannot work on isolated chunks. (Note: the ledger's own design already handles this correctly — it's built to check new chapters against an accumulating fact store as they arrive, rather than re-reading the whole manuscript from scratch each time. That incremental-accumulation pattern is directly reusable here, not a separate mechanism.)
- Overall story arc / structure — only judgeable at the whole-book level.
- Tradition/register identification (Brain 1) — needs enough text to diagnose correctly, though likely a representative sample (first chapter plus a few later ones) rather than the full manuscript.

**Proposed pipeline shape:**
1. Fast initial pass on a representative sample → tradition/register diagnosis (Brain 1).
2. Parallel chunked passes per chapter → prose-level craft notes, streamed back to the user as each chapter completes.
3. Incremental whole-manuscript pass, building as chapters arrive → continuity ledger + overall arc, using the same accumulate-and-check pattern the ledger design already specifies.
4. Light synthesis step → stitches 2 and 3 into one coherent report rather than leaving the user with fragmented, throughline-free output.

**This directly improves the delivery/streaming honesty problem found earlier tonight.** Chapter-level notes can genuinely stream in as they complete (fast, parallel, real progress) instead of the whole-report guess-and-flicker pattern the skeleton bugs exposed — because each piece becomes available exactly when it's genuinely ready, not sequentially revealed from one giant call pretending to be incremental.

**How this integrates with the already-planned speed rebuild** (from the post-launch backlog: prompt caching → evidence charter → coarse 2-track parallelism → re-test effort levels — sequence confirmed correct and still standing, do not reorder):

- **Prompt caching of the source text** slots in *underneath* the chunking model, not instead of it — caching benefits every chunk call individually (each chapter call reuses the cached manuscript context rather than paying full input-token cost per chunk), so it should still be built first, exactly as sequenced. Chunking without caching would multiply input-token cost across chapters; caching is what makes chunking economically sound rather than just fast.
- **The evidence charter step** (Stage 1 emitting a structured allocation of observations to tracks) is a natural fit for the per-chapter chunked passes above — each chapter's charter feeds its own craft-note pass, and the charters across chapters can also feed the whole-manuscript arc/continuity pass in step 3, rather than needing a second full read.
- **Coarse 2-track parallelism (craft vs structure)**, already planned for short-form, generalises naturally to long-form: within each chapter chunk, craft and structural tracks can still run in parallel per the existing 2-track design; the *chapters themselves* are then a second, coarser layer of parallelism on top.
- **Effort-level re-testing** happens last in both plans, and should happen once against the final combined architecture (short-form 2-track + long-form chunking), not twice separately — testing effort levels against either piece in isolation before both are built risks re-deriving the same conclusion twice for no reason.

**Net effect:** the short-form speed rebuild and the long-form chunking model aren't two separate projects that happen to both be about speed — the long-form chunking model is best understood as the short-form rebuild's parallelism strategy extended one level up (per-chapter instead of per-track), reusing the same caching and evidence-charter foundations rather than building parallel infrastructure twice.

## What NOT to do without asking first

- Don't touch the legal/solicitor file cluster (gitignored, several distinctly-named files, confirmed in scope in an earlier session — do not assume a new filename is safe just because it doesn't match the originally-listed names).
- Don't commit to fixing vs. cutting the spidergram/pacing chart — build collapsible if you want, but the final verdict needs more tester data.
- Don't guess at how prominent the differentiator messaging should be — start subtle as agreed, flag back before escalating to anything more visible/marketing-like.
