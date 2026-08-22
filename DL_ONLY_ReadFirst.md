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
- `DraftAndLens_FragmentMode_Spec.md` — fragment/short-input handling and the revision loop. Design only, not built. Sequenced after Mentor mode.
- `DraftAndLens_DepthAndScenarios_Spec.md` — tradition depth, scenarios page, contextual nudges. Design only, not built. Build order inside.
- `DraftAndLens_MentorCompleteness_Spec.md` — progress tracking, writer-set goals, "How I remember" page. Design only, not built. Build order inside.

## Standing beta build order (updated 2026-08-21)

Items 1–4 of the 2026-08-18 order are **done and verified live**: detection, timeline reasoning (ledger phase 3), mentor mode, and the differentiator line. Also shipped since: fragment mode, the tradition depth gap, `/how-i-read`, contextual nudges, and §5.5 flag dismissal.

**Mentor Completeness (all four stages) shipped 2026-08-21/22:** lens self-recognition and the sixth `/how-i-read` scenario (stage 1), trajectory / Gap A (stage 2), writer-set goals / Gap B including the `writer_goals` migration (stage 3), and `/how-i-remember` plus the horizon line / Gap C (stage 4). **`/how-i-read` and `/how-i-remember` were merged into `/how-it-works` (two tabs) on 2026-08-22** — one nav entry, copy unchanged, both old routes redirect. **The signed-in half of stages 3 and 4 has still NOT been checked in a browser**; see the SESSION_LOG entry for exactly what is unseen.

**Active queue:**

1. **Lens-voice upload edge case — ACTIVE, approach to be agreed before code.** A writer pasting real published prose by one of the 36 lens voices (actual Carver, actual Hemingway) currently gets a reading of it as if it were their own work — and a lens can end up reading its own author's prose back to them. That is a trust and credibility risk, not a curiosity. Was deferred as "worth building once detection exists and is stable" (`DraftAndLens_Internal_Research_Notes.md`); detection is now stable, so it is live. Proposed approach lives in `SESSION_LOG.md` — **Nenad approves the approach before any code is written.**
2. **Cross-submission pattern recognition (Depth spec, Part 1 Gap 2)** — needs a `writer_patterns` migration Nenad applies by hand. Design note in `SESSION_LOG.md`, decisions still open.
3. **New UI design exploration (Noel-driven)** — see the backlog file.

Don't reorder without Nenad's explicit instruction.

## Periodic audit — it has a clock now (2026-08-21)

`AUDIT_CHECKLIST.md` runs on **two** triggers, either sufficient: before any major new feature, **and every 2–3 weeks regardless of what is being built**. A feature-gated audit only ever ran when someone was already about to build; quiet weeks accrue drift nothing looks at.

Every run is recorded in the checklist's own run log. **If the last recorded run is more than three weeks old, run it before anything else that session.** Last run: 2026-08-18.

## Standing evaluation rule — apply at the right moment, not on a timer

Before marking any feature complete, and whenever a natural pause occurs in build work (end of a spec phase, before starting UI work, before a launch decision), ask:

1. **Is this the best it can be?** Would a serious editor or mentor find it genuinely useful, or merely functional?
2. **Is anything missing that would make it substantially more valuable?** Not nice-to-haves — things whose absence means the feature doesn't fully deliver on its promise.
3. **Is anything excessive?** Does anything clutter or undermine the core experience?
4. **Does it hold up against the product's own standard?** "A reading, not a rewrite." No-rewrite stance under pressure. Editor voice throughout. Tradition-first.

This is not a checklist to run mechanically. It's a standing instinct to apply when the moment is right. Record any findings in this file or in DraftAndLens_Internal_Research_Notes.md — not in chat.
