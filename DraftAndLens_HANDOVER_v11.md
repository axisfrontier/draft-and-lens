# Draft & Lens — Handover (current state)
## Written June 2026 · supersedes all earlier HANDOVER / SessionSummary files (incl. v10)

> Purpose: let a fresh conversation (or Claude Code, or you) pick up cold without re-deriving anything. This captures **state and decisions**, not the philosophy — for the full law, see `DraftAndLens_Architecture_v6.md`.

---

## ⚑ HOW TO USE THIS FILE — WHO READS WHAT
This handover serves two readers. Give the whole file to a fresh thinking-session; point Claude Code only at the build parts.

- **Claude Code needs:** §0–§4 (what it is, philosophy, build state, files, pipeline), §11 (the build work), and §13 (note-quality / teach-the-move — the newest build prompt). Code should NOT act on §12 (legal/compliance) — that's context, not build instructions.
- **You / a fresh thinking-Claude needs:** all of it, especially §12 (legal & compliance state) and §5/§10 (logged future requirements).
- **A solicitor needs:** the two record files named in §12 — they don't need this handover.
- **Governing docs are now: Architecture v6 (§21 amended), LearnedCorpus v2.5, ThinkingDiscipline.** Archive older corpus versions (v2.3, v2.4) so Code reads only v2.5.

---

> **Update (v11 — session 22 June):** KEY ROTATION DONE + CHANGE 4 ESSENTIALLY COMPLETE. Three keys rotated and working (Anthropic, Clerk secret, Supabase service_role); two old-key clean-ups to confirm before first push (old Anthropic key revoked; Supabase legacy HS256 disabled). **CHANGE 4 user-data functions committed (Claude Code, isolated commits):** view stored works, export my data, per-work delete (commit 550cc53 = 3/6), full account-wipe with Clerk-account removal + Danger-zone two-step confirm (4/6), rename a work (5/6). [Confirm 6/6 / final state via `git log`.] **In progress — Step 3:** the no-training promise made VISIBLE in the UI (a line at sign-up + near the paste box) PLUS a code confirmation that nothing in the pipeline opts user text into training (so the claim is provably true — Anthropic's commercial API does not train on API data by default; verify no third-party logging receives the manuscript). **Then pausing for:** data-protection verification (encryption confirm, breach hook, retention pruning) → final security re-check (bundle IP grep exit:1, RLS test, deletion test) → FIRST GITHUB PUSH (only once both old-key removals confirmed).
>
> **NEW logged production item (v11): a Help AI** (see §5 item 8) — a scoped navigation/explainer assistant for the production model: answers "where do I find X," "what does this term mean" (routes to the §19 glossary), "how does the reading work." STRICT scope: navigation + explanation only, NEVER a second editorial voice and never craft opinions (that would muddy the reading). Pairs naturally with the teach-the-move work. Post-launch.
>
> **ZERO-BUDGET LEGAL PATH confirmed (see `DraftAndLens_GoLive_Compliance_Checklist.md`):** a free beta needs ≈£40–80 total — adapt the existing drafts via a free/low-cost UK template generator, pay the ICO fee (£40–52/yr, the one real spend), accept the free DPAs, publish. Solicitor review deferred to the paid-launch stage. The no-training promise must be VISIBLE in-product (checklist item 1b), not just in the policy.

> **Update (v10 — session 21 June, later):** PERSISTENCE/REVISION BUILD LARGELY DONE (Claude Code, Phases 3a/3b). Built & committed: Clerk auth (sign-in required to analyse; every reading tied to an account; `@clerk/nextjs` v6 — v7 needs Next 15, we're on 14); Supabase project in EU/London with a `readings` table, RLS on, server-only client via service_role key; moderation gate (blocks only the narrow set — the circus story passed); CHANGE 1 sections-open. Built & testing (Phase 3b, not yet committed): revision-awareness — every reading saved, plain-code diff vs last saved version, three behaviours (unchanged → previous reading instantly · revised → fresh reading naming the change · new work → normal), keeps last 5 versions/work, fails gracefully.
>
> **⚠️ TWO ACTION ITEMS (not doc problems):**
> 1. **ROTATE 3 KEYS before this repo ever goes to GitHub: Anthropic, Clerk secret, Supabase service_role** — exposed during a messy setup (stray key-named files got swept into a commit; removed, commit rewritten, `.gitignore` hardened, nothing pushed publicly). This is the project's SECOND key-exposure event. Do it before any push.
> 2. **Privacy Policy's "delete your data" promise cannot go public until CHANGE 4 (export/delete/account-wipe) ships** — still unbuilt. Correctly gated as pre-public-launch, not pre-internal-testing.
>
> **STILL TO BUILD (next Code instructions, in order):** CHANGE 4 (export / per-work delete / full account-wipe with cascade / view / rename / undo-delete) → data-protection verification (encryption confirm, no-training true, breach hook, retention pruning) → final security re-check (bundle grep + RLS + deletion tests).
>
> **NEW PRODUCT WORK designed this session — note quality (§13, separate later build):** from a real reading, Nenad caught three faults: an identical note ("adjective density is high") rendered THREE times; five instances named but only one addressed; and — the important one — verdicts given with no *move* taught, leaving a writer who doesn't know craft terms stuck. Fixed in **LearnedCorpus v2.5** ("Teaching the move" extension of the illustrative-examples clause) + a Code prompt (`DraftAndLens_CodePrompt_TeachTheMove_Tasters.md`). The law: **teach the move on one instance so the writer applies it themselves + make the craft term legible (glossary-linked) — never hand back a corrected line or set.** This is "teach the move," NOT "show the fixed line" (the ghostwriter line). Do this AFTER CHANGE 4 + security re-check — do not hand Code both at once.


> **Update (v9 — latest session, 20–21 June):** STAGE E IS CLOSED. The full report UI now renders as the real product, inline on the upload page, all from live `/api/analyse` data: verdict band, craft radar + tradition-alignment bars, story arc (emotion line dashed), character bible, section-by-section reading, inline note anchoring (Report ⇄ Notes-on-the-text toggle), Where To Begin / Action Plan / What To Fix Next, partial-read banner, industry-match panel. Tagline changed everywhere: "a reading, not a verdict" → **"a reading, not a rewrite."** Verified clean: `tsc` passed, `next build` green, bundle IP grep PASS (exit:1), client-IP guard 8/8, IP boundary intact (no UI imports from `src/prompts`/`src/ai`).
>
> **NEW since v8 — three connected things designed and prompt-ready (see §11 + standalone files):**
> 1. **Revision-awareness** — D&L now (by design) recognises same-work-vs-genuine-revision and behaves differently: *unchanged* → return the stored reading **verbatim** (protects a note whose exact wording mattered — solves the "wording-loss on re-roll" problem); *changed* → **full fresh reading of the whole piece**, naming the revision. This is the Mentor substrate; it pulls **Supabase + identity (Clerk)** forward. Diff is **code, not a brain**. Decision settled: store last version silently server-side (NOT user-facing version history); one mechanism, two behaviours.
> 2. **Content moderation gate** — runs **before storage/processing**. CSAM = absolute block (never stored, may be reported). Plus content illegal in the operating jurisdiction, plus pornographic content with no literary purpose (brand line). **CRITICAL: tuned for literature** — serious fiction depicting dark/sexual themes is ALLOWED; the line is the narrow prohibited set, not subject matter.
> 3. **User-data functions + data protection** — export, full account deletion (cascade), per-work delete, view stored works, rename/organise, undo-delete grace window; RLS, encryption at rest + in transit, EU/UK Supabase region, no model training, breach-logging hook, version cap (N=5), retention pruning.
>
> **Also decided this session:** all report sections **open by default** (was 01–05 open / 06–13 collapsed) — collapsing signals "less important" or causes a section to be missed, and the reading is the product. Lens voices do NOT notice revisions by default (editor/Brain 2 only); making a voice acknowledge a revision is an opt-in, default-off toggle and **must never receive the editorial corpus**.
>
> **NEXT:** decide sequencing (see §11 "the sequencing call") — pull the revision-awareness/persistence build (production Code prompt) ahead, OR do the visible "next" items first (glossary tooltips §19, the 27-lens UI, follow-up chat). Persistence is the Mentor substrate but invisible to a first-time tester; the lens UI/glossary do more for first impressions. This is a deliberate choice, not drift.

> **(Carried from v8) LearnedCorpus → v2.3.** Principle 9 device-vs-instance; Scope clause (corpus binds the editor/Brain 2, NOT the voices) + real-voice-failure checklist; v2.3 illustrative-examples clause (editor AND voices may offer a brief in-register example — never a rewrite, never fabricated best-in-class). The build consequence stands: **voices draw on their own character sheets, never the editorial corpus.**

---

## 0 · What Draft & Lens is (one paragraph)

A web app that gives writers a tradition-aware editorial *reading* — not a rewrite — of film scripts, treatments, short fiction, and stage plays. It calls the Anthropic API. Its value is three things nothing else combines: (1) it judges each work *on its own terms / tradition*, never a fixed rubric; (2) 27 master "lens" voices (Spielberg, Hemingway, Chekhov, etc.); (3) epistemic honesty (never concludes beyond what it read). Built by Nenad — an amateur writer (two published short stories), non-technical — to help his own work and make a modest living. "A reading, not a rewrite," pro-craft, never generates prose.

### ★ POSITIONING NORTH STAR (use this to settle feature/form/design/copy decisions)
**Draft & Lens aims to be the most useful tool for writers who don't want to be rated against a generic rubric, and don't want an AI to write for them.**
- This is not a slogan bolted on — it's a description of what's already built. Every core decision serves this writer: tradition-on-its-own-terms (not a rubric), a reading-not-a-rewrite (not a ghostwriter), teach-the-move (grow the writer, don't fix the draft), the load-bearing tradition engine.
- It defines who D&L is FOR (serious-craft writers wary of rubric-scoring and AI-writing) and who it is NOT for (genre-volume self-publishers wanting an all-in-one toolbox — that's AutoCrit's audience). Not competing for the same person.
- **Competitive truth (AutoCrit, the closest surface-competitor):** AutoCrit is a broad all-in-one platform whose feedback engine measures prose against *genre benchmarks* (metrics, rubric) — the thing D&L rejects. AutoCrit already does revision-memory and a no-training promise, so neither is a D&L differentiator; the differentiator is HOW the reading is done. Do NOT chase AutoCrit's breadth (formatting, marketing, beta-reader toolbox) — that dilutes the moat and is an unwinnable race on a solo budget.
- **Broadening rule:** broaden by *form* (novels/long-form, TV pilots, memoir, possibly poetry) only where the tradition engine genuinely transfers AND the same writer exists in that form. Poetry needs care — its unit of analysis may require its own pipeline, not just a dropdown. Do NOT broaden by *feature* toward the Swiss-army-knife. "Best at the one thing" is the moat; "most useful at everything" is a trap.
- **Conversion discipline:** broadening is a post-tester, data-driven decision — let testers/users reveal what they'd pay more for, rather than building broad on a guess.

---

## 0b · THE PHILOSOPHY IN BRIEF (the load-bearing beliefs — unchanged)

- **Read the work on its OWN terms, never a fixed rubric.** The core principle and the moat. A feature absent by design is a choice, not a fault.
- **Tradition identification is the load-bearing dependency.** Brain 1 runs first; Brain 2 receives the tradition as locked. Architecture, not hope.
- **A reading, not a rewrite.** Never generates or rewrites the writer's prose. Editor (later mentor), never ghostwriter.
- **Epistemic honesty.** Never conclude beyond what was read; never fabricate; verify before claiming absence.
- **A tradition's primary instruments are not failures.** Device-vs-instance: fault uneven *use*, never the instrument. The work's own best moment is the first measure of best-in-class.
- **Tone preserves the writer's confidence.** "Here's what I see, why it matters in your tradition, what it could reach toward" — never "this is wrong."
- **Human-in-the-loop is the quality mechanism, not a primitive stage.** Errors caught become corpus principles. Self-improvement-by-AI is unsafe for a taste product.
- **Reliability over cleverness at scale.** The multi-brain pipeline makes the good reading *repeatable*. Never collapse to one mega-prompt.
- **Governing method (ThinkingDiscipline):** attention before understanding before solution; find the question beneath the question; load-bearing dependency before building; define what good looks like first.

(Full: `DraftAndLens_LearnedCorpus.md` v2.3 and `ThinkingDiscipline.md`.)

---

## 1 · WHERE THE BUILD IS RIGHT NOW (most important section)

**The production Next.js app is the live build.** The migration works end to end and Stage E (full report UI) is **closed and verified** (see v9 update above). The old single-file `DraftAndLens.html` prototype remains the **source of truth for prompt IP and product behaviour**, but the product itself is now the Next.js app.

**Stages:** 0 scaffold ✅ · 1 prompts server-side + key boundary ✅ · C minimal upload wired to `/api/analyse` ✅ · E full report UI ✅ · **Persistence/revision (Clerk auth + Supabase + moderation gate + CHANGE 1) ✅ committed; revision-awareness diff/three-behaviours ✅ built, Phase 3b testing (not yet committed)**.

**Still to build (in order):** confirm 2 old-key removals → finish Step 3 (no-training visibility) → data-protection verification → security re-check → first GitHub push. THEN note-quality/teach-the-move (§13). CHANGE 4 user-data functions now essentially complete (see v11 update).

**Commits on `main`** through Stage E (confirm the Stage E commit landed). IP boundary intact: bundle grep PASS (exit:1), client-IP guard 8/8, no UI imports from `src/prompts`/`src/ai`.

**Project folder:** `/Users/nenadkojic 1/Dropbox/Mac/Desktop/AI tool builds/Draft&Lens/draft-and-lens`. iMac set to display-sleep 10 min, machine-sleep prevented for uninterrupted Code runs. Plain-talk skill at `~/.claude/skills/plain/SKILL.md`.

**⚠️ Security housekeeping (carried forward):** a live API key was exposed in a terminal paste in an earlier session and should have been rotated — confirm it was.

---

## 2 · THE CURRENT FILES

**Build / law docs (give to Claude Code):**
- `DraftAndLens.html` — the prototype, source of truth for IP/behaviour
- `DraftAndLens_Architecture_v6.md` — the law doc
- `DraftAndLens_LearnedCorpus.md` — v2.3 editorial principles (governing)
- `ThinkingDiscipline.md` — working method (governing)
- **`DraftAndLens_CodePrompt_RevisionAwareness.md`** — NEW: the production build prompt for revision-awareness + moderation + data-protection + user-data functions + open-sections. This is the next build spec.
- **`DraftAndLens_CodePrompt_RevisionAwareness_MVP.md`** — NEW: the same behaviour for the single-file HTML, session-scoped (only if updating the prototype).
- **`DraftAndLens_CodePrompt_MentorRegister_Addendum.md`** — NEW (v9): attaches to the revision-awareness prompt; mentor disposition on every read + memory framing on revision. Mostly a Brain 2 prompt edit.
- **`DraftAndLens_CodePrompt_TeachTheMove_Tasters.md`** — NEW (v10): note-quality build — dedup identical notes, account for the full set, and teach-the-move tasters (demonstrate the technique + make the term legible, never rewrite the line). Do AFTER CHANGE 4 + security re-check. See §13.

**Record / NOT for Claude Code (your files; some for a solicitor):**
- **`DraftAndLens_Legal_Policy_Starter.md`** — NEW: what's law/policy vs what's code; DPAs; trust-feature positioning; policy decisions.
- **`DraftAndLens_Legal_Document_Drafts.md`** — NEW: first drafts of Privacy Policy, Terms, AUP, AI-disclosure — FOR SOLICITOR REVIEW, not legal advice.
- **`DraftAndLens_GoLive_Compliance_Checklist.md`** — NEW: the go-live checklist (documents, ICO fee, DPAs, build verification, ongoing).
- `DraftAndLens_ExpertMode_Spec.md` — Expert View spec (post-Stage-E; see §10).
- **`DraftAndLens_Amendment_EditorMentorRegister.md`** — (v9) the editor/mentor register amendment. **NOW FOLDED IN** to Architecture §21/§07 and LearnedCorpus (Principle 10). Kept as a standalone record of the decision; the live docs already contain it.

**Superseded — do not feed to any build tool:** `Architecture_v5`/non-versioned, `MasterPrompt`, old `HANDOVER`/`SessionSummary`/`ArchitecturalEvolution`, `deepseek_text_*`. Strategy docs (CaseStudy, CompetitorAnalysis, GoLivePlan) = reference, not build specs. Prior handovers v1–v8.

---

## 3 · WHAT'S IN THE PRODUCT (so docs/build stay in sync)

Everything from v8 §3 still holds (treatment mode, must-choose submission type, inline anchoring §18, glossary §19, honest staged progress + Stop/abort, DLTrace dev-only, the brain model/reliability fixes, Brain 1b skip <5k words, structural sampling, device-vs-instance). **New in v9:** the full report UI (Stage E) renders all of the above live; all report sections open by default.

---

## 4 · THE BRAIN PIPELINE (unchanged from v8)

Sequence: **Brain 1 (diagnostician) → Brain 1b (structural reader)\* → narrator verify\* → Brain 2 (analyst, streaming) ‖ Brains 3/4/5 parallel → post-stream narrator correction → client-side glossary + anchor resolution.** (\* skipped <5k words.)

Models: 1 Diagnostician Sonnet 4.6 · 1b Structural Sonnet 4.6 · Narrator verify Sonnet 4.6 · Narrator correct Opus 4.7 · 2 Analyst Opus 4.7 (effort `medium`) · 3 Scorer Sonnet 4.6 · 4 Market Sonnet 4.6 · 5 Bible Sonnet 4.6 · 6 Lens ×27 Sonnet 4.6 · 7 Conversation Sonnet 4.6.

**Load-bearing law:** Brain 1 (tradition) MUST precede Brain 2, which receives the tradition as locked. Never collapse the pipeline.

**Revision-awareness sits BEFORE this pipeline** (diff + moderation gate), and after a moderation pass either returns the stored reading (unchanged) or runs the pipeline with a what-changed note (changed). The diff is code, not a brain.

---

## 5 · LOGGED PRODUCTION REQUIREMENTS (unchanged from v8 — Architecture v6 §21)

1. **Editor & Mentor as one voice in two registers** *(revised v9 — supersedes "editor-only MVP / mentor activates later"; see `DraftAndLens_Amendment_EditorMentorRegister.md`).* The editor register leads analysis; the mentor *disposition* (developmental tone, encouragement, "where to grow next") is present on EVERY read from the first — it needs nothing stored. What a genuine revision adds is not the mentor switching on but **memory** (judging the change, naming recurring tendencies). Disposition shows up two ways on a first read: a thread throughout AND a closing developmental note. The line: developmental, never directive — about the writer's *capacity*, never instruction on the work's *correct form*.
2. **Mentor tiering (restated v9):** the free/paid line is **disposition (free) vs memory (paid)**, NOT editor (free) vs mentor (paid). Free = full honest reading WITH the mentor disposition always (never hobbled) + real single-session taster. Paid = the memory register (persistent cross-session, tendency tracking). Surface, never fake; memory never simulates a past it lacks.
3. **Interrogate / "push harder"** — opt-in only; independent of Mentor but deepened by it.
4. **Best-in-class research** — required before Interrogate.
5. **Self-critique brain** — second Claude pass vs the LearnedCorpus; different rules for editor vs voices (v2.3 Scope clause); paid/opt-in.
6. **Free-tier lens selection** — curated 12 of 27 unlocked.
7. **Scriptmatch/submission-match agent** — POST-LAUNCH; draft-and-approve only, never auto-send.
8. **Help AI (NEW v11)** — a scoped navigation/explainer assistant for the production model: "where do I find X," "what does this term mean" (routes to the §19 glossary), "how does the reading work." STRICT scope: navigation + explanation only — NEVER a second editorial voice, never craft opinions (that would muddy the one reading). Pairs with teach-the-move. Post-launch.

**No-fabrication law:** a capability that can't run is *described*, never performed.

---

## 6 · PIPELINE OPTIMISATION (unchanged) — prompt caching (verify applied), stream Brain 2 earlier, self-critique brain. Do NOT add adaptive brain engagement.

---

## 7 · LAUNCH / GO-TO-MARKET STATE

- **Gating requirement before testers:** prompts + lenses server-side — **DONE.** (Migration complete; Stage E closed.)
- **NEW gating requirement before REAL users with accounts + payment:** the legal/compliance work in §12 — documents reviewed, ICO fee, DPAs, build verified against its promises. This does NOT block internal testing.
- **Pricing (confirm at launch):** Free £0 (full reading, 10k words, curated lenses) / Starter ~£9 / Pro ~£24 / Studio later. No credit system.
- **Hosting:** GitHub (private) → Vercel → Clerk → Supabase (now pulled forward) → Stripe (billing later).
- **Testers:** 3–5 honest writers; framing "break it and tell me where it's wrong." Recruitment posts drafted. Don't approach famous names until proven.
- **Competitor truth:** no direct feature-competitor combines tradition-awareness + multi-format + 27 lenses. Generators (Sudowrite etc.) are not competitors.

---

## 8 · HOW TO WORK WITH NENAD (unchanged)

Non-technical, tight budget, wants to launch soon. Short plain answers, no padding; push back honestly when warranted but don't restate what he knows. API is pay-as-you-go (keep credit topped up; auto-reload worth setting). Do NOT suggest wellbeing-harming trades. The human-in-the-loop is the quality mechanism, not something to engineer away. Established preferences: complete discrete tasks as isolated commits; audit before building; never let Code rewire components before a diff of current-vs-required exists; logical sweep (if one doc updates, all relevant docs update); surface hidden assumptions and flag sequencing before writing prompts.

---

## 10 · EXPERT VIEW (spec only, post-Stage-E — `DraftAndLens_ExpertMode_Spec.md`)

Same reading, **less translated** — not smarter/longer/harsher. Framing is "translated vs untranslated," never "beginner vs expert." Reuses the §19 glossary as a teaching surface so an amateur can grow into it. Discussion + sampler, never a rewrite; denser and braver, never longer; never a separate harsher pipeline. Likely free (presentation preference, not a capability gate). **Build after the core report UI — now unblocked, since Stage E is closed.**

---

## 11 · THE NEW BUILD WORK (revision-awareness + moderation + open-sections) — FOR CLAUDE CODE

Fully specced in the standalone prompts (§2). Summary:

- **Open all report sections by default** (trivial UI change).
- **Moderation gate before storage** — CSAM absolute block (never stored), narrow prohibited set, tuned for literature.
- **Revision-awareness** — silent store of last version (Supabase, EU/UK, Clerk identity); code-based diff + threshold; unchanged → stored reading verbatim, changed → full fresh reading naming the revision. Work-matching treats script/story/play as separate works, not revisions. Lens-voice revision-awareness is opt-in, default off, never fed the corpus.
- **User-data functions** — export, account-wipe (cascade), per-work delete, view, rename, undo-delete grace window.
- **Data protection** — RLS (test it), encryption at rest + in transit, EU/UK region, no model training (verify true), breach hook, version cap N=5, retention pruning.
- **Build order:** open-sections → moderation gate → Supabase+identity foundation → persist → diff/threshold (unchanged path) → changed path → work-matching → user-data functions → data-protection verification. One step at a time; verify each.

**THE SEQUENCING CALL (decide before running):** this pulls persistence/auth ahead of the lighter "next" items (glossary tooltips §19, 27-lens UI, follow-up chat). Persistence is the Mentor substrate but invisible to a first-time tester; the lens UI/glossary do more for first impressions. Persistence matters more for *retention* than *first impression*. Choose deliberately.

---

## 12 · LEGAL & COMPLIANCE STATE (NEW — record, NOT for Claude Code to act on)

**The split:** Code builds the *functions and safeguards*; you + a solicitor handle the *documents and decisions*. The build doesn't make you compliant on its own — build + paperwork together. None of this blocks internal testing; all of it blocks real users with accounts and any payment.

**Code builds (in the production Code prompt §11):** moderation gate, RLS, encryption config, EU region, export/delete/account-wipe/view/rename/undo-delete, no-training guarantee, breach-logging hook, version cap, retention pruning.

**You + solicitor (drafts ready in `DraftAndLens_Legal_Document_Drafts.md`):** Privacy Policy, Terms of Service, Acceptable Use Policy, AI-disclosure notice — first drafts written, need review before publishing.

**You decide (in `DraftAndLens_Legal_Policy_Starter.md`):** operating jurisdiction (assume UK/EU), 18+ only, retention period, grace-window length, breach-response process, porn brand line, ICO registration.

**Key reasoning settled this session:**
- "Compliant everywhere on Earth" is impossible. **Build to GDPR (strictest) for data — covers travellers and most regimes including US state laws.** Gate *content* on your operating jurisdiction + the universal CSAM absolute + your AUP. Data law follows the user's residence, not their physical location on a given day — a UK user abroad is still a UK user; no geo-detection needed.
- **DPAs** required with Supabase, Anthropic, Clerk, Vercel, Stripe.
- **Lead with privacy as a trust feature** ("your work is private, encrypted, yours to delete, never used to train AI") — turns the obligation into a selling point.
- **No "100% compliant"** exists — the target is a defensible posture. What protects Nenad personally: documents reviewed, ICO fee paid, DPAs in place, build tested against its promises.

**Go-live steps:** see `DraftAndLens_GoLive_Compliance_Checklist.md` (3 stages: before any real user · verify build vs promises · ongoing).

**Indicative costs (UK, verify):** ICO fee £40–60/yr · solicitor review of drafts £300–800 one-off · Supabase/Clerk/Vercel free tiers early, ~£20–60/mo modestly live · Anthropic API per-use · Stripe ~1.5%+20p/transaction · domain ~£10–15/yr.

---

## 13 · NOTE QUALITY — DEDUP, COMPLETE-THE-SET, TEACH-THE-MOVE (NEW v10 — FOR CLAUDE CODE, after CHANGE 4)

Triggered by a real reading (the circus-story sample) where Nenad — the target confused-writer — couldn't act on the notes. Three faults, three fixes, specced in `DraftAndLens_CodePrompt_TeachTheMove_Tasters.md` and governed by LearnedCorpus v2.5 ("Teaching the move"):

1. **Dedup** — "adjective density is high" rendered 3× identically; "strong sonic patterning" 2×. A note makes its point ONCE, naming multiple locations rather than repeating. (Render/note-set fix; check if source is generation or anchoring.)
2. **Account for the set** — five adjectives named, one addressed. A note that names a set must address the set (demonstrate on one + name it applies to the others), not leave four dangling.
3. **Teach the move (the centrepiece)** — where a note names a line-level craft problem with a teachable shape, demonstrate the *technique* on one instance so the writer applies it themselves, AND make the craft term legible (plain definition + glossary §19 link). Goal: the writer learns the move and the term, and won't need D&L for it next time.

**The governing law (disposition-vs-directive, Principle 10 + v2.5):** **teach the move, never fix the work.** "Here's the move, on one example — yours to take across the rest" is editor. "Here's your line/paragraph, fixed" is ghostwriter. The taster always teaches; it never delivers corrected text to paste back. Decided form: **teach the move** (not "show the fixed line").

**Scope:** line-level craft notes with a repeatable technique only. NOT structural notes. NOT the lens voices (their examples are governed separately by the SCOPE clause — do not apply the editor taster spec to them).

**Sequence:** AFTER CHANGE 4 + data-protection verification + security re-check. Separate, later build. Do not hand Code this and the persistence work at once.

---

## 9 · CONVERSATION-STATE NOTE

This handover holds the *state*; decisions also persist via memory. Re-upload it (and the current build context) at the start of a new chat. **Next concrete action:** (1) confirm the 2 old-key removals (old Anthropic key revoked; Supabase legacy HS256 disabled); (2) finish Step 3 — make the no-training promise visible at sign-up + near the paste box, and verify in code that nothing opts user text into training; (3) data-protection verification → security re-check → first GitHub push; (4) THEN the note-quality / teach-the-move build (§13). The mentor-register addendum hooks the changed-path during the revision work. Help AI (§5.8) and Expert View (§10) are post-launch/optional; legal work (§12, zero-budget path) runs in parallel and gates only the public/payment step.

---

*Draft & Lens — Handover v11 · June 2026 · pairs with Architecture v6.0 (§21 amended), LearnedCorpus v2.5, ExpertMode_Spec, the Code prompts (RevisionAwareness, MentorRegister_Addendum, TeachTheMove_Tasters), and the legal/compliance record files*
