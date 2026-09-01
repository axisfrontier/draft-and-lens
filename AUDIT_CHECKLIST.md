# Draft & Lens — Periodic Audit Checklist

**Time budget: 15–30 minutes.** If it takes longer, something on it is too broad and should be cut or split — a checklist that gets skipped because it is daunting protects nothing.

**Two triggers, either one is enough: before starting any major new feature, OR every 2–3 weeks regardless of what is being built** (the second added 2026-08-21 — a feature-gated audit only runs when someone is about to build, so quiet weeks of small fixes accrue drift nothing looks at). Not on a session count. The point is to enter a build with a clean floor, and a feature boundary is the moment when stale assumptions are most likely to be inherited into new code. (Every finding in the worked examples below was discovered *during* a build, when it was expensive; each would have been cheap to catch at this checkpoint.)

**Where this lives:** its own file rather than inside `CLAUDE.md`. `CLAUDE.md` is loaded into every session and should stay short enough to be read every time; a checklist is consulted deliberately, at a known moment. `CLAUDE.md` links to it.

---

## 1 — Dead code (5 min)

Code that cannot execute is worse than unused code: it reads as covered ground and is maintained as if it runs.

- [ ] **Gate vs cap contradictions.** Any threshold that gates a code path — does another limit make it unreachable?
      `grep -rn "MIN_\|_CAP\|_LIMIT\|>= *[0-9]\{3,\}" src/ --include="*.ts" | grep -v test`
      Then check each gate against every cap that could prevent reaching it.
- [ ] **Brains and stages that never appear in telemetry.** If `submission_telemetry` has no rows for a stage across recent runs, either it never fires or it is not instrumented — both need explaining.
- [ ] **Feature flags and env switches** still referenced but always one value in practice.

> **Worked example (2026-08-17):** `TESTER_WORD_CAP = 4000` rejects any submission above 4,000 words, but `structuralReader`, `narratorVerifier` and `narratorCorrector` are gated at `STRUCTURAL_READER_MIN_WORDS = 5000`. Three brains — one of them the only Opus-tier call besides the analyst — could never execute. Confirmed by their total absence from 40 telemetry runs. Nothing in the code looked wrong; the contradiction was only visible when the two constants were read together.

## 2 — Duplicated logic patterns (10 min)

Not duplicated *text* — duplicated *reasoning*. The dangerous kind is a subtle mistake copied to several places, where fixing one instance feels like fixing the bug.

- [ ] **Supabase writes that return `!error` without checking rows changed.**
      `grep -rn "return !error" src/lib/`
      An update matching zero rows succeeds with no error. If the boolean means "it worked" to a caller, it must `.select()` and check length.
- [ ] **`window.close()` without a fallback.** Browsers ignore it for tabs the user opened; a bare call is a dead control.
      `grep -rn "window.close()" src/`
- [ ] **The same guard written twice.** When a rule appears in two files, ask which is authoritative — and whether both are still enforced.
- [ ] **New helper duplicating an existing one.** Before adding to `src/lib/`, scan the directory listing; it is short enough to read in full.

> **Worked examples (2026-08-17):** the `return !error` pattern appeared in `attachReading`, and the same shape was found in three further functions in `readings.ts`. Separately, seven pages each had a `window.close()` "Close" control that could not work when the page was opened directly — one bug in seven places, fixed once as `closeOrGoBack()`.

## 3 — Unused exports (3 min)

- [ ] For each `export` in `src/lib/` and `src/ai/`, confirm at least one non-test caller:
      `for s in $(grep -rhoE "^export (async )?function [a-zA-Z0-9_]+" src/lib src/ai | awk '{print $NF}' | sort -u); do def=$(grep -rl "export \(async \)\?function $s\b" src | head -1); n=$(grep -rn "\b$s\b" src --include="*.ts" --include="*.tsx" | grep -v "^$def:" | wc -l | tr -d ' '); [ "$n" = "0" ] && echo "UNUSED? $s"; done`
      (Rewritten 2026-08-22: the previous version excluded whole FILES rather than the defining file's own lines, so it returned 15 candidates for 6 real ones. Check each hit by hand anyway — a function used only by tests is a separate finding, not the same one.)
- [ ] An export used *only* by tests is either dead, or a sign the test is testing an internal it should not reach.

## 4 — Stale documentation contradicting behaviour (10 min)

The most expensive category, because docs are trusted and code is checked.

- [ ] **Every number stated in a doc, verified against code.** Counts, thresholds, tiers, limits.
- [ ] **Every filename referenced in `CLAUDE.md`, confirmed to exist on disk.**
- [ ] **Version numbers agree** between a document's filename, its own header, and anything that references it.
- [ ] **Rules stated in prose vs rules enforced in prompts.** Where a corpus or design doc states a principle, confirm the prompt actually contains it — and the reverse, that prompt rules with real editorial weight are written down somewhere durable.
- [ ] **Status claims.** Anything marked done in a checklist or log — spot-check two at random against the repo.

> **Worked examples (2026-08-17):** `CLAUDE.md` gave the sidebar link count as 25 while the ledger design and a standing ruling said 26 — one of them wrong, neither trustworthy until counted. `CLAUDE.md` referenced `DraftAndLens_LearnedCorpus_v2.7.md`, which does not exist; the file on disk is `_v2.9.md` and its own header says `Version 2.11`. And the corpus's "teaching the move" rule was scoped to notes naming a *problem*, while the product had implemented the strengths half months earlier — the doc stated half a rule.

## 5 — Test hygiene (2 min)

- [ ] **Any test that has been failing for more than one session.** Either fix it or delete it — a permanently red test trains everyone to ignore the suite.
- [ ] **Tautological assertions.** Grep for `|| true`, `=== false || `, `expect(true)`.

> **Worked example (2026-08-17):** an assertion written as `(await attachReading(...)) === false || true` could not fail. Removing the tautology immediately exposed a real bug — `attachReading` returned `true` after attaching nothing. Separately, `client-ip-guard.test.ts` asserted 27 lens voices against an actual 35 and had been failing for the whole session.

---

## Recording the outcome

Append findings to `SESSION_LOG.md` under the date, split into:

- **Fixed now** — mechanical, obvious, low-risk.
- **Flagged** — needs a product decision. Record *why* it is a decision rather than a fix, or the next session will treat it as a fix and guess.

An audit that finds nothing is a valid result and worth recording as such — but check the checklist itself is still pointed at where the code has actually moved.

---

## Run log

Append a line every time this checklist is run, whatever it found. The gap between dates is the thing worth seeing — a checklist with no record of being run is indistinguishable from one nobody uses.

| Date | Trigger | Outcome |
|---|---|---|
| 2026-08-18 | first run, before the detection build | Real defects on its first outing: two dead brain modules never executed, `detachReading`/`listLocks`/`traceMark` dead, corpus filename lagging its content. |
| 2026-08-22 | feature boundary — large day of shipping (goals, panel rebuild, bible move, frame work) | 9 findings, **all 9 actioned same day** in 7 verified commits. 3 dead-code items from 18 Aug finally deleted; 3 more dead modules found and deleted incl. `runLens`/`runConversation`, which the routes bypass entirely; partial-read handling removed as unreachable (Nenad's ruling, cap stays 4,000); skeleton caught up with the prompt; nested CLAUDE.md corrected; IP-guard tautology replaced with a visible skip. Dead-brains finding from 17 Aug confirmed RESOLVED. Live smoke test after the payload change: reading completed, no `coverage` key stored. |
| 2026-09-01 | feature boundary — the merge (Push Harder into every reading), brought forward from the 12 Sept clock check at Nenad's instruction | 8 findings. **4 fixed same day** (`4b17edb`, plus the merge commit): `/analysis/[id]` was a LIVE Stage 0 scaffold rendering "Analysis {id} — Stage 4." in raw developer text — unreachable by link, routable by URL, a flat editor's-voice breach — deleted; `reportSkeletonSections` listed `'What To Revise'` in all three lists while `parseReport` lifts it, so the placeholder could never fill (same drift as 2026-08-22's `Where To Grow Next`, opposite direction); four exports narrowed to their own files; `stripe/tiers.ts` lost `interrogate: true`. **3 flagged for Nenad** (`reconciled_reason` write-only, `tiers.ts` having zero consumers at all, the stale pre-launch legal TODO). **1 self-resolving**: `lib/interrogate.ts`'s header claimed the depth was "NOT SENT TO THE SERVER YET" and that nothing reached the analyst — false since the §21b wiring — and the file was replaced by the merge. Baseline before and after: tsc clean, 356/356 green, IP grep exit 1. |

### Deferrals — decisions NOT to run, and why

These are deliberately kept out of the table above. **A deferral is not a run
and does not reset the clock**: the three-week trigger still counts from the
last dated row in the run log, never from a line here. Recording them anyway,
because a trigger that fires and is waved through without a record is
indistinguishable from a trigger nobody noticed.

- **2026-08-24 — trigger 1 (before a major new feature: Interrogate mode) —
  DEFERRED by Nenad.** Everything that has landed since the 2026-08-22 run is
  writer-facing copy: `adb7e8a`, `0ae8d27`, `86ce39e`, `57e5936`, `0d1a112`,
  `9f358c9`, `b02414d` — seven commits, all single words or single sentences,
  no logic, no new modules, no schema. `tsc` clean and 239/239 tests green
  throughout, and the IP bundle grep returned exit 1 on each build. There is no
  new surface for the checklist to find drift in.
  **Standing on this deferral:** it covers this feature boundary only. When
  Interrogate is actually built — and especially once §21c best-in-class
  research lands and brings real code with it — trigger 1 fires again and is
  not covered by this line. Next clock check is due 2026-09-12 (three weeks
  from 2026-08-22) regardless.
