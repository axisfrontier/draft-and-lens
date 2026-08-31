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

**Active queue (trimmed 2026-08-24 — two entries were stale, see below):**

1. **New UI design exploration (Noel-driven)** — see `DraftAndLens_UIExploration_Backlog.md`. The only item in this queue that has not been built.

Don't reorder without Nenad's explicit instruction.

**Removed from this queue on 2026-08-24, both shipped and verified in source and on the live site:**

- *Lens-voice upload edge case.* Built. `src/ai/lens-authorship.ts`, the provenance gate (`provenanceHold`, `page.tsx`), and all 35 `LENS_SELF_RECOGNITION` lines are in production. The build-order paragraph directly above this queue already recorded it as Mentor Completeness stage 1; the queue entry had simply never been struck. **Its 35 self-recognition lines are unapproved copy that is already live** — that part is still open, and it is a copy approval, not a build item. Inventory in `SESSION_LOG.md`.
- *Cross-submission pattern recognition (Depth spec, Part 1 Gap 2).* Built. The `writer_patterns` migration is applied and the table is live, `PATTERN_COPY` was approved 2026-08-21, and the callout renders in `ReportView`. `writer_patterns` is also in `exportUserData` now, contrary to an older `SESSION_LOG` note.

## The reading's voice changed on 2026-09-01 — know this before touching any prompt

**Every reading now addresses the writer as "you", and every note is capped at
120 words.** `HOW THESE NOTES ARE WRITTEN` in `src/prompts/analyst.ts` governs
all of it. This is not interrogate-scoped: ordinary readings changed too, and
Nenad approved that scope explicitly on a reviewed sample.

Three older rules were amended to stop mandating multi-part notes —
`ACKNOWLEDGE DUAL READINGS` (now a check, not a defence-then-prosecution
structure), `TEACH THE MOVE` (taster capped) and `NAME THE MECHANISM, THEN THE
REACH` (both halves, one short note). **They were amended, not weakened. Do not
restore the old sequencing to "fix" a note that reads thin — check the 120-word
ceiling first.**

Measured on one story, same diagnostic and lens: 3,314 → 2,439 words, "you"
3 → 17, longest note 201 → 157. The ceiling was overshot once; it is countable
and tunable.

**The phrasing in `tests/prompts/interrogate-directive.test.ts` is pinned on
purpose.** Four tests failed during this work because sentences had been
reworded for style; those exact sentences are what closed the 2026-08-28 quoting
leak. If a test like that fails, restore the wording — do not move the test.

## Two things that were silently broken and are now fixed (2026-09-01)

Both were live on ordinary readings, neither was caused by Interrogate, and
neither was visible without running the real pipeline and inspecting output.

1. **The verdict was dropped from every reading.** `extractVerdict` capped the
   detail at 400 characters; real verdict paragraphs run 839–911. The sidebar's
   permanent "Verdict" link scrolled to an empty div. Fixed in `f4443f0`; the
   parser now accepts bare, bolded and `##` forms and `parseReport` keeps the
   verdict out of the section list. **That tolerance is a deliberate safety net
   — do not "simplify" it away**, even though the prompts now ask for the bold
   form (`634a61c`).
2. **Two paths cut a submission with nothing saying so** — Brain 1 between 3,000
   and 6,000 characters, and `/api/lens` above 12,000. Both now use
   `src/ai/read-window.ts`: text is whole, or it is declared cut. **Each caller
   passes its own window; the shared thing is the shape, not the number.**

**Open, not urgent, Nenad's call:** `/api/lens` has no word cap, so it truncates
where `/analyse` and `/converse` refuse. Logged as a product inconsistency.
Leave it alone until he rules.

## Two live states a session must know before touching either (2026-08-24)

### 1. Interrogate mode — UI complete and live, analysis gated. DO NOT FLIP THE FLAG.

The UI is built, deployed and verified on production: the "How should I read it?" sub-label row inside step 2, READ IT / PUSH HARDER, READ IT pre-selected. It is approved copy in an approved placement.

**The analytical content is NOT built and must not appear to be.** Two of the four approved strings — the helper line under the pills, and "This is a Push harder reading." at the top of the report — are gated behind `INTERROGATE_ANALYSIS_LIVE` in `src/lib/interrogate.ts`, currently `false`.

**Do not flip that flag.** Not to make the UI look finished, not to demo it, not because the strings are already written. It stays `false` until **§21c best-in-class research is done AND the analyst genuinely runs the interrogated read**. Flipping it early puts the product in breach of its own Architecture v6 law — *Mentoring and interrogation are never faked*: a reading that was not interrogated must never tell a writer that it was. A test in `tests/lib/interrogate.test.ts` fails if the flag is flipped, deliberately, so that whoever flips it has to read why it was shut.

**Interrogate is still NOT in the active queue and is not next by default.**

**Status as of 2026-09-01.** §21c research is done and the analyst genuinely runs
the interrogated read — the two conditions above are met in code. Three guards
were added on 2026-08-28 and verified on a second reading; the directive was
tightened and the reading's register reformed on 2026-09-01, both reviewed by
Nenad on real output. **The flag is still `false` and stays that way.** He has
said twice, in the clearest terms, that flipping it is his decision to make
separately and is not part of any task handed over. `tests/lib/interrogate.test.ts`
still fails if it is flipped. Do not flip it. Do not propose flipping it as a
next step.

### 2. Lens self-recognition lines — rewrites proposed, NOT approved, NOT deployed

All 35 lines are live and unapproved. A review on 2026-08-24 found the problem is structural rather than per-line: **17 of the 35 close on the identical phrase "Show me yours."**, so a writer trying several lenses in one session meets the same sign-off from several supposedly distinct minds — which contradicts the claim `/about` makes for them.

**21 rewrites are proposed in `SESSION_LOG.md`** (the 17, plus four flagged lines whose closing was the problem). Acknowledgement halves untouched; only the closings change.

**Nothing has been changed in the codebase. Nenad approves before any of it is written or deployed.**

## Periodic audit — it has a clock now (2026-08-21)

`AUDIT_CHECKLIST.md` runs on **two** triggers, either sufficient: before any major new feature, **and every 2–3 weeks regardless of what is being built**. A feature-gated audit only ever ran when someone was already about to build; quiet weeks accrue drift nothing looks at.

Every run is recorded in the checklist's own run log. **If the last recorded run is more than three weeks old, run it before anything else that session.** Last run: 2026-08-22.

## Standing evaluation rule — apply at the right moment, not on a timer

Before marking any feature complete, and whenever a natural pause occurs in build work (end of a spec phase, before starting UI work, before a launch decision), ask:

1. **Is this the best it can be?** Would a serious editor or mentor find it genuinely useful, or merely functional?
2. **Is anything missing that would make it substantially more valuable?** Not nice-to-haves — things whose absence means the feature doesn't fully deliver on its promise.
3. **Is anything excessive?** Does anything clutter or undermine the core experience?
4. **Does it hold up against the product's own standard?** "A reading, not a rewrite." No-rewrite stance under pressure. Editor voice throughout. Tradition-first.

This is not a checklist to run mechanically. It's a standing instinct to apply when the moment is right. Record any findings in this file or in DraftAndLens_Internal_Research_Notes.md — not in chat.
