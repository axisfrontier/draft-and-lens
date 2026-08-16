# SESSION_LOG.md — Draft & Lens

Append-only log of decisions made in any session (Claude Code or relayed from a claude.ai chat) that will matter to a future session. Write the entry the moment the decision is made — don't reconstruct from memory afterward. See CLAUDE.md → Session Discipline.

Format per entry: date, source (Claude Code session / relayed from claude.ai chat), the decision, and why.

---

## Pending Decisions

- **Continuity ledger (item 1): design at v1.3, REVIEWED AND CLEARED TO BUILD, 2026-08-15.** Supersedes the previous "AWAITING FINAL REVIEW — do not start building" entry. All eight §11 questions answered by Nenad; answers recorded verbatim in the design doc's §11 and reflected in §2, §5.1, §6, §7, §10, §12. Build order is phase 1 (manuscript grouping — a prerequisite, not a sub-task, per §0.1) then phase 2 (extraction + ledger view at its own route + locks). **Two things still open and both block phase 3 only, not phase 2:** sub-question 1a (what to assume about a frame that has not yet been inferred) and the sidebar-count conflict below.
- **Sidebar link count: `CLAUDE.md` says 25 max, ledger design + ruling 6 say 26. Unresolved.** `draft-and-lens/CLAUDE.md` states 13 constant links + Analysis variable to 12 = 25 overall maximum. The ledger design has said 26 since v1.2 and Nenad's ruling 6 confirmed "26, plus Continuity when present." One of the two is wrong; neither should be trusted until counted against the rendered sidebar. Not urgent — phase 2 adds no report section — but **reconcile before phase 3.**
- **Two findings from Nenad reviewing the live report page, 2026-08-12 — QUEUED, lower priority than `spelling.ts` and the ledger §11 review. Do not start until both of those are done.**

### Item A — "Notes on the text" label without direction — FIX WRITTEN 2026-08-12, NOT YET VERIFIED OR COMMITTED
**Finding:** annotations name a technique but stop there — e.g. *"Mangled weather, bluff and blustery, yawned overhead like a sea without a shore"* gets flagged **lyrical** and nothing more.
**Ruling (Nenad):** every note must do **diagnosis + direction**, not labelling alone.

**CORRECTION to the earlier entry in this log:** it claimed the annotation prompt lived in `src/prompts/diagnostic.ts` "confirmed via grep." That was wrong — a false lead. `diagnostic.ts` is Brain 1 and the `lyrical` match there is an example in its **register** list (the tonal register of the whole piece), not the label attached to a line. Recording the error because the grep looked like confirmation and wasn't.

**How annotations actually work — worth knowing before touching this area again:**
The notes are **not separately generated**. Brain 2 (the analyst) writes its report in prose and wraps verbatim quotes in `⟦…⟧`; `extractAnchors` in `src/lib/anchor.ts` then scrapes *the sentence surrounding each bracketed quote* and presents that as the margin note. So note quality is entirely a function of how the analyst phrases the sentence it puts the quote in — there is no separate "annotation prompt" to edit.
`ANCHOR_DIRECTIVE` (`src/prompts/fragments/anchor-directive.ts`) is **mechanics only** — how to bracket, nothing about note content.
`anchor.ts:86` already drops an anchor when fewer than 12 characters remain after removing the quote ("no note is better than a fake note") — a crude floor that Nenad's example clears while still being useless.

**Root cause:** the analyst prompt already has `TEACH THE MOVE, NEVER FIX THE WORK`, which demands exactly diagnosis + direction — but it is scoped to *"MANDATORY FOR LINE-LEVEL CRAFT NOTES… where a note names a line-level craft **problem**."* Nothing governed notes that name a technique or a **strength**, so those labelled and stopped. Nenad's example is a strength note, falling straight through the gap.

**Fix written:** new rule `NAME THE MECHANISM, THEN THE REACH` added to `src/prompts/analyst.ts`, placed directly after `TEACH THE MOVE` as its deliberate counterpart (that one governs problems, this governs strengths). Requires (1) MECHANISM — what specifically makes it work, not the adjective, with craft terms glossed per Principle 27; (2) REACH — another moment in the piece where the same instrument is already live, or one where its absence is felt and the move is available. Uses Nenad's own weather line as the wrong/right example. Includes an explicit guard against manufacturing reach where none exists, and against inventing strengths to have something to praise — the same false-positive discipline as the continuity ledger.

**Token-budget check (per the standing rule on analyst prompt changes):** `adaptiveAnalystConfig` in `src/ai/config.ts` sets `maxTokens: 16000` at **every** tier, matching the documented target — no cap change needed. **But this change makes each note longer, which is exactly the truncation risk that rule exists for.** After deploying, verify all 13 sections still render and the sidebar still shows its full link count. If sections start dropping, the cap — not the rule — is what needs revisiting.

**Status: UNVERIFIED, UNCOMMITTED.** `tsc` refused repeatedly by the classifier outage. It is a string-only change to a prompt constant, so type risk is near zero, but it has not been checked and no reading has been run against it.

### Item B — investigated 2026-08-12, BLOCKED ON NENAD, no code changed
**Located:** the title block is `src/components/analysis/ReportView.tsx:391–471` (`id="sec-title"`).
- **Above the title** (line 399): `traditionLine` — `[diagnostic.tradition, diagnostic.register].join(' · ')`, uppercase mono. Metadata.
- **Below the title** (line 434): `diagnostic.summary` — Brain 1's "one-sentence summary of what the work is about", prose with a left rule.

**Key finding: the two are ALREADY functionally distinct in the code** — exactly the metadata-vs-plain-summary split Nenad proposed as the fix. So the observed duplication is not structural and must not be "fixed" by restructuring the layout.

**HYPOTHESIS OF "CONTENT COLLAPSE" WAS WRONG — recorded so nobody re-runs it.** I predicted Brain 1 was writing a `summary` that restated tradition/register. Nenad supplied the two real strings and they share no content at all: the top line is craft classification, the bottom is plot. The summary was fine.

**ACTUAL CAUSE — field length, not content overlap.** Brain 1 returned whole paragraphs in `tradition` and `register`. Real example:
`tradition` = *"Magical realism / literary fabulism — a contemporary fable set within a circus world, with secondary markers of near-future speculative fiction (the 2032 London setting, 'life-extended geriatric', 'destitute-inspired fashion') functioning as atmospheric texture rather than world-building premise."*
`register` = *"Lyrical and warmly oblique — elevated in its descriptive passages, gently comic in dialogue, humane in its narrative gaze."*
`traditionLine` joins those two and renders them uppercase mono at `.72rem` with `.22em` letter-spacing — styling built for something like `MAGICAL REALISM · LYRICAL AND WARMLY OBLIQUE`. The result is an essay in wide-tracked capitals above the title. It reads as duplicative because both it and the summary are large blocks of descriptive prose bracketing the title, not because they say the same thing.

**Fix applied to `src/prompts/diagnostic.ts` (`PASS1_BASE`):** hard six-word limits on `tradition` and `register`, with all qualification, secondary markers and evidence pushed to `formNotes`. This was already the design intent — the prompt said *"if it blends two, name the dominant one and note the second in formNotes"* — but nothing enforced brevity, so the model ignored it.
**Costs the analyst nothing:** `formNotes` is passed to Brain 2 in full (`analyst.ts:185`), so the nuance still reaches the reading. It also improves the ScoresDashboard alignment caption, which interpolates `tradition` into the sentence "how each element is serving …" — currently absurd with a paragraph in it.
**Deliberately NOT done:** no layout change (the two elements are correctly distinct already), and no render-side length cap. A defensive cap on `traditionLine` is a reasonable follow-up if the model still over-runs, but it would mask a prompt-compliance problem rather than fix it, and it needs visual verification. Nenad's call.
**Status: COMMITTED `58fb0bc`, DEPLOYED, VERIFIED LIVE 2026-08-13.** The tradition banner now reads *"Reading this as near-future literary magical realism — warm, oblique, quietly fantastical"* — a short label, no paragraph in tracked capitals. The ScoresDashboard alignment caption also reads correctly again ("how each element is serving this work's tradition"), confirming the knock-on fix.

### Spell-check UX — WRITTEN 2026-08-13, UNVERIFIED, UNCOMMITTED
Nenad's ruling: inline highlighting in the text itself, hover popup with the suggestion, click accepts, hover-out dismisses with a small delay. He explicitly asked that the `⟦…⟧` anchor collision be solved rather than dodged by putting results elsewhere.

**The anchor collision is solved, and it was never the hard part.** `segments` from `resolveAnchors` carry no absolute offsets, but they concatenate to the submitted text, so offsets recover by accumulation; `findMisspellings` already reports absolute indices. `mergeRuns` splits at every boundary from both systems, producing runs that belong to at most one anchor and at most one flag. Overlap in any combination — misspelling inside a quote, outside one, or straddling its edge — falls out naturally. A flag split across a segment boundary yields two runs sharing a `flagIndex`; only the first carries `flagStart`, so accepting substitutes the correction once instead of duplicating it.

**The real conflict was click-to-replace, and it was a product-shape problem, not a rendering one.** D&L does not hold the manuscript. Mutating the displayed text would desync from `source_text` in Supabase (which revision-matching diffs against), invalidate the reading generated from the original, and shift every character offset after it — breaking anchor positions in the same view. Agreed resolution: accepting a correction updates the view only, accumulating into a running set; the writer then copies a corrected copy back to their own draft. Stored text is never touched.

**Files:** new `src/components/analysis/SpellingMark.tsx` (highlight + hover popup); `AnchoredView.tsx` gains `mergeRuns`, `applyCorrections`, accepted-set state, and the export row.

**Colour decision, flagged deliberately:** this uses `--error` (red) where the product otherwise avoids it. Narrow and intentional — Tradition Alignment avoids red because craft is not right-or-wrong, whereas a misspelling *is* wrong by construction (every entry in MISSPELLINGS is a non-word). The three ambers in this view are already taken by anchor spans, glossary terms and the active note; a fourth would be illegible. Accepted corrections turn green. **If Nenad dislikes red here, it is one constant in `SpellingMark.tsx`.**

**Hover-dismiss:** ~260ms grace on mouse-out and the popup keeps its own hover alive, so the cursor can travel from word to popup without it vanishing — the standard pattern, and why no manual close button is needed. Focus/blur and Enter/Space/Escape mirror it for keyboard.

**Status: UNVERIFIED, UNCOMMITTED** — `tsc`/build refused repeatedly by the classifier outage. Render change; needs a real reading with a typo in it to confirm the highlight lands on the right word, the popup is reachable, and an accepted correction substitutes exactly once.

### Streaming-view fixes (ReportSkeleton) — WRITTEN 2026-08-13, UNVERIFIED, UNCOMMITTED
Nenad reported two distinct streaming symptoms: permanent grey placeholders that never fill, and content that renders → disappears → renders again. Two separate causes, both in `ReportSkeleton.tsx`, both fixed together.

**Cause 1 — phantom placeholders (documented, pre-existing since 2026-07-25).**
`reportSkeletonSections.ts` lists **every** heading a mode can produce (13 for story), because it cannot know in advance which the model will earn. Evidence-gating (Principle 26) means a short piece earns ~6, so the other ~7 sit blank for the whole run and then vanish when `ReportView` mounts. That file's own header documents this as expected. **Important for the open revert question: this predates the annotation fix (`3e594f7`) by three weeks — the visible gaps are NOT caused by that change.**
*Fix:* sections stream in document order, so once a later heading arrives, an earlier missing one is provably skipped. Drop its placeholder at that point. Applied to the derivation, not the render sites, so the skeleton's sidebar and body cannot disagree — the invariant CLAUDE.md now names.

**Cause 2 — flicker (new finding, root cause identified).**
`findBody` re-parsed the **entire partial buffer** on every stream delta and matched headings by exact string equality. Two failure modes:
(a) a heading arriving character-by-character momentarily equals a shorter heading — `## THEME` before `## THEMATIC …` — so a body renders under the wrong heading and then disappears;
(b) `parseReport`'s `place()` routes on heading **content**, so `## WHAT` falls into `sections[]` and renders as a numbered section, then jumps out into the WHAT TO REVISE callout once the heading completes — taking its number with it and reshuffling every section after it.
*Fix:* parse only up to the last completed section (`lastIndexOf('\n## ')`). A heading is only trustworthy once the next `## ` exists. The in-flight tail stays a placeholder a moment longer, which is what a placeholder is for.

**Confirmed safe for the finished report:** `ReportView` re-parses the complete text independently and shares none of this code path. These changes cannot alter a completed reading — only the streaming view.

**Status: UNVERIFIED, UNCOMMITTED** — `tsc`/build refused by the classifier outage. Render change, so it needs a real streaming run to confirm: watch that sections fill monotonically, nothing flickers out, and no blank placeholder survives past a later section filling.

### Tradition Alignment improvements — WRITTEN 2026-08-13, UNVERIFIED, UNCOMMITTED
Nenad's request: (a) underline the six dimension labels with plain-language rollover glosses, using the same mechanism as Notes-on-text per Principle 27; (b) add a small coloured status dot left of each right-hand assessment label — green for landing well, amber for developing, explicitly **no red** because this is a read, not a mark scheme.

**Both done in `src/components/analysis/ScoresDashboard.tsx`.**

**Design decision — glosses defined locally, NOT added to `GLOSSARY`.** `glossary-data.ts` is the *detection set*: its own header says "adding a term here makes it legible everywhere in a reading", i.e. every occurrence gets auto-underlined throughout report prose. Of the six dimensions only `register` and `voice` already exist there; adding `form` in particular would litter every ordinary use of that very common word. `TermTooltip` takes `term` and `gloss` as props, so passing them directly gives an identical reader experience with no change to global detection. Glosses are written to say what **that row assesses**, not what the craft term means in the abstract — the reader's question at that table is "what is being judged?".

**Judgement call flagged — two colours, five labels.** `scoreLabel` returns five values (Fully earned / Landing well / Developing / Needs attention / Not yet landing), but the request described two states. Split at score ≥ 7: the two positive labels green, the three below amber. No red at any level. If Nenad wants a third tier, the split lives in one function (`statusColour`).

**Accessibility:** the dot carries `aria-hidden="true"` — the adjacent text already states the status, so the dot is decorative reinforcement rather than a second wordless signal read out to screen readers.

**Status: UNVERIFIED, UNCOMMITTED** — `tsc`/build refused repeatedly by the classifier outage. This is a **render change**, so unlike the prompt edits it genuinely needs visual confirmation: check the dots align with the text baseline, the tooltip on the first row is not clipped by the caption above it, and the amber dashed underline reads correctly against the uppercase mono labels.

### Item A — VERIFIED LIVE 2026-08-13 (commit `3e594f7`)
The `NAME THE MECHANISM, THEN THE REACH` rule is working in production. On the very line Nenad originally flagged, the reading now returns: *"The mechanism, 'yawned' gives the sky appetite… 'without a shore' refuses the reader a horizon, which is exactly right for a story about a young woman with nowhere to go."* Mechanism, not label. Elsewhere: *"specific nouns, an image that adds atmosphere the words alone can't carry."*

### Truncation risk from Item A — INVESTIGATED, NOT A REGRESSION
The standing rule on analyst prompt changes required checking that longer notes don't push the report past `maxTokens: 16000` and silently drop sections. On the first verification run, IMAGERY / THEME / THE ENDING appeared as empty skeleton placeholders and the analysis took longer than usual — which looked exactly like truncation. **It was not.** Nenad reloaded the finished report and all sections were populated. Cause was render-during-stream: sections render as skeletons until their text arrives, and the longer notes simply widened that window. No content lost, no cap change needed.
*Worth knowing for next time:* a partially-streamed report and a truncated one look identical mid-flight. The distinguishing test is to reload the **finished** report — if sections are still empty, it is truncation; if they populate, it was streaming.

### Superseded original note — duplicate copy above/below the story title
**Finding:** on the report page, two pieces of copy sit above and below the title (example title: "A fine breakfast.") and appear to do the same job rather than distinct ones.
**Ruling:** review both; either merge them, or make each clearly distinct in function (e.g. one is genre/tradition metadata, the other a plain reader-facing summary) — not both doing the same thing.
**Not yet located precisely** — same `ReportView.tsx` area as item A almost certainly, but the exact two elements haven't been identified. Needs a proper read of the component, not just a grep hit.

**Rulings on the continuity ledger, 2026-08-10 (Nenad):**
1. **v1 scope narrowed** to names, physical descriptions, stated ages/dates, explicit relationships. Timeline and geography deferred until this is proven low-noise. Design line that keeps stated dates in while keeping timeline out: *compare assertions, never compute chronology.*
2. **Contradictions get their own dedicated report section, severity-tiered** (hard contradiction vs. worth checking) — not inline flags. Section appears only when populated, per Principle 26.
3. **Approach validated against the market.** Extract facts → store persistently → flag rather than infer intent matches Bunsho, EPOS-AI and Novarrium. Direction confirmed; not a reason to copy further.
4. **Locked facts adopted** (Novarrium's term): the writer marks certain facts permanently invariant, flagged in their own tier above the severity ladder. Design splits these into **rule locks** (chronology-free, genuinely unambiguous) and **state locks** (a character's death — depends on the chronology reasoning ruling 1 deferred, so it demotes to worth-checking unless the manuscript is declared linear). *Worth carrying forward: the most intuitive lock a writer will reach for is the one current scope handles least confidently. Argues for promoting timeline in v2 — open question 7.*
5. **Detection, not prevention — stated as a boundary.** D&L's ledger reads already-written text; most competitors' equivalents feed a generating model. Opposite obligations: prevention optimises recall and resolves ambiguity, detection needs precision and must surface it. Recorded so generation-side patterns aren't borrowed unexamined. **Hard line: the ledger is never an input to generating or suggesting prose** — that is the ghostwriting D&L exists not to do, and any future proposal to use it that way is a change of product position, not a feature increment.
- **Handover items 3–7 not started.** Item 2 (file upload) is done — see log below. Remaining: spell-check (in scope; grammar-check explicitly NOT), colour/font fix, Visualizer design exploration, surfacing the three differentiators, spidergram collapsible-vs-fix. Full detail in `DraftAndLens_Handover_2026-08-02.md`.
- **Spidergram fix-vs-cut: still undecided**, needs more tester data than Noel alone. Building collapsible is fine either way.
- **Differentiator messaging prominence: start subtle**, flag back before escalating to anything more marketing-like.

### Spell-check (handover item 3) — scope ruled, engine written, NOT verified or committed

**Nenad's scope ruling, 2026-08-10:** flag only high-confidence real misspellings (common English words spelled wrong). Skip anything that could plausibly be an invented name, dialect, or deliberate stylistic choice. **When in doubt, don't flag — false positives are worse than missed errors for this tool.** Writer-marked "known" terms worth including if clean; otherwise ship conservative first.

**Architecture decision that follows from it: a curated known-misspellings list, NOT a dictionary.**
A dictionary flags every word it does *not* contain — in a novel that means every invented name, place and rendering of dialect, i.e. a wall of false positives about the writer's own vocabulary. Inverting it means a word is only flagged when positively identified as wrong, and anything unfamiliar is silently ignored.
*Invariant that makes it safe:* **every key in the list is a non-word in English**, so no valid word can ever be flagged. Anything that is a real word in any register (British, American, archaic, dialect) is excluded by construction — choosing between two real words is grammar, which is out of scope.
*Consequence worth noting:* this largely **obviates the "mark as known" feature** — invented terms are never candidates in the first place, so there is nothing to suppress. Recommend shipping without it and seeing whether anyone asks.

**Written:** `src/lib/spelling.ts` — `findMisspellings(text)`, ~120 curated entries, no IP, no dependency, importable client or server. Two guards: the list itself, and skipping capitalised occurrences that don't open a sentence (so a character named "Wisper" is never corrected to "whisper"). Documents its deliberately-excluded candidates and why (`judgment`/`judgement`, `strait`, `breath`/`breathe`, `agin`, `discreet`/`discrete`, `its`/`it's`).
**Status: UNVERIFIED AND UNCOMMITTED.** `tsc` never ran — Bash was refused throughout. No caller yet; surfacing it in the UI is deliberately a separate chunk, because that touches the report sections and the 26-link sidebar contract and needs render verification.
*A first draft of this file contained three defects, caught on self-review before this note: a stray Cyrillic-character key, an over-engineered dead "placeholder" mechanism, and `agin → again` — dialect, and a direct violation of the module's own invariant. Worth recording as evidence the invariant earns its keep.*

### Scoping findings, 2026-08-10 — handover items 4 and 7

**Item 4 (colour/font contrast) appears ALREADY DONE, undeployed — same pattern as item 2.**
Commit `6fc6850` ("fix(a11y): raise contrast and type scale on dark-surface labels") covers `(app)/page.tsx`, `beta-gate/page.tsx`, `nav/SiteNav.tsx`. The fixes are present in the working tree — `page.tsx` carries the measured comments (`--label-amber` 4.31:1 → `--amber-l` 6.46:1 at line ~320; `--ink-faint` 3.30:1 → `--ink-soft` 6.66:1 on the paper overlay at ~418; the upload-error message raised to `--paper` at ~743). Nav type scale raised from .5–.58rem to .64–.72rem, which was Noel's "too small to read" point.
*Unverified:* whether report-surface components (`ReportView` and children) also need it. They sit on the paper background, so the dark-surface failure mode is less likely, but nobody has measured them.
*Action:* deploy and check with the Chrome extension before treating item 4 as closed. Do not rebuild it.

**Item 7 (spidergram/pacing chart) — components located.**
- **Spidergram** = `RadarChart`, rendered inside `components/analysis/ScoresDashboard.tsx` ("Editorial dashboard → Craft balance"), alongside the tradition-alignment bars.
- **Pacing chart** = `components/analysis/StoryArc.tsx` — Tension/Pace/Emotion over beats. It **already has a toggleable legend**, so there is an established interaction idiom to match rather than invent.
*Design interaction that must be handled, not discovered later:* the sidebar contract is 26 links, of which **Dashboard is 2**. If a section can collapse, a sidebar link pointing into collapsed content scrolls to nothing. Collapse must therefore default to **expanded**, and clicking a sidebar link into a collapsed section must auto-expand it. That makes this slightly more than wrapping a `<details>` around the chart.
*Still not decided, per standing instruction:* fix-vs-cut. Collapsible only.

### Commands blocked by the Bash classifier outage on 2026-08-10 — run when convenient

1. **Deploy — still not fired**, Bash refused on every attempt including with Nenad present and approving. Nothing from 2026-08-10 is live: `origin/main` is at `7d19e8c`. **Found a better path tonight: the hook is already saved on disk**, gitignored, no clipboard needed:
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens" && git log origin/main..HEAD --oneline && curl -sS -X POST "$(cat "draft-and-lens/.deploy-hook")" && echo " === DEPLOY FIRED ==="`
   (`draft-and-lens/.deploy-hook` and `draft-and-lens/.vercel-deploy-hook` hold identical content — same project/token, just an uncleaned duplicate. Either works; Nenad may want to delete the duplicate at some point, not urgent.)
   Original clipboard-based command, now superseded: `cd "/Users/nenadkojic 1/Projects/Draft&Lens" && HOOK="$(pbpaste)" && case "$HOOK" in https://api.vercel.com/v1/integrations/deploy/*) curl -X POST "$HOOK";; *) echo "REFUSING: not a Vercel deploy hook";; esac`
2. **Delete four stray empty files.** All four verified zero-byte individually (`Fetched`, `main`, `next`, `draft-and-lens@0.1.0`) — stray shell redirects, safe to remove:
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens/draft-and-lens" && rm -f Fetched main next "draft-and-lens@0.1.0"`
3. **Stop git paging** (the pager swallowed several sessions' worth of output today):
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens" && git config core.pager cat`
4. **graphify query** for the continuity-ledger architecture — never ran (classifier down). The design was written from direct reads of `readings.ts`, `analyse/route.ts` and the upload path instead, so it is grounded in the actual code, but a graph query may surface call sites those reads missed.
5. ~~Commit the design doc + this log~~ — **DONE**, Bash recovered briefly. Committed and pushed as `7d19e8c` (design v1.2). This log's own later edits are uncommitted again; fold them into the next commit.
6. **Verify and commit the spell-check engine** — written, never type-checked:
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens/draft-and-lens" && npx tsc --noEmit && npm run build && cd "/Users/nenadkojic 1/Projects/Draft&Lens" && git add draft-and-lens/src/lib/spelling.ts SESSION_LOG.md && git commit -m "feat(spelling): conservative known-misspelling detector (no UI yet)" && git push origin main`
7. ~~KEY ROTATION~~ — **DONE, 2026-08-12.** All three rotated by Nenad directly in Vercel/provider dashboards (Claude has no dashboard access) and verified working:
   - ✅ **Anthropic** — rotated, redeployed, verified: a real Analyse run completed and streamed back a full reading.
   - ✅ **Supabase `service_role`** — rotated, redeployed, verified: that reading saved and appeared correctly in "Your work" after refresh.
   - ✅ **Clerk `CLERK_SECRET_KEY`** — rotated, redeployed, verified: explicit sign-out/sign-in cycle succeeded with no issues, confirming the new secret key (not just the publishable key, which was rotated earlier and doesn't exercise this path).
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` also rotated (lower priority — meant to be public).
   - **Old key values reported deleted in all three dashboards** (Nenad's account, not independently verifiable by Claude — no dashboard access). This is the step that actually closes the exposure; rotation alone would have left the old, possibly-compromised keys still able to authenticate.
   - **Net result: the "repo was briefly public, treat all three keys as compromised" item from the pre-paid-launch checklist is resolved.**

**Finding, worth carrying into the launch checklist: the Supabase project was PAUSED (Free tier auto-pause after inactivity) when rotation started tonight.**
Data was intact — Supabase's own pause screen confirms nothing is lost — but this means Supabase calls had likely been silently failing in production for a while before tonight, with no visible symptom, because `readings.ts` is deliberately written so every Supabase call degrades gracefully on failure (falls back to an ordinary fresh reading, nothing stored, no error shown). A user's saved works, revision history, and reading library could have simply stopped saving with nobody noticing — the exact blind spot graceful degradation creates. Resumed manually mid-rotation; confirmed working via the same Analyse-then-check-works-list test. **Action for later:** decide whether Supabase needs to move off Free tier before paid launch, since a paused database in production is a launch-blocking failure mode that produces zero error signal.

---

## Log

### 2026-08-15 — Claude Code session (STATUS NOTE — stopped at usage limit)

**Where this stopped:** cleanly, at a commit boundary. Nothing half-edited, nothing uncommitted except this log entry. Resume by re-reading `DraftAndLens_Handover_2026-08-02.md` and this file, then continuing at "Next" below.

**DONE and deployed earlier in the session** (all pushed; `origin/main` at `31ab45b` when the deploy hook was fired):
- **Analyst self-consistency (bug #14)** — two passes on `src/prompts/analyst.ts` adding `ESTABLISHED CONTEXT JUSTIFIES THE CHOICE`, in the same "MANDATORY BEFORE FAULTING" family as DEVICE vs INSTANCE. Commits `106eafe`, `d66cc20`. All three snippets in `DraftAndLens_Annotation_Test_Set.md` run against the **real** pipeline (Brain 1 + Brain 2, live API, no mocks) — tests 2 and 3 pass; test 1 closed by Nenad's ruling that "cut the redundant intensifier" is a legitimate craft note distinct from the vague-verb pattern the test targets. Logged in the feedback tracker as #14, status Done.
- **Collapsible spidergram + pacing chart (bug #6)** — commit `5a48a1b`. `ScoresDashboard` and `StoryArc` are now native `<details>`, independently toggleable. Tracker marked **In progress, not Done**: collapsing answers the clutter complaint but not the underlying "what do I do with this shape" question.
  - ⚠️ **Supersedes the 2026-08-10 note in this log** (Pending Decisions → item 7 scoping) which said collapse "must therefore default to **expanded**". Nenad chose **collapsed by default** when asked directly. The auto-expand-on-sidebar-click half of that older note was implemented and is correct — a fragment jump only auto-reveals a closed `<details>` when the target is *inside* it, not when the id is *on* it, so the sidebar links carry an explicit `onClick`.
  - Second non-obvious fix worth keeping: `stopPropagation()` does **not** stop `<summary>`'s disclosure toggle — it is a default action on the click, not a bubbled listener. The legend toggles needed `preventDefault()` too.
- **Eyebrow font-swap hypothesis — my DISCONFIRMED verdict was WRONG IN METHOD. Corrected 2026-08-16.**
  The original run measured `getBoundingClientRect()` and computed `fontSize` across the `loading→loaded` transition, found them byte-identical, and concluded "not a FOUT". **Both halves of that were bad.** `next/font`'s metric-matched fallback exists precisely to hold rect and size constant during a swap, so measuring them can only ever return "no change" — it cannot detect a font swap, only a layout shift. And `document.fonts.status === 'loaded'` does not mean the fonts are loaded: it means no load is *currently pending*. On a live page, 71 of 77 app font faces were `unloaded` while status read `loaded`.
  **Actual mechanism, confirmed live 2026-08-16 after Nenad reported a second sighting on body copy:** browsers fetch a font file only when a glyph needs it, so each weight/style variant loads lazily the first time it is used. With `display: 'swap'`, that renders the metric-matched fallback for **144–179ms measured** and then swaps to the real face — visibly different letterforms, zero layout shift. During streaming, new content uses variants for the first time mid-read, which is why it shows up as "text looked wrong then corrected itself" rather than at page load. One root cause, both sightings.
  *Lesson worth keeping: "no reflow" is not "no FOUT". Metric matching is designed to make those two things independent.*

- ~~**Eyebrow font-swap hypothesis — DISCONFIRMED, no code changed.**~~ *(superseded — see above)* Measured directly with `ResizeObserver` + `document.fonts.status` on a repro that mirrors the real title block. Captured the genuine `loading → loaded` transition; rect and computed `fontSize` byte-identical across it (601×38.875px, 12.96px), zero resize events, same for the `<h1>` (601×151.1875px, 72px). `next/font/google`'s metric-matched fallback is doing its job. **Do not re-run this investigation** — it is not a FOUT. If the "briefly looked wrong" symptom recurs, look at pop-in perception or the SSE update path, not fonts.
- **Deploy** — build green, bundle IP-leak guard passed against the fresh `.next/static`, pushed, hook fired, live site verified.
  - Two **pre-existing, unrelated** failures in `tests/prompts/client-ip-guard.test.ts` surfaced and were deliberately not fixed: `cost-log.ts` trips the "UI must not import ai/" rule via a *type-only* import (erased at compile time, no runtime leak — verified by reading it), and the lens-count assertion expects 27 against an actual 35. Both predate tonight. **Test hygiene item, not a leak.**

**DONE this step — continuity ledger unblocked:**
- Design doc updated to **v1.3** (commit `2e7d98c`) recording all eight §11 rulings verbatim plus their design consequences. §5.1 rewritten (frame no longer declared), §2 constrained (single lightweight confirm), §6 sidebar rule, §7 two new risk rows, §10 rephased, §12 turned into a build-status section.

**Next — nothing started, no code written yet:**
1. Migration SQL in `draft-and-lens/supabase/migrations/` — `manuscripts` + `continuity_facts` (incl. `source`, `lock_kind`, `lock_from_sequence` per §5.7), plus nullable `manuscript_id` / `sequence_index` on `readings`. Follow `submission_telemetry.sql`: idempotent, RLS enabled, **write it, do not apply it**.

   **Schema reconnaissance already done — don't re-derive it.** `readings` columns confirmed in use by `src/lib/readings.ts`: `id` (PK, string — used by `pruneVersions` at :252/:258), `user_id`, `work_id`, `work_title`, `work_format`, `source_text`, `reading_json`, `submission_type`, `created_at`, `deleted_at`. Two things this settles for the migration:
   - **`work_id` is NOT a primary key** — it repeats across the ≤5 versions of a work (`MAX_VERSIONS`), so `continuity_facts.reading_id` must FK to `readings.id`, not `work_id`.
   - **`id`'s exact SQL type is still unconfirmed** — it is read as a string in TS, which is consistent with `uuid` (as in `submission_telemetry.sql`) but not proof. **Confirm against the live table before writing the FK**, or write the FK in a follow-up statement so a type mismatch can't fail the whole migration. `MAX_VERSIONS = 5` pruning is also why the ledger needs its own table (§0.2) — facts must outlive the readings they came from, so `reading_id` should be recorded but **must not** cascade-delete facts when a version is pruned.
2. ~~Phase 1 data layer + GDPR cascade~~ — **DONE 2026-08-16.** `src/lib/manuscript-match.ts` (deterministic grouping suggestion, 18 unit tests), `src/lib/manuscripts.ts` (create/list/attach/detach/buildCandidates, verified 19/19 against the live tables), and the §8 cascade across all five user-data functions in `readings.ts` (5 unit tests). Commits `0f8f1f7`, `5f28b11`, `92ff685`.
3. ~~Phase 2: ledger view + locks~~ — **DONE 2026-08-16.** `src/lib/continuity.ts` (23/23 against live tables, incl. 4 cross-user ownership attempts), `/api/ledger` + `/api/ledger/[manuscriptId]`, and the view at `/ledger` + `/ledger/[manuscriptId]` with promote-to-lock, unlock, remove, and add-directly. Commits `08d2aa4`, `5439697`, `2f6c328`. Build green; IP boundary re-checked on the new client surface (all 5 markers absent, bundle guard passing).

**Beta-completion list (Nenad, 2026-08-16, revised same day after the two blockers below were ruled on):**
1. Ledger phase 2 — view + locks. **DONE.**
1b. **Grouping confirm step at upload** (ruling 2) — not new scope, just never wired in. Nenad: "go ahead." **IN PROGRESS.**
2. **Extraction (§9 Stage 1)** — populates the ledger. **IN scope for beta**, added 2026-08-16.
3. **Detection** — the actual contradiction flagging. **IN scope for beta**, added 2026-08-16.
4. Ledger phase 3 — timeline reasoning (ruling 7). Positioned after or alongside extraction, since it operates on extracted facts.
5. Mentor mode — persistent cross-session memory, editor→mentor progression.
6. Differentiator messaging / editor voice — depends on Mentor mode existing, since the line is only true once there is real memory to point at.

**Nenad's ruling on (b), 2026-08-16, worth preserving verbatim in substance:** the ledger ships as the *real* feature for beta. A manual-only ledger "doesn't answer what Noel actually asked for (automatic contradiction flagging) and risks looking finished while not doing the thing that matters." Extraction and detection are therefore beta items, not post-beta.

*Explicitly out of scope: pre-paid-launch checklist (Clerk production, security re-check, GDPR controls, solicitor review, Stripe, stable reading URLs) and the long-form chunking architecture.*

**Follow-up logged, NOT to be fixed unasked:** audit `softDeleteWork`, `restoreWork` and `renameWork` in `readings.ts` for the same `return !error` pattern fixed in `attachReading` — a Supabase update matching zero rows succeeds with no error. Judged **not trivial** despite being a three-line change: adding the row check makes `softDeleteWork` return false when a work is already deleted, which the account page surfaces as an error to the writer. That is arguably more correct but is a user-visible behaviour change and needs its own verification pass.

### TWO BLOCKERS FOR THAT LIST — flagged 2026-08-16, need Nenad's ruling

**(a) No manuscript can be created, so the ledger is unreachable.** Phase 1's data layer is built and verified, but the **grouping step at upload was never wired in** — nothing calls `createManuscript` / `suggestManuscript` / `attachReading`. Ruling 2 specified a "single lightweight confirm/adjust step" at upload; that UI does not exist. Until it does, `/ledger` is permanently empty for a real user and locks have nothing to attach to. This is the smallest change that makes everything already built reachable, but it touches the upload/analyse path — the core working product — so it is not something to alter unasked.

**(b) The list omits extraction and detection entirely.** The beta list goes phase 2 → phase 3 (timeline) → mentor mode, but §10's phases 2 and 4 also include **extraction** (Stage 1, §9 — what populates the ledger) and **detection** (what actually flags contradictions). Without them the ledger displays only what the writer typed by hand, and never reports a contradiction — which was Noel's third want-list item and the whole "why is this better than pasting into Claude" answer. Timeline reasoning (item 2) also operates on extracted facts, so it has little to work on until extraction exists. Either the list is missing two items, or extraction/detection are deliberately post-beta and the ledger ships as a manual character sheet for beta. **That is a product call, not a build detail.**

**Matcher limitation found in live testing, 2026-08-16 — names that only ever open sentences are invisible.**
`extractEntities` skips sentence-initial capitals, which is what stops "The" and "He" being read as characters. The cost is that a name appearing *only* at the start of sentences is never extracted. Demonstrated live: a 109-word passage where Marisol, Dashiell and Ottoline each opened their sentence produced **zero** entities and band `none`; the same three names moved mid-sentence produced band `auto`, score 1.0. In a full chapter most names will appear mid-sentence at least once so this is unlikely to bite, but it means grouping quality depends on sentence construction, and a short or dialogue-light piece can silently fail to match. Worth revisiting if real grouping proves unreliable — a targeted fix would be to accept a sentence-initial capitalised word when the same token also appears mid-sentence elsewhere in the corpus.

**Two findings from phase 1 worth carrying forward:**
- **A Supabase update matching zero rows succeeds with no error.** `attachReading` originally returned `!error` and so reported success after attaching nothing — telling a writer their chapter was grouped when it was not. Both mutators now `.select()` and require a returned row. **Any other `update().eq(...)` in this codebase that returns `!error` has the same latent bug**; `readings.ts`'s `softDeleteWork`, `restoreWork` and `renameWork` all follow that pattern and are worth an audit, though there the predicate is derived from the user's own library so a zero-row match is far less likely.
- **Grouping entities are derived, not cached.** Deliberate: a cached entity set on the manuscript row would go stale on delete/restore/prune, and stale entities produce wrong grouping, which §2 names as the failure that poisons the ledger. If grouping ever gets slow, cache with an explicit invalidation path — don't just denormalise.

**BLOCKED / needs Nenad:**
- ~~**Applying the migration**~~ — **APPLIED AND VERIFIED 2026-08-16** (project `hlbvhjretidvbugyrsrs`). 18/18 functional checks: both tables present, `readings` gained `manuscript_id` + `sequence_index`, all eight check constraints actually reject bad rows (including the §3 "no quote, no extracted fact" invariant), the manuscript→facts FK cascade fires, and `narrative_frame` defaults NULL-as-unknown. Took three attempts; the first two reported success in the SQL editor without creating anything. **Confirmed not a schema-cache lag** — polled 90s. Likeliest cause recorded in the migration file: the Supabase editor runs only *selected* text when a selection exists.
- **`.env.local` was silently broken and is now fixed** (Nenad, 2026-08-15). An unterminated quote on the `NEXT_PUBLIC_SUPABASE_ANON_KEY` line swallowed the next line, leaving `NEXT_PUBLIC_SUPABASE_URL` unset, so `isSupabaseConfigured()` was false and **local dev had been saving nothing to Supabase at all** — invisible, because `readings.ts` degrades silently by design. Local read/write round-trip now verified. *(Second instance of the graceful-degradation blind spot first noted 2026-08-12; the Free-tier auto-pause risk still stands.)*
- ~~**Sub-question 1a**~~ — **RESOLVED 2026-08-15: unknown-and-demote**, per recommendation. Frame begins unknown, never default-linear; ages/dates and state locks cannot reach hard/locked tier until dismissal behaviour establishes the frame; rule locks unaffected. Implement in phase 3 — see design §5.1.
- **Sidebar 25-vs-26 conflict** — still open. Nenad will confirm the correct figure once he can count it against the rendered sidebar. **Do not guess; do not let it block phase 1/2.** Phase 3 only.

**Correction worth recording, because instruction 6 says to re-read the handover on resume and it will mislead:** `DraftAndLens_Handover_2026-08-02.md` does **not** contain tonight's context. Verified by grep: no §11 answers, no annotation self-consistency work, no eyebrow/skeleton investigation, and it still lists key rotation as outstanding when this log has recorded it **done since 2026-08-12**. What it *does* carry that matters is the file-upload and spell-check rulings and, appended 2026-08-15, the hybrid long-form chunking architecture (which ruling 5 makes a hard dependency for lifting `TESTER_WORD_CAP`). **Treat this log, not that handover, as the record of 12–15 August.**

### 2026-08-10 — Claude Code session

**Decision: removed the "never ask Nenad to run terminal commands" rule.**
Replaced in both root `CLAUDE.md` and `draft-and-lens/CLAUDE.md` with: when Bash is genuinely down (classifier outage), hand over the exact command to run manually rather than stating the problem and waiting.
*Why:* Nenad's call. Blocking on a dead tool is slower than handing off, and handing off is how the session was already working in practice. The old rule caused a real stall this session.

**Decision: `draft-and-lens/CLAUDE.md` working-directory path corrected.**
The nested file still told sessions to `cd` into a Dropbox path confirmed non-existent on 2026-08-08; only the root `CLAUDE.md` had been fixed (commit `6c51366`). Now corrected in both, with a dated note so a future session doesn't reinstate it from git history.

**Finding: handover item 2 (file-upload fixes) was already built and is genuinely complete.**
Commit `374b892` covers all of it. Verified by reading the code, not the commit message:
- `.md` added to the format registry, with `stripMarkdown()` handling YAML frontmatter and `[[wikilinks]]` — Obsidian specifically, which was the tester's actual tool.
- `.docx`/`.pdf` root cause was NOT a size limit as the handover guessed. `FileReader.readAsText` returns mojibake on binary containers instead of throwing, and the only guard was a `length >= 20` check that junk passes. Both formats now carry `transport: 'server'` and extract via mammoth / unpdf in `/api/upload`.
- `.pdf` was broken by the same mechanism and equally advertised — of the five formats offered, only `.txt` and `.fountain` ever worked. Not in the handover; found here.
- Failures surface on the upload screen via `uploadError` (`role="alert"`), and `canAnalyse` cannot become true from a failed upload, so the analysis-screen dead-end is structurally closed rather than just messaged around.
*Why this matters for future sessions:* the handover listed item 2 as to-do because the fix was committed locally but never pushed. Handover docs can lag the repo in both directions — check the repo before building, and check the push state before believing something is live.

**Open gap carried forward from `374b892`: `.fdx` passes raw Final Draft XML to the analyst.**
`.fdx` is advertised in `UPLOAD_FORMATS` and accepted with `transport: 'text'`, so the analyst receives XML markup rather than prose. Not a dead-end — the readable-text gate passes it, because XML *is* text — but the reading quality on a Final Draft file is silently degraded and nothing tells the writer. The commit describes this as "degraded rather than broken, logged for a later pass"; that log existed only in the commit message, which is not somewhere a future session looks. Recorded here so it isn't lost.
**Decision (Nenad, 2026-08-10): `.fdx` removed from the advertised format list rather than parsed now.**
Reasoning: silently degraded analysis is worse than not supporting the format. A writer who uploads `.fdx` now gets the standard "not supported" message naming what *is* supported, instead of a reading quietly compromised by XML markup they can't see. Removed from `UPLOAD_FORMATS` in `upload-formats.ts`; `UPLOAD_ACCEPT` and `UPLOAD_FORMAT_HINT` derive from that list, so the picker and drop-zone hint update with it and cannot drift.
*Future format-support item, not urgent:* parse `.fdx` properly (extract `<Paragraph>`/`<Text>` content, the way `.docx` is extracted server-side) and re-add it. A comment in `upload-formats.ts` warns against re-adding it unparsed.

**Decision: the Vercel deploy hook is NOT stored in chat or in Claude's memory.**
Nenad offered to paste it into chat for permanent recall. Declined: a deploy hook is a bearer secret — anyone holding it can trigger a production deploy — and pasting it into chat puts it in the transcript permanently, while "remember it forever" would mean writing a live credential to a plaintext memory file. Agreed home is a `VERCEL_DEPLOY_HOOK=` line in `.env.local` (already gitignored, already holds the other secrets), added by Nenad in an editor rather than via shell so it stays out of shell history. Claude must never do a full read-modify-write on that file — single-line edits only, per the standing `[SENSITIVE]`-corruption rule.
*Status:* not yet added. Until it is, deploys need the hook on the clipboard.

**Design written for the continuity ledger (item 1) — `DraftAndLens_ContinuityLedger_Design_v1.md`. Nothing built.**
Two findings from reading the code reshape the feature and are worth carrying forward regardless of whether the design is accepted:
- **Chapters are not grouped.** `resolveRevision` matches submissions to works by text similarity (`SAME_WORK_SIMILARITY = 0.4`, word-bigram Dice, `readings.ts:29`). Chapter 2 of a novel shares almost no bigrams with chapter 1, so it is filed as a *new work*. The system models "one work = one text, revised" — there is no concept of "manuscript." Any cross-chapter feature needs manuscript grouping built first, as a prerequisite rather than a sub-task.
- **`MAX_VERSIONS = 5` hard-prunes older rows** (`readings.ts:245`), so anything stored inside `reading_json` is destroyed with them. A ledger must be its own table with its own lifecycle.
Also flagged in the design: a new table creates real GDPR work — all four user-data functions in `readings.ts` touch only `TABLE = 'readings'`, and the launch checklist gates paid launch on a deletion-cascade test.

**Correction to the launch checklist: `purgeExpiredDeletions` IS auto-called — but only lazily, which is a genuine retention gap.**
The checklist and handover both list it as "exists, not auto-called." That is inaccurate. It is called at `src/app/api/works/route.ts:21`, on `GET /api/works`. Verified as the **only** call site by reading every route that imports from `readings.ts` (`analyse`, `works`, `works/[workId]`, `account`, `export`).
*Why it still matters:* the sweep runs only when a signed-in writer loads their works list. A writer who soft-deletes a work and never returns keeps that data indefinitely, well past the 30-day `SOFT_DELETE_GRACE_DAYS` window — so the stated retention policy is not actually guaranteed. The fix is a scheduled sweep (Vercel cron) rather than on-access only.
*Action:* correct the wording in `DraftAndLens_Launch_Checklist.md` and re-scope the item from "wire it up" to "make the existing sweep unconditional." Not done here — the launch checklist is planning material and editing it is Nenad's call, not a cleanup task.
