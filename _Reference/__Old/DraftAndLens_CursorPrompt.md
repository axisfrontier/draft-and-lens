# Draft & Lens — Cursor Conversion Prompt
### Paste the block below into Cursor (Composer / Agent mode) with `DraftAndLens.html` and `DraftAndLens_Architecture.md` open in the workspace.

---

## How to use this

1. Open Cursor. Open a new empty folder for the project (e.g. `draft-and-lens`).
2. Drag `DraftAndLens.html` and `DraftAndLens_Architecture.md` (v5.0) into that folder so Cursor can see them.
3. Open Cursor's Composer/Agent (the multi-file mode), and paste the **entire prompt** below.
4. Work through it in the stages it defines — do **not** ask for everything in one shot. Approve each stage, run it, confirm it works, then continue.
5. After Stage 1, run the **browser security check** at the end of this document before going further.

A note before you start: this is the hardest part of the whole project. Go slowly, approve one stage at a time, and when something breaks, paste the exact error back to Cursor. Don't let it move to the next stage until the current one runs.

---

## ░░ THE PROMPT — paste everything below this line ░░

You are a senior full-stack engineer. We are converting a working single-file prototype (`DraftAndLens.html`) into a production-grade Next.js 14 application. The authoritative specification is `DraftAndLens_Architecture.md` (v5.0) — treat it as law. Read both files fully before writing any code.

**The single most important requirement:** all AI prompts and all lens voices currently live in the browser. In the converted app they must live **only on the server**. The browser must send only the user's submitted text (plus settings) and receive only results. The prompt text and lens definitions must never appear in any file the browser downloads. If you are ever unsure whether something belongs client-side or server-side, it belongs server-side.

### Non-negotiable principles (from the architecture doc)

- **TypeScript strict mode.** No `any` unless unavoidable and commented.
- **Layered architecture, no bleed:** `prompts/` (craft rules, server-only), `ai/brains/` (orchestration, server-only), `app/api/` (routes), `data/` (Supabase), `components/` + `app/` (UI). UI renders data and makes no editorial decisions.
- **One source of truth.** Every prompt, tradition, and lens voice is defined exactly once. No duplication. If a rule changes, it changes in one place.
- **The API key is read from an environment variable on the server only.** It is never imported into, referenced by, or bundled with any client component. Never hardcode it.
- **Word-limit and tier checks run server-side before any Anthropic call.**
- **Every prompt constant carries a comment:** what craft principle it encodes, and the date it was last reviewed.
- **Design tokens only** — port the CSS variables from the HTML into one tokens file; no hardcoded colours in components.
- **Additive, not destructive.** Adding a lens or tradition must never require editing existing working code.

### What to extract from the prototype, verbatim

The prototype contains the real, tuned editorial IP. Preserve its **content exactly** — only its *location* changes (browser → server). Specifically, locate and move server-side, without altering wording:

- The three mode system prompts: `SCRIPT_SYSTEM`, `STORY_SYSTEM`, `PLAY_SYSTEM`.
- The diagnostician prompt: `PASS1_SYSTEM`.
- The structural reader prompt: `STRUCTURAL_READER_SYSTEM`.
- The narrator verifier / corrector prompt logic.
- The full `LENS_DATA` object and the `getLensSystemPrompt()` logic — all lens voices.
- The conversation system prompt logic.
- The genre lists, the tradition framework, and any embedded craft corpus text.
- The 7-brain orchestration sequence and all model names, token limits, streaming and thinking settings exactly as in the prototype's `fetch` calls.

Do not paraphrase, "improve," or summarise any prompt text during the move. The wording is deliberate and has been tuned through extensive testing. Copy it exactly.

### Build in these stages. Stop after each. Wait for my approval.

**Stage 0 — Scaffold.**
Create a Next.js 14 App Router project, TypeScript strict, Tailwind. Set up the folder structure exactly as in §05 of the architecture doc, including the `prompts/fragments/` folder from v5.0. Create a `.env.local.example` listing every env var the app will need (`ANTHROPIC_API_KEY`, Clerk keys, Supabase keys, Stripe keys) with placeholder values and a one-line comment each. Create `.gitignore` that excludes `.env.local`. Produce a `README.md` explaining how to run the project locally. Do not build features yet. Show me the tree and the package.json, then stop.

**Stage 1 — Prompts layer (server-only) + the API key boundary.**
This is the security-critical stage. Move every prompt listed above into `src/prompts/` as typed, versioned TypeScript constants, organised per the folder structure. Create the Anthropic client in `src/ai/client.ts` that reads `process.env.ANTHROPIC_API_KEY` and is imported only by server code. Add a build-time guard or clear convention ensuring nothing in `src/prompts/` or `src/ai/` can be imported by a client component (e.g. mark them with `import 'server-only'` at the top of each module). After this stage, the prompt text must exist only in server modules. Show me the files and explicitly confirm that no prompt string is reachable from the client bundle, then stop.

**Stage 2 — The 7-brain AI layer (server-only).**
Implement each brain in its own file under `src/ai/brains/` exactly per §03: diagnostician (Brain 1), structural reader (Brain 1b), analyst (Brain 2, streaming), scorer (Brain 3), market (Brain 4), bible (Brain 5), lens (Brain 6), conversation (Brain 7). Implement `src/ai/orchestrator.ts` that runs the sequence: Brain 1 → Brain 1b → narrator verification (sequential), then Brain 2 streaming alongside Brains 3/4/5 in parallel, exactly as the prototype does. Apply **Anthropic prompt caching** to every brain's system prompt (§14b). Preserve all model names and token settings from the prototype. Implement the v5.0 conditional fragments: `partial-read.ts` (appended to the analyst when input is truncated — §13) and `known-work.ts` (appended to the market brain — §14). Show me the orchestrator and one brain in full, then stop.

**Stage 3 — API routes with the security spine.**
Create the routes per §05/§09: `api/analyse`, `api/lens`, `api/converse`, `api/upload`. Each route, in this order: verify the user is authenticated (Clerk) → check rate limit → check tier word/feature limit → sanitise input → compute the truncation signal `{ truncated, wordsRead, wordsTotal, fractionRead, coverage }` and pass it into the brains (§13) → run the orchestrator → stream or return results. The word-limit check must run before any Anthropic call. Show me the `analyse` route in full, then stop.

**Stage 4 — Port the UI.**
Recreate the prototype's screens as React components under `src/components/` and `src/app/`, matching the current design exactly. Port the CSS variables into `src/design/tokens.css` and use them exclusively — no hardcoded colours. The components call the API routes; they contain no prompt text and no editorial logic. Preserve the current homescreen (two-column hero, lenses, footer), the analysis report layout, the conversation panel order (input + revision notes above, message thread below), and the standalone nav pages (About, Glossary, Feedback, Legal). Reproduce the partial-read banner from the `coverage` signal. Show me the homescreen and the report components, then stop.

**Stage 5 — Auth, tiers, persistence.**
Integrate Clerk for auth. Implement the tier definitions from §07 in `src/stripe/tiers.ts`. Implement the Supabase schema from §08 with row-level security. Wire saved analyses, conversations, and revision notes per tier. Do not integrate Stripe billing yet — just the tier *logic* and gating, so a small beta can run with manually-assigned tiers. Show me the tier logic and the data layer, then stop.

**Stage 6 — Tests and hardening.**
Add the tests from §10, especially "Brain 2 never re-identifies the tradition" and the partial-read test ("the analyst makes no whole-work claim when truncated"). Add a test that no prompt constant is importable from a client component. Run the full type-check and test suite. Show me the results.

### Throughout

- Comment generously but precisely — a senior developer reading this cold should understand *why*, not just *what*.
- Prefer clarity over cleverness.
- If the architecture doc and the prototype ever disagree, follow the architecture doc and tell me about the conflict.
- At the end of each stage, give me a one-paragraph plain-English summary of what changed and what I should test.

## ░░ END OF PROMPT ░░

---

## After Stage 1: the browser security check (do this before continuing)

This is the test that confirms the whole point of the conversion worked. After Stage 1 (or once the app runs locally):

1. Run the app locally (`npm run dev`, usually `http://localhost:3000`).
2. Open the page in Chrome. Open DevTools (right-click → Inspect → **Sources** tab, and also the **Network** tab).
3. In Sources, look through the JavaScript files the browser loaded. Use Cmd+F / Ctrl+F to search the loaded sources for a distinctive phrase from one of your prompts — e.g. a few words you know appear in `SCRIPT_SYSTEM` or in a lens voice.
4. **You must find nothing.** If the prompt text does not appear anywhere in the client sources, the server-side move succeeded. If you *can* find it, the prompt is still shipping to the browser — stop and tell Cursor: *"This prompt text is still reachable in the client bundle; it must be server-only. Fix it."*
5. Repeat the search for a lens voice phrase and for the string `ANTHROPIC_API_KEY` or your actual key — the key must never appear.

Do not invite a single tester until this check passes.

---

## When something breaks

Paste the exact error text back to Cursor with: *"This errored at Stage N. Here is the full error. Fix it without changing the architecture."* Don't accept a fix that skips a security requirement to make an error go away — if Cursor suggests moving a prompt client-side or hardcoding the key "to get it working," refuse and ask for the correct fix.
