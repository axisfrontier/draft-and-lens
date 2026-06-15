# Draft & Lens — Cursor Conversion Prompt (v6)
### Paste the block below into Cursor (Composer / Agent mode) with `DraftAndLens.html` and `DraftAndLens_Architecture_v6.md` open in the workspace.

---

## How to use this

1. Open Cursor. Open a new empty folder for the project (e.g. `draft-and-lens`).
2. Drag **only the current files** into that folder so Cursor can see them: `DraftAndLens.html`, `DraftAndLens_Architecture_v6.md`, `DraftAndLens_LearnedCorpus.md`, `ThinkingDiscipline.md`. **Do not** include the old `Architecture.md` (non-v6), `MasterPrompt.md`, `HANDOVER.md`, `SessionSummary.md`, or `ArchitecturalEvolution.md` — they are superseded or historical and will confuse the build.
3. Open Cursor's Composer/Agent (multi-file mode), and paste the **entire prompt** below.
4. Work through it in the stages it defines — do **not** ask for everything in one shot. Approve each stage, run it, confirm it works, then continue.
5. After Stage 1, run the **browser security check** at the end of this document before going further.

A note before you start: this is the hardest part of the whole project. Go slowly, approve one stage at a time, and when something breaks, paste the exact error back to Cursor. Don't let it move to the next stage until the current one runs.

---

## ░░ THE PROMPT — paste everything below this line ░░

You are a senior full-stack engineer. We are converting a working single-file prototype (`DraftAndLens.html`) into a production-grade Next.js 14 application. The authoritative specification is `DraftAndLens_Architecture_v6.md` — treat it as law. Two further documents are governing references the architecture cites and your prompts must respect: `DraftAndLens_LearnedCorpus.md` (the editorial reasoning the prompts encode) and `ThinkingDiscipline.md` (the working method). Read all four files fully before writing any code.

**The single most important requirement:** all AI prompts and all lens voices currently live in the browser. In the converted app they must live **only on the server**. The browser must send only the user's submitted text (plus settings) and receive only results. The prompt text, the lens definitions, and the anchor-delimiter directive must never appear in any file the browser downloads. If you are ever unsure whether something belongs client-side or server-side, it belongs server-side — **except** the glossary definitions and the inline anchor *resolver/view*, which are explicitly non-IP and client-side (see below and §18–§19 of the architecture doc).

### Non-negotiable principles (from the architecture doc, §01)

- **TypeScript strict mode.** No `any` unless unavoidable and commented.
- **Layered architecture, no bleed:** `prompts/` (craft rules, server-only), `ai/brains/` (orchestration, server-only), `app/api/` (routes), `data/` (Supabase), `components/` + `app/` (UI), `lib/` (client helpers: anchor resolver, dev tracer). UI renders data and makes no editorial decisions.
- **One source of truth.** Every prompt, tradition, lens voice, and the glossary is defined exactly once. No duplication.
- **The API key is read from an environment variable on the server only.** Never imported into, referenced by, or bundled with any client component. Never hardcoded.
- **Word-limit and tier checks run server-side before any Anthropic call.**
- **Every prompt constant carries a comment:** what craft principle it encodes, and the date last reviewed.
- **Design tokens only** — port the CSS variables from the HTML into one tokens file; no hardcoded colours.
- **Additive, not destructive.** Adding a lens, tradition, or mode must never require editing existing working code.
- **Mode is user-declared (must-choose), never auto-inferred server-side.** The route rejects a request with no mode.
- **Nothing fakes mentor or interrogate output** (architecture §21) — a capability that can't run is described, never performed.

### What to extract from the prototype, verbatim

The prototype contains the real, tuned editorial IP. Preserve its **content exactly** — only its *location* changes (browser → server). Locate and move server-side, without altering wording:

- The **four** mode system prompts: `SCRIPT_SYSTEM`, `STORY_SYSTEM`, `PLAY_SYSTEM`, and **`TREATMENT_SYSTEM`** (the prototype now has four modes — do not miss Treatment).
- The four report structures, including `TREATMENT_REPORT_STRUCTURE`, and the four genre-note sets including `TREATMENT_GENRE_NOTES`.
- The diagnostician prompt: `PASS1_SYSTEM`.
- The structural reader prompt: `STRUCTURAL_READER_SYSTEM`, **including its treatment-aware branch** (when the mode is Treatment it collects structural evidence and leaves narrator arrays empty).
- The narrator verifier and corrector prompt logic. Note the current model split: **verifier on Sonnet, corrector on Opus** — preserve these exactly.
- The **anchor-delimiter directive** appended to the analyst prompt (it instructs the model to wrap verbatim quotes in `⟦…⟧`). This is IP and moves server-side with the analyst prompt — it becomes `prompts/fragments/anchor-directive.ts`.
- The `PARTIAL_READ_DIRECTIVE` and the `KNOWN_WORK_CHECK` fragments.
- The full `LENS_DATA` object and the `getLensSystemPrompt()` logic — **all 27 lens voices** (the roster grew from 22; confirm membership against the prototype).
- The conversation system prompt logic.
- The genre lists, the tradition framework, and any embedded craft-corpus text.
- The brain orchestration sequence and **all model names, token limits, streaming and thinking settings exactly as in the prototype's `fetch` calls** — including the analyst's adaptive thinking and its **effort level exposed as a tunable constant** (default `medium`).

Do not paraphrase, "improve," or summarise any prompt text during the move. The wording is deliberate and tuned through extensive testing. Copy it exactly. If you believe a prompt has a bug, flag it — do not silently rewrite it.

### What is deliberately NOT IP, and stays client-side

- The **glossary** (`GLOSSARY` object + the term-annotation walker + the tooltip UI + the glossary page). These are plain craft definitions; they reveal nothing about how the reading is produced. Port them to `components/glossary/` and keep them client-side. (Architecture §19.)
- The **inline anchor resolver and anchored view** (extract `⟦…⟧` from the rendered report, locate quotes in the submitted text, pin notes). The *directive* that produces the brackets is server-side IP; the *resolution and rendering* are client-side. Port to `lib/anchor.ts` + `components/analysis/AnchoredView.tsx`. (Architecture §18.)
- **DLTrace** — the dev tracer. Port to `lib/trace.ts` but **gate it behind a dev/staff flag**; it must never ship active to users. (Architecture §20.)

### Build in these stages. Stop after each. Wait for my approval.

**Stage 0 — Scaffold.**
Create a Next.js 14 App Router project, TypeScript strict, Tailwind. Set up the folder structure exactly as in §05 of the architecture doc (note the four `modes/` files, the `fragments/` folder with three fragments, the `genres/` and four `report/` files, `lib/anchor.ts`, `lib/trace.ts`, `components/glossary/`). Create `.env.local.example` listing every env var (`ANTHROPIC_API_KEY`, Clerk, Supabase, Stripe) with placeholder values and a one-line comment each. Create `.gitignore` excluding `.env.local`. Produce a `README.md`. Do not build features yet. Show me the tree and the package.json, then stop.

**Stage 1 — Prompts layer (server-only) + the API-key boundary.**
The security-critical stage. Move every prompt listed above into `src/prompts/` as typed, versioned TypeScript constants — **all four modes**, the diagnostic, the structural reader (with treatment branch), the narrator logic, the four genre-note sets, the four report structures, the three fragments (`partial-read.ts`, `known-work.ts`, `anchor-directive.ts`), and **all 27 lens voices**. Create the Anthropic client in `src/ai/client.ts` reading `process.env.ANTHROPIC_API_KEY`, imported only by server code. Put `import 'server-only'` at the top of every module in `src/prompts/` and `src/ai/`. After this stage, the prompt text and the anchor directive must exist only in server modules. Show me the files and explicitly confirm that no prompt string and no lens voice is reachable from the client bundle, then stop.

**Stage 2 — The brain AI layer (server-only).**
Implement each brain in its own file under `src/ai/brains/` per §03: diagnostician (Brain 1), structural reader (Brain 1b, with the treatment branch), narrator verifier + corrector, analyst (Brain 2, streaming, with the anchor directive and adaptive-thinking/effort settings), scorer (Brain 3, treatment-aware), market (Brain 4), bible (Brain 5), lens (Brain 6), conversation (Brain 7). Implement `src/ai/orchestrator.ts` running the corrected sequence: Brain 1 → Brain 1b → narrator verification (sequential), then Brain 2 streaming alongside Brains 3/4/5 in parallel, with the post-stream narrator correction. Apply **Anthropic prompt caching** to every brain's system prompt (§14b). Preserve all model names, token limits, and settings from the prototype exactly (verifier Sonnet, corrector Opus, analyst Opus + effort tunable). Implement the conditional fragments. Show me the orchestrator and the analyst brain in full, then stop.

**Stage 3 — API routes with the security spine.**
Create the routes per §05/§09: `api/analyse`, `api/lens`, `api/converse`, `api/upload`. Each route, in order: verify auth (Clerk) → check rate limit → check tier word/feature limit → **require a declared mode (reject if absent)** → sanitise input → compute the coverage signal `{ truncated, wordsRead, wordsTotal, fractionRead, coverage }` and pass it into the brains (§13) → run the orchestrator → stream or return results. The word-limit check must run before any Anthropic call. Carry the interrogate opt-in flag and the mentor-relationship inputs through to the orchestrator context (even if those features are stubbed until Stage 8). Show me the `analyse` route in full, then stop.

**Stage 4 — Port the UI.**
Recreate the prototype's screens as React components under `src/components/` and `src/app/`, matching the current design exactly — on the design tokens (`src/design/tokens.css`), no hardcoded colours. Reproduce: the must-choose upload flow (four types: Film Script / Treatment / Story / Stage Play; numbered steps; CTA gated on a chosen type; only the character bible optional); the honest staged progress indicator and the Stop control; the analysis report layout; the inline anchored-text view and the glossary tooltips (both client-side, operating on produced results only); the conversation panel order (input + revision notes above, thread below); the standalone nav pages (About, Glossary, Feedback, Contact, Legal). Reproduce the partial-read banner from the `coverage` signal. Port DLTrace behind a dev-only gate. Components contain no prompt text and no editorial logic. Show me the upload screen and the report components, then stop.

**Stage 5 — Auth, tiers, persistence.**
Integrate Clerk. Implement the tier definitions from §07 in `src/stripe/tiers.ts` — including the lens **selection** logic (free = curated 12 per §16, rest greyed with names visible), the `interrogate` flag, and the `mentorTaster`/`mentorPersistent` flags. Implement the Supabase schema from §08 with row-level security, **including `work_key` on analyses and the `revisions` table** (the persistence substrate for mentor mode, even though mentor is built in Stage 8). Wire saved analyses, conversations, and revision notes per tier. Enforce the lens gating server-side. Do not integrate Stripe billing yet — tier *logic* and gating only, so a small beta can run with manually-assigned tiers. Show me the tier logic and the data layer, then stop.

**Stage 6 — Tests and hardening.**
Add the tests from §10, especially: "Brain 2 never re-identifies the tradition"; the partial-read test ("the analyst makes no whole-work claim when truncated"); the **client-IP guard** (no prompt constant or lens voice importable from a client component); the **anchor resolver** tests (exact/repeat/case-insensitive/whitespace/orphan/cap); the **glossary matcher** tests (canonical/alias/longest-match/word-boundary/2-cap/case); the **treatment** test (routes to TREATMENT_SYSTEM; never faulted for absent dialogue). Run the full type-check and test suite. Show me the results.

**Stage 7 — Billing.** Stripe, subscription flow, tier-aware UI.

**Stage 8 — Roadmap features (§21), in dependency order, each gated and opt-in/consented where specified.**
(a) Single-session mentor taster — no persistence; compares two drafts held in one session. (b) Persistent mentor — uses `work_key` + `revisions`; gates strictly on a genuine revision relationship confirmed by *asking the user*, with a light similarity sanity-check as backstop; never triggers on an unchanged resubmit or a different work. (c) Interrogate mode — opt-in; default read unchanged; requires the best-in-class-per-tradition research (§21c) before implementation; must not become external-rubric imposition. Show me each before wiring it live.

### Throughout

- Comment generously but precisely — a senior developer reading this cold should understand *why*, not just *what*.
- Prefer clarity over cleverness.
- If the architecture doc and the prototype ever disagree, follow the architecture doc for *structure/standards* and the prototype for *prompt content*, and tell me about the conflict.
- At the end of each stage, give me a one-paragraph plain-English summary of what changed and what I should test.

## ░░ END OF PROMPT ░░

---

## After Stage 1: the browser security check (do this before continuing)

This is the test that confirms the whole point of the conversion worked. After Stage 1 (or once the app runs locally):

1. Run the app locally (`npm run dev`, usually `http://localhost:3000`).
2. Open the page in Chrome. Open DevTools (right-click → Inspect → **Sources** tab, and the **Network** tab).
3. In Sources, search the loaded JavaScript (Cmd+F / Ctrl+F) for a distinctive phrase you know appears in `SCRIPT_SYSTEM` or `TREATMENT_SYSTEM` or in a lens voice.
4. **You must find nothing.** If the prompt text does not appear in the client sources, the move succeeded. If you *can* find it, stop and tell Cursor: *"This prompt text is still reachable in the client bundle; it must be server-only. Fix it."*
5. Repeat for a lens-voice phrase, for the anchor-directive phrase (search for the `⟦` character or the directive wording), and for the string `ANTHROPIC_API_KEY` or your actual key — the key and the prompt IP must never appear.
6. **Allowed to appear (these are not IP):** glossary definition text, and the anchor *resolver* code. Finding those client-side is correct, not a leak.

Do not invite a single tester until this check passes.

---

## When something breaks

Paste the exact error text back to Cursor with: *"This errored at Stage N. Here is the full error. Fix it without changing the architecture."* Don't accept a fix that skips a security requirement to make an error go away — if Cursor suggests moving a prompt client-side or hardcoding the key "to get it working," refuse and ask for the correct fix.

---

*Draft & Lens — Cursor Conversion Prompt v6 · June 2026 · matches Architecture v6.0*
