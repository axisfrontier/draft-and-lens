# Draft & Lens — Long-Form Build Guide (For Code, When Activated)

> ⚠️ **DO NOT RUN THIS YET.** This guide is paired with `DraftAndLens_LongFormArchitecture_Spec.md`. Both remain dormant until beta is complete, feedback is incorporated, and Nenad explicitly authorises this build. When that day comes, paste both files to Code at the start of the first session.

---

## Pre-flight (before Phase 1 begins)

Confirm all of these before writing any code:
1. Beta feedback has been incorporated and the short-form pipeline is stable
2. Higher API rate limits have been requested and granted (platform.claude.com/settings/limits)
3. Feature flag infrastructure exists in the codebase (a clean on/off switch)
4. CLAUDE.md and LearnedCorpus are at their latest versions

---

## Standing rules for every phase

- Audit first, show plan, wait for go — no exceptions
- Every phase is additive — the existing 4,000-word pipeline must never be edited, only extended alongside
- After every phase: confirm the beta pipeline still works exactly as before (submit a short test piece through the normal flow)
- One logical change per commit, tsc before each, Chrome extension verification after each deploy
- The feature flag must default to OFF at every stage until Phase 8's dormancy verification passes

---

## Phase 1 — Chapter Detection + Fast First-Pass Overview
**Model: Opus / High**

- Build chapter detection (headers, "Chapter N" markers, scene breaks; fallback to ~4,000-word segments if no structure found)
- Build the Haiku-tier fast first pass: locks tradition once, builds initial character map, identifies throughline, produces whole-work overview
- This pass's output becomes the shared context for Phase 2 — no other phase runs until this streams correctly
- Verify: submit a test long-form piece (behind the feature flag, dev-only), confirm the overview streams within 30-60 seconds and tradition is locked correctly

---

## Phase 2 — Parallelized Chapter Batches + Prompt Caching
**Model: Opus / High**

- Build the batch orchestrator: 6-8 concurrent Brain 2 calls per batch, respecting rate limits
- Each chapter call inherits the Phase 1 shared context via Anthropic prompt caching (corpus, tradition ruling, character map cached once, reused across all calls)
- Wire in the existing report tiering system (Micro/Short/Full) per chapter, based on chapter word count — this already exists for beta, reuse it, don't rebuild it
- Verify: submit a multi-chapter test piece, confirm batches process concurrently (check logs/timing), confirm cached tokens are being reused (check token usage doesn't scale linearly with chapter count for shared context)

---

## Phase 3 — Whole-Work Brains Run Once
**Model: Sonnet / High**

- Market fit (Brain 4): runs once on overview + sample chapters, not per chapter
- Character bible (Brain 5): builds progressively as chapters complete, accumulating rather than restarting per chapter
- Verify: confirm Brain 4 and Brain 5 each fire exactly once per submission, not once per chapter

---

## Phase 4 — Progressive Delivery UX
**Model: Opus / High** (UI + orchestration complexity)

- Build the chapter grid UI: overview visible immediately, chapters populate progressively as their batch completes
- Reuse the skeleton-then-fill pattern already built for short-form (Session 1 work) — extend it, don't reinvent it
- Verify with Chrome extension: submit a test piece, confirm overview appears in 30-60s, confirm chapters fill in progressively while later batches are still processing, confirm the writer can read completed chapters while others are pending

---

## Phase 5 — Chapter Hashing + Diff Detection
**Model: Sonnet / High**

- Each chapter gets a stable identifier at first submission (not tied to position — see Phase 7)
- Hash each chapter's content, store against the writer's account
- On resubmission: compare hashes per chapter identity; unchanged chapters serve their prior stored reading directly, no reprocessing
- Verify: submit a test piece, edit one chapter, resubmit — confirm only the edited chapter reprocesses, confirm unchanged chapters return instantly from storage

---

## Phase 6 — Dependency Graph + Ripple Check
**Model: Opus / High**

- Build the dependency graph at initial submission: which chapters establish what (characters, setups, plot mechanisms), which chapters depend on those
- Store graph relationships against chapter identity, not position (see Phase 7)
- On a chapter edit: traverse the graph to find affected chapters — a direct lookup, not a fresh reasoning pass
- Flagged chapters get a lightweight Haiku-tier "does this still hold" recheck
- Verify: submit a test piece, edit a chapter that establishes something used later (e.g. a character trait), resubmit — confirm the graph correctly flags the dependent chapter for a recheck, confirm unrelated chapters are not rechecked

---

## Phase 7 — Chapter Identity Stability (Reordering)
**Model: Sonnet / Medium**

- Confirm chapter identifiers are assigned once at first submission and persist regardless of position in the manuscript
- If a writer reorders chapters without editing content: confirm the graph and hash system recognise this as unchanged content, not a full re-diff
- If reordering changes narrative logic (e.g. a flashback moved earlier now precedes information it originally followed): this should be flagged as a content-adjacent change requiring normal diff/ripple flow (Phase 5-6), not treated as pure reordering
- Verify: reorder two unedited chapters in a test submission, confirm no unnecessary reprocessing occurs; then reorder in a way that changes narrative logic, confirm it correctly triggers the ripple check

---

## Phase 8 — Partial Failure Handling
**Model: Sonnet / High**

- Each chapter's Brain 2 call is independently retryable — a failure in one chapter must never affect other chapters' batches or the whole submission
- Failed chapter UI state: clear "This chapter's reading didn't complete — retry" message with a single retry button
- Retry re-runs only that chapter's Brain 2 call, inheriting the same cached shared context (cheap, fast)
- Overview and all successfully completed chapters remain visible and usable throughout any partial failure
- If more than 20% of chapters fail in one run: surface a single system-level notice suggesting the writer wait and retry the whole submission
- Verify: simulate a chapter-level failure (e.g. force an error in one batch call during testing), confirm the rest of the submission completes normally, confirm the retry button works and only reprocesses the failed chapter

---

## Phase 9 — Selective Reading
**Model: Sonnet / High**

- Allow a writer to select any chapter or passage from an already-submitted long-form manuscript
- Wire this to the existing excerpt mode (built in beta) for a fresh Brain 2 reading on just that selection
- Wire this to any lens voice for a lens reading on just that selection
- Verify: select a chapter from a completed long-form submission, request an excerpt-mode reading and a lens reading, confirm both operate on just the selected text without reprocessing the whole manuscript

---

## Phase 10 — Lens Q&A (Brain 7 / Chat Panel)
**Model: Opus / High — own session, given IP boundary sensitivity**

- Build the chat interface: writer types a question, selects a lens voice, receives an answer
- **Critical guardrail:** the lens must answer from the submitted text only. If a question cannot be answered from what's on the page, the lens must decline in character (e.g. Chandler: "You haven't shown me the room yet. Ask me again once I can see it.") rather than hallucinate
- Add this guardrail as a new corpus principle in LearnedCorpus before building the chat logic
- Two modes: whole-work Q&A (aware of the overview/character map) and selective Q&A (scoped to a chapter/passage, using Phase 9)
- Full IP boundary check after this phase — confirm no lens prompt content, corpus content, or brain logic appears in the client bundle (standard bundle grep, extended to cover any new chat-related files)
- Verify: ask a lens a question answerable from the text (confirm grounded answer), ask a lens a question NOT answerable from the text (confirm in-character decline, not hallucination)

---

## Phase 11 — Cost Measurement
**Model: Sonnet / Medium** (this is a testing/measurement phase, not a build phase)

- Run 3-5 full internal test reads at realistic lengths: 80k, 100k, 120k words
- Log actual token spend end-to-end for each (Phase 1 overview + all chapter batches + Phase 3 whole-work brains)
- Report actual cost-per-read figures
- This informs pricing decisions outside of Code's scope — report findings back to Nenad, no further action from Code

---

## Phase 12 — Feature Flag + Dormancy Verification
**Model: Sonnet / High**

- Confirm the feature flag cleanly gates the entire long-form system — default OFF
- With the flag OFF: submit a normal beta-length piece through the existing short-form pipeline, confirm it behaves exactly as it did before this entire build (identical output, identical timing, no regression)
- With the flag ON (dev/internal only): confirm the long-form system activates correctly end-to-end
- This is the final gate before any live launch — do not consider this build complete until dormancy is proven, not assumed

---

## After Phase 12

Report back with:
1. Confirmation the beta pipeline is unaffected (Phase 12 verification)
2. Cost-per-read figures (Phase 11)
3. Any open issues or edge cases discovered during build
4. Recommended internal testing plan before considering live activation

Do not switch the feature flag on for real users until Nenad has reviewed all of the above and given explicit go-ahead.
