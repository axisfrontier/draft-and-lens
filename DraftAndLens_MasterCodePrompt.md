# Draft & Lens — Master Code Prompt (July 2026)

> **Read CLAUDE.md and DraftAndLens_LearnedCorpus_v2.7.md before anything else.**
> This is the single source of truth for all outstanding Code work. Work through sessions in order. Never run a session marked PREREQUISITES REQUIRED until all prerequisites are confirmed. Never touch codex-maths. IP boundary is a permanent constraint — all brain and lens prompt content stays server-side, browser sends text and receives results only.

---

## STANDING PROTOCOL (every session, every edit)
- Audit the relevant files before touching anything. Show the plan. Wait for go.
- One logical fix per commit. `tsc` before every commit. Verify live with Chrome extension after every deploy.
- Additive edits only — never rewrite a working component from scratch.
- If Bash goes down: do not ask Nenad to run terminal commands that can wait. Flag it and continue with what's available.
- After any ReportView change: confirm sidebar shows the correct link count.

---

## SESSION 1 — Sign-in Gate UX (Option A)
**Model:** Sonnet / Medium | **Ready:** Yes

### Decision
Option A: gate visible from the start. Text area visible but locked behind a warm semi-transparent overlay from page load. No bait-and-switch. User sees the requirement immediately on landing.

### Audit first
Read the homepage/upload page component. Find:
1. Where the text area is rendered
2. Whether Clerk's `useUser()` or `useAuth()` is already imported
3. Any existing sign-in state check on this page

Report. Wait for go.

### What to build
When a user lands and is **not authenticated**, show a semi-transparent overlay over the text area section only (header, tagline, and any lens grid remain visible and interactive).

**Overlay behaviour:**
- Present from page load — not triggered by any user action
- Sits over the text area only, not the full page
- Disappears automatically when user signs in (Clerk auth state change)
- No dismiss button — the only escape is signing in

**Overlay design (warm paper aesthetic):**
- Background: `rgba(245, 241, 232, 0.92)`
- Backdrop filter: `blur(2px)`
- Border radius matches the text area container
- Centred content:

```
Create a free account to start your reading
Your work stays private and is never used to train AI.
[Create account]  [Sign in]
```

- Heading: existing serif font, `--ink-dark`
- Subtext: existing body font, `--ink-faint`, small
- Buttons: primary amber for "Create account", ghost for "Sign in" — both trigger Clerk flows

**What stays visible and interactive:** header, tagline, lens grid (if on homepage), all content outside the text area section.

**After sign-in:** overlay disappears, text area becomes fully interactive, no page reload required.

**Copy (exact — do not change):**
- Heading: `Create a free account to start your reading`
- Subtext: `Your work stays private and is never used to train AI.`
- Primary button: `Create account`
- Secondary button: `Sign in`

**What not to do:** do not gate the entire page; do not use a full-screen modal; do not show to authenticated users; do not add a dismiss option.

### Verify
- Visit draftandlens.com logged out — overlay visible over text area, header and lens grid interactive
- Click "Create account" — Clerk sign-up opens
- Click "Sign in" — Clerk sign-in opens
- Sign in — overlay disappears, text area becomes interactive

**One commit:** `feat: sign-in gate overlay (Option A)`

---

---
> ⛔ STOP AFTER SESSION 1. Deploy, verify live with Chrome extension, report completion. Do not proceed until Nenad confirms go in a new message.
---

## SESSION 2 — Note Quality (Brain 2 / Report)
**Model:** Sonnet / Medium | **Ready:** Yes (run after Session 1 is deployed and verified)

Governing law: `DraftAndLens_LearnedCorpus_v2.7.md` (Principles 9, 10, 11 + Teaching the Move). This is a Brain 2 analyst prompt change + report-render fix. Keep all prompt IP server-side. Re-run bundle grep if client surface changes.

### Goal
Every note must be: non-repetitive, complete, actionable, and legible. No note that names a problem without showing what to do. No duplicates. No vague or jargon terms left unexplained.

### Five fixes (one commit each, in this order)

**Fix 1 — Dedup**
An identical or near-identical note must appear ONCE, naming its multiple line locations. Never 3–4 copies. Check whether duplication is in generation or anchoring; fix at source.

**Fix 2 — Account for the set**
A note that names several instances (e.g. five adjectives) must address the set — demonstrate the move on one and state it applies to the others. No dangling instances.

**Fix 3 — Teach the move**
Every note that names a craft problem must show HOW to fix it, demonstrated on ONE example, so the writer applies it themselves. Never just the verdict ("too many adjectives"); always the move ("test each by removing it — does the image survive?"). NEVER hand back rewritten lines — teach, don't ghostwrite.

**Fix 4 — No vague terms left cold**
When a note uses a craft term a non-expert may not know, make it legible in plain language AND link the glossary. Goal: the writer learns the term AND the move.

**Fix 5 — Abstraction discrimination (Principle 11)**
Before flagging an abstraction as weak, check: is it load-bearing (names a perception the concrete can't carry — keep it) or floating (restates what an image already showed — flag it)? The Brain 2 prompt must make this discrimination. Notes that merely say "too abstract" without this check are wrong.

### What not to do
- Do not rewrite the writer's text in a note — always an invented example
- Do not reduce note count for its own sake — quality, not brevity
- Do not change the scoring system, section structure, or sidebar

### Verify
Submit a test piece. Confirm: no duplicate notes, all notes teach a move, no bare jargon, abstractions assessed correctly.

---

---
> ⛔ STOP AFTER SESSION 2. Deploy, verify live with Chrome extension, report completion. Do not proceed until Nenad confirms go in a new message.
---

## SESSION 3 — New Lens Voices + Genre Groupings
**Model:** Sonnet / High | **PREREQUISITES REQUIRED — do not run until all met**

### Prerequisites (confirm all before starting)
1. ⚠️ Complete Bukowski profile — profile cut off mid-sentence, needs completion
2. ⚠️ Nabokov profile — missing entirely, needs profile or confirmed decision to keep at current depth
3. File `DraftAndLens_NewLensVoices_Profiles.md` must be in the D&L project root with all 35 profiles
4. Portrait images for 8 new lens voices provided (Chandler, Leonard, Highsmith, King, Le Guin, Christie, Morrison, Ferrante)

### CRITICAL IP RULE
All 35 lens voice system prompts are D&L's core IP. Server-side only. After every commit touching lenses, run bundle grep: search `.next/static` for "Chandler", "Leonard", "Highsmith", "frantumaglia", "hooptedoodle", and the existing 5 IP markers. All must return exit:1.

### Part A — Audit
Read `src/prompts/lenses/` — list all current lens files, confirm 27 exist. Read `meta.ts`. Read `src/components/analysis/ReportView.tsx` — find `LENS_GROUPS`. Confirm client-side LENS_GROUPS has exactly 27 entries matching server-side meta.ts. Check how lens portrait images are stored. Report. Wait for go.

### Part B — Add 8 new lens voices (server-side only)
Add to `src/prompts/lenses/` using profiles from `DraftAndLens_NewLensVoices_Profiles.md`:
1. `chandler.ts` — Raymond Chandler
2. `leonard.ts` — Elmore Leonard
3. `highsmith.ts` — Patricia Highsmith
4. `king.ts` — Stephen King
5. `leguin.ts` — Ursula K. Le Guin
6. `christie.ts` — Agatha Christie
7. `morrison.ts` — Toni Morrison
8. `ferrante.ts` — Elena Ferrante

Add each to `meta.ts`. Do NOT add to LENS_GROUPS yet. One commit per 2 voices. Run bundle IP grep after each commit.

**Portrait images:** Images for all 8 new voices are in the project folder under `Lens voices_images/`. Wire each image to its lens card exactly as existing voices are wired. Apply `filter: grayscale(100%)` via CSS to all 8 new portrait images — check how existing 27 voices render and match the treatment exactly for consistency.

### Part C — Upgrade 16 existing lens voice prompts
Update using upgraded profiles from `DraftAndLens_NewLensVoices_Profiles.md`:
Orson Welles, Jean-Pierre Jeunet, Wim Wenders, Quentin Tarantino, Wachowskis, Aaron Sorkin, Mario Puzo, Eric Roth, Tina Fey, David Simon, Charlie Kaufman, Judy Blume, Hayao Miyazaki, Jerry Bruckheimer, Kevin Feige, Coen Brothers.
One commit per 4 voices.

### Part D — Update LENS_GROUPS (client-side)
Update `LENS_GROUPS` in `ReportView.tsx` using exact IDs from meta.ts. Use these groups exactly:

```
LITERARY_FICTION: [hemingway, carver, oconnor, bukowski, nabokov, chekhov, morrison, ferrante]
CRIME_THRILLER_SUSPENSE: [chandler, leonard, highsmith, christie, puzo]
HORROR_SPECULATIVE: [king, leguin]
ART_CINEMA: [welles, wenders, jeunet, miyazaki, coppola, villeneuve, kaufman, wachowskis, coens]
POPULAR_CINEMA: [spielberg, tarantino, scott, bruckheimer, feige]
SCREENPLAY_TELEVISION: [sorkin, roth, fey, simon]
YOUNG_ADULT: [blume]
```

Total: 35 voices. Verify count explicitly. One commit.

### Part E — Genre group UI on lens grid
Update the lens grid display to show voices grouped by the categories above.
- Each group has a visible label (small caps, `--ink-faint`, mono font — matching existing section headers)
- Within each group, lens cards render exactly as they do now
- Groups collapse/expand if over 4 voices OR display in a compact grid — propose before building
- "27 Ways of Looking" header updates to "35 Ways of Looking"
- No other changes to how individual lenses function
One commit. Verify live — all 35 lenses render, all group labels show, individual lens clicks work.

### Part F — Update lens disclaimer
Update wherever the lens disclaimer appears (AUP, About, in-product) to reflect 35 voices. Add the 8 new names. Keep the disclaimer wording: "Interpretive lenses inspired by each writer's published work — not the actual people, not affiliated or endorsed by them or their estates." One commit.

### Part G — Final IP check
`npm run build` → compiled successfully. Bundle IP grep on all 35 voice names → exit:1. Chrome extension verify → 35 lenses visible, grouped, clickable, producing readings. Report: total lens count, group breakdown, IP grep result.

---

## SESSION 4 — Genre Corpus Additions (Brain 1 + Brain 2)
**Model:** Sonnet / Medium | **Ready:** Yes (run after Session 3 is live)

D&L's corpus is currently literary-fiction biased. Brain 1 (tradition identification) and Brain 2 (analyst) both need genre-specific additions so that crime, thriller, horror, sci-fi/fantasy, and contemporary realism work correctly.

### Audit first
Read Brain 1 system prompt and Brain 2 analyst prompt. Confirm where tradition identification logic lives and what genre signals it currently recognises. Report. Wait for go.

### Brain 1 additions — tradition identification
Add the ability to recognise these genre traditions and their primary markers:

- **Hardboiled / noir:** first-person detective voice, moral ambiguity as structure, atmosphere over puzzle mechanics, corrupt institutional world
- **Cosy mystery / classic crime:** fair-play puzzle construction, closed world (village, manor, social group), satisfaction through revelation, economy of clue
- **Psychological thriller / suspense:** interior dread, unreliable consciousness, slow revelation, guilty protagonist
- **Horror / popular fiction:** situation-first, the ordinary made monstrous, dread sustained over time, stakes in character before spectacle
- **Science fiction / fantasy / speculative:** estrangement effect, world-as-premise, exposition as immersion, the familiar defamiliarised
- **Contemporary literary realism / autofiction:** interiority over event, unflinching body-anchored narrative, the domestic as epic, first-person unreliability

### Brain 2 additions — genre corpus principles (additive, after existing principles)

Add these six as numbered principles in the LearnedCorpus, after Principle 16:

**Principle 17 — In hardboiled and noir, plot is subordinate to atmosphere and voice.**
Thin plotting is not a failure. A detective story that meanders through morally ambiguous terrain is doing its work. Do not penalise the absence of a tidy resolution. The city is as important as the crime.

**Principle 18 — In cosy mystery, fair-play construction is the primary instrument.**
The reader must have access to all the clues. A solution the reader could not have reached is a failure. Economy and inevitability are the standards — not atmosphere, not psychological complexity.

**Principle 19 — In psychological thriller and suspense, slow revelation and delayed disclosure are craft, not pacing failures.**
A scene that does not advance plot but deepens dread is doing its work. The protagonist's guilt or unreliability must be felt before it is understood. Do not penalise deliberate withholding.

**Principle 20 — In horror, dread is a sustained state built through accumulation.**
A scene "without incident" may be the primary instrument — establishing the ordinary so the monstrous has somewhere to arrive. Do not penalise slow scenes in horror. Evaluate whether the ordinariness is specific enough to make the horror land.

**Principle 21 — In science fiction, fantasy, and speculative fiction, exposition is not a failure.**
World-building exposition is the genre's primary instrument for creating the estrangement that makes everything else possible. Do not penalise it. Evaluate instead whether the exposition creates a living world or an inert glossary.

**Principle 22 — In contemporary literary realism and autofiction, the emotional payoff is the contract with the reader.**
Unlike crime or thriller, withholding emotional resolution IS a genuine failure in this tradition — not earned ambiguity. The inner life is the plot. A narrative that ends without emotional specificity has broken its contract.

### After adding
Update `DraftAndLens_LearnedCorpus_v2.7.md` to v2.8 with the six new principles. Confirm Brain 2 references the updated corpus. One commit. Submit a test piece in each tradition to verify tradition identification is working. Report.

---

---
> ⛔ STOP AFTER SESSION 4. Deploy, verify live with Chrome extension, report completion. Do not proceed until Nenad confirms go in a new message.
---

## SESSION 5 — Chat Panel (Brain 7)
**Model:** Opus / High | **Run in its own session — do not combine with anything above**

This session has its own scope, IP boundary requirements, and verification protocol. Run it standalone after Sessions 1–4 are complete and stable. The prompt is in `Code_Prompt_3_ChatPanel.md` in the project folder.

---

## When Fast Mode is approved by Anthropic
Re-apply `speed: 'fast'` and the `anthropic-beta` header to Brain 2 in `analyst.ts`. One commit.

---

## Permanent reminders
- Site stays password-protected until solicitor review
- Word cap stays at 4,000 until long-form architecture is built (two-pass for scripts/plays, chapter pipeline for novels) — named pre-launch milestone
- Every deploy: verify live with Chrome extension before declaring done
- Sidebar: 26 links now, 35 after Session 3 — verify after any ReportView change
- IPO Class 42 trademark still not filed — Nenad to action outside Code
