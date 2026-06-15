# Draft & Lens — Handover (current state)
## Written June 2026 · supersedes all earlier HANDOVER / SessionSummary files

> Purpose: let a fresh conversation (or Cursor, or you) pick up cold without re-deriving anything. This captures **state and decisions**, not the philosophy — for the full law, see `DraftAndLens_Architecture_v6.md`.

> **Update (this session):** LearnedCorpus → **v2.3**. (v2.1) Principle 9 device-vs-instance; (v2.2) a Scope clause — the corpus binds the editor/Brain 2, NOT the voices — plus a real-voice-failure checklist; (v2.3) "Illustrative Examples — Showing, Not Rewriting": both the editor AND the voices may offer a brief example of a note ("one way you might put it…"), in their own register, as an option the writer accepts or rejects — never a rewrite, never a correction, never a finished version of the work; examples must be real, never fabricated best-in-class attributed to a named author. Architecture v6 corrected to match the HTML's §3 fixes (5k skip, structural sampling, device-vs-instance). DLTrace on the 3,692-word story confirmed the skip logic and tradition-ID working in production. **A truncated base64 in Carver's lens-header photo was fixed in the HTML, and the lens-photo-container CSS gap (align-self) corrected.** **New product decisions logged:** the lens section is reframed as subjective — voices are "a reading, not a ruling," not editors; working title "Twenty-Seven Ways of Looking / How each voice reads your work — a reading, not a ruling"; subjectivity must be shown (in-voice framing, first-person grammar, surfaced disagreement between voices), not buried in a one-time disclaimer. The illustrative-example capability (editor + voices showing, not just telling) is the safe, agreed form of the "taster" idea — opt-in, post-migration, gated; needs the §5.4 best-in-class research before any version that references named authors. Build consequence for Cursor Stage 2: **voices must draw on their own character sheets, NOT the editorial corpus** — feeding the corpus into lens prompts sands them toward tradition-neutral and destroys the feature.

---

## 0 · What Draft & Lens is (one paragraph)

A single-file HTML web app (`DraftAndLens.html`) that gives writers a tradition-aware editorial *reading* — not a rewrite — of film scripts, treatments, short fiction, and stage plays. It calls the Anthropic API. Its value is three things nothing else combines: (1) it judges each work *on its own terms / tradition*, never a fixed rubric; (2) 27 master "lens" voices (Spielberg, Hemingway, Chekhov, etc.); (3) epistemic honesty (it never concludes beyond what it read). Built by Nenad — an amateur writer (two published short stories), non-technical — both to help his own work and to make a modest living. The product is "a reading, not a verdict," pro-craft, never generates prose.

---

## 0b · THE PHILOSOPHY IN BRIEF (why D&L is the way it is)

These are the load-bearing beliefs. Every design decision serves them; violating them breaks the product even if the code works.

- **Read the work on its OWN terms, never a fixed rubric.** The core principle. D&L identifies what kind of work a piece is trying to be, then judges execution against *that tradition's* standards — not a universal "good writing" checklist. A feature absent by design (no dialogue in a treatment, compression in minimalism) is a choice, not a fault. This is the single thing that separates D&L from AutoCrit/Roast My Script and every generic tool.
- **Tradition identification is the load-bearing dependency.** Get it wrong and every downstream note is wrong. That's why Brain 1 runs first and Brain 2 receives the tradition as *locked* — enforced by architecture, not hope.
- **A reading, not a rewrite.** D&L never generates or rewrites the writer's prose. It reflects the work back with clarity. It is an editor (and, later, a mentor) — never a ghostwriter.
- **Epistemic honesty.** Never conclude beyond what was read (the partial-read law). Never fabricate (mentor/interrogate output must be real or described, never simulated). Verify before claiming absence. Acknowledge known works rather than mis-pitch them.
- **A tradition's primary instruments are not failures.** Before faulting an element, check whether it's an instrument of the tradition — or a device the work uses well elsewhere (the device-vs-instance rule). Fault uneven *use*, never the instrument itself.
- **Tone preserves the writer's confidence.** Every note: "here is what I see, why it matters within your tradition, what it could reach toward" — never "this is wrong, change it." Accuracy, not softness, but never the kind of feedback that makes a writer abandon their form.
- **The human-in-the-loop is the quality mechanism, not a primitive stage.** D&L improves by a person with taste catching errors, which become corpus principles. Self-improvement-by-AI is unsafe for a taste product — it drifts toward the generic rubric D&L exists to avoid. The slow manual loop is *correct*.
- **Reliability over cleverness at scale.** Single-pass Claude can read brilliantly but drifts inconsistently across thousands of users. The multi-brain pipeline exists to make the good reading *repeatable*, not because Claude needs many tries. Never collapse it to one mega-prompt to save time.
- **Governing method (ThinkingDiscipline):** attention before understanding before solution; find the question beneath the question; identify the load-bearing dependency before building; define what good looks like before building begins.

(Full versions: `DraftAndLens_LearnedCorpus.md` v2.3 and `ThinkingDiscipline.md`.)

---

## 1 · WHERE THE BUILD IS RIGHT NOW (the most important section)

**Two parallel things exist:**

**A) The working prototype** — `DraftAndLens.html`, ~686KB, fully functional, in `/mnt/user-data/outputs/`. This is the source of truth for *what the product does* and for *all prompt IP*. It runs in the browser using the user's own Anthropic API key.

**B) The production migration** — being built in **Cursor** as a Next.js 14 app, to move all prompts/IP server-side. Status:
- **Stage 0 (scaffold): DONE & approved.** Next.js 14, TS strict, full folder structure, design tokens, `.gitignore` excludes `.env.local`. Correctly flagged the two-pages-at-`/` routing conflict.
- **Stage 1 (prompts server-side + API-key boundary): BUILT, NOT YET VERIFIED.** Cursor reports all IP moved verbatim into `src/prompts/`, every module `import 'server-only'`, client-IP guard test added, 27 lenses + 4 modes + anchor directive server-side, verifier=Sonnet/corrector=Opus split preserved.
- **TOOL DECISION (this session): moving from Cursor to Claude Code.** Cursor's free tier hit its monthly limit mid-Stage-1 (resets ~30 June 2026) AND locks the model to Composer 2.5 Fast (weakest; no Claude). Since the migration is security-critical, the weak model was a real risk. Decision: do the migration in **Claude Code via the Claude Desktop app** (the "Code" tab — graphical, no terminal needed; requires an active Pro plan, ~£17–20/mo, one month likely covers the whole migration). Same files, stronger model (Opus/Sonnet), no reset wait. Stage 1 may need rebuilding/re-verifying in Claude Code rather than trusting Cursor's unverified Stage-1 claim.

### THE IMMEDIATE NEXT ACTION (in Claude Code)
Follow `DraftAndLens_ClaudeCode_StarterScript.md` (written this session). In short:
1. Get the 6 files in one folder; install Claude Desktop; open the folder in the Code tab.
2. First instruction: *"Read DraftAndLens_HANDOVER_v7.md and DraftAndLens_Architecture_v6.md, then tell me the current state and the next action before doing anything."* (loads context, no building yet)
3. Have Claude Code set up Git (the undo button) before any edits.
4. Confirm the Stage 1 plan; give it the two rules (lenses never get the corpus; don't break the pipeline); build.
5. **Run the browser security check** — open the local URL in Chrome → Inspect → Sources → Cmd+Option+F → search these five, each must return **ZERO**:
   - `STEP ONE — IDENTIFY THE TRADITION`
   - `WHAT A TREATMENT IS`
   - `You are Steven Spielberg reviewing`
   - `⟦`
   - `sk-ant-`
   (Allowed to appear — NOT IP: glossary definitions, the anchor *resolver* code.)
6. All zero → Stage 1 verified, plan Stage 2. Any hit → *"This is still reachable in the client bundle; it must be server-only. Fix it,"* re-check.

### ⚠️ BEFORE STAGE 2 — RE-UPLOAD THE HTML
The HTML in Cursor's folder is **stale** — it predates the latest fixes (see §3). Replace it with the current `/mnt/user-data/outputs/DraftAndLens.html`, and tell Cursor what changed so it re-syncs the affected server-side prompt files:
> "I've updated DraftAndLens.html since Stage 1. Changes: (1) Brain 1b + narrator verifier now skip for works under 5,000 words; (2) the structural reader samples midpoint and turns instead of head+tail; (3) a 'device vs instance' rule was added to the analyst prompt and the lens corpus. Re-sync the affected prompt files and note the orchestration changes for Stage 2."

---

## 2 · THE CURRENT FILES (what's authoritative, what to ignore)

**Current / use these (all in `/mnt/user-data/outputs/`):**
- `DraftAndLens.html` — the live prototype, source of truth
- `DraftAndLens_Architecture_v6.md` — **the law doc** (full rewrite; supersedes v5)
- `DraftAndLens_CursorPrompt_v6.md` — the conversion prompt (matches v6)
- `DraftAndLens_SetupChecklist.md` — v1.1 (Vercel/Clerk/keys; tool-agnostic)
- `DraftAndLens_LearnedCorpus.md` — v2.3 editorial principles (governing). Principle 9 (device-vs-instance) and a Scope clause added this session; Principles 1–8 and the Core unchanged from v2.0. The Scope clause establishes that the corpus binds the EDITOR (Brain 2), not the voices — and includes a real-voice-failure-vs-voice-being-itself checklist for the self-critique brain.
- `ThinkingDiscipline.md` — working method (governing; unchanged)
- `DraftAndLens_ClaudeCode_StarterScript.md` — day-one running order for the migration in Claude Code (written this session)
- `DraftAndLens_HANDOVER_v7.md` — this file

**Superseded / DO NOT feed to any build tool:**
- `DraftAndLens_Architecture_v5.md`, `DraftAndLens_Architecture.md` (non-versioned)
- `DraftAndLens_MasterPrompt.md`, old `HANDOVER.md`, `SessionSummary.md`, `ArchitecturalEvolution.md`
- Strategy docs (`CaseStudy`, `CompetitorAnalysis`, `GoLivePlan`) — fine as reference, not build specs
- `deepseek_text_*.txt` — unknown, ignore

**The 5 files to put in the build tool's folder (Claude Code or Cursor — nothing else):** `DraftAndLens.html`, `DraftAndLens_Architecture_v6.md`, `DraftAndLens_CursorPrompt_v6.md`, `DraftAndLens_LearnedCorpus.md`, `ThinkingDiscipline.md`. (Plus the handover + starter script for context; the `CursorPrompt_v6` conversion spec applies to Claude Code too — it's tool-agnostic despite the name.)

---

## 3 · EVERYTHING BUILT INTO THE HTML SINCE v5 (so the docs/build stay in sync)

All of these are IN the current prototype and reflected in Architecture v6:

- **Treatment mode** — a 4th submission type (alongside script/story/play). Own `TREATMENT_SYSTEM`, report structure, genre notes; threaded through every brain. Read for structure, never faulted for absent dialogue / summary / telling.
- **Must-choose submission type** — user explicitly picks the type (numbered steps: 1 add work → 2 choose type → 3 analyse); auto-detect no longer routes. Only the character bible is optional.
- **Inline note anchoring (§18)** — analyst wraps verbatim quotes in `⟦…⟧`; client resolves them and pins notes beside the passage. Directive is server IP; resolver/view are client-side.
- **Glossary term system (§19)** — ~45 craft terms; one `GLOSSARY` object powers both the glossary page and inline hover/tap tooltips. Explicitly NOT IP — stays client-side. Unit-tested matching.
- **Honest staged progress + Stop/abort** — the analysing bar narrates real pipeline stages (Reading → Structure → Writing → final check) tied to genuine transitions; a Stop button aborts; navigating away aborts the request. Nav disabled during a run.
- **DLTrace** — dev-only pipeline tracer (console + on-screen panel, toggle backtick or `?debug=1`). MUST be stripped/gated from production.
- **Brain model + reliability fixes:**
  - Narrator verifier moved **Opus → Sonnet** (pure JSON classification).
  - Narrator corrector stays **Opus** (rewrites prose in voice).
  - Analyst stays **Opus 4.7**, streaming, adaptive thinking, **effort tunable** (`DL_ANALYST_EFFORT`, default `medium` — was `high`, which caused minutes of pre-text thinking read as a stall).
  - Fixed a **`const userPrompt` reassignment crash** that silently killed Brain 2 on truncated input (i.e. always on free tier) — was the real cause of the "stuck at summary" stalls.

**The most recent fixes (this session — the ones that make the HTML in Cursor stale):**
- **Brain 1b skip-on-short:** below **5,000 words**, Brain 1b AND the narrator verifier are skipped — Brain 2 has the full text and can hold the structure itself. Evidence: a 3,692-word story produced a strong reading with 1b timed out, proving 1b wasn't load-bearing on short works. Saves ~45s + removes a timeout on short pieces.
- **Structural sampling (when 1b DOES run, ≥5k words):** replaced the old head+tail trim (which dropped the entire middle, so 1b never saw the midpoint it was meant to map) with sampling of opening + quarter-turn + **midpoint** + three-quarter turn + ending. Faster return AND a better map.
- **Device-vs-instance rule** (added to BOTH the analyst prompt and the lens corpus): before faulting an element, check whether it's an instance of a device the work uses *successfully elsewhere*; if so, name it as an instrument, point to where it succeeds, and frame the weak occurrence as "raise it to the standard your own best instance sets" — never "remove it." This fixed a real error (it had faulted a recurring italicised-narrator device as a one-off "essayising" failure). **Key principle that emerged: the work's own best moment is the first measure of best-in-class — before any external standard.**

---

## 4 · THE BRAIN PIPELINE (current model assignments)

Sequence: **Brain 1 (diagnostician) → Brain 1b (structural reader)\* → narrator verify\* → Brain 2 (analyst, streaming) ‖ Brains 3/4/5 in parallel → post-stream narrator correction → client-side glossary + anchor resolution.**  (\* = skipped on works <5k words.)

| Brain | Job | Model |
|---|---|---|
| 1 Diagnostician | tradition/register/ambition | Sonnet 4.6 |
| 1b Structural reader | evidence map (skipped <5k) | Sonnet 4.6 |
| Narrator verify | classify narrator lines (skipped <5k / treatments) | Sonnet 4.6 |
| Narrator correct | rewrite wrongly-flagged notes | Opus 4.7 |
| 2 Analyst | the reading (streaming) | Opus 4.7, effort `medium` |
| 3 Scorer | craft/tradition scores | Sonnet 4.6 |
| 4 Market | studio/publisher match + known-work | Sonnet 4.6 |
| 5 Bible | character bible | Sonnet 4.6 |
| 6 Lens ×27 | master voices | Sonnet 4.6 |
| 7 Conversation | follow-up chat | Sonnet 4.6 |

**Load-bearing law:** Brain 1 (tradition) MUST precede Brain 2, which receives the tradition as locked and never re-identifies it. This is the moat against generic-rubric drift. Do NOT collapse the pipeline into one mega-prompt to save time — single-pass Claude drifts at scale; the brains enforce reliability.

---

## 5 · LOGGED PRODUCTION REQUIREMENTS (all post server-side migration, all gated in Architecture v6 §21)

1. **Editor → Mentor progression.** MVP is editor-only. Mentor mode activates when a user resubmits the **same work, REVISED** — judges whether the revision fixed what was flagged, and over multiple revisions names recurring tendencies. **Gate strictly on a genuine revision relationship** — ASK the user ("is this a revision of something you've had read?"), don't just detect; never trigger on an unchanged resubmit or a different work.
2. **Mentor tiering.** Free = full honest reading always (never hobbled) + a *real* single-session taster (revise/resubmit within one browser session, comparing two in-memory drafts — genuine, no fabrication). Paid = persistent mentor (cross-session memory, tendency tracking). Limitation must be NATURAL, not imposed throttling. Surface the paid capability in free *after* the taster delivers value — describe, never fake.
3. **Interrogate / "push harder" mode.** Opt-in only, never default. Adds (a) questioning whether the *ambition itself* was worth attempting; (b) showing best-in-class for that tradition. INDEPENDENT of Mentor (available on a first submission) but DEEPENED by it. Must NOT become external-rubric imposition.
4. **Best-in-class research** (required before Interrogate is built): define best-in-class per tradition from a craft/success angle (e.g. Carver's ceiling for minimalism), not a generic rubric.
5. **Self-critique brain** (the "embed Claude reviewing D&L's own work" idea): a second Claude pass reviewing Brain 2's analysis against the LearnedCorpus before the user sees it — catching weak notes (faulting a device used well elsewhere, imposing a rubric, unverified absence, mis-read tradition). Same model on its own output. Adds a call (latency/cost) → paid-tier or opt-in. Must critique on the work's OWN terms, never a generic rubric. **Critically, it runs by DIFFERENT rules for the editor vs the voices** (see LearnedCorpus v2.3 Scope clause): on Brain 2 it checks corpus adherence (tradition, device-vs-instance, verify-before-absence); on a voice it must NOT correct tradition-blindness — a voice applying its own rubric across a tradition it doesn't share is the feature, not a fault. For voices it checks only the real-failure list: out of character, factual misread of the literal text, fabrication, breaking frame to claim objective authority, cruelty with no way forward.
6. **Free-tier lens selection:** curated 12 of 27 unlocked, rest greyed with names visible as upgrade prompts. Free set: Spielberg/Tarantino/Villeneuve, Hemingway/Chekhov/King, Sorkin/Puzo, Fey, Bruckheimer.

**No-fabrication law:** mentor and interrogate output must never be simulated — a capability that can't run is *described*, never performed.

---

## 6 · WHAT'S LEFT TO MAKE THE PIPELINE OPTIMAL

Mostly done (gating + parallelism + fixes above). Remaining:
1. **Prompt caching** — biggest real speed win; it's a **server-side build step** (Cursor Stage 2, already in the v6 Cursor prompt). Can't be done in the HTML. Verify it's actually applied, not just declared.
2. **Stream Brain 2 earlier** — perceived-speed improvement.
3. **Self-critique brain** — quality (see §5.5), paid/opt-in.
The pipeline is already near-minimal; do NOT add an "adaptive brain engagement" system — the bottleneck is Brain 2's write time, which no skipping touches, and the safe skips are already in.

---

## 7 · LAUNCH / GO-TO-MARKET STATE

- **The one gating requirement before ANY tester sees it:** prompts + lenses server-side (the migration). The prototype currently exposes everything in the browser. No exceptions.
- **Pricing (confirm at launch):** Free £0 (full reading, 10k words, ~2–3/mo, curated lenses) / Starter ~£9 (30k words, all 27 lenses, library) / Pro ~£24 (full length, multi-project, draft comparison, export) / Studio later. No credit system — explicit selling point.
- **Hosting plan:** GitHub (private) → Vercel → Clerk (auth + can remove testers instantly) → Supabase (later, for saved work) → Stripe (later, billing). All in the SetupChecklist.
- **Testers:** recruit 3–5 honest writers via r/Screenwriting, r/writing, writing Discords, BBC Writersroom, Nenad's own writing network. Framing: "break it and tell me where it's wrong," not "try my tool." Recruitment posts drafted (general + screenwriter + fiction versions). DO NOT send the link until prompts are server-side. Skip approaching famous/professional names until it's built, polished, and proven.
- **Competitor truth:** no direct feature-competitor combines tradition-awareness + multi-format + 27 lenses. Category competitors: AutoCrit (fixed-rubric, fiction-only, no lenses), Roast My Script (cheap shallow coverage), human readers (quality benchmark). Generators (Sudowrite, BookNova, TextBuilder) are NOT competitors — opposite side of the line.

---

## 8 · IMPORTANT CONTEXT ABOUT NENAD / HOW TO WORK WITH HIM

- **Non-technical**, on a tight budget ("broke"), wants to launch soon and make a modest living. Keep technical explanations plain and step-by-step; don't assume dev knowledge.
- **Communication preference:** short, plain answers; no padding or unnecessary hedging. Push back honestly when warranted (he values this), but don't write a thesis pointing out things he already knows.
- **API/cost reality:** D&L runs on the Anthropic API (pay-as-you-go; no free tier — the starter credit ran out once already). The production model is users funding API cost via subscriptions, or their own keys. He must keep credit topped up to test; auto-reload is worth setting.
- **Do NOT** suggest trades that harm wellbeing (he once joked about skipping meals to fund it — was redirected firmly). The free-reset path costs only time and is fine; nothing is urgent enough to justify going without.
- **The recurring discipline:** the human-in-the-loop reviewing output is NOT a primitive process to engineer away — it's the quality-control that keeps D&L from drifting generic. Every error caught becomes a corpus principle. Self-improvement-by-AI is unsafe for a taste product; the LearnedCorpus is the right mechanism.

---

## 9 · CONVERSATION-STATE NOTE

This handover holds the *state*; decisions also persist via memory. Re-upload it (and the current HTML if doing build work) at the start of a new chat. The next concrete action: **set up Claude Code (Claude Desktop → Code tab) and follow `DraftAndLens_ClaudeCode_StarterScript.md` — load context, set up Git, build Stage 1, run the browser security check, then plan Stage 2.** (Cursor is superseded for this work; if ever reused, its unverified Stage-1 claim must still be checked the same way.)

---

*Draft & Lens — Handover v7 · June 2026 · pairs with Architecture v6.0 and LearnedCorpus v2.3*
