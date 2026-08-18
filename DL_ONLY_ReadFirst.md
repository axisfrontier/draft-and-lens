# DL_ONLY_ReadFirst.md

**THIS FILE IS DRAFT & LENS ONLY. It does not apply to Codex-Maths.**
If you are about to state anything about Codex-Maths — its UI process, its repo, its build steps, its mockups — STOP. This file has no authority there. Codex-Maths has its own equivalent file (`CM_ONLY_ReadFirst.md`). Go check that instead. The two projects share a developer (Nenad) but nothing else — different repos, different tech, different UI processes, different histories. Treat resemblance between the two as coincidence, never as shared fact.

---

## Hard rules for working on D&L

1. **Files are ground truth. Chat memory is not.** Before concluding something wasn't discussed or decided, check repo files (CLAUDE.md, SESSION_LOG.md, DraftAndLens_Internal_Research_Notes.md, DraftAndLens_UIExploration_Backlog.md) — a failed chat search is not proof of absence.

2. **Classify every "decision needed" before relaying it to Nenad:**
   - Factual/lookup (check the file, check the code) → resolve it myself, report the answer
   - Genuine preference/values call → this is Nenad's, present it as a real decision
   - Getting this wrong was the single most repeated failure in the 2026-08-18 session.

3. **Write down anything product-shaping before the session ends** — don't rely on it surviving in chat history.

4. **D&L has NO batch-based mockup system.** The "21 mockups, 8 batches" process is Codex-Maths only. If this pattern seems to apply to D&L, that's a merge error — stop and re-check which repo/project is actually being discussed.

5. **If a broad search keeps surfacing the same conversation thread across multiple unrelated queries, that thread is the primary working record for this phase — read it thoroughly, don't keep re-querying it narrowly.**

6. **When memory search comes back empty, say so plainly.** "I searched and found nothing" ≠ "this never happened." State which is true, don't blur them.

## Known past failures (2026-08-18) — do not repeat

- Asked Nenad to decide the sidebar link count (25 vs 26) — this was answerable by reading the component source, not a preference call.
- Asked Nenad whether to "trust" extraction's entity match on a name-variance test case — this was a reading-comprehension instruction for Code, not a decision for Nenad.
- Repeatedly described Codex-Maths' 21-mockup/8-batch process as if it were D&L's, causing real confusion and frustration.
- Missed a real, previously-logged D&L edge case (lens voice self-upload) on first search due to overly narrow query phrasing, despite the source thread having surfaced multiple times already that session.

## Current file pointers (D&L repo)

- `CLAUDE.md` — single source of truth for live rules (sidebar link count, etc.)
- `SESSION_LOG.md` — Code's own resume/handover notes
- `DraftAndLens_Internal_Research_Notes.md` — deferred ideas, edge cases, "not forgotten" list
- `DraftAndLens_UIExploration_Backlog.md` — new UI design exploration, not started
- `AUDIT_CHECKLIST.md` — Level 3 periodic audit, triggers before major new features

## Standing beta build order (as of 2026-08-18)

1. Detection — nearly complete, migration applied, being verified live
2. Timeline reasoning (ledger phase 3) — not started
3. Mentor mode — not started
4. Differentiator messaging — not started, depends on Mentor mode
5. THEN: new UI design exploration (Noel-driven), see backlog file

Don't reorder without Nenad's explicit instruction.
