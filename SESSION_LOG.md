# SESSION_LOG.md — Draft & Lens

Append-only log of decisions made in any session (Claude Code or relayed from a claude.ai chat) that will matter to a future session. Write the entry the moment the decision is made — don't reconstruct from memory afterward. See CLAUDE.md → Session Discipline.

Format per entry: date, source (Claude Code session / relayed from claude.ai chat), the decision, and why.

---

## Pending Decisions

---

# SESSION STATUS — 2026-08-17, by Level (read this first when resuming)

## LEVEL 1 — DONE, findings only, nothing changed

Full report: **`DraftAndLens_Level1_Audit_2026-08-17.md`**.

- **1a tier audit** — complete, including measured latency from 40 production runs. Four candidate mismatches await Nenad's review; **no tier was changed**.
- **1b corpus review** — complete. Five gaps identified, **no edit made**. Headline: the corpus's "teaching the move" rule is scoped to notes naming a *problem*, so it states only half the rule the product implements; SCOPE never mentions Brain 4, so the brain behind Noel's A24 complaint is governed by nothing.

**Fixed since (both explicitly authorised):** extraction is now inside a `withCostTracking` scope, so its tokens and latency reach telemetry (`5f12c56`).

## LEVEL 2 — DETECTION BUILT AND TESTED, **NOT WIRED INTO THE PIPELINE**

Commits `ee054b8` (gates), `250a7a4` (two-pass + test set). Test set: **`DraftAndLens_Detection_Test_Set.md`**, results appended.

- **2a scope** — mechanical facts only, stated at the top of `src/lib/detection-gates.ts` with the reasoning for why it is an honest limit rather than a v1 compromise.
- **2b two-pass** — pass 1 asks whether claims are incompatible; pass 2 is given the *opposite* job, to excuse them. **Measured: pass 1 median 2.05 s, pass 2 4.72 s**, and pass 2 runs on only half the cases. **It earns its cost** — it changed the outcome in 3 of the 5 cases it ran, every one a downgrade from `contradiction` to `worth_checking`.
- **2c severity** — three outcomes, `not_a_candidate` always carries a reason so "correctly not flagged" and "silently dropped" stay distinguishable. Enforced by the return type, not convention.
- **2d tier** — `claude-opus-4-8`, the analyst's tier, per the ruling.
- **2e test set** — **9 of 10 pass.** Three bugs found and fixed by the run; two "failures" were my own faulty test data, recorded rather than quietly corrected.

### ⚠️ NOT DONE — detection does not run on real submissions
2a–2e asked for detection **built and tested**, and it is. It is **not called from `/api/analyse`** and produces no user-visible output. Surfacing it means the Continuity report section (§6a). ~~Blocked on the sidebar-count question~~ — **that is now resolved (base 25, → 27 with the Continuity section)**, so the remaining work is the section itself and its UI, not a blocked decision.

### A4 / entity variance — RULED 2026-08-17, PARTIALLY IMPLEMENTED

**Nenad's ruling, general principle for ALL entity-variance cases, not just A4:** do not treat extraction's entity match as authoritative, and do not distrust it by default either. **Read the surrounding text and use judgement, as a careful human reader would** — is this the same person under a nickname or a formal/informal variant, an inconsistency in how the narration refers to one person, or genuinely two distinct characters? *The extraction merge is one signal, not a verdict.*

**Architectural consequence, and why this is more than a prompt tweak:** pass 2 currently receives only two quoted spans. It has no surrounding text to read, so it *cannot* apply this ruling as written — the judgement it is being asked to make requires context it is not given.

**DONE:** `extractContext(sourceText, quote, radius)` in `src/lib/detection-gates.ts` — returns the passage around an evidence quote, anchoring through whitespace and smart-quote differences, and returning **null rather than a wrong window** when the quote cannot be located (context from the wrong place is worse than none). 6 tests.

**DONE (code, `58638ae` + follow-up): steps 1 and 2.** `aContext`/`bContext` thread through `runDetection` into `buildVerifyPrompt`, and `DETECTION_VERIFY_SYSTEM` carries the identity principle worded as the ruling — the shared subject key is one signal, neither authoritative nor to be distrusted; read the passages and judge. It names the three ordinary cases (nickname/formal variant, one person the narration spells inconsistently — which *is* a real finding — and two genuinely distinct characters) and says to answer uncertain rather than resolve by trusting or by doubting the match.

**⚠️ NOT YET VERIFIED BEHAVIOURALLY — this is the first thing to do on resume.**
`tsc` is clean and the change is additive to a prompt, but the detection test set has **not** been re-run against it. Committed but **not deployed**, and detection is not wired into the pipeline, so nothing user-facing is affected. Re-run before relying on it, and check BOTH directions:
- A4 should move to `contradiction` now that pass 2 can read the passages;
- **and no Group B case may regress into a false positive** — more context cuts both ways, and B1/B3/B5 are the cases that would suffer.

**Still to do:**
- **Production wiring:** detection needs each fact's `reading_id` → `readings.source_text` to build context windows. That lookup does not exist yet and is part of wiring detection into the pipeline.

### ⚠️ SUPERSEDED — original open question, kept for the reasoning

Should pass 2 treat extraction's **entity match as authoritative**? It currently does not, so "Katherine" vs "Kathryn" lands at `worth_checking` because pass 2 cannot confirm from two quotes that they are the same woman. Trusting the match propagates any wrong merge extraction made; distrusting it softens every name-variance case — the one category where spelling *is* the point. **Nenad's call.**

## LEVEL 3 — DONE

**`AUDIT_CHECKLIST.md`** written. 15–30 minutes, triggered **before starting any major new feature** rather than on a session count. Five sections (dead code, duplicated logic patterns, unused exports, stale docs, test hygiene), each with a grep to run and a worked example drawn from a real finding of this session. Proposed home: its own file, linked from `CLAUDE.md` — deliberately not inside it, since `CLAUDE.md` is loaded every session and should stay short enough to actually be read.

**Not run.** Producing the checklist was the task; running it was explicitly not.



### ⚠️ DEAD BRAINS — needs Nenad's product decision, flagged 2026-08-17, NOT fixed
`TESTER_WORD_CAP = 4000` rejects any submission above 4,000 words (HTTP 413), but three brains are gated at `STRUCTURAL_READER_MIN_WORDS = 5000`:
- `structuralReader` (Brain 1b)
- `narratorVerifier`
- `narratorCorrector` — **the only Opus-tier brain besides the analyst**

**Nothing can reach 5,000 words, so none of the three has ever executed.** Confirmed by their total absence from 40 runs of `submission_telemetry`. `FREE_WORD_LIMIT = 10000` is unreachable for the same reason.

Two ways to resolve it and they are genuinely different products: **bring the 5,000 gate down** to something under the cap (these brains start running on ordinary submissions — better readings, more latency and cost on every long-ish piece), or **raise the cap to 5,000+** (longer submissions allowed, which interacts with the long-form chunking architecture that is currently out of scope). Nenad's call — explicitly not decided here.

Consequence worth knowing meanwhile: the narrator-pair tier inversion noted in the Level 1 audit (judgement at Sonnet, execution at Opus) is **moot in practice** until this is resolved.


- **Continuity ledger (item 1): design at v1.3, REVIEWED AND CLEARED TO BUILD, 2026-08-15.** Supersedes the previous "AWAITING FINAL REVIEW — do not start building" entry. All eight §11 questions answered by Nenad; answers recorded verbatim in the design doc's §11 and reflected in §2, §5.1, §6, §7, §10, §12. Build order is phase 1 (manuscript grouping — a prerequisite, not a sub-task, per §0.1) then phase 2 (extraction + ledger view at its own route + locks). **Two things still open and both block phase 3 only, not phase 2:** sub-question 1a (what to assume about a frame that has not yet been inferred) and the sidebar-count conflict below.
- ~~**Sidebar link count: unresolved.**~~ **RESOLVED 2026-08-17 by counting `ReportView.tsx` directly. `CLAUDE.md`'s 25 was correct; the ledger design's 26 (which ruling 6 confirmed without deriving) was not.** Base 25 = 13 constant + 12 Analysis max. The Continuity ledger link makes 26; a future Continuity section makes 27. `CLAUDE.md` is now marked as the single source of truth and all three docs agree. *Original entry:* `draft-and-lens/CLAUDE.md` states 13 constant links + Analysis variable to 12 = 25 overall maximum. The ledger design has said 26 since v1.2 and Nenad's ruling 6 confirmed "26, plus Continuity when present." One of the two is wrong; neither should be trusted until counted against the rendered sidebar. Not urgent — phase 2 adds no report section — but **reconcile before phase 3.**
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
1b. ~~**Grouping confirm step at upload**~~ — **DONE and VERIFIED LIVE 2026-08-16.**

**Grouping/ledger feature verified end-to-end on production, 2026-08-16.** All three paths confirmed by live test, not by inspection:
- **Auto-grouping** — a third piece sharing 3+ distinctive names grouped silently, no prompt shown, filed as a new chapter of "Home", report showed the "Added to X" trace with Undo, and the sidebar gained its Continuity ledger link.
- **Confirm fallback** — shown when the match is ambiguous; and the earlier bug where it appeared then cancelled itself is fixed (cause: classification ran before the submission type was known, so criterion 5 failed closed on format and the band flipped from `confirm` to `auto` once a type was picked).
- **Manual detach** — "Not part of this book" removed a chapter, count dropped 4→3, all stored versions of that work detached while the readings themselves survived.

**Known cosmetic wart, confirmed in real use and NOT fixed:** chapter numbering leaves gaps after a detach (a writer now sees chapters "2, 3, 5"), because `resolveAttachment` assigns "highest + 1" and never reuses a freed index. Deliberate — reusing indices would silently renumber chapters the writer may have referred to elsewhere — but it looks broken. If it needs fixing, the options are renumber-on-detach (cheap, mutates existing rows) or display-position-instead-of-index (cosmetic only). Nenad's call.
2. ~~**Extraction (§9 Stage 1)**~~ — **BUILT AND DEPLOYED 2026-08-16.** `src/prompts/continuity.ts` (prompt), `src/ai/brains/continuity-extractor.ts` (brain + `validateFacts`, 14 unit tests), `storeFacts`/`listKnownEntities` in `src/lib/continuity.ts` (10/10 verified against live tables), wired into `/api/analyse`. Commits `2904593`, `1fc18a7`.
   - **Gated on complete AND grouped.** Excerpts excluded per ruling 4; ungrouped excluded because `continuity_facts.manuscript_id` is NOT NULL. Consequence worth knowing: **a writer who never groups anything never sees a ledger populate.** Correct, but it means the feature is invisible until grouping is used.
   - **Runs after `done` is sent**, so extraction latency and failure are invisible to the writer.
   - **Model: `claude-sonnet-4-6`**, matching every other non-analyst brain — not a judgement call, house convention. Adds one model call per grouped complete submission; that is a real per-submission cost increase.
   - **Standalone brain test passed** on sample prose: 4 facts, 0 rejected, all quotes verbatim; correctly tagged a dialogue claim as `register: dialogue` at 0.55 confidence rather than treating it as the book's assertion, and correctly skipped a volatile interiority line.
   - **Not yet verified end-to-end through a real submission** — that happens on the next grouped complete analysis. What to check: the ledger for that manuscript stops saying "Nothing tracked yet".
   - **Watch item:** one extracted value came back as `hair_colour_childhood = darker than current` — a comparative rather than the short normalised value the prompt asks for. Harmless here (dialogue register, 0.55 confidence, so it demotes), but if this shape recurs the prompt's normalisation rule needs tightening.
   - **Deferred deliberately:** extraction counts/rejection reasons are not logged. They belong in telemetry, and `logSecurityEvent`'s typed union is the wrong home — widening it would blur what a security event means. Rejection patterns are the earliest signal the extractor has drifted, so this is worth a proper channel.
### EXTRACTION VERIFIED END-TO-END 2026-08-16 — and it exposed two bugs that BLOCK detection

**Verification passed.** A grouped complete submission produced 5 distinct facts across 3 entities; the ledger stopped saying "Nothing tracked yet". Registers, categories and verbatim quotes all correct.

**BUG 1 — a revised chapter is filed as an ADDITIONAL chapter, not the same one.**
`resolveAttachment` always assigns "highest + 1", with no check for whether that work is already in this manuscript. Evidence in live data: work `c737cd7f` occupies BOTH ch1 and ch2, and work `63f74d39` occupies ch6 and ch7. So revising chapter 1 makes the book appear to gain a chapter, and the chapter list shows the same work twice under different numbers.

**BUG 2 — FIXED 2026-08-16 (commit `8d8ae70`).** ~~re-extraction duplicates facts, and nothing supersedes the old ones.~~
Every submission re-extracts and inserts a fresh set. Live data: 9 fact rows for 5 distinct (entity, attribute, value) identities. The `superseded_by` column exists in the schema (§3) and nothing writes to it.

**Why these two together BLOCK detection, and must be fixed before it:**
A writer revises chapter 3 and changes a character's eye colour. The old fact stays in the ledger; the new one is added alongside it. Detection then compares the two and reports that the book contradicts itself — **when the "contradiction" is between a chapter and its own earlier draft.** That is precisely the trust-destroying false positive §1.1 is built to prevent, and it would fire on the single most ordinary writer behaviour there is: revising. Building detection on top of this would make the feature's worst failure mode its most common one.

**Bug 2 resolution (Nenad's ruling, 2026-08-16): soft-delete the old draft's facts outright, NOT `superseded_by`.** His reasoning, worth preserving: that column represents *a later chapter legitimately updating an established fact*, which is a meaningfully different case from *a chapter being revised before its real version is submitted*. Using one mechanism for both would conflate two concepts. The old draft's facts were never canonical.
Implemented as `retireFactsForWork` in `src/lib/continuity.ts`, called from `/api/analyse` before the new facts are stored so the ledger never briefly holds both. **Writer-authored locks are excluded from retirement** — they are the writer's own assertion, not an extraction, so redrafting a chapter must not remove them. Verified 9/9 against live tables.

**BUG 1 — FIXED 2026-08-16 (commit `e7a60e3`), verified 8/8.** `resolveAttachment` now takes an optional `workId` and reuses the existing `sequence_index` when that work is already grouped. Keyed on `work_id` because that is already what `resolveRevision` decided identifies "the same piece" — reusing that judgement rather than inventing a second notion of sameness that could disagree with it. `workId` is optional, so callers without one keep the old highest+1 behaviour.

~~**BUG 1 STILL OPEN — not ruled on.**~~ A revision is still filed as an *additional* chapter (`resolveAttachment` assigns "highest + 1" without checking whether that `work_id` is already in the manuscript). Live evidence: work `c737cd7f` at ch1 and ch2; `63f74d39` at ch6 and ch7. Suggested fix, not implemented: reuse the existing `sequence_index` when the work is already grouped. Bug 2's fix works regardless of this — it keys on `work_id`, not on chapter number — but the chapter list still shows the same work twice under different numbers.

**WATCH ITEM — FIXED 2026-08-17 (commit `ff8f6b0`).** ~~comparative/encoded values recurred~~ Two of five: `age_gap_over_marisol = "9 years older"` and `eldest_of_three_siblings = "true"`. Both push the claim into the attribute name and leave a value that is not a short normalised token. Not harmful yet, but these compare badly: two chapters phrasing the same relationship differently would produce two unrelated attributes that can never be checked against each other. The prompt's normalisation rule needs tightening before detection relies on attribute matching.

**My error, recorded:** I ran the verification twice. The first `Runtime.evaluate` call timed out at 45s but the request had already reached the server and completed, producing ch6; the retry produced ch7. A timed-out tool call does not cancel server-side work. Cost: one extra analysis. ch6 and ch7 are my test artefacts and can be detached from the ledger view.

**Test artefacts cleaned up 2026-08-16.** The piece I submitted twice while verifying extraction (work `63f74d39`, filed as ch6 and ch7) has been detached and its 9 facts retired. Readings left intact, exactly as the "Not part of this book" control does. Manuscript "Home" is back to Nenad's own four chapters with zero facts — extraction will repopulate on his next grouped complete submission.

**Pre-existing duplicate RESOLVED 2026-08-17** (Nenad: detach ch2, ch1 has the better title). Note for anyone repeating this: ch1 and ch2 were the *same* work, so `detachWork` could not be used — it keys on `work_id` and would have removed both. Detached the single row numbered ch2 instead. "Home" is now three distinct works, three rows, no duplicates. ~~needs a word~~ Work `c737cd7f` still occupies BOTH ch1 ("Chapter One") and ch2 ("Untitled") — created *before* bug 1 was fixed, so the fix prevents new ones but does not retroactively merge this. No facts exist for it now, so it poses no detection risk; it is purely a confusing chapter list. Detaching one of the two would resolve it (ch1 has the better title), but that mutates Nenad's own content rather than my test data, so it is flagged rather than done.

**Extraction normalisation tightened 2026-08-17.** The real fault behind the comparative values was the *attribute*, not the value: `age_gap_over_marisol` and `eldest_of_three_siblings` both folded the claim into the attribute name, and an attribute that encodes its own answer can never disagree with anything. Two rules added to `src/prompts/continuity.ts`: the attribute must name a property another chapter would independently arrive at, and a comparative must be resolved to an absolute from what the chapter itself states or not extracted at all. Verified on the exact prose that produced the bad values — `age_gap_over_marisol` → `stated_age = 50` (41 + 9), `eldest_of_three_siblings` → `birth_order = eldest`, five facts, none suspect, and the derived age correctly rated 0.72 against 0.95 for directly-stated ones. **Prompt-only: this shape cannot be caught in `validateFacts`** — "9 years older" is short, well-formed and quote-backed, so any heuristic strict enough to reject it would also reject legitimate values.

---

## STATE AT END OF SESSION, 2026-08-17 — read this first when resuming

**The continuity ledger is complete through extraction and verified live.** Phases: grouping (§2) ✅, ledger view + locks (§6b, §5.7) ✅, extraction (§9 Stage 1) ✅. Everything is committed, pushed and deployed; the working tree holds only three changes that predate this whole session (`.gitignore` ×2, one image).

**NEXT ITEM IS DETECTION, AND IT IS DELIBERATELY NOT STARTED.** Nenad's instruction, 2026-08-17: *"Detection is deliberately deferred to a fresh conversation — I want proper attention on it, not a fast decision at the end of a long session."* Do not begin it on a resumed session without that conversation. Two things it needs settled first: **model tier**, and **which §5 gates apply and how** (register comparability §5.2, POV scoping §5.3, the flashback/stated-age edge §5.4, and sub-question 1a's unknown-and-demote rule, which was ruled on but never implemented because nothing flags yet).

**Both bugs that blocked detection are fixed** — a revision now keeps its chapter number (bug 1, `e7a60e3`) and retires its previous draft's facts (bug 2, `8d8ae70`). Without those, detection would have reported chapters contradicting their own earlier drafts.

**Beta list after detection:** timeline reasoning (phase 3) → Mentor mode → differentiator messaging. Still out of scope until beta completes: the pre-paid-launch checklist and long-form chunking.

3. **Detection** — the actual contradiction flagging. **IN scope for beta**, added 2026-08-16. **BLOCKED on bugs 1 and 2 above**, and on Nenad's ruling on model tier and the §5 gates.
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

---

## 2026-08-18 — Claude Code session

**Decision (Nenad): detected continuity flags PERSIST from the first pass. Not show-until-reload.**
A new store sits alongside `continuity_facts`; §6a renders from stored flags on every view rather than from a live in-memory result.
Reasoning, from the code rather than preference:
- Detection runs *after* the reading is delivered (`api/analyse/route.ts`, the post-stream extraction block, grouped + complete submissions only). A non-persisted flag would therefore exist only in a narrow window on the submitting tab.
- Readings persist and are re-viewable at `/analysis/[id]`. Ephemeral flags mean reopening a saved reading shows a report whose Continuity section has silently vanished — the writer cannot tell that from "nothing was found."
- `continuity_facts` already persists. Persistent facts with ephemeral flags is architecturally inconsistent, and leaves the §6b ledger view unable to show flags at all.
- Detection costs two model calls per candidate pair. Without persistence every view either re-pays that or shows nothing.

**Word-cap gate lowered 5,000 → 4,000 (`STRUCTURAL_READER_MIN_WORDS`, `ai/orchestrator.ts`).**
Confirmed by Nenad as settled: 4,000 was always the intended beta cap and the 5,000 gate was stale leftover config. The gate transitively controls Brain 1b, the narrator verifier and the post-stream corrector; above `TESTER_WORD_CAP` it meant all three were unreachable on every submission the beta accepts.
*Flagged, not actioned:* `api/analyse/route.ts` rejects `wordCount > TESTER_WORD_CAP`, so the largest accepted submission is exactly 4,000 words while the gate is `>= 4_000`. These three brains therefore now fire on precisely one input size. If the intent is that they run on ordinary beta submissions the gate wants to be lower (~2,500–3,000); that is a cost/product call and was left open. Nenad's instruction was explicit that the cap itself must not be raised.

**Regression found and fixed in the detection pass-2 prompt (`prompts/detection.ts`).**
The entity-identity block added in `d273037` is headed "WHEN THE NAMES DIFFER", but its closing instruction — say uncertain if the surrounding text does not settle identity — read as unconditional. Pass 2 applied it to *same-name* pairs and softened clear contradictions because it could not confirm the two Sarahs were one Sarah.
Measured on A1 (green eyes ch.1 / brown eyes ch.7, linear, omniscient narration): contradiction 3/3 before `d273037`; 0/2 after it with no passage context; 2/3 with context. A scoping sentence restricting the block to differing names restores 10/10 across three consecutive full runs of the A1–C1 set.
*Method note for future sessions:* the detection test set lives only in `scripts/.tmp-detect-test.mjs` (untracked) and makes real model calls. It has no recorded baseline, which is why "is this a regression or was it always marginal?" had to be answered by checking out the pre-change prompt and re-running. **That test set should become a tracked fixture with recorded expected outcomes**, or the same question costs a full investigation every time.

**Two pre-existing failures in `tests/prompts/client-ip-guard.test.ts`, present at HEAD and unrelated to any change above.** Verified by stashing.
- `src/lib/cost-log.ts` imports from `../ai`, which the guard forbids for UI layers. Either a real layering violation or the guard's file list is too broad — needs a decision, not a silent fix.
- "has 27 lens voices" now finds 35. Eight voices were added (the eight new portraits sitting untracked in `Lens voices_images/`); the assertion was never updated. Stale test, not a code fault.

### Resume note — detection wiring (§6a), 2026-08-18

**State: built, type-clean, build-clean, unit-tested, visually verified. NOT deployed. Blocked on one manual step.**

**THE BLOCKER — apply the migration by hand.** `draft-and-lens/supabase/migrations/continuity_flags.sql` has not been run. It cannot be applied from a session: `.env.local` holds only the Supabase REST keys (anon + service role) and no Postgres connection string, and PostgREST cannot execute DDL. Paste the file into the Supabase SQL editor, then confirm it took — the ledger migration records the run reporting success twice without the objects appearing:

```sql
select table_name from information_schema.tables
 where table_schema = 'public' and table_name = 'continuity_flags';
```

**Then:** `npm run build` → `git push origin main` → fire the Vercel hook → submit two grouped chapters of a complete piece that disagree on a stated fact, and confirm the Continuity section and its sidebar link appear.

Push and deploy were deliberately left undone rather than run autonomously. The feature cannot be verified live until the table exists, and CLAUDE.md forbids declaring a fix complete without visual confirmation — so shipping it first would put unverifiable code in production. Sequencing that is Nenad's call.

**Verified without the table:**
- `listAdjudicatedPairs`, `storeFlags`, `listFlagsForReading`, `listFlagsForManuscript` all degrade cleanly against the real table-less database — Set(0)/0/[]/[] , no throw. So deploying ahead of the migration is safe: detection contributes nothing and the reading is untouched.
- §6a renders correctly (checked in Chrome against a local fixture route, since removed): tiers, colours, sort order, and the `character:sarah` → "Sarah — eye colour" humanisation.
- Full build ✓ compiled successfully; bundle IP grep exit 1.

**Two things detection needs that are NOT built, both flagged rather than decided:**

1. **No flag can currently reach `contradiction` in production.** `deriveFrame` reads linearity off `structuralMap.narrativeStructure`, and the structural reader is gated at 4,000 words while `TESTER_WORD_CAP` rejects anything above 4,000 — so a map is produced only for a submission of exactly 4,000 words. With no map, `nonLinear` is null, ruling 1a demotes, and every `age_date` candidate lands on the soft tier. Other categories still reach hard tier, but the timeline-dependent ones cannot. This is the same gate/cap interaction `AUDIT_CHECKLIST.md` §1 already documents; lowering the gate to ~2,500–3,000 would fix it and is a cost call.
2. **`unreliableNarrator` and `multiplePov` are always null** — nothing in the pipeline establishes either as a fact. They are left null rather than inferred, so they demote rather than mislead, but the §5.1/§5.3 gates are effectively inert until something sets them.

**Also outstanding, unrelated to this work:** the two pre-existing `client-ip-guard` test failures (see the entry above) are still failing at HEAD.

### Live verification PASSED — §6a on production, 2026-08-18

Migration applied by Nenad; deploy hook fired; verified on real submissions via the Chrome extension.

**Result.** A hard-tier contradiction rendered in the report and persisted:
`character:sarah mallory / eye_colour`, `outcome=contradiction`, `ceiling=hard`, `demotions=[]`, `short_circuited=false`, `confidence=0.9`. Both passes ran and the adversarial second pass failed to find an innocent explanation, which is the design working as intended rather than a single model agreeing with itself. Sidebar carried both `CONTINUITY LEDGER` (Overview) and `CONTINUITY` (Editorial Analysis); every in-page sidebar link resolved to a real section.

**Test shape that works, for whoever repeats this.** Two chapters grouped into one manuscript, both `story` + `complete piece`, contradiction on a NON-age attribute stated in narration. An age or date cannot reach `contradiction` while the structural-reader gate sits at the word cap (see the resume note), so testing with an age proves nothing.

**HONEST CAVEAT on the persistence ruling.** The flag is provably in the database, but reload-survival cannot currently be demonstrated in the UI: `/analysis/[id]` is still a Stage-0/4 scaffold (`Analysis {id} — Stage 4.`), and reloading the home page discards the entire reading, not just the Continuity section. So the reason given for persisting — "a reopened reading would show no Continuity section" — describes a view that does not exist yet. The decision is still right (the flags are stored, cheaply, and will render the moment that view is built), but its user-visible benefit is not yet realised. Do not describe §6a as "survives reload" until `/analysis/[id]` renders stored readings.

**Three findings, none from this build, all pre-existing:**

1. **An `unchanged` resubmission silently discards the writer's grouping choice.** `resolveRevision` returns `unchanged` at `UNCHANGED_SIMILARITY = 0.97`, and that branch in `api/analyse/route.ts` sends `done` and returns *before* the attachment/extraction/detection block. Hit live: chapter 1 was submitted with "Yes — part of The Hollow Year" explicitly selected, came back in ~5s from cache, and was never attached — the manuscript still read "(0 so far)" afterwards. The writer is told nothing. Lightly edited resubmissions are the ordinary case for a writer, so this is not an edge case.

2. **Grouping suggestions surface stopwords as evidence, in user-facing copy.** `/api/ledger/suggest` proposed grouping an unrelated chapter into the real manuscript "Home" on `sharedEntities: ["one","the"]`, rendered in the panel as "Yes — part of Home (both mention one, the)". It correctly landed in `confirm` rather than `auto` (`failedCriteria: shared-names, overlap`), so the §2 safety held and it asked instead of grouping silently — but the evidence shown to the writer is noise and undermines trust in the question being asked.

3. **`/analysis/[id]` is still the Stage-0 placeholder.** Worth knowing before anything else is designed around re-viewing a reading.

**Test data left on Nenad's production account — not deleted, since removing data is his call:**
- manuscript **"The Hollow Year"** (`9b444631-cae1-49e7-9294-ff5c78d02042`) with 2 chapters and 1 continuity flag;
- a standalone work from the first, ungrouped "Chapter One" submission.
Nothing was written to the real "Home" manuscript — the test deliberately created its own book.

### Level 3 periodic audit — first run, 2026-08-18

Ran `AUDIT_CHECKLIST.md` in full. It had never been run; the handover called the three-dead-brains incident "the strongest possible justification" for actually using it. It found real defects on its first outing, so the practice pays for itself.

**Fixed now**

- **§2 — `renameWork`, `softDeleteWork`, `restoreWork` reported success on zero rows.** A Supabase update matching nothing succeeds with no error, so all three returned `true` for a work that does not exist, belongs to another user, or is already in the target state; `api/works/[workId]` turns that straight into `ok:true`. The two delete/restore functions also ran their ledger cascade on that false success. **The 2026-08-17 entry already records finding this shape "in three further functions in readings.ts" — these are those three, and they were never fixed.** A finding recorded but not applied is indistinguishable, a session later, from one that was handled.
- **§5 — the two long-red `client-ip-guard` tests.** Lens count stale at 27 against an actual 35 (now also asserts every id has meta + a prompt, so it cannot rot the same way); the layering check flagged a *type-only* import, which emits no JavaScript and cannot carry prompt IP — the guard now strips type imports, verified still red for a value import.
- **§3 — removed `listFlagsForManuscript`,** an export I added earlier today with no caller. My own debt, introduced in the flags-store commit against the standing rule to check the module for dead code in the same commit. §6b will need it and can re-add it.
- **§4 — `CLAUDE.md` pointed at `DraftAndLens_LearnedCorpus_v2.7.md`,** deleted earlier today. Now points at v2.9 and notes the filename/header mismatch.
- **§4 — verified rather than assumed:** the stated 16000-token analyst target is correct at every tier in `adaptiveAnalystConfig`.

**Flagged — decisions, not fixes**

1. **`FREE_WORD_LIMIT = 10_000` is unreachable.** It is passed as the pipeline's `wordLimit`, but `TESTER_WORD_CAP` rejects anything over 4,000 first, so the whole 4k–10k coverage/truncation path is dead in production — the *same* gate-vs-cap family as the three dead brains, found by the same §1 check. Which number is wrong is a product call.
2. **`lens.ts` and `conversation.ts` are entire brain modules that never execute.** `api/lens` and `api/converse` each build their own model call inline from the prompt modules, bypassing `runLens` / `runConversation` completely. This is duplicated *reasoning* (§2) and dead code (§3) at once: two places know how to call the model for a lens, and the one under `src/ai/brains/` is not the one that runs. A bug fixed in the brain would change nothing live. Deciding which side is canonical is architectural — Architecture §03 says brains own orchestration, which suggests the routes drifted, but collapsing them is not a mechanical edit.
3. **Also dead, lower stakes:** `detachReading` (the detach route uses `detachWork`), `listLocks`, `traceMark`.
4. **Corpus filename lags its content** — `DraftAndLens_LearnedCorpus_v2.9.md` header reads "Version 2.11". Already a worked example in the checklist itself and still unfixed; renaming touches every doc that references it, so it wants doing deliberately.

**Checklist itself:** still pointed where the code is. §1 and §2 both found live defects on this run.

### Deployed and verified live, 2026-08-18 (end of session)

Six commits shipped: the two grouping fixes, the works zero-rows fix, the two test repairs, the audit outcome. Build ✓, 93 tests green, bundle IP grep exit 1, `origin/main..HEAD` empty before the hook fired.

Live functional check on the entity fix — the exact chapter text that previously returned `band: "confirm"` with `sharedEntities: ["one","the"]`, proposing to group into the real manuscript "Home", now returns `band: "none"` with no suggestion at all. Test data confirmed gone: "Home" is the only manuscript.

**Beta-completion list now stands at:**
1. ~~Ledger phase 2~~ — done
2. ~~Extraction / detection~~ — **done and verified live today**
3. **Timeline reasoning (ledger phase 3) — BLOCKED, needs Nenad.** The handover gated it on "detection being solid and tested", which it now is, so the gate is lifted. But there is no build spec: the ledger design promotes it to next priority and resolves sub-question 1a as "unknown-and-demote, promote once dismissal behaviour establishes the frame" — and that mechanism needs a dismissal UI (a writer marking a flag intentional) that does not exist. `continuity_facts.reconciled_at` is the column for it and `gatePair` already reads it, so the data side is ready and the interaction is not. What phase 3 actually consists of is a product decision.
4. **Mentor mode — BLOCKED, needs Nenad.** Only `DraftAndLens_CodePrompt_MentorRegister_Addendum.md` exists (register/disposition), not a feature spec.
5. **Differentiator messaging — blocked behind 4** by its own stated dependency.

Everything not requiring a product decision is done. Deliberately not started: anything in the pre-paid-launch checklist or the legal cluster, and the UI exploration (whose own file sequences it after the audit, which has now run).

### Resume note — timeline reasoning (ledger phase 3), 2026-08-18

Stopped at a usage checkpoint while scoping phase 3. **No code written, nothing in flight, tree clean.** Items 1 (detection) is done and verified live; 2–4 remain. What the design read established, so the next session does not re-derive it:

**Phase 3 is not one feature. It is three separable pieces, and only one of them is genuinely blocked.**

1. **Frame storage and accumulation — buildable now, no decision needed.** `deriveFrame` (`src/ai/detection-pass.ts`) reads linearity off *this submission's* `structuralMap` only, and leaves `unreliableNarrator`/`multiplePov` null always. Two consequences: the §5.1 and §5.3 gates are inert, and because the structural reader is gated at the word cap the map is almost never produced, so the frame is unknown on essentially every real submission and everything demotes. The design says the frame is "inferred silently" (ruling 1) — inference accumulated across a manuscript's chapters and stored on `manuscripts` is implied by that and needs no new ruling. This is the highest-value unblocked piece.

2. **Promotion on established frame — blocked on an interaction that does not exist.** Sub-question 1a resolved 2026-08-15 as *unknown-and-demote, then promote once dismissal behaviour establishes the frame*. `continuity_facts.reconciled_at` is the column, and `gatePair` already reads it — the data side is ready. What is missing is the writer marking a flag as intentional, i.e. §6a needs a dismissal control. Whether that control exists, and what it says, is a product decision.

3. **State locks (§5.7) — the actual driver of ruling 7,** which promoted timeline reasoning precisely because state locks are not honestly checkable without it. §5.7 already specifies the violation condition concretely: the character must appear as a **live participant in present-tense narration** at a later sequence position with no flashback or dream marker; where that cannot be established it demotes to worth-checking and names the likely explanation first. That is implementable prose, but it needs the frame from (1) to be worth anything.

**Boundary to hold, from §3:** *compare assertions, never compute chronology.* "Born in 1971" vs "born in 1968" is in scope; working out whether chapter 9 precedes chapter 2 is not. Phase 3 must not quietly cross that line — §5.4 says the boundary is load-bearing, and the design is explicit that death locks are the most intuitive lock and the least checkable, so copy must not over-promise.

**Suggested order next session:** (1) frame storage + accumulation, then (3) state locks on top of it, and raise (2) with Nenad as the one real decision.

### Frame storage — no migration needed, 2026-08-18

Checkpointed before writing code. **Nothing in flight, tree clean.** One finding that changes the plan in the previous resume note:

**`manuscripts.narrative_frame jsonb` already exists** (`continuity_ledger.sql`), with a header stating exactly the semantics phase 3 needs: the three §5.1 frame properties, "inferred from behaviour, never asked (ruling 1)", and NULL means UNKNOWN and must never be read as a permissive default. So frame storage needs **no migration** — the column was provisioned in phase 2 and has never been written to. The previous note's plan to add columns is superseded.

**Accumulation semantics worked out, for whoever picks this up:**
- `nonLinear` must be **sticky true**. One mapped chapter reading as linear does not make the book linear — chapter 1 linear plus chapter 9 a flashback is the ordinary case, and letting an early chapter's evidence set `false` would hand hard tier to exactly the age/date clashes §5.4 names as the exposed edge. So: any chapter non-linear → true, permanently; false only once at least one chapter has produced structural evidence and none was non-linear; NULL until any evidence exists at all.
- `multiplePov` is **derivable today with no model call and no new storage** — two or more distinct non-null `pov_character` values across the manuscript's stored facts is direct evidence. `gatePair` already consumes `multiplePov === true` to demote cross-POV clashes, so this activates a dormant safety gate rather than adding one. Deriving it live from the ledger each run beats storing it: no denormalisation, no drift.
- `unreliableNarrator` has **no evidence source in the pipeline**. It stays null and the §5.1 gate stays inert. Do not infer it from `narrativeStructure` or register — neither means it, and a wrong `false` promotes narration to the book's own voice, which is the §5.2 failure.

**Caveat that limits the value of all of this:** `structuralMap` is the only linearity signal and the structural reader is gated at the word cap, so in practice almost no submission produces one. Frame accumulation is correct to build, but `nonLinear` will stay NULL on real beta traffic until that gate is resolved — which is the flagged `FREE_WORD_LIMIT` / `TESTER_WORD_CAP` decision. `multiplePov` is the piece that will actually fire today.

### Ledger phase 3 (timeline reasoning) — built, 2026-08-19

Three chunks, all committed, 111 tests green, build ✓, IP grep exit 1.

1. **`multiplePov` derived from the ledger** — two or more distinct POV characters across a manuscript's facts. Costs no model call and no storage, and activates the §5.3 cross-POV demotion in `gatePair`, which had been inert since it was written. Names normalised for case/whitespace so `Sarah`/`sarah` across chapters is one POV, not two.
2. **`narrative_frame` accumulation, sticky-true** — folded across every chapter rather than derived from whichever one is in front of us. One chapter reading linear does not make a book linear; once any chapter is non-linear the manuscript stays non-linear. `false` only ever from a standing start. No migration — phase 2 provisioned the column and never wrote to it.
3. **State locks (§5.7) + the locked tier** — deterministic, no model call, one violation per lock citing the earliest later narration appearance.

**~~ACTION REQUIRED~~ — APPLIED AND VERIFIED by Nenad, 2026-08-19. The constraint now includes 'locked'; the locked tier is live. Kept below for the record:**
`draft-and-lens/supabase/migrations/continuity_locked_tier.sql`. It widens the `continuity_flags` outcome CHECK to admit `'locked'`, §6's fourth tier. **Nothing breaks before it is applied:** lock violations are stored in their own batch, so a rejected `locked` row costs only the lock flags and never the contradiction flags beside them — and since the locked tier requires a manuscript established as chronological, the overwhelmingly common `worth_checking` lock flag stores fine either way. Verify with the query in the file's footer.

**Scope held throughout:** compare assertions, never compute chronology (§3). Nothing added computes whether one chapter precedes another. The innocent explanation (flashback / memory / dream) is shown at BOTH lock tiers, including the firm one, because §5.7 says it stays available and death locks are the least checkable thing the feature offers — the copy does not claim otherwise.

**Still held for Nenad, unbuilt as instructed:** the flag dismissal control. Sub-question 1a's "promote once dismissal establishes the frame" depends on it; `reconciled_at` exists and both `gatePair` and the new state-lock check already honour it, so only the interaction is missing.

**Known limit, unchanged:** `nonLinear` will stay NULL on real beta traffic because `structuralMap` is the only linearity signal and the structural reader is gated at the word cap. Frame accumulation is correct and will start working the moment that flagged `FREE_WORD_LIMIT` / `TESTER_WORD_CAP` decision is made. `multiplePov` fires today.

### Mentor mode built and verified live; differentiator messaging — 2026-08-19

**Part A — mentor disposition.** Audited first, as the addendum requires. Item 1 needed no change: the mode prompts already carry the mentor register ("MENTOR STANDARD", honest-without-harshness). Item 2 was a genuine gap — no closing growth element existed. The old "Where To Begin"/"Action Plan" tails that might have supplied one were collapsed into WHAT TO REVISE by corpus v2.10, and that list is about the draft, not the writer. So `WHERE TO GROW NEXT` was added to the always-include set across story/script/treatment. One more section in the existing analyst pass — no second model call, as the addendum forbids.

**Verified live on production, first read, no prior stored.** The section rendered as `sec-09` and appears in the sidebar. It gave ONE forward direction, framed as the writer's capacity ("you could take this facility… and practise carrying it backward into time"), grounded in evidence from that very text ("already alive in the cooling water and the wheel that caught"), pointed at future work rather than this draft — **and invented no history.** That is the addendum's verify criterion 1 passing on real output.

**Part B — memory framing.** The acknowledge-the-change half already existed in `buildRevisionDirective`. Added the half that needs evidence: `getPriorRevisionNotes` returns the stored WHAT TO REVISE from the previous reading of the same work, or null. Null is the load-bearing case — the caller passes null rather than a placeholder, so no code path invites a past that was not given. The no-fabrication law is structural, not merely instructed, and the tests assert the absence as carefully as the presence.

**CLAUDE.md sidebar counts updated:** `parseReport` lifts only WHAT TO REVISE, so WHERE TO GROW NEXT lands in the Analysis group. Analysis max 12 → 13, base 25 → 26, ceiling 27 → 28.

**Differentiator messaging (item 4) — the subtle half is DONE; the escalation is FLAGGED for Nenad.**
The 2026-08-02 handover §6 defines two distinct things, and only one of them was mine to build:
- *The subtle version* (its line 35): the persona references something concrete from the writer's own previous submission, demonstrating persistence "without ever saying so directly". **That is exactly what Part B now does** — where a revision answered an earlier note, the reading says so plainly. No comparison, no competitor named, method shown rather than claimed.
- *The escalation* (its line 36): breaking toward directness with an explicit method line. **Not built, deliberately.** Three reasons it is Nenad's, not mine: the copy is marked "(draft, not final copy)"; it must fire "once, not repeated", and *once per what* is undefined (per writer? per work?) with no user-state storage existing to track it; and the handover's own closing instruction is explicit — "Don't guess at how prominent the differentiator messaging should be — start subtle as agreed, flag back before escalating to anything more visible/marketing-like."
- Also worth carrying: the line "only works if the feedback right after it is sharp and specific enough to validate the confidence in the same breath". Whatever gates it must be a quality gate, not just a memory gate.

**Beta list now:** 1 detection ✓ · 2 timeline reasoning ✓ · 3 mentor mode ✓ · 4 differentiator — subtle half ✓, escalation awaiting Nenad. Next in the UI backlog's order is the periodic audit (already run 2026-08-18) and then the new UI exploration.

**Still awaiting Nenad:** the flag dismissal control; the `FREE_WORD_LIMIT`/`TESTER_WORD_CAP` decision that keeps `nonLinear` NULL on real traffic.

### State locks VERIFIED LIVE at the locked tier — 2026-08-19

Manuscript "The Salt Line": chapter 1 establishes Elena Barros and her death; a **writer state lock** was created through the real API (`POST /api/ledger/[manuscriptId]`, 201) as `character:elena_barros / state = dead`, `lock_kind=state`, `lock_from_sequence=1`; a later chapter puts her back on the page in narration. Stored flag: `outcome = locked`. Rendered in §6a under a red rule with the label **LOCKED**, sorted above everything, with the innocent explanation still shown. Screenshotted.

**Test fixture disclosed:** `narrative_frame` was seeded to `{nonLinear:false}` directly rather than learned, because learning it needs a structural map and that needs a ≥4,000-word chapter against a 4,000-word cap. The tier logic and rendering are genuinely verified; **frame accumulation from a real structural map is still not verified live.**

**Finding 1 — the lock check sees extracted FACTS, not appearances.** Chapter 2 had Elena in narration throughout and raised nothing, correctly: every Elena fact it produced was `register = dialogue`, and §5.2 rightly excludes those. Chapter 3 raised the violation only because it stated physical facts about her in narration (height, hair, scarring, age). So a character can be a live participant in present-tense narration for a whole chapter and stay invisible to the check if nothing *extractable* — name, physical, age/date, relationship — is asserted about them in the book's own voice. The design's condition is "appears as a live participant in present-tense narration"; what the ledger can actually see is narrower than that. Not a bug — the gate is behaving as written — but the feature is less sensitive than §5.7 implies, and that gap should be stated plainly rather than discovered by a writer whose death lock stayed quiet.

**Finding 2 — a lock violation cannot be promoted later.** Flags are unique on `(fact_a_id, fact_b_id)` and stored with `ignoreDuplicates`, so a violation first raised at `worth_checking` (unknown frame) can never be re-stored as `locked` once the frame becomes known. Sub-question 1a says ages/dates and state locks "sit at worth-checking until dismissal behaviour establishes the frame, **then promote**". Nothing promotes. This is why the frame had to be established *before* the first violation in this test. Fixing it means either an update-on-conflict for a strictly higher tier, or re-adjudicating lock pairs each run — a design call, not a mechanical fix.

### Verification pass complete — 2026-08-19

**Mentor Part B VERIFIED LIVE, no-fabrication law included.** A revised chapter produced a reading that named the change specifically: *"the previous draft explained both the misreading and the correction; this version holds both in a single syntactic movement."* Checked against the stored prior notes rather than taken on trust — the earlier reading's WHAT TO REVISE said verbatim *"The sentence is explaining both the misreading AND the correction. Cut the second clause."* So the claim came from the real note it was handed, not invented. Grounded, specific, and without reproach.

**`multiplePov` NOT verified live — blocked upstream, not in the derivation.** A deliberately dual-POV chapter (section headings, two close-third centres, two named viewpoint characters) came back with every fact classified `narration_omniscient` and `pov_character = null`. Across the whole test manuscript only one distinct POV value ever appeared, so `deriveMultiplePov` correctly returned null.

The derivation is unit-tested and correct; the **extractor rarely assigns `pov_character` at all**. So the §5.3 cross-POV gate remains effectively inert in practice even now that something consumes it — the same shape of problem as `nonLinear` depending on a structural map the word cap suppresses. Both gates are correctly built and starved of input. Making the extractor assign POV reliably is its own piece of work and a prompt-design decision.

**`narrative_frame` accumulation still not verified live.** It requires a structural map, which requires ≥4,000 words against a 4,000-word cap. For the lock test the frame was seeded directly as a disclosed fixture. Unit-tested (sticky-true, including that a later linear chapter cannot un-learn a non-linear book), but never observed learning from real evidence.

**Test data deleted.** Manuscript "The Salt Line" plus 5 readings, 22 facts and 1 flag; also the standalone "The Quiet House" used for the Part A check. Verified after: `Home` is the only manuscript, its 3 readings and 9 facts intact, no readings from today remain, `continuity_flags` empty.

**Live-verification scoreboard**
| Item | Live? |
|---|---|
| Detection §6a contradiction | ✅ |
| State locks — locked tier | ✅ (frame seeded) |
| Mentor Part A — WHERE TO GROW NEXT | ✅ |
| Mentor Part B — memory framing | ✅ |
| Grouping stopword fix | ✅ |
| `multiplePov` | ❌ extractor does not assign POV |
| `narrative_frame` accumulation | ❌ needs ≥4,000 words vs a 4,000 cap |
| Differentiator escalation | not built — Nenad's call |

### Lock promotion fixed and VERIFIED LIVE; ledger sensitivity logged as a constraint — 2026-08-20

Two commits, 123 tests green, build ✓, IP grep exit 1, deployed.

**1. `docs:` the ledger-sensitivity finding is now a recorded constraint, not an open bug.** `DraftAndLens_Internal_Research_Notes.md` gains a *Known constraints — built as designed* section: state-lock checks fire on extracted facts, not on presence, so a locked character can be on the page for a whole chapter and stay invisible unless something extractable is asserted about her *in the book's own voice*. Recorded with why it stays (loosening it breaks §5.2; it fails in the safe direction — a quiet miss, not a false accusation) and what it costs (a copy obligation: a silent lock means nothing was found, never that the manuscript is clean). `multiplePov` and `nonLinear` are logged alongside it as correctly built and starved of input.

**2. `fix:` a flag can now be promoted, never demoted.** This one was a real defect against sub-question 1a, which resolves as unknown-and-demote *then promote*. Nothing promoted: flags are unique on `(fact_a_id, fact_b_id)` and were stored with `ignoreDuplicates`, so a violation first raised at `worth_checking` under an unknown frame was pinned there for the life of the manuscript. `storeFlags` now runs a promotion pass over exactly the rows the insert declined — strictly upward, compare-and-set on the outcome it read, `reading_id` moved to the promoting run so §6a shows it where the writer is actually looking.

**Verified live against the production ledger**, three runs on one throwaway manuscript, no model calls (the two facts differ in attribute, so no candidate pair):

| Run | Frame evidence | Stored frame | Flag |
|---|---|---|---|
| 1 | none | `null` | row `f96973dd` — `worth_checking`, ceiling `worth_checking` |
| 2 | structural map: linear | `{nonLinear:false}` | **same row**, now `locked`, ceiling `hard`, reading_id moved |
| 3 | structural map: non-linear | `{nonLinear:true}` (sticky) | same row, **still `locked`** — no demotion |

Run 2 is the fix: before it, that row could never leave `worth_checking`. Run 3 is the guarantee that matters just as much — a manuscript that turns non-linear later must not silently retract a finding the writer has already been shown. Test manuscript, facts and flag hard-deleted afterwards; `Home` verified as the only manuscript remaining.

**Scope held:** this fixes the state-lock half of 1a. The fact-pair half (age/date clashes) additionally needs pairs to be re-adjudicated when the frame changes, which costs model calls per pair — a cost decision, not a mechanical fix, and deliberately not taken here.

**Found while scoping the remaining verification:** the structural reader runs at `wordCount >= 4,000` and the route rejects `> 4,000`, so a submission of **exactly 4,000 words** is the one width of window where a real structural map can be produced under the current cap. That is the route to verifying `narrative_frame` accumulation from real evidence rather than a seeded fixture.

### Verification found five token ceilings set below their own brains' output — 2026-08-20

Continuing the verification list (multiplePov, narrative_frame, Mentor Part B) turned up a defect class that had nothing to do with the ledger and mattered more than any of them. Five commits, 123 tests green, build ✓, deployed.

**How it surfaced.** `narrative_frame` had never been seen to learn, and the standing explanation was the word cap. Scoping that, I found the one width of window where a map is possible today: the route rejects submissions **above** 4,000 words and the structural reader runs at **4,000 or more**, so a submission of exactly 4,000 words reaches it. A 4,000-word test chapter (deliberately non-linear, two named POV centres) was run through the real pipeline — and the map came back null anyway, with the diagnostic reading `title: Untitled · tradition: Unknown`.

That was not the word cap. **The structural reader was stopping at `max_tokens` on every single call**, and because it is a JSON brain, truncation is not partial output: `parseJsonLoose` returns null and the entire map is discarded, which `.catch(() => null)` in the orchestrator makes indistinguishable from a brain with nothing to say.

**Measured, then fixed — each brain's natural output against the ceiling it had:**

| Brain | Ceiling | Natural output | What truncation cost |
|---|---|---|---|
| `structuralReader` | 2500 | 3,025–3,550 | Whole map discarded. **The real reason `narrative_frame` never learned.** |
| `diagnostician` | 800 | 677–958 | FALLBACK on **3 runs in 6** — tradition 'Unknown', register 'Unknown', empty ambition, for the whole reading. Every downstream brain is handed the tradition as locked (P1). |
| `narratorCorrector` | 6000 | 6,175–6,609 | **Reports delivered ending mid-sentence.** See below. |
| `bible` | 1200 | 2,240–2,356 | Character bible cut in half, mid-entry, and shown that way. |
| `market` | 1200 | 1,159–1,204 | Ceiling sat exactly ON the output; a long run drops the market section silently. |
| `narratorVerifier` | 1000 | 500 for 4 lines; **804 observed live** | Null verdicts → the narrator correction pass does not run at all. Raised because its input just grew: a complete structural map carries longer `narratorBehaviour` lists. |
| `scorer` | 800 | 405–416 | Healthy, unchanged. |
| `continuityExtractor` | 3000 | 1,343–1,426 (17–18 facts) | Healthy, unchanged. |

Not measured, so not touched: `moderation`, `detection`, `lens`, `conversation`. `lens`/`conversation` are in the modules the 2026-08-18 audit found never execute, so their entries here may not be live values at all.

**The narrator corrector deserves its own paragraph, because it was reaching writers.** It returns the *whole corrected report*, so its ceiling has to clear the analyst's 16,000 — at 6,000 it could not. Measured on an 18,609-char report: the call stopped at `max_tokens` having produced 18,575 chars, and the guard written to catch exactly this — `corrected.length > analysisText.length * 0.7` — **accepted it**, because a truncation that loses the last 3% is still 97% of the original. The delivered report ended `"This is a controlled,"`. The same call at 16,000 finishes in 6,175 tokens and closes properly.

**Follow-up, not done here:** that guard is length-based and cannot see a `stop_reason` of `max_tokens`. Raising the ceiling puts the truncation out of reach; it does not make it detectable. The structural fix is to surface `stop_reason` from `callTextBrain` so truncation is a fact rather than an inference — that changes a shared signature and every call site, so it wants doing deliberately rather than at 2am.

**Cost of the change:** ceilings are billed for what is used, not what is allowed. Per submission this adds roughly 1,100 output tokens (bible), 300–1,000 (structural reader), 150 (diagnostician) — cents, in exchange for a diagnostic that parses half the time instead of always failing, a bible that finishes, and reports that do not stop mid-sentence.

**Verification scoreboard, updated**

| Item | Live? | Evidence |
|---|---|---|
| Lock promotion `worth_checking` → `locked` | ✅ **new** | Same flag row promoted on the frame becoming known; no demotion when it went back to unknown |
| `narrative_frame` accumulation | ✅ **new** | `{nonLinear: true}` stored from a REAL structural map — "non-linear — multi-timeline with frame narrative" — not a seeded fixture |
| `multiplePov` | ✅ **new** | `pov_character` = `maren` / `halvard` / null on three consecutive runs; `deriveMultiplePov` → true |
| Mentor Part B — memory framing | ✅ | End-to-end 2026-08-19; re-checked read-only today against production: works with a prior reading return the real stored WHAT TO REVISE (capped at 1,800 chars), works without one return null |
| Detection §6a contradiction | ✅ | 2026-08-18 |
| State locks — locked tier | ✅ | 2026-08-19 |
| Mentor Part A — WHERE TO GROW NEXT | ✅ | 2026-08-19 |
| Differentiator escalation | not built | Nenad's call, unchanged |

**Disclosure on method:** today's runs went through the real brains, the real Anthropic API and the production Supabase, but not through the browser — this Chrome profile's session showed signed-out when the work started, so submissions were driven by calling `runAnalysisPipeline` / `runContinuityExtractor` / `runDetectionPass` directly, exactly as `/api/analyse` calls them. The route's own word gate is arithmetic and was read rather than exercised. Every test manuscript created was hard-deleted; `Home` verified as the only manuscript remaining after each run, with its readings and facts untouched.

**Still awaiting Nenad, unchanged:** the flag-dismissal control; the differentiator escalation; and the `FREE_WORD_LIMIT` / `TESTER_WORD_CAP` decision — which is now the *only* thing keeping `nonLinear` from learning on ordinary traffic, since a structural map needs 4,000+ words and the cap rejects anything above 4,000.

### Word cap standing decision applied; internal dead zone removed — 2026-08-20 (later)

**Working tree cleared, as agreed.** Four commits: both `.gitignore` files (the root one carries the `.env*` and legal/trademark rules — they were protecting nothing outside this one disk); the six untracked working docs including both handovers; the eight new lens voice portraits; and new ignore rules for `graphify-out/`, `.claude/launch.json` and `scripts/.tmp-*`. Left uncommitted at Nenad's instruction: `Ads/`, `Inspiration/`, `draftandlens.png`, `Lucas.jpg` (a modification, 445,790 → 63,620 bytes, not an addition). Also still untracked and not in either list: `DraftAndLens_Prototype_Component_CSS.css` — it sat in the same "bulk asset" row and was not named either way, so it was left alone.

**`DraftAndLens_WordCap_StandingDecision.md` is now committed.** The file's own stated purpose is to be the permanent record of a decision that was agreed once, never written down, and cost real time to re-derive. Sitting untracked on one disk it was not that yet.

**The dead zone is gone.** Brain 1b and the narrator verifier ran only at `wordCount >= 4,000` while the route rejected anything `> 4,000` — so a submission of exactly 4,000 words was the only one that could produce a structural map, and every other length got a null one indistinguishable from a brain with nothing to say. The gate and its constant are deleted; both stages now run at every length.

Two stale rationales went with it, in the same commit: `limits.ts` justified the cap by keeping readings under a "5,000-word structural-reader threshold" that was in fact 4,000 — the two numbers had already met, which is how the window appeared — and the structural reader's own header still claimed it was skipped below 5,000.

**Verified live at 700 words** — a length that could not previously produce a map at all:

- structural map returned: `"linear — single continuous scene unfolding in real time on one Tuesday…"`
- `narrative_frame` stored as `{nonLinear: false}` — learned, from real evidence, at 700 words
- `deriveMultiplePov` → null, correctly: one POV character in that excerpt is the honest answer, not a failure

**Not touched, and flagged rather than assumed.** `adaptiveAnalystConfig` still branches at 800 and 3,000 words, and `cost-log`'s Micro/Short labels at the same numbers. These are not dead zones under the decision — nothing is disabled either side, the token ceiling is 16,000 at every tier, and the only real boundary is sonnet → opus at 3,000. That is "lighter, appropriately-scaled", which the decision explicitly allows. If Nenad wants that boundary gone too it is a cost decision (opus on every 500-word piece), not a bug fix.

**THE COST, MEASURED — Nenad should see this number.** The structural and narrator stages now run ahead of the analyst on every submission. On the 700-word run: structural reader **45.9s**, narrator verifier **9.4s** — about **55 seconds added before the report starts streaming**, on pieces that previously skipped both. Total wall clock 254s. The stage pill does say "Mapping the structure" throughout, so it is not a blank screen, but the Latency Diagnostic Brief's own 5A concern is exactly this.

This is the accepted cost of the decision, not a surprise. If it turns out to be too much, the lever is making Brain 1b cheaper — a faster model for `structuralReader`, or a tighter map — **not** re-introducing a threshold, which is the thing the decision forbids. Raised as an option, not acted on.

**The route's rejection copy is unchanged**, deliberately. It already reads warmly — "Draft & Lens reads best in focused pieces right now — please paste up to about 4,000 words (a chapter, a short story, or an excerpt). Full-length novels and scripts are coming soon." The decision doc says the exact wording waits on the Editor's voice being finalised, so rewriting it now would be guessing at copy that has a proper source coming.

### Fragment mode built and deployed; live UI check BLOCKED on sign-in — 2026-08-20 (late)

Two commits, 131 tests green, build ✓, bundle IP grep exit 1, deployed.

**`8fffd59` — server path.** `kind: 'fragment'` branch on `/api/converse`; existing conversation contract untouched. `src/lib/fragment.ts` (routing, no word count anywhere — a test pins that), `src/prompts/fragment.ts` (server-only IP), `getFragmentContext` in readings.ts (read-only), `TOKEN_LIMITS.fragment = 1200`.

Verified against the real model, three cases: a craft ask returned three paragraphs of specific line-level reading quoting the writer's words; a free-text question needing the whole chapter redirected without half-answering; a deliberate bait asking for a mark out of ten plus a rewritten sentence refused both in one line and then gave a real reading. 380/354 tokens against 1200.

**`f2a3ffc` — the door and the upfront ask.** `FragmentPanel.tsx`, mounted in page.tsx with an import and one element. Three options plus free text, `fit` offered only when `/api/works` reports something read. All copy placeholder.

**WHAT IS NOT VERIFIED, and why.** The signed-in flow. This Chrome profile is signed OUT of draftandlens.com (it was signed in earlier today; the session has since dropped), and signing in is not something I can do. Confirmed live as far as is possible without a session:
- the panel ships and renders — Chrome's DOM search finds the entry button on the deployed page;
- the endpoint is guarded — an unauthenticated POST to `/api/converse` with `kind: 'fragment'` gets a 307 to sign-in, never a reply;
- the IP boundary holds — `.next/static` grep for the new fragment prompt phrases returns exit 1.

**Two minutes for Nenad, signed in, to close it:** open draftandlens.com → "Just have a passage and a question?" beneath the Analyse button → paste any paragraph → (1) "how the writing itself is holding up" should return 3-4 paragraphs of prose in seconds, no headings, no score, no rewritten line; (2) the free-text box with *"add this to my chapter and tell me if it's cohesive now"* should decline and ask for the chapter; (3) "does this fit with what you've read" should be selectable given existing works. Nothing should appear in the works list afterwards — the exchange is stored nowhere.

**Deliberately not built, flagged rather than hidden:** the spec's "which lens speaks" clause. The server composes a lens voice when `target` is a lens id, but the panel does not yet offer a picker, so v1 answers in D&L's editorial voice. The mechanism is there; the UI increment is small.

**Next:** differentiator messaging — mechanism plus user-state storage, placeholder copy, final wording to Nenad before it goes live. Not started.

### Both live-test issues fixed and VERIFIED LIVE — 2026-08-20 (late)

**Issue 1 — a 30-word paste ran the full pipeline. `05896b1`.**
Nothing failed to route; nothing was routing. Fragment mode shipped as a separate door and the Analyse button had no knowledge of it, so a short paste took the only path it knew. Fixed at the entry point in both places — page.tsx hands the passage to the conversation instead of starting a reading, and `/api/analyse` returns 422 with `offerFragment` as defence-in-depth.

**Verified live, signed in:** a 31-word paste with Story + Complete piece selected, Analyse clicked — **no `/api/analyse` request was made at all** (network panel confirms), the fragment panel opened by itself carrying the passage across, and the craft option returned three paragraphs of specific line-level prose in under nine seconds. No headings, no sections, no score, no rewrite. During an earlier attempt against a mid-deploy bundle the server guard alone was observed returning 422, so both layers are confirmed independently.

`FULL_READING_MIN_WORDS = 200` is a product number and is Nenad's — the point below which a full reading is not honest, not the point below which fragment mode is nicer. It sits against the Word Cap standing decision and the commit explains at length why it is not the kind of gate that decision forbids: it is not inside any brain, and it asks rather than silently rerouting.

**Issue 2 — the font swap. `98d7feb`. It was never a font-loading problem.**
Two earlier passes chased `display: swap`, declared variants and synthesised weights; the 2026-08-16 commit's own note admits its swap fix was unproven. It was unproven because none of those was the cause.

The reading is rendered by two components holding two independent copies of its typography, and they disagreed:

| | streaming (ReportSkeleton) | finished (ReportView) |
|---|---|---|
| body prose | `--font-serif` | inherits `--font-sans` |
| section headings | mono .72rem uppercase amber-d | serif .9rem 700 ink |

So every line changed face the instant streaming ended. Body metrics matched, so nothing reflowed and only the letterforms moved — which is exactly what it looked like, and it happened on **every** reading, not intermittently.

Fixed by deleting the second copy rather than correcting it. The body wrapper now declares no typography at all — FormattedBody's own `<p>` already owns size, line-height and colour, and family is the one property it inherits, so streaming now inherits sans from `globals.css` exactly as the finished report does (the prototype's own arrangement). The heading constant is aligned to the finished view, which the design system names as correct. Both carry comments saying why they must not re-declare type.

**Verified live by measurement, not by eye** — computed styles sampled mid-stream and again after completion on the same reading:

| | mid-stream | finished |
|---|---|---|
| body font | `IBM_Plex_Sans` | `IBM_Plex_Sans` |
| size | 16.56px | 16.56px |
| line-height | 31.1328px | 31.1328px |

Identical. Section headings render Libre Baskerville 700 at `--ink` in both. The staging phase is fully styled throughout.

**Why it looked like a regression:** with the narrator corrector's ceiling fixed the night before, that pass now actually runs, so the final text differs from the streamed text as well as the face. The swap had been there all along; the wording moving made it impossible to miss.

**Left on the account:** one test reading from a 260-word excerpt, created to verify issue 2. Deleting readings is destructive and it is Nenad's data, so it stays until he says otherwise.

### Differentiator messaging built — migration awaiting Nenad — 2026-08-20 (late)

`d069c93`. 137 tests green, build ✓, IP grep exit 1, deployed. **Nothing shows yet, by design.**

**Once-ever is a schema guarantee, not caller discipline.** `user_milestones` has a composite primary key on `(user_id, milestone)`, and `claimMilestone` attempts the insert rather than checking first. Check-then-show has a race in it, and that race's outcome is a writer being told the same thing twice by a sentence whose entire claim is that the product remembers. A failed insert has no window. Per Nenad's 2026-08-20 ruling the milestone is per WRITER: one showing per account, ever, whatever the work.

**The gate is memory only, and the quality gate is recorded as unenforceable rather than quietly dropped.** §6 says the line "only works if the feedback right after it is sharp and specific enough to validate the confidence in the same breath". What is checkable: the reading is a genuine revision AND prior notes were actually retrieved. Both are required — a revision whose notes came back null was handed null by the no-fabrication law, so it genuinely was not read against anything, whatever its revision status says. What is not checkable at runtime is whether the reading that follows is any good, and a guess there would let the product make its loudest claim over its weakest reading. `lib/differentiator.ts` states this in the file rather than leaving it to be rediscovered; the mitigation is editorial, so **the final copy should be judged against a mediocre reading, not only a good one.**

**There is no differentiator spec file to note this in** — the source is the 2026-08-02 handover §6, which is a historical record and the wrong place to amend. It is recorded here and in the code. Say if you want a standing spec file for it.

**Fails closed in every direction** — no Supabase, missing table, any error, any conflict all return false and nothing renders. Verified against the live database just now: `user_milestones` absent (PGRST205), `claimMilestone` returned false. So the deployed code is live and inert, which is what keeps unapproved placeholder copy away from a real writer.

**Copy is placeholder and not approved.** A test guards it against naming a competitor or making a comparison — §6's method is demonstration, and a comparison would turn a reading into an advert.

**What is left, in order:**
1. Nenad applies `supabase/migrations/user_milestones.sql` manually.
2. Nenad approves final wording (replaces `DIFFERENTIATOR_PLACEHOLDER_COPY`).
3. Live verification, which needs three readings on one work: an original, a genuine revision (line should appear once, under the revision banner), and a second revision (line must NOT appear again). Until step 1 the third check cannot be distinguished from the fail-closed path.

### Differentiator VERIFIED LIVE — three readings, all three checks pass — 2026-08-20 (late)

Migration applied by Nenad. Verified on production with three real readings of one work, driven through the browser signed in.

| # | Submission | Revision banner | Method line | `user_milestones` |
|---|---|---|---|---|
| 1 | original, 227 words | — | **not shown** ✅ | empty — the claim was never asked for |
| 2 | genuine revision, 227 words | shown | **shown once** ✅ | one row, `23:10:16` |
| 3 | second revision, 222 words | shown | **not shown** ✅ | still one row, same timestamp |

Reading 1 is the check that matters most for the mechanism's design: the memory gate failed, so `claimMilestone` was never called and the account's single showing was **not** burned on a reading that had nothing to remember. That ordering — gate first, claim last — is what makes the one showing land somewhere it means something.

Reading 2 rendered it exactly where §6 wants it: immediately under "Updated reading — this responds to your revision of an earlier draft", 71 characters after it, in quiet italic serif at `--ink-soft` with a hairline rule. And the reading itself validated the claim in the same breath without being asked to — the OVERVIEW opened *"The revision has sharpened the piece materially. The gull sentence, which in an earlier form carried an explanatory clause about what birds know that people cannot see, has been cut to its bone…"*. That is the quality gate happening by luck rather than by enforcement, which is exactly the distinction recorded in `lib/differentiator.ts`.

Reading 3 confirms the once-ever guarantee against a second qualifying reading, not merely against a repeat of the same one.

**Cleanup, both reversible for 30 days:**
- The milestone row was **deleted to re-arm the account**, using the procedure in the migration footer. It had been spent on placeholder copy, and leaving it would have meant Nenad's own account could never see the approved line.
- The Halloran test work (3 readings) soft-deleted. Six works remain, all his.

**Still required before this reaches a writer:** final wording. The mechanism is verified; the copy is not approved.

### Depth & Scenarios spec — three of four parts built and verified live — 2026-08-21

Build order followed as specified. 144 tests green, build ✓, IP grep exit 1 throughout. Four commits.

**1. Tradition depth — ambition against execution (`a27b156`).** Brain 2 now separates a writer working IN a tradition from one reaching FOR it. Built as an analyst system-prompt extension rather than a new pass: a second call would need the whole text and the whole diagnostic to say anything, which is Brain 2's job description at Brain 2's cost, with a seam down the middle of the reading. Attached to the analyst rather than a TRADITION ALIGNMENT body because story and treatment have that heading, script calls it GENRE ALIGNMENT and stage play has neither.

Three guards against the obvious failure, which is condescension: the innocent reading is mandatory and comes first; the gap must be named in the tradition's own vocabulary, with generic quality words explicitly forbidden; and it runs both ways.

**Verified twice.** On a deliberately thin imitation-minimalism passage the reading returned *"In minimalist realism, spare means every sentence carries load; thin means less in it than it needs. This sentence is thin: it occupies space and does zero work."* — and in the same reading correctly read `He did not wash it` as the instrument working rather than the same failure. Then live in the browser on production, where the OVERVIEW framed the whole reading as *"does the restraint carry load, or is it merely thin?"*

**2. Scenarios page, `/how-i-read` (`b49054f`).** Live, in the nav between About and Glossary, first person throughout, reusing `closeOrGoBack` (whose fallback path list needed the new route adding or Close would have stranded anyone arriving in the same tab).

**SCENARIO 5 IS DELIBERATELY ABSENT.** The spec lists six; five shipped. The missing one is cross-submission pattern recognition — Gap 2, not built. Shipping it would have this page tell writers I notice things across their work when I demonstrably do not, and a retention page is exactly where that temptation is strongest. The file says so where the next person will read it. It goes in when Gap 2 does.

**3. Contextual nudges (`49b325f`).** One per reading, once per writer ever, never beside the method line. Evaluated at the very end of the stream — the only point where extraction has finished or been skipped AND the differentiator has fired or not — and claimed last, so a nudge the writer will not see cannot consume their single showing. `countSubmissions` runs before the reading is stored, which is what makes "their first" and "their third" answerable without inference.

Priority departs from the spec's table order deliberately: what actually happened beats what might happen, so a first reading that also contributed facts gets the ledger line.

**Verified live end to end:** a 220-word chapter grouped into a throwaway book extracted 13 facts, `nudge_ledger_tracking` was claimed at 00:21:07, and the line rendered as designed — quiet italic serif, hairline rule, DISMISS control — after the reading's action block and before the lenses. Dismiss removed it. No differentiator appeared, correctly, since this was a new work rather than a revision.

**Two catalogue entries not built,** with reasons in `nudges.ts`: the fragment-redirect nudge belongs to a different surface with a different transport, and the tradition-gap nudge has no deterministic signal — pattern-matching the report for "thin" would fire on readings that merely used the word, and a nudge that guesses wrong claims the writer's one showing forever.

**Test data removed:** manuscript, facts, work and nudge milestone rows all deleted. `Home` is the only manuscript, 6 works, `user_milestones` empty.

**4. Cross-submission pattern recognition — NOT BUILT, FLAGGED, as instructed.** It needs a `writer_patterns` table and therefore a Supabase migration Nenad applies by hand. Stopping here was the instruction. When it is picked up, the design questions already visible: what counts as evidence of a pattern (Brain 2 identifies tendencies in prose, not as structured output, so something has to extract them); how a pattern is dismissed and where that lives; and the strict gate that a pattern is never named from one submission.

**Everything above ships with placeholder copy** for the nudges, awaiting approval the same way the method line was.

### For Nenad on return — nudge copy, page copy review, and the Gap 2 design — 2026-08-21

## 1. The three nudge lines, exactly as they stand in `src/lib/nudges.ts`

| Milestone | Fires when | Copy |
|---|---|---|
| `nudge_ledger_tracking` | this submission contributed facts to a manuscript ledger | "I'm tracking names and details across your chapters now." |
| `nudge_revision_memory` | a first reading, no prior submissions | "If you resubmit this revised, I'll read it against what I said here." |
| `nudge_keep_sending` | the third submission (two prior) | "The more you send me, the more I'll notice across your work." |

**One of these has an honesty problem, not a wording problem.** `nudge_keep_sending` promises that sending more work means I notice more *across* it — which is cross-submission pattern recognition, Gap 2, **not built**. As written it is a claim the product cannot keep. Either soften it to something true today (that a work in revision gets read against its own past), or hold that nudge until Gap 2 ships. My recommendation is to hold it: it is the only one of the three that has no true version at present, and it burns the writer's single showing when it fires.

The other two are accurate as shipped. Note `nudge_ledger_tracking` differs from the spec's table by one word — I added "now", because the nudge fires at the moment it becomes true. Revert if you prefer the spec's version.

## 2. `/how-i-read` copy review

**Two false claims found and fixed immediately (`26d94b7`), not queued for approval.** A page whose whole purpose is closing the gap between what the product does and what a writer can see must not overstate it, and leaving an untrue line live while it waits for sign-off is the worse trade. Both corrected lines still need your approval.

- ~~"I show you both passages so you can see what I saw rather than take my word for it"~~ — **false**. `ContinuitySection` renders a flag's `reasoning` and `explanation` only. The two evidence quotes are read during detection and never stored on the flag or displayed. Now reads: "I tell you which chapters they were so you can go and look."
- ~~"I say what would settle it"~~ — **overclaimed**. The worth-checking tier names the innocent explanation; it does not say what evidence would resolve the question. Now reads: "I name the innocent explanation before the awkward one."

**Worth your judgement, not obviously wrong:**
- *"If a note I gave you didn't land, I'll say that too."* Part B is instructed to speak to whether a revision addressed earlier notes, so this is plausible — but it is not guaranteed by anything structural, and it is the page making a promise on the model's behalf. Softening to "where a note didn't land, I'll usually say so" would cost little.
- *"I start keeping a ledger"* uses product vocabulary. The sentence defines it inline, so it reads acceptably — but "ledger" is a glossary term, and this is the one place the page names machinery rather than behaviour.

**Clean on voice throughout otherwise** — first person, no product-speak, no competitor named, no feature lists. The banned-phrase grep returns nothing against this file.

**Still true and worth keeping in mind:** the page has five scenarios, not the spec's six. Scenario 5 is cross-submission patterns and stays out until Gap 2 exists.

## 3. Cross-submission pattern recognition (Gap 2) — design note, for your decision

### 3a. Getting structured tendencies out of Brain 2's prose

Three options considered; one recommended.

**Recommended — a small extractor brain over the finished report.** Mirrors `continuity-extractor` exactly: runs post-delivery so its latency is invisible, reads the *report* rather than the manuscript (~19k chars, cheap), and returns at most two or three candidate tendencies, each with the verbatim sentence from the reading it came from. Its one law is that it may only **restate a claim the reading already made** — never generate a new judgement. That makes it structurally incapable of inventing a pattern the reading did not support, which is the same discipline that makes the continuity extractor trustworthy.

**Rejected — asking Brain 2 for a JSON tail.** The analyst streams to the writer, so a machine-readable block would stream into the report view and need stripping in `parseReport`; it would sit at the very end of the longest output in the system, which is exactly where the 2026-08-20 truncation bugs lived; and it means editing the most tuned prompt in the product for a non-reading purpose.

**Rejected — deriving from scores or WHAT TO REVISE.** Free, but wrong: scores are dimensions, and the revision list is per-draft and directive. Neither is a *habit*, and squeezing one out of them produces generic creative-writing advice, which the spec explicitly forbids.

**The hard problem is matching, not extraction.** "Over-explains emotional states" in reading one and "the narrator names the feeling the image already showed" in reading four are the same tendency in different words; exact string matching would never join them, and there is no embedding infrastructure here. **Recommendation: a closed vocabulary of tendency keys**, drawn from the LearnedCorpus's own failure vocabulary, which the extractor must choose from rather than free-text. Matching then becomes exact on the key, the gate becomes countable, and — the real prize — every pattern is named in the corpus's terms rather than in whatever words one reading happened to use.

### 3b. Where dismissal lives — and the problem the spec did not see

The spec says pattern dismissal works "same dismissal logic as continuity flags". **There is no continuity flag dismissal.** `reconciled_at` is read in five places — `gatePair`, `state-locks`, `detection-pass` — and written by nothing. No route, no control, no UI. It has been the standing blocked item since 2026-08-18, and it is the same interaction that sub-question 1a's promotion path waits on.

So pattern dismissal would be the **first** dismissal control in the product, not a reuse of an existing one. That is materially more work than the spec implies. Your call between:

1. **Build flag dismissal first, patterns follow it.** Recommended. It unblocks 1a's promotion path as well — the storage half of which is already built and verified — so one interaction pays for two features.
2. **Build pattern dismissal standalone.** Faster to Gap 2, leaves flags still undismissable, and risks two different dismissal idioms later.

**A second mismatch:** the spec places dismissal "in the ledger view", but `/ledger/[manuscriptId]` is scoped to one manuscript and patterns are per-writer, spanning works. They have no home there. The natural place is wherever a writer sees their work as a whole — `/account`, which already lists every work — or a small per-writer page of its own.

### 3c. Gate logic

- **Never from one submission.** `confirmed_count >= 2` counted over **distinct works**, not distinct readings — three revisions of one story are one piece of evidence about the writer, not three.
- **Not before the third submission**, per the spec.
- **Dismissed patterns never resurface**, and dismissal is per-pattern, not per-reading.
- **At most one pattern named per reading**, for the same reason nudges are capped at one: two quiet asides in one reading is clutter.
- **The stored text is what the analyst is handed** — never a paraphrase generated at read time. Same no-fabrication law as Part B: if there is nothing real to pass, pass null.
- **Evidence is retained** (`reading_ids`) so a named pattern can always be traced back to the readings that produced it. A pattern that cannot show its evidence should not be shown to the writer.

**Not built, as instructed** — `writer_patterns` needs a migration you apply by hand. The SQL is not written yet either; it should follow the decisions above, particularly the closed-vocabulary key, which changes the table's shape.

### §5.5 flag dismissal built and verified live — 2026-08-21

`b19cc11`, `99ce41a`. The standing blocked item since 18 Aug. **No migration needed** — `continuity_facts` already carries `reconciled_at` AND `reconciled_reason`, both provisioned in phase 2 and never written to.

Dismissal does two things because the schema keeps two kinds of memory. **The flag becomes `dismissed`**, which is what makes it permanent — a contradiction pair enters `listAdjudicatedPairs` and is never re-adjudicated; a lock violation IS recomputed every run but `storeFlags` can neither insert it (unique pair) nor promote it, because `promotes` treats dismissed as terminal in both directions. That guard was written on 20 Aug before anything could be dismissed; this is the case it existed for. **One fact is reconciled, never both** — the column is per-fact while §5.5 speaks per-pair, so marking both sides would reach past what the writer agreed to. On a state lock the writer's own lock is never the reconciled side: "she's in chapter 3 because it's a flashback" is not "the death no longer holds", and a violation in chapter 12 must still fire.

**Verified against the production ledger, then live in the browser.** Script-level: violation raised at worth_checking → dismissal sets the flag dismissed, reconciles the appearance with the writer's reason, leaves the lock live → a later run under a KNOWN-LINEAR frame (maximum promotion pressure) leaves it dismissed and creates no duplicate. Browser: a seeded chapter-1 fact plus a real submission produced a genuine `contradiction` flag in §6a — "Marta Vey — eye colour" — with the quiet THIS IS INTENTIONAL control beneath it. Clicking removed the flag and the whole §6a section; the database showed `outcome = dismissed` and exactly one fact reconciled.

**One defect found by that verification and fixed (`99ce41a`):** both facts sat at `sequence_index = 1`, so the "reconcile the later one" tiebreak fell through to whatever order `.in()` returned — non-deterministic across runs. Now sorted later-first then by id.

**On completing sub-question 1a's promotion path — the honest position.** It was already complete before this build, and it is worth being exact about why rather than claiming credit for it here. Promotion needs two things: the frame becoming known, and flags being able to move up. Frame learning from structural maps shipped 2026-08-21 (and now runs on every submission since the word-count gate was removed); flag promotion shipped 2026-08-20 and was verified live the same day. What dismissal adds is 1a's *other* half — the suppression side — plus the guarantee that a writer's decision beats the frame becoming known later.

**1a's own wording says "promote once dismissal behaviour establishes the frame", and that clause is still not implemented, deliberately.** Read carefully against §5.5, the worked example is `unreliableNarrator` — "dismiss two or three flags on the same narrator and the product asks once, quietly". It is not `nonLinear`, and it could not be: a writer dismissing an age clash as intentional is evidence the book is NON-linear, which demotes rather than promotes. Inferring a frame from dismissals therefore points the demoting way, and building it would make the ledger *less* confident, not more. Worth Nenad confirming that reading before anyone implements the clause as literally written.

### Lens-voice upload — proposed approach, NO CODE WRITTEN — 2026-08-21

Queued active in `DL_ONLY_ReadFirst.md`. **Nenad approves the approach before any code.**

**The risk is three risks, and the third one is the one that decides the design.** A writer pastes real published Carver: (1) the reading critiques it, and "D&L told Raymond Carver his prose is thin" is a screenshot that ends the product's credibility; (2) the Carver lens is asked to read Carver, which exposes that no lens knows who wrote anything; (3) it is a plagiarism and copyright surface — we would store published text and hand back something that reads as authentication.

**Nenad's proposed signal — title page, byline, known published-work markers — is right, and catches only the careless case.** Someone pasting a scanned page with a copyright line is caught cheaply and deterministically. Someone pasting the prose alone, which is the ordinary case, is not caught at all. So metadata is necessary and nowhere near sufficient.

**The asymmetry that must drive the design:** a false positive is far worse than a miss. Telling a writer "this is published work" when it is their own Carver-influenced prose is an accusation of plagiarism levelled at someone who did nothing wrong — worse than the original problem, and unrecoverable in a way a missed catch is not. Any approach whose failure mode is a confident accusation is the wrong approach, and that rules out simply asking a model "is this published?" and acting on a yes.

**Proposed: two tiers, and neither of them accuses.**

1. **Deterministic metadata gate, pre-model, zero cost.** Byline patterns, `Copyright ©`, `First published in`, ISBN, `From the collection`, epigraph-style attributions, "by <Name>" adjacent to a title. Very high precision, near-zero false positives. On a hit, decline before any brain runs — the same place the word cap and moderation already sit.

2. **A recognition question folded into an existing gate call, not a new brain — and it asks rather than tells.** Where the model recognises the text with high confidence, the writer does not get an accusation. They get something in the register of: *"I think I've read this before. If it's yours, say so and I'll read it properly."* That single reframe converts a precision problem into an interaction: a false positive costs an innocent writer one click, and a true positive costs a plagiarist their cover. It also keeps the product honest — "I think I recognise this" is a true statement about the model's state, where "this is published work by X" is a claim it cannot actually support.

**What declining means:** no reading, no work or reading rows stored, nothing to the ledger, and an editor-voiced response rather than an error.

**Three questions for Nenad, all genuinely his:**
- **Does this apply to fragment mode?** A writer asking "what is this Carver paragraph doing?" is a legitimate and valuable craft question, and the fragment answer never claims the prose is theirs. My inclination: full readings decline, fragment craft questions are allowed. That is a product call about what the tool is for.
- **The 36 lens authors specifically, or published work generally?** Broader is safer and raises the false-positive rate.
- **What is stored on a decline?** I would count it in telemetry and store no text at all.

### Lens-voice gate built and verified live — 2026-08-21

`ab257f0`. 156 tests green, build ✓, IP grep exit 1. Scope per Nenad's ruling: **no author list, no enumeration of works, misses accepted.**

**Gate 1 — publication apparatus, deterministic, free.** Rights formulas, permissions boilerplate, prior-publication statements, ISBNs, cataloguing, the standard disclaimer page.

**A refinement worth reading, because it inverts part of the original sketch.** Bylines, title pages and copyright lines are NOT signals and are explicitly excluded. They are what a writer puts on their own manuscript — "A Novel by Jane Smith" is the most ordinary thing at the top of a submitted draft, and "© 2026 Jane Smith" is a writer asserting their own rights. Using them as evidence of published work would fire hardest on the writers who format a submission properly, and the accusation would land on someone who did nothing wrong. What survives is only apparatus a publisher adds and an author never types. Tests pin the exclusions as hard as the matches.

**Gate 2 — soft model recognition, its own call.** Not folded into moderation, though moderation already runs pre-pipeline on the same opening. The two gates have OPPOSITE failure postures: moderation fails closed because the cost of letting the prohibited set through is unbounded; this fails open because the cost of a wrong refusal is an innocent writer accused of plagiarism. A single parse error in a shared call would either block legitimate work or silently disarm the safety gate, depending which default won. Runs concurrently with the other two gates, so it adds no wall clock.

The model is asked whether it recognises the text, **not who wrote it**, and told not to name it. "I think I recognise this" is a true statement about its own state; "this is Carver" is a claim it cannot support.

**Neither gate refuses.** The writer gets a question — *"I think I've read this before — it reads to me like something already published. If it's yours, tell me and I'll read it properly."* — and answers it in one click. `confirmedOwn` then skips both halves.

**Verified against the real model, four cases:** two public-domain famous openings recognised; original minimalist prose clear; and the case that matters most, deliberately Carver-imitating ORIGINAL prose, clear — imitation is how craft is learned and must never read as a match.

**Verified live on production:** a submission carrying rights boilerplate produced the hold with the confirmation button and **no pipeline ran at all**; clicking "It's mine — read it" cleared the hold and started the reading, which was then stopped so no test data was created.

Fragment mode exempt, as ruled. Declines store nothing — no work, no reading, no text. The telemetry event (`provenance_declined`, added to the existing security-log union alongside `moderation_blocked`, no migration) carries the signal name only.

### Cross-submission patterns — two proposals for Nenad, NO CODE — 2026-08-21

1a confirmed unbuilt and correctly flagged; no action taken there.

## Proposal A — the closed tendency vocabulary

Every key below is a failure **the LearnedCorpus already names**, in the corpus's own words, with its principle cited. None is invented, and that is the point: a closed vocabulary drawn from the corpus makes "generic creative-writing advice" structurally impossible to produce, because there is no key for it.

| Key | Corpus | What the corpus calls it |
|---|---|---|
| `restatement` | P2 | The narrator "explains what the work has already made clear… removes the reader's work". P2 calls this "always a failure" and gives its own cross-form applications: a character speaking subtext aloud in a play, a final sentence stating the theme in fiction. |
| `narrated-not-accumulated` | P5 | The work "narrates a development that should be accumulated" — the reader "is given conclusions without the experience that produces them". |
| `shrinking` | P7 | The narrator "replaces the image's register with something smaller or wrong", against extending, which adds a dimension the image cannot reach. |
| `floating-abstraction` | P11 | Abstraction that "replaces concrete work the scene needs; announces significance the images have already earned, or gestures vaguely where specificity was available" — explicitly NOT abstraction as such, which P11 defends. |
| `unearned-ambiguity` | P13 | The reader "confused because the writing failed to commit", as against ambiguity that is "the product of precision". |
| `borrowed-phrase` | P4 | "Generic material placed against specific material loses the argument… a borrowed phrase placed against hard-won imagery diminishes the imagery." |
| `withheld-payoff` | P22 | Tradition-bound: in contemporary literary realism and autofiction, ending "without emotional specificity has broken its contract". |

**Two of these are tradition-bound and must not be counted outside their tradition.** `withheld-payoff` is a failure in literary realism and a virtue in crime or thriller; `borrowed-phrase` only arises where a juxtaposition is doing work. Counting either without checking the tradition would assert a failure that P3 says is a primary instrument — the exact error the corpus exists to prevent.

**What is deliberately excluded.** Nothing from the reader-side guard principles — P3, P6, P9, P12, P15, P23, P26. Those bind the analyst, not the writer. A "pattern" drawn from them would say something like *"your devices keep getting faulted"*, which is a fact about the tool, not about the writing.

**Three properties the storage has to carry:**
- **The extractor chooses a key or returns nothing.** Free text is what makes matching impossible across differently-worded readings; forcing a choice from seven is what makes `confirmed_count` countable at all.
- **Every candidate must carry the verbatim sentence from the reading it came from.** Forcing a choice invites the extractor to pick the nearest key when the reading said something else; a candidate with no quotable sentence is discarded rather than stored. Same discipline as the continuity extractor.
- **The vocabulary is closed AND versioned.** Adding an eighth key later means evidence gathered under the old vocabulary cannot be matched to it retroactively. A `vocab_version` column keeps that visible instead of silently mixing two eras of counting.

## Proposal B — where per-writer dismissal lives

The spec says "same as continuity flag dismissal, in the ledger view". That cannot be taken literally: `/ledger/[manuscriptId]` is scoped to one manuscript and patterns span a writer's whole body of work, so they have no home there.

Four candidates:

1. **`/account`** — already per-writer, already lists every work, already carries destructive controls, so the idiom exists. But it is a settings surface, and a craft observation sitting beside "delete my account" is tonally wrong.
2. **A new per-writer page** (`/patterns`, or folded into `/how-i-read`) — clean, but a new nav entry for something a writer will visit rarely.
3. **In the reading itself, at the point the pattern is named** — the Mentor section, dismissed exactly where it is claimed.
4. **`/ledger` index** — per-writer, but it is about books, not about the writer's habits.

**Recommendation: 3, with 1 as a later review surface.** It matches the idiom just built for continuity flags, where the control sits on the flag in §6a rather than in a settings page — the writer corrects the claim at the moment they disagree with it, which is what makes it read as a correction rather than a preference toggle. It needs no new surface. If only one thing is built, build 3; a list of previously-named patterns can follow whenever it earns its place.

**Consequence for the migration, which is Nenad's to apply:** the table needs `dismissed_at` per pattern (never named again once dismissed), `vocab_version`, and the evidence `reading_ids`. The shape depends on the two decisions above, so the SQL is deliberately not written yet.

### Gap 2 built end to end and verified live — 2026-08-21

Three commits: `150915e` store and gate, `53b5fda` extractor, `1f7dafc` surfacing and dismissal. 165 tests green, build ✓, IP grep exit 1.

**The gate is the feature.** A named pattern is the largest claim the product makes about a person — not "this draft does X" but "you do X, repeatedly". Three conditions: never after dismissal; **seen in at least two distinct WORKS**, because three revisions of one story are one piece of evidence about a writer; and not before the writer's third submission. Recording is idempotent per work, not per reading.

**The extractor reads the REPORT, never the manuscript.** The reading has already judged the work under its confirmed tradition with the whole corpus behind it; a second brain judging the prose again would be an opinion nobody asked for, formed without the diagnostic and free to contradict what the writer just read. Every prompt rule is also a code check — closed vocabulary, evidence must be a real substring of the report, tradition guard — because a prompt is an instruction and the code is the guarantee.

**Where Nenad's tradition constraint was interpreted rather than applied literally, and it is flagged in the code as well as here.** `withheld_payoff` is gated on tradition and fails closed (P22 names literary realism and autofiction; withholding resolution is the instrument in crime, noir and much horror). `borrowed_phrase` is NOT gated: P4 "applies to all forms using deliberate tonal or temporal contrast", so whether a borrowed phrase loses an argument is a property of the work rather than its tradition, and there is no tradition in which it is a primary instrument — a tradition test would have nothing to test against.

**One quiet aside per reading, hierarchy now explicit:** method line > named pattern > nudge. Unlike the first two, a pattern is not once-ever — it stays named until the writer rejects it.

**Verified live, in order:**
- extractor on two real reports before wiring: a reading claiming restatement returned exactly one candidate with a verbatim sentence; a largely admiring reading returned **nothing** — praise is not a tendency;
- a seeded pattern (disclosed fixture: `restatement`, two works) was named in a real reading, rendering as an amber-ruled ACROSS YOUR WORK block above the lenses, with no nudge alongside it;
- the same real reading independently found `restatement` and incremented the count 2 → 3 with a new work id — the record path working on live output;
- dismissal removed it, set `dismissed_at`, emptied `listPatterns`, made `isNameable` false, **and a later reading finding the same tendency did not revive it** — which is why the row is kept rather than deleted.

**Correction to yesterday's record.** I reported that the lens-voice verification "was then stopped so no test data was created". That was wrong: clicking Stop aborts the client stream, but the server run completes and stores the reading. A work from that test sat on the account until now. Deleted. Worth remembering as a general fact about verification — Stop is not a cancel.

**All test data removed:** `writer_patterns` empty, nudge milestones cleared, both test works soft-deleted, `Home` the only manuscript, 6 works.

**Awaiting Nenad:** the seven `PATTERN_COPY` lines are placeholder and unapproved — same process as the method line and the nudges.

### Stage 1 complete — page copy, lens self-recognition, two specs — 2026-08-21

**1a — `/how-i-read` (`f0e3…`, see log).** "If a note I gave you didn't land, I'll say that too" removed — nothing structural guaranteed it and the page was promising on the model's behalf. Replaced with "Where I can see what changed, I'll say so." The sixth scenario is written and live: patterns across a writer's works, describing only what the feature does — named after more than one work, never from one, correctable permanently.

**1b — both shipped nudge lines approved as written.** No change.

**1c — lens self-recognition (`6b41c94`).** A lens handed its own work now says so in its own voice and asks for the writer's instead. 35 lines, one per lens.

A NARROWER QUESTION than the provenance gate asks, deliberately: that gate is forbidden from naming anyone, because a list of authors is what Nenad ruled out. This asks one binary question about ONE author the writer already named by choosing the lens — no list, nothing enumerated. The false positive has its own flavour here — a lens claiming a writer's own prose is the product taking credit for their work — so the prompt carries the anti-imitation framing that held on the provenance check, and the floor is high. Fails open: the lens just reads the work.

**Verified against the real model, six cases.** Every negative held, including original Carver-imitating prose against the Carver lens. The positive works and is author-specific: public-domain Chekhov against the Chekhov lens returns yes; the same text against Hemingway returns no.

**Verified live on the deployed endpoint.** Production returned `{type: 'self_recognition'}` followed by Chekhov's line. Stated precisely because the first attempt did not: a UI lens click at 19:48 produced an ordinary reading, and the check run against that exact stored text returned true three times out of three — so the click had hit a build that predated the deploy, not a logic fault. The endpoint was then called directly from the authenticated page and behaved correctly. What is not separately exercised is ReportView rendering that text, which is the same rendering path every lens reading already uses.

**Two things worth Nenad's eye:**
- **The brief says 36 lens voices; `LENS_IDS` has 35.** Every one is covered. If a 36th is expected it is missing from the lens set, not from the copy.
- **The provenance gate fired on Chekhov, but slowly** — a check nine seconds after submission showed no hold, and it appeared later. Not a defect (the gate runs concurrently with moderation and answers when it answers), but worth knowing that "no hold yet" is not "no hold".

**1d — two files committed** (`d9547a3`): `DraftAndLens_MentorCompleteness_Spec.md` and the standing evaluation rule plus a file pointer in `DL_ONLY_ReadFirst.md`.

**Test data removed:** Chekhov work soft-deleted, patterns and nudge milestones cleared, 6 works, `Home` the only manuscript.

### Stage 2 complete — trajectory (Gap A), no migration — 2026-08-21

`3bd86c0`. 176 tests green, build ✓.

**Derived, not stored — a deliberate departure from the spec's shape, flagged rather than done quietly.** The spec asks for `trend` and `trend_note` columns recalculated on each extraction. Deriving at read time from what the table already holds wins on three counts: no migration, no denormalised verdict that can drift from its own evidence, and it cannot go stale — a tendency that stops appearing becomes "improving" the moment the next work is read, with no recalculation step for anyone to forget. **If Nenad wants the verdict stored for analytics, that is a migration and `deriveTrend` becomes its writer.**

The store only records works where a tendency DID appear, so absence is only meaningful against the writer's whole sequence of works. That is why the derivation takes that sequence rather than working from the row alone.

**Both hard rules enforced and tested.** Three data points before any verdict — with two works there is a before and an after, not a trajectory, and calling that improving dresses a coin flip as development. No positive spin on stable: the note says it has not shifted, and a test asserts it contains no encouragement word. A further test asserts no note ever contains a digit — no scores, no percentages, no false precision on qualitative data. Worsening additionally needs four works behind it, because "in each of the last three, out of exactly three" is all the evidence there is rather than a change.

**Verified live.** A pattern seeded against the two OLDEST works (disclosed fixture) was named in a real reading and carried the trajectory note beneath it: *"A pattern across your work — borrowed phrasing set beside your own…"* then *"It hasn't turned up in your last couple of pieces, though — whatever you're doing about it is working."* Dismissal control present, one aside only, no nudge alongside.

**Open for Nenad:** the three trend notes are placeholder copy, and question 3 of the spec's open questions ("does this match the established editor voice?") is still his to answer.

**Test data removed:** pattern rows and nudge milestones cleared, test work soft-deleted, 6 works.

### Lens voice 36 — Lucas is NOT missing; the odd file is `hatten.jpg` — 2026-08-22

Checked before building anything, because it was framed as a one-line fix and was not one.

**`lucas` has been in `LENS_IDS` all along** — index 22 of 35, with meta, a craft philosophy, a prompt, a self-recognition line and `public/lenses/lucas.jpg`. `DraftAndLens_NewLensVoices_Profiles.md` carries a full **GEORGE LUCAS** profile. Nothing about him is missing, and adding him would have created a duplicate id.

**Where the "36" comes from:** `Lens voices_images/` holds **36** portraits and the app holds **35**. The extra file is `hatten.jpg` — a young person, no profile in the profiles doc (whose own header says "All 35 voices"), and **no reference anywhere in the repo or the app**. So the count mismatch is one unidentified image, not a missing voice.

**Not actioned, because it is Nenad's call and needs something only he has.** A 36th lens is not an id in an array: it needs a name, a craft philosophy in that voice, a lens prompt, a descriptor, a category and a self-recognition line. If `hatten.jpg` is meant to be someone, say who and the profile can be written. If it is a stray, it should be deleted so the folder stops implying a voice that does not exist.

(`Lens voices_images/Lucas.jpg` also shows as modified in git — a replaced portrait, uncommitted since before this session. The app serves `public/lenses/lucas.jpg`, which is a separate file, so nothing in the product changed.)

### Stage 3 complete — writer-set goals (Gap B), migration applied — 2026-08-22

Five commits: `a50a6c9` store, `66d3e60` routes, `7224c9c` pipeline, `998481f` + `a15a766` UI, `c6211cf` a voice fix found by live verification. 213 tests green, build ✓, IP grep clean.

**The migration was applied by Nenad before this session and verified from here** — `writer_goals` exists with every expected column. `deleteAllUserData` now includes it (the migration footer's required follow-up) and so does `exportUserData`.

**The design line that governs everything here: a goal is a LENS, never a rubric.** The tradition is locked by Brain 1 and decides the standard the work answers to (P1); a goal is what the writer was reaching for inside that standard. Admitting a goal as a standard would let a writer redefine what counts as good in their own work — the one thing an editor cannot allow — and would quietly turn every reading into a compliance check against a sentence typed at upload. The directive says so and explicitly permits saying, kindly, when a goal pulls against what the tradition needs.

**Two brains, deliberately.** Brain 2 holds the goals while it reads. A second, post-delivery brain reads the finished REPORT — never the manuscript — and turns what the reading already found to face what the writer said they wanted. Same architecture as the pattern extractor and for the same reason: a brain judging the prose again, against a standard the writer set, is exactly what Gap B may not do. `validateGoalNotes` is the guarantee behind the prompt: verbatim evidence from the report, a goal id we actually asked about, no score in any dress, at most two notes.

**Verified against the real model, four cases.** A report bearing on the goal produced a quoting, developmental note. A goal the reading never touches produced silence. **A goal pulling against the tradition — "I want every scene to end on a twist", against a pastoral — produced silence rather than a scolding**, which was the case most likely to embarrass the product. The fourth found a real defect: the note said "the report points to the third scene", the product describing its own machinery to the person it is talking to. Rule 6 now forbids naming the report, the reading, the analysis or the notes — the editor wrote it, so the editor says "I". Re-verified: same finding, same quote, first person.

**Verified against the production table** (temporary harness, removed): create, list, reword and set aside all work; a manuscript id that is not the writer's is refused rather than rescoped; another user can neither reword nor set aside; a set-aside goal is kept with `dismissed_at` and never listed again. All test rows deleted, zero left.

**Decisions taken, worth knowing before anything is built on top:**
- **Scope follows the writer's choice, and the choice is only offered when it exists.** With a book selected they pick "for this book" or "for my writing"; without one there is a single honest answer and no control is shown. The server refuses a foreign manuscript instead of silently rescoping — quietly turning "what I want for this book" into "what I want for my writing" would put words in their mouth and read the next unrelated piece against it.
- **Goal progress sits OUTSIDE the one-aside-per-reading hierarchy** and above the named pattern. The method line, a pattern and a nudge are things the product volunteers; this is the only thing on the page the writer asked for.
- **No control on the goal note in the reading.** A goal is set aside where a writer's goals live — the account for standing ones, the book's ledger for a book's — not inside one reading of one piece.
- **Goal notes are not stored.** Like the method line, the pattern and the nudge, they exist only in the live reading; reloading a stored reading shows the reading, not the aside. Storing them is a migration if Nenad wants it.
- **"Set aside", never "dismiss", in every writer-facing string.** A pattern is dismissed because it was wrong about them; a goal is set aside because they moved on — or because they got there, and the product cannot tell which.

**Open for Nenad:**
- The seven `PATTERN_COPY` lines and the three trend notes are still placeholder (unchanged from Stage 2). The goal-progress copy is model-written per reading, so there is no fixed string to approve — but the FIELD copy on the submit panel, the account and ledger blurbs, and the Gap C nudge line are all mine and unapproved.
- `writer_patterns` is still absent from `exportUserData` — pre-existing, not introduced here, and worth fixing since a named pattern is a statement the service stores about a writer. Not touched, because it is unrelated to this change.

### Stage 4 complete — /how-i-remember and the horizon line — 2026-08-22

`06b0cb1` nudge, `6239c95` page and nav. Build ✓, deployed.

**The page describes only what runs today** — revision memory, a habit named after more than one work, trajectory (including that stable is never dressed up), and a goal held across readings without ever being scored. Same discipline that kept the sixth scenario off `/how-i-read` until Gap 2 existed. No comparison table, no feature matrix, no free-versus-paid framing: a table would make the reading relationship look like a plan, and what is on offer is that somebody remembers your work.

**Where Gap C was interpreted rather than followed literally.** The spec puts its quiet line "after a first reading". A first reading already carries the approved revision-memory nudge, and two quiet asides in one reading is precisely the clutter the one-per-reading rule exists to prevent — and displacing approved copy with unapproved copy is not my call. **The line fires on the SECOND reading instead**, the only slot in the sequence not already spoken for (0 revision memory, 2 the compounding line). The claim is truer there: the writer has seen two readings and can feel what a single one does not know. No migration — `user_milestones.milestone` is free text for exactly this.

**Not tier-gated, because no tier gate exists yet.** Gap C describes the line as free-tier. Nudges are shown to everyone today; when mentor tiering lands, this line is one of the strings that needs a gate.

### ⚠️ Browser verification NOT done this session — extension offline

The Chrome extension would not connect (reported not installed/running on every attempt), so the standing "verify live in the browser" rule could not be met for Stages 3 and 4. What WAS verified: production build, full suite, IP bundle grep, the goal-progress brain against the real model, the goals store against the production table, and — on the deployed site — that the route and the new nav entry exist (`/how-i-remember` redirects through the beta gate with `?next=/how-i-remember`, and the gate page renders the "How I remember" link; `/api/goals` answers 307 to the gate rather than 404).

**Still unseen in a browser, and worth ten minutes when the extension is back:** the goal field on the submit panel (and its scope control appearing only once a book is chosen), the goal note rendering above the pattern block in a real reading, the `GoalList` on `/account` and on a book's ledger page, and the `/how-i-remember` page itself signed in.

### /how-i-read + /how-i-remember merged into /how-it-works — verified live — 2026-08-22

`0b747bd`. Nenad's call: one page, two tabs — "A reading" and "Over time" — one nav entry, copy untouched.

**Structural only, and proved so rather than asserted.** Every text block was extracted from both old files and checked against the new one: 94 blocks, none missing. The single thing that did not survive is each page's own eyebrow ("How I read", "How I remember") — those were page identity and the tab labels are that now. Both `<h1>`s and every paragraph are verbatim.

**Tab state is in the URL and written with `replaceState`, never `pushState`.** Close must still return the writer to the reading they came from; an entry per tab click would leave them pressing Close through their own browsing of the page. Verified live: glossary → how-it-works → two tab switches → Close landed back on the glossary.

**Both old routes redirect rather than 404** (`next.config.mjs`), and `/how-i-remember` lands on `?tab=over-time` — the half it named. **Not permanent redirects**: a 308 is cached hard by browsers and would outlive any decision to split the pages again. These are courtesy redirects for links shared during the beta, not a URL commitment.

`leave-page.ts`'s fallback path list now names `how-it-works` — miss that and Close strands anyone who arrived in the same tab, which is the trap the route hit when `/how-i-read` first shipped.

### Chrome extension — what "not connected" actually meant — 2026-08-22

Diagnosed after it blocked every live check earlier in the session. **Nothing was wrong with the install:** Claude 1.0.85, Default profile, Web Store install, `<all_urls>` and `claude.ai` permissions granted, service worker started that morning, and Claude Code authenticated as the same account (nenad.kojic@gmail.com, confirmed from `~/.claude.json`).

**What was missing was the account-level pairing.** `list_connected_browsers` returned an empty list and the connect broadcast reached nothing — the extension was running but not registered to the account. Opening the extension panel in Chrome fixed it and a browser registered immediately.

**Worth remembering:** "the extension is not connected" does not mean it is missing or disabled. Check `list_connected_browsers` first — an empty list is a pairing problem and the fix is the extension panel, not a reinstall. Also on this machine: both `/Applications/Google Chrome.app` and `/Applications/Google Chrome 2.app` exist and the running browser is the "2" copy; same profile, so extensions load either way, but it is worth tidying.

### GDPR export completed, and a guard so it stays complete — 2026-08-22

`d784630`. `writer_patterns` had been absent from `exportUserData` since the day its table was created: a writer could ask for everything held about them and not be shown the product's largest claim ABOUT them. Dismissed rows are included deliberately — a writer is entitled to know the row is kept and why it has to be.

`user_milestones` had the same gap and was added with it. **Flagged rather than assumed:** it was not in the brief, it is not content, and reverting it is one line.

**The real fix is `tests/lib/user-data-completeness.test.ts`.** Both claims — nothing left behind, nothing held back — are hand-maintained lists, and both have now been wrong in exactly the same way (`user_milestones` missed the deletion list on 21 Aug, `writer_patterns` missed the export from the start). The guard discovers per-user tables from the source — a `src/lib` module exporting a `*_TABLE` constant — and fails if either function misses one, so the next table breaks a test on the day it is written rather than the day a writer asks for their data. Verified by deletion: removing the new query turns it red.

### ⚠️ RESUME NOTE — 2026-08-22, checkpointed at a usage limit

**Done and committed this stretch:** `91cf6d3` povCharacter (multiplePov fix), `b6c791e` narrator reliability (unreliableNarrator). Both verified against the real model. `ec3e1a8` (panel reorder + bible move) is committed AND DEPLOYED — see the flag below.

**Not started: the submission panel redesign proposal.** Nenad's brief: minimum necessary — (1) paste/upload, (2) format, (3) complete/excerpt, (4) analyse. Goals, grouping and bible all move off the homescreen; fragment inline expansion stays off, the "Just have a passage and a question?" link is sufficient. **Proposal goes in this file first; no building until he approves.**

### ⚠️ THE PANEL MID-STATE IS ALREADY LIVE — Nenad's call needed

He asked me not to deploy it. It had already gone out ~40 minutes earlier (`ec3e1a8`, deployed and confirmed in the browser) before he said so. Recording it because the instruction and the state of production disagree, and he should decide rather than discover it.

**Reverting would move production AWAY from where he wants it.** What is live now is: paste → format → complete/excerpt → grouping → goal → analyse. His target is paste → format → complete/excerpt → analyse. The state before `ec3e1a8` was strictly more cluttered — it had the character bible box, the goal box AND the two scope pills. So the live state is closer to the target than the state a revert would restore.

**My recommendation: leave it, and let the redesign replace it.** If he wants production frozen at the older shape instead, `git revert ec3e1a8` is clean — but it also reverts the character-bible move he approved in the same breath, since both are in that commit.

### Character bible — code built, SQL for Nenad to run

`ec3e1a8`. Two columns on `manuscripts`, read by the analyse route from the book a piece is filed under, written from the book's own page beside its goals. **Until the SQL is run, `getManuscriptBible` returns null and every reading behaves exactly as it did before the commit** — nothing breaks, the box on the book page simply will not save.

Full file with reasoning: `draft-and-lens/supabase/migrations/manuscript_bible.sql`. **Run in Supabase → SQL Editor:**

```sql
alter table public.manuscripts
  add column if not exists bible text,
  add column if not exists bible_skip boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'manuscripts_bible_length_chk'
  ) then
    alter table public.manuscripts
      add constraint manuscripts_bible_length_chk
      check (bible is null or length(bible) <= 20000);
  end if;
end $$;
```

Verify after applying — two rows expected:

```sql
select column_name, data_type, column_default
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'manuscripts'
   and column_name in ('bible', 'bible_skip');
```

**The accepted cost, recorded so nobody rediscovers it as a bug:** a standalone piece has nowhere to paste a bible, because there is no book to hold one. Brain 5 still builds one from the text; the writer simply cannot hand one over.

### multiplePov — root cause was one missing paragraph of prompt

`povCharacter` had sat in the extractor prompt as a single `null` inside the example JSON with no sentence anywhere defining it. The model copied the example: **9 of 9 facts on the live ledger had a null POV**, so `deriveMultiplePov` could never return true and the cross-viewpoint gate had never fired since it was written.

Now defined — the consciousness the prose is inside; first person and limited/close third only; null for omniscient, dialogue, documents and anything unclear — and the example shows a filled value beside the null one, because the example is what taught "always null".

**Verified against the real model.** A two-viewpoint chapter: 4 of 5 facts carried a POV, two distinct, `deriveMultiplePov` → true. Straight omniscient: 5 facts, all null → null. No false positives on the case that would produce them.

**Two unrelated extraction defects observed while testing, NOT fixed, worth a look later:** the extractor recorded "He thought her eyes were grey" as `character:dessie eye_colour=grey` — interiority about ANOTHER character attributed to the thinker; and it produced the attribute `hair_colour_location`, which folds a location into the attribute name against the prompt's own "the attribute names the property" rule. Both predate this change.

### unreliableNarrator — built, one-way by design

`b6c791e`. The structural reader answers one more question rather than a new brain being added. 'unreliable' → true; **everything else → null, never false**, because a wrong true costs precision while a wrong false promotes narration to the book's own voice — the §5.2 failure the gate exists to prevent.

Stored beside `nonLinear` in the same jsonb column, sticky-true, no migration needed.

**Verified against the real structural reader, three cases:** a first-person narrator the text visibly undercuts returned "unreliable" with its own evidence → true; limited third, biased but trustworthy → "unclear" → null; omniscient → "unclear" → null. The likeliest false positive did not happen.

### nonLinear — no action, confirmed not a bug

The structural map builds on every submission (12 real runs, 30 to 260 words, `structuralReader` in every stage list). `deriveFrame` reads real output correctly: a linear piece returned "linear — single unbroken scene…" → false; a two-flashback piece returned "non-linear — …two embedded temporal jumps…" → true. It is NULL on live data only because frame evidence is recorded solely when detection runs, which needs a submission filed under a book that contributes new facts — and exactly one real run has ever reached detection.

### Character bible — migration applied, feature verified end to end — 2026-08-22

Nenad ran `manuscript_bible.sql`; both columns confirmed present from here. (The first paste failed with `42601: syntax error at or near "Step"` — my prose had been copied in with the SQL. Nothing was applied, the script rolled back whole, and the table was untouched. Worth remembering when handing over SQL: give one fenced block and nothing else.)

**Verified against the live table** (store layer): write, read back, skip toggled independently of the text, and a different user refused on both read and write. Test value restored to exactly what was there before.

**Verified in the browser** on the deployed site: the box renders on the book page under CHARACTER BIBLE with SAVE and "don't keep one for this book"; typing and saving showed SAVED; a full page reload brought the text back, so the round trip through `/api/ledger/[manuscriptId]` works. Test text then cleared — `Home` is back to `bible: null, bible_skip: false`.

**The homescreen no longer carries it.** Live panel order now reads: 1 YOUR WORK → 2 WHAT IS IT? (with complete/excerpt beneath) → 3 WHERE DOES IT BELONG? → OPTIONAL → what do you want from this piece? → 4 ANALYSE.

**Still outstanding from this stretch:** the panel redesign proposal (Nenad's minimum-necessary brief), and `91cf6d3` + `b6c791e` are pushed but NOT deployed — no hook has been fired since the instruction to stop deploying.

### PROPOSAL — the minimum submission panel. NOT BUILT, awaiting Nenad — 2026-08-22

His brief: ask the minimum necessary. Paste/upload → format → complete/excerpt → analyse. Goals move to after the reading or the account page; grouping moves to after the reading or is inferred; nothing below the Analyse button but the privacy line and the fragment link; fragment inline expansion off the homescreen.

## The panel

```
1  YOUR WORK              upload box · paste box · word count
2  WHAT IS IT?            Film script · Treatment · Story · Stage play
                          Complete piece · Excerpt      ← sub-row, defaults to Complete
3  ANALYSE

   Your work is yours. We never train AI on it — it's sent only to generate your reading.
   Just have a passage and a question? →
```

Three numbered steps, one optional sub-row, nothing else. No divider, because with the optional zone empty there is nothing left to divide. **Format stays mandatory** — the server never infers it (§15), and a story read as a script is a wrong reading rather than a rough one. Everything else on that panel today is either answerable later or answerable elsewhere.

## What moves, and what each move costs

**A. Goals → the account page and the book page.** Both surfaces already exist and are live, so this is deletion, not building.

*The cost, and it is real:* a goal has to exist BEFORE a reading to be held during it, so nothing can be set for THIS piece at the moment of sending. A returning writer with standing goals is unaffected; a writer's first goal now arrives one reading later than it would have.

*Optional mitigation, small build:* one line under a finished reading — "want me to hold something for next time?" — writing a goal for future readings rather than this one. It is honest about what it does, and it puts the ask where the writer has just seen what I do with it.

**B. Grouping → after the reading. This is the only expensive move, and it is expensive.**

Today the manuscript must be known BEFORE the run: attachment, fact extraction and contradiction detection all happen inside the same request, in that order. Moving the question after the reading means building a path that does not exist — file an EXISTING reading under a book, then run extraction and detection for it retroactively. The pieces are all there (`resolveAttachment`, `runContinuityExtractor`, `runDetectionPass`, the detach route); nothing composes them for a reading that has already been delivered.

*Inference cannot replace the question, and it is worth being exact about why.* Silent auto-grouping already exists and already fires on high-confidence matches (`band: 'auto'`). But a FIRST book can never be created by inference — there is nothing to match against — and the `confirm` and `none` bands exist precisely because the evidence was not strong enough to act on alone. Inference covers the easy case and leaves the case that matters.

*Recommended shape:* keep silent auto-grouping exactly as it is, and add one control to the finished reading — "this reads like part of *Home* — file it there?", or "start a book with this". The writer answers it having just read the piece, which is a better moment to ask than before I have read a word.

*The cost:* the ledger fills one step later than it does now; a writer who never reaches the end of a reading never groups; and a first chapter's facts are only extracted once they say it belongs to a book.

**C. The Editorial Lenses grid → the left column.** "Nothing below Analyse" removes its current home. It is marketing, and the left column is already the marketing column — it belongs under the hero paragraph rather than under the button.

**D. Fragment mode → its own route (`/passage`).** The link stays exactly where it is and stops expanding a panel in place.

*One detail that must not be lost in the move:* pressing Analyse on anything under 200 words currently hands the passage straight into the inline panel rather than making the writer paste it twice. With a route, that becomes a redirect carrying the passage — **via sessionStorage, never a query string**: the passage is the writer's own text and must not sit in a URL, in history, or in a server log.

## Three questions, all his

1. **"It arrives as I write it."** — third line under the button today. Keep it beside the privacy line, or drop it? It sets the streaming expectation, which nothing else on the panel does.
2. **The post-reading goal line** — build it, or leave goals entirely to the account and book pages? Not building is defensible: a goal set deliberately on a quiet page may be worth more than one typed on the way past.
3. **Grouping** — build the post-reading attach path (real work: a new route, extraction and detection for an already-delivered reading, and a control in the report), or accept auto-grouping only for now and let everything else be grouped later from the book page? The second is much cheaper and leaves a gap: a writer with one book and a second chapter that does not auto-match has no way to file it.

**Nothing here is built. Approve the shape and answer 1–3 and I will build it in one pass.**

### Minimum panel built and verified live — 2026-08-22

`927f7f9`. Nenad's answers: keep "It arrives as I write it."; build the post-reading goal line; **do not** build the retroactive grouping path — grouping stays on the panel where it is, because the cost of moving it outweighs the benefit at this stage.

**A correction worth recording, because the brief assumed otherwise:** goals were NOT already off the panel. Only the scope pills had gone; the goal box itself was still there. Removing it is what the ruling actually asked for, and the optional divider went with it — the bible had left that zone earlier the same day, so the goal box was the only thing left in it.

**Live panel now:** 1 YOUR WORK → 2 WHAT IS IT? (with complete/excerpt beneath) → 3 WHERE DOES IT BELONG? → 4 ANALYSE, then the privacy line, "It arrives as I write it.", and the fragment link. Confirmed on the deployed site.

**Nothing on the panel writes a goal any more, so the analyse route stopped accepting one.** It still READS them: a goal set on the account page or a book's page is held while the reading is written, exactly as before.

**The post-reading line fires only for a writer holding NO live goals.** That condition is what makes it a pointer rather than a nag — telling someone who already has goals that they could set one is noise — and it retires itself the moment they set their first, so no milestone row is needed. It says "for next time" because that is the truth: a goal must exist before a reading to be held during it.

**Verified with a real reading on production.** The line rendered in quiet italic serif between the reading's revision block and the Editorial Lenses section, reading "You can set a goal for next time in your account.", with the link resolving to `/account`.

**Test data removed:** the reading was soft-deleted through the app's own path (so its cascades ran), and the `restatement` pattern row it created was cleared. Account is back to 6 works, no goals, no patterns, `Home` still `bible: null`.

**One durable note about driving this panel from the browser tools:** typing into the paste box with the `type` action does not reach it — three separate attempts landed nothing, on both the old panel and the new one. What works is setting the value through the native `HTMLTextAreaElement` setter and dispatching an `input` event, so React registers the change. Worth using directly next time rather than rediscovering it.

### Two extraction defects fixed — 2026-08-22

`e8b4216`. Both were found while verifying the povCharacter fix, both predate this session, and neither failed anything: the ledger simply filled with facts that could never meet each other, which is the quietest way for a continuity feature to be useless.

**1 — a belief filed under the thinker.** "He thought her eyes were grey" extracted as `character:dessie eye_colour=grey`. The claim is about Marta. Filed under Dessie it invents a property he does not have, and the disagreement that matters — her eyes green in narration, grey in his head — had nothing to meet, because the two facts sat under different entities.

The rule now LEADS the register section rather than sitting after it, because that is exactly where the mistake is made, and it carries the real failure as its worked example. The holder of a belief already has two fields of its own: `register` and `povCharacter`.

**2 — a qualifier inside an attribute name.** `hair_colour_location = "grey at the sides"`. Facts are matched by entity + attribute, so that fact could only ever be compared with another that phrased its qualifier identically. The existing rule covered comparatives and childhood qualifiers but not "where on the body", so the observed failure joins the WRONG list and the general form is now stated: qualifiers belong in the value, always — where on the body, at what age, under what light, according to whom.

**Both are prompt rules, and that is not laziness.** No code check can know whose property a claim is, or tell a property name from a qualifier. What the tests pin is the presence of the rules, since losing them would be silent in exactly the way the original defects were.

**Verified against the real model on the exact passage that produced both.** The belief now files as `character:marta | eye_colour = grey | register=interiority | pov=dessie`, and the hair fact as `character:dessie | hair_colour = grey at the sides`.

**Worth noticing what that unlocks:** Marta's eye colour is now claimed twice on the same entity and attribute — green in narration, grey in Dessie's head. That is the first time those two claims have been able to disagree at all. They should NOT surface as a contradiction, because `interiority` is not the book asserting anything (§5.2) — a character being wrong about someone's eyes is ordinary fiction. It is a good live test of the register gate once a real two-POV chapter goes through.

### AUDIT RUN — 2026-08-22. Findings only, nothing fixed.

**On the trigger:** the log's last run is 2026-08-18, four days ago, so this is NOT overdue on the clock — the standing rule is 2–3 weeks. The other trigger is what justifies it: a great deal shipped today (goals, trajectory, the panel rebuild, the bible move, two extractor fixes, the frame work), and a feature boundary is exactly when stale assumptions get inherited.

**Resolved since the last run, worth recording:** the 2026-08-17 dead-brains finding is gone. `structuralReader`, `narratorVerify` and `narratorCorrect` appear in the stage list of every one of the last 12 real runs, at word counts from 30 to 260. The 5,000-word gate was removed and the brains now execute.

## §1 Dead code

**1. `FREE_WORD_LIMIT = 10_000` is unreachable, and three things downstream of it are dead.** The route rejects anything over `TESTER_WORD_CAP = 4000` before the pipeline starts, so `computeCoverage(text, 10_000)` can never truncate. Therefore `coverage.truncated` is permanently false, and with it: `buildPartialReadDirective` (`src/prompts/fragments/partial-read.ts`) never reaches the analyst, and `PartialReadBanner` never renders. This is the same shape as the dead-brains finding of 2026-08-17 — two constants that are each sensible alone and contradictory together.

**2. `src/lib/trace.ts` is dead in full.** One export, `traceMark`, zero callers anywhere; its env switch `DL_TRACE_ENABLED` is referenced only inside the file it lives in. **Flagged 2026-08-18 and still present.**

**3. `detachReading` (`lib/manuscripts.ts`) is dead** — `/api/ledger/detach` uses `detachWork`. **Flagged 2026-08-18, still present.**

**4. `listLocks` (`lib/continuity.ts`) is dead.** **Flagged 2026-08-18, still present.**

**5. NEW — two brain modules are dead, and this is the dangerous kind.** `runLens` (`ai/brains/lens.ts`) and `runConversation` (`ai/brains/conversation.ts`) have no callers: `/api/lens` and `/api/converse` each build their own Anthropic call inline. So the file that *looks* like the lens implementation is not the lens implementation. Anyone fixing lens behaviour would reasonably edit the brain module and see nothing change.

**6. NEW — `suggestManuscript` (`lib/manuscript-match.ts`) is dead** — `/api/ledger/suggest` composes `classifyMatch` + `buildCandidates` itself. Same shape as 5.

## §2 Duplicated logic

- **`return !error` swept: clean.** 12 sites, 11 correctly check rows changed. The twelfth (`readings.ts:413`) returns a bare `!error`, and that one is right: it is the final delete in `deleteAllUserData`, where zero rows matched is a legitimate success for a writer who had nothing stored.
- **`window.close()`: clean.** One call, inside `leave-page.ts`, with the documented fallback chain.
- **The real duplication is §1.5 and §1.6** — not duplicated text, duplicated reasoning, with the unused copy looking authoritative.

## §3 Unused exports

- **Genuinely dead** (no caller in `src`, none in tests): `traceMark`, `detachReading`, `listLocks`, `runLens`, `runConversation`, `suggestManuscript`.
- **Exported but only used inside their own file** — tidy-up candidates, no risk: `extractAnchors`, `findAnchor`, `readableRatio`, `summarizeChange`.
- **Exported for tests by design, and documented as such**: `mergeFrameEvidence`, `selectGoalsForReading`, `validateGoalNotes`, `entityOverlap`, `isMissingTable`. Correct as they are.

## §4 Stale documentation

**7. `draft-and-lens/CLAUDE.md` still names `DraftAndLens_LearnedCorpus_v2.7.md`, which does not exist.** The root `CLAUDE.md` was corrected to `v2.9` on 2026-08-17; the nested copy was missed. **This is last audit's finding, surviving in the other file** — which is itself the lesson: the fix was applied where the defect was found rather than everywhere it lived.

**8. NEW — the streaming skeleton is one section behind the prompt.** `reportSkeletonSections.ts` lists **13** story sections; `src/prompts/report/story-structure.ts` defines **14**. `WHERE TO GROW NEXT` was added to the prompt on 2026-08-19 and never to the skeleton, so it arrives during streaming with no placeholder ahead of it. `CLAUDE.md` is correct ("Story mode defines 14 sections"); the code is what drifted.

**Verified correct, no action:** the sidebar constant-link count — Overview 3 + Dashboard 2 + Action 3 + Reference 5 = **13**, exactly as `CLAUDE.md` states, with the ledger and Continuity links conditional on top. Two status claims spot-checked (§5.5 dismissal control, differentiator milestone) both hold.

## §5 Test hygiene

- **No long-failing tests.** 237 pass, 23 files. The two long-red `client-ip-guard` tests recorded in August are gone.
- **9. One tautology, and it is on the guard that matters most.** `tests/prompts/client-ip-guard.test.ts:156` runs `expect(true).toBe(true)` when `.next/static` does not exist. So the test protecting the non-negotiable IP boundary reports green having checked nothing. It should skip visibly rather than pass silently.

## The checklist itself

Its §3 grep is too crude — it excludes whole files, so it returned 15 candidates of which 6 were real and 9 were noise. Worth tightening to "references outside the defining file, excluding tests" before the next run.

## Recommended order if these are actioned

1. **§4.8 skeleton section** and **§4.7 corpus filename** — minutes each, zero risk.
2. **§5.9 the IP guard tautology** — small, and it restores a real protection.
3. **§1.2/3/4/5/6 dead code deletion** — mechanical, but §1.5 deserves a decision first: delete the two brain modules, or move the route logic INTO them so the file that looks authoritative becomes authoritative.
4. **§1.1 the word cap** — the only one that is a product decision rather than a fix, and it is the same decision that has been open since 2026-08-17: raise the cap, or accept that partial-read handling is aspirational and delete it.

### AUDIT FOLLOW-UP — all nine findings actioned — 2026-08-22

Seven commits, each verified on its own. Nenad's two rulings: delete `runLens`/`runConversation` (route logic stays inline), and delete partial-read handling entirely without raising the cap.

| # | Finding | Commit | What was done |
|---|---|---|---|
| 8 | Skeleton one section behind the prompt | `d3acbbb` | `Where To Grow Next` added; the two lists diffed and now agree, 14 each |
| 7 | Nested `CLAUDE.md` naming a corpus that does not exist | `1f1ab0e` | Points at v2.9 with the same note as the root file |
| 9 | IP guard passing green having checked nothing | `a52d474` | `it.skipIf`; proved both ways by moving `.next/static` aside — 7 passed, 1 **skipped** |
| 2,3,4 | `trace.ts`, `detachReading`, `listLocks` — flagged 18 Aug, never removed | `6bade3d` | Deleted |
| 5,6 | `runLens`, `runConversation`, `suggestManuscript` | `995c7eb` | Deleted; their tests re-pointed at `classifyMatch`, the function the route actually calls |
| 1 | Partial-read handling that could never fire | `eff2ef4` | `FREE_WORD_LIMIT`, `wordLimit`, `computeCoverage`, `CoverageSignal`, the client `Coverage` type, the `coverage` field on the done payload, the directive and the banner — all gone |

**Why the last one needed a live smoke test rather than a green build.** It removed a field from the streamed `done` payload and a prop from `ReportView`, which is the core product path: a mistake there breaks every reading and no test would have caught a runtime shape mismatch.

Ran one on production. **It completed**: telemetry `outcome=completed`, 290 words, every stage present, and the stored `reading_json` keys are now `["bible","market","report","scores","diagnostic"]` — **no `coverage`**, exactly as intended. Readings stored before today still carry the old key, which is what `ReadingPayload`'s new note describes. In the browser the report rendered with its verdict, the lens grid and the goal line, and the console carried no application error.

**Test data removed:** the smoke-test work soft-deleted, its `restatement` pattern row cleared. Goals empty, `Home` still `bible: null`.

**One thing deliberately NOT done.** Four exports are used only inside their own file — `extractAnchors`, `findAnchor`, `readableRatio`, `summarizeChange`. They are noted in the audit as tidy-up candidates, not findings, and dropping an `export` keyword changes nothing for anybody. Left alone rather than padding the count.

**Also updated: the checklist's own §3 grep**, which excluded whole files and produced 15 candidates for 6 real ones. It now counts references outside the defining file only.

### nudge_keep_sending was already live — verified, not changed — 2026-08-22

Asked to re-enable it. **It was re-enabled on 2026-08-21 in `43bbc57`** ("the third nudge is true now, so it fires"), the same day Gap 2 shipped and made its claim true. There was no line left to change, so nothing was changed. The "one line to re-enable" note dates from before that commit and was overtaken by it the same afternoon.

**Trigger verified, both halves.**

*The decision* (pure, unit-tested, 10/10): fires only at `priorSubmissions === 2` — the third submission, since the count is taken BEFORE this reading is stored. It yields to a real ledger event, to the method line and to a named pattern, so it can never be the second quiet aside in a reading.

*The guarantee* (against the live `user_milestones` table, temporary harness, rows removed after): first claim `true`, second `false`, third `false`. A different milestone for the same writer still claims cleanly, so the lock is per-milestone rather than per-user.

**Worth knowing, and the reason the verification was worth doing at all: `user_milestones` is completely empty.** No milestone has ever been claimed by anyone in production — not the method line, not any nudge. That is explainable rather than broken: the nudges shipped on 21 August, test rows were cleared the same day, and every submission since has come from accounts already well past the trigger counts (Nenad's is at 6 live works, the others at 21 and 3). Today's smoke tests could not fire one either, for the same reason.

**Consequence for anyone trying to SEE this nudge:** it cannot appear on any existing account. It needs a writer at exactly their third submission, with no facts extracted, no method line and no named pattern in that same reading. A fresh account is the only practical way to watch it happen.

### Repo hygiene — the working tree is finally clean — 2026-08-22

`bc578b7` commits the two build briefs (`Code_Prompt_MentorCompleteness.md`, `Code_Prompt_DepthAndScenarios.md`). They were untracked while the code they specified was live, which is the wrong way round — a future session reading those commits had no way to see what was actually asked for.

`8fe25c7` ignores `Ad concepts/` (380K), `Inspiration/` (1.2M) and `draftandlens.png`, following `/Ads/` on 20 August for the same reason: reference material and marketing artwork that no line of code imports. The portraits the app serves stay tracked in `draft-and-lens/public/lenses/`.

`Lens voices_images/Lucas.jpg` is left modified and uncommitted, per Nenad — a replaced source portrait that the build never reads.

## RESUME NOTE — 2026-08-23 (SUPERSEDED below; kept for the gotchas only)

**Everything this note said was outstanding is now DONE.** The test account is
deleted and Nenad's session is restored. Read the CLOSING NOTE at the end of the
file instead; only the "gotchas" list below is still worth reading.



### Shipped and verified live today (all on main, all deployed)
- `aadb3a4` steps 2 and 3 inert until step 1 has work in it
- `2b7870e` removed "It arrives as I write it." from the submission panel
- `850a228` step 3's grouping choices always inline (no card, no radios, no disclosure)
- `8adc748` auto-grouping trace reworded: "I read this as part of X - how it was set when you sent it."
- `78e144b` "Complete piece or excerpt?" sub-label contrast - **deploy fired, NOT yet verified live**

### PICK UP HERE — 1. verify 78e144b live
Load draftandlens.com, confirm "COMPLETE PIECE OR EXCERPT?" now matches the
other section labels (--paper when a format is pickable, --paper-dark when not).

### PICK UP HERE — 2. the nudge visual check is HALF DONE
Nenad approved: sign in as the test account in his normal window, screenshot the
nudge, then restore his session. **His session was never actually displaced** -
the in-page Clerk ticket sign-in returned HTTP 400 and did not take effect. He is
still signed in as himself. Do not assume otherwise; check before acting.

**A LIVE TEST ACCOUNT IS SITTING ON PRODUCTION AND MUST BE DELETED.**
  user_3IJxc0xpraTccmE8bqLkC5Ug0HN  /  dl-nudge3-visual@draftandlens.com
It holds 2 readings and 2 milestones (nudge_revision_memory, nudge_mentor_horizon)
and writer_patterns restatement confirmed_count 1. It was left primed
deliberately: only the THIRD submission remains, so resuming costs one reading
rather than three. If the visual check is abandoned, delete it anyway.

State is exactly right for the third nudge: priorSubmissions will be 2, no
pattern is nameable (restatement needs 2 distinct works), nothing is grouped, no
revision - so `nudge_keep_sending` will fire.

To finish: sign the browser in as that user, paste the corporate-satire piece,
mode "story", click ANALYSE, wait ~3.5 min, screenshot the nudge line
"The more you send me, the more I'll notice across your work."
Then DELETE /api/account as that user, and confirm Supabase rows are 0 and the
Clerk user 404s.

Restore instructions for Nenad's own session (only if it does get displaced) are
in the session scratchpad file RESTORE_OWNER_SESSION.md; his Clerk user id is
user_3HpInqchAM6HI5nrIDI4yWADneK. A sign-in ticket minted from his own
CLERK_SECRET_KEY restores it without handling any password.

### Two open items he has NOT ruled on
- `withheld_payoff` tradition gate substring-matches "literary fiction" inside
  "Corporate satirical literary fiction", so it recorded against a comic satire.
  `traditionTreatsAsFailure`, src/lib/writer-patterns.ts. Corpus-semantics call.
- Pills uppercase book titles (HOME, not Home) via the shared `pill()` helper.

### Gotchas that cost time today - do not relearn them
- The Vercel deploy does NOT reuse the local chunk hash, so polling
  `_next/static/.../page-<localhash>.js` for a 200 never succeeds. Verify a deploy
  by loading the page and checking behaviour instead.
- `pkill -f "next start"` does not kill the local server; the process is named
  `next-server`. Kill by PID from `lsof -ti:3000` or the new server silently
  fails to bind and you test a stale build.
- The production BETA_GATE_PASSWORD does NOT match the one in local .env.local.
- `innerText` returns CSS-uppercased text, so `includes('On its own')` is false
  while the pill reads ON ITS OWN. Match case-insensitively.
- getComputedStyle during the pills' 150ms transition, or on a node React has
  replaced, gives misleading values. Screenshot to confirm.


## CLOSING NOTE — 2026-08-23, all work complete

### Shipped and verified live
- `aadb3a4` steps 2 and 3 inert until step 1 has work
- `2b7870e` removed "It arrives as I write it."
- `850a228` step 3 grouping choices always inline (no card, no radios, no disclosure)
- `8adc748` auto-grouping trace reworded to confirm rather than confess
- `78e144b` "Complete piece or excerpt?" contrast — verified: inert #c8c0a8, active
  #f5f1e8, an exact match for the step headings
- `af51623` satire never records `withheld_payoff` (+ first tests for that gate)
- `c7b4047` manuscript titles keep their case in the grouping pills ("Home")

### The third nudge — VISUALLY CONFIRMED, nothing outstanding
Rendered on screen on production after a real third submission through the UI:
"The more you send me, the more I'll notice across your work." — italic, amber
rule, DISMISS control, below the goal prompt. All three milestone rows were
present (`nudge_revision_memory`, `nudge_mentor_horizon`, `nudge_keep_sending`).

### Test accounts — BOTH FULLY DELETED, verified
`dl-nudge3-test@` and `dl-nudge3-visual@`: all seven per-user Supabase tables at
0 rows, Clerk GET 404, email search 0 matches for both.

### Nenad's own session — displaced and restored, verified durable
Restoring via `Clerk.setActive` in-page LOOKED fine but did not survive a reload
(API calls came back 401) because the session cookie never wrote durably. What
actually worked: navigate to `https://www.draftandlens.com/?__clerk_ticket=<token>`
and let Clerk run the full handshake. Verified by a clean reload with no ticket:
/api/works and /api/ledger/suggest both 200. If a future session ever needs this,
use the URL-ticket form, not setActive.

### Still unruled by Nenad
- Letter-spacing on title pills eased .22em → .08em alongside the case change.
  His ruling named case only; flagged in `c7b4047` and revertible on its own.
- The satire gate fix is covered by unit tests and is deployed, but was never
  exercised by a live satire submission — that would cost another full reading.

### Gotcha worth keeping
The debounced grouping effect does not re-fire if text and mode already settled
before the session became valid. Nudge the textarea to re-trigger it, or a
manuscript pill will look missing when it is not.


## APPROVED COPY — Interrogate mode helper line (2026-08-23)

Interrogate / push-harder mode is NOT built. This records Nenad's ruling on its
copy so it is not lost between sessions.

The goals-aware second sentence of the helper line, when Mentor goals exist:

    "I'll bear in mind what you told me you were trying to do."

REJECTED, do not use: "I'll hold it against what you said you're working on."
In British English "hold something against someone" reads as resentment, which
is the opposite of the intent. Same reason the wider "hold against" sweep was
commissioned — see the copy audit in this session.

### The two open rulings — DECIDED 2026-08-23

1. **The toggle resets on every submission. It never persists.** A sticky
   toggle becomes a default by habit, and the mode may never be the default.
2. **On an excerpt the mode still runs, with best-in-class suppressed.** The
   ambition-fit half still runs; the best-in-class half does not, because it is
   a whole-work standard and an excerpt judged against a finished book is a
   false comparison.

Still awaiting approval: placement inside step 2, the READ IT / PUSH HARDER
pills, and the first helper sentence.


## RESUME NOTE — 2026-08-23, second usage-limit pause

### Items 1 and 2 of the six-item brief are DONE and deployed

Item 1 needed no work: the how-it-works paragraph fix was already live at
`6eee6c0` and verified. (The brief said "two how-it-works fixes just approved";
only one had been approved. The heading was folded into item 2 as a "hold"
instance. The other thing raised — the dropped "I won't invent progress"
promise — is NOT a hold fix and is still unruled. See below.)

Item 2, every writer-facing "hold" rewritten, one commit per page:
- `0309644` how-it-works x5 (147 read against / 178 answer to / 196 working /
  220 remember / 256 heading remember)
- `dab1de9` ledger index + detail (must keep to; rules and states now *apply*;
  "answer to" matching how-it-works)
- `7ee18dc` about:23 (do not answer to the same rules)
- `315c5fe` goals errors x4 sites (keep / I still have it)
- `a9a388b` FragmentPanel:267 (working)

Deployed as `a9a388b`. **NOT yet verified live** — deploy fired at the pause.
First job on resume: load /how-it-works, /ledger, /about and confirm.

Two "hold" instances deliberately left, both out of scope:
- `src/app/(app)/page.tsx:425` — a code comment, not copy.
- `src/app/api/converse/route.ts:36` — "How is the writing itself holding up?"
  is a prompt instruction, and the brief said writer-facing only. It now
  disagrees with the UI copy that offers it, which reads "working". Worth a
  ruling.

### PICK UP HERE — items 3, 4, 5, 6 not started

**3. Interrogate mode.** All decisions are recorded above in this file: opt-in,
resets every submission, ambition-fit always, best-in-class suppressed on
excerpts, helper line "I'll bear in mind what you told me you were trying to do."
The brief requires the UI placement and pill copy be PROPOSED IN THIS FILE
BEFORE BUILDING, and not deployed without the proposal recorded. The earlier
proposal (step 2 placement, READ IT / PUSH HARDER pills, first helper sentence)
is in this session's transcript but was never written here — write it here first.

**4. The ~45 placeholder strings** — full inventory exists in the transcript but
NOT in this file. Must be listed here grouped by feature. The groups are:
35 lens self-recognition lines; 3 trend notes; 1 mentor-horizon nudge; 2 fragment
prompts; 1 fragment short-input refusal; ~8 FragmentPanel strings. Plus a second
category with no approval record either way: /how-it-works both tabs, account
page, ledger view, goal copy, continuity flags.

**5. Differentiator copy** — already confirmed exact and pinned by a test
(`65d6a73`). Re-running the suite is sufficient; no drift is possible without
`tests/lib/differentiator.test.ts` failing.

**6. Standing evaluation rule** — not yet run over any of today's work.

### Still unruled by Nenad
- The dropped promise on /how-it-works: the old goals paragraph said "I won't
  invent progress to have something encouraging to say — if a draft gives me
  nothing real to say about what you wanted, I say nothing about it." His
  replacement text dropped it. Behaviour is unchanged (the rule still lives in
  `goal-progress.ts`) but the page no longer promises it.
- "onward" vs "onwards" in the two ledger lock explainers.
- "spelled" vs "spelt" in the same explainer.
- Prompt-level "holding up" in converse/route.ts (above).


## SESSION 2026-08-24 — items 1–4 of the six-item brief, done

### 1. The hold sweep, verified live — and one miss

Loaded on production and read in full: `/how-it-works` (both tabs), `/about`,
`/ledger`. Zero instances of hold / holds / holding / held in the rendered copy
of any of them. The sweep landed.

**But the sweep missed two strings on `/ledger/[manuscriptId]`,** which is a
different route from `/ledger` and was not on the verify list. The two lock
radio buttons still read "Holds everywhere" and "Holds from chapter" — sitting
directly beneath the explainer `dab1de9` had already rewritten to "a rule
*applies* everywhere… a state *applies* from a chapter". The card explained the
choice in one verb and labelled it in another. Fixed at `57e5936` using the
sweep's own replacement.

**The remaining `hold`s in the codebase are all out of scope and should stay:**
- prompt files (`analyst.ts`, `fragment.ts`, `tradition-depth.ts`, the lens
  corpus, the report structures) — server-side IP, no writer reads them;
- the glossary, where "a consistent register holds the reader" and "the
  through-line that holds a story together" are the craft meaning of the word,
  not the resentment sense the sweep was commissioned to remove;
- developer-facing 400s in `api/ledger/[manuscriptId]/route.ts` — CLAUDE.md
  exception 2;
- code comments.

### 2. `converse/route.ts` craft ask — `adb7e8a`

"How is the writing itself holding up?" → "How is the writing itself working?"
Now matches the FragmentPanel option that sends it ("Just tell me how the
writing itself is working"). Nenad's ruling, 2026-08-24, resolving the item the
previous session flagged as needing one.

### 3. onward → onwards — `0ae8d27`

Both writer-facing sites, `/ledger/[manuscriptId]` lines 456 and 630. Nenad's
ruling, 2026-08-24.

Three `onward`s remain in code comments (`api/ledger/[manuscriptId]/route.ts`,
`lib/state-locks.ts`, `lib/continuity.ts`). Not writer-facing, left alone.

**Still unruled: "spelled" vs "spelt"** in the same explainer — "Katherine is
never spelled Kathryn". The brief did not cover it.

### 4. The dropped promise, restored — `86ce39e`

Added as the fourth sentence of the `/how-it-works` goals paragraph, Nenad's
exact wording:

> If a reading gives me nothing real to say about what you wanted, I'll say
> nothing about it.

Verified before writing it that the promise is still true of the code:
`prompts/fragments/goals.ts:43–45` instructs "if this draft gives you nothing
real to say about one of them, SAY NOTHING ABOUT IT", and `goal-progress.ts`
independently drops any note whose evidence is not a real substring of the
report. The page had stopped promising a restraint the product still practises.


## PROPOSAL — Interrogate mode UI (2026-08-24) — AWAITING NENAD, NOT BUILT

This is the proposal the brief required to be written down before any code.
**Nothing here is built and nothing is deployed.** It covers the three things
`APPROVED COPY — Interrogate mode helper line (2026-08-23)` left open:
placement, pill copy, and the first helper sentence.

Everything already decided stands unchanged and is not re-opened here: opt-in
only (Architecture §21b), the toggle resets on every submission, ambition-fit
always runs, best-in-class is suppressed on an excerpt, and the goals-aware
second sentence is "I'll bear in mind what you told me you were trying to do."

### A. Placement — a sub-label row inside step 2

The submission panel is three numbered steps: **1 Your work** (paste/upload),
**2 What is it?** (four type pills, then the sub-label "Complete piece or
excerpt?" with two more pills), **3 Where does it belong?** (grouping pills,
inline since `850a228`). `src/app/(app)/page.tsx`, lines ~790 / ~922 / ~990.

**Proposed: a third row inside step 2, directly beneath "Complete piece or
excerpt?", built exactly like it** — a mono sub-label one rank below the step
headings, then a two-pill grid. Sub-label: **HOW SHOULD I READ IT?**

Why there, in order of weight:

1. **It must not be a numbered step.** §21b is explicit that Interrogate is
   opt-in and never the unprompted default. A step 4 gives it equal standing
   with "what is it?" and turns an invitation into a question the writer has to
   answer. The sub-label rank is the visual grammar of "optional" that this
   panel already has.
2. **It is the same class of question as complete/excerpt.** That control is
   also half about the work and half about how to read it — an excerpt already
   suppresses whole-work judgements. Interrogate has exactly that character.
3. **The two controls interact, so they should be adjacent.** The 2026-08-23
   ruling is that on an excerpt the mode runs with best-in-class suppressed.
   Putting the two rows together means the writer can see both choices at once
   and the suppression is legible rather than mysterious.
4. **Not next to ANALYSE.** A last-second setting above the submit button gets
   clicked by reflex, and there is no room there for a helper line — and the
   helper line is what makes the consent informed.

Same enable/disable rule as the rest of step 2: inert until `hasWork`, using
the `pill()` helper and the `--paper` / `--paper-dark` pair the sub-label above
it already uses.

### B. Pill copy — READ IT / PUSH HARDER, as proposed

    HOW SHOULD I READ IT?
    [ Read it ]   [ Push harder ]

**"Read it" is pre-selected.** That is the default reading and it must look
chosen, not blank — `submissionType` already sets the precedent by defaulting
to `complete`. A writer who ignores this row gets exactly what they get today.

"Push harder" is the writer's own phrase for what they are asking for, which
keeps it an instruction to the editor rather than a product feature name. It
also matches the internal name in Architecture §21b, so the code and the
control agree.

**Reset:** clear alongside the other per-submission state at
`page.tsx:~470`, where `setProvenanceHold('')` and the rest already reset —
that is what makes ruling 1 (never persists) fall out of the existing shape
rather than needing its own mechanism.

### C. The helper line — first sentence

Appears **only when "Push harder" is selected**; "Read it" shows nothing, so
the panel stays quiet in the default case. Editor's voice, developmental, and
it has to make the consent informed by saying what actually changes.

**Proposed, complete piece:**

> I'll question the ambition itself, not just how far you got with it, and show
> you what the strongest work in this tradition reaches for.

**Proposed, excerpt** — because best-in-class is suppressed there and the line
must not promise it:

> I'll question the ambition itself, not just how far you got with it. What I
> won't do on an excerpt is set it beside the strongest work in the tradition —
> that's a whole-work standard, and a passage judged against a finished book
> isn't a fair reading.

(First draft of this line said "I'll leave the comparison alone" before the
comparison had been introduced — it withdrew something the writer had not yet
been told existed. Caught in the evaluation pass below.)

Then, appended when the writer has live Mentor goals, the already-approved
sentence: **"I'll bear in mind what you told me you were trying to do."**

Two alternates for the first sentence if the above is too long:
- "I'll ask whether the thing you're attempting was worth attempting, and show
  you the standard the strongest work in this tradition reaches."
- "I'll take the question the reading normally leaves alone — whether the
  ambition was the right one — and show you what this tradition can do."

### D. Not proposed here, and still open

- **Where the opt-in shows up in the report.** The reading has to be visibly
  the interrogated one, or the writer cannot tell the mode did anything.
- **§21c best-in-class research is a hard prerequisite** and is not done. The
  architecture is explicit that Interrogate done badly "curdles into
  external-rubric imposition — the very thing Draft & Lens exists to avoid".
  The UI can be approved before that research; the mode cannot ship without it.


## INVENTORY — every unapproved writer-facing string (2026-08-24)

Counted from source on 2026-08-24, not from the previous session's estimate.
**The real total is 54, not ~45** — the FragmentPanel group is 12 strings, not
the ~8 the resume note guessed. Two things previously listed as unapproved have
since been approved and are recorded at the bottom so they are not re-litigated.

Category A is copy the code itself marks `PLACEHOLDER`. Category B is copy with
no approval record either way — never marked placeholder, never signed off.

---

### CATEGORY A — marked PLACEHOLDER in the source (54 strings)

#### A1. Lens self-recognition — 35 lines
`src/prompts/lenses/self-recognition.ts` — one per lens, `LENS_SELF_RECOGNITION`.

What a lens says when handed its own author's published prose. Each does the
same three things in that voice's register: claims the work, declines to read
it, asks for the writer's own. Deliberately short.

    hemingway    This one is mine. It was true when I wrote it. Show me yours.
    carver       That's mine. I cut it to the bone years ago. I'd rather see yours.
    chekhov      You have handed me my own pages. Bring me something of yours — that is the more interesting proposition.
    oconnor      This is my own, and I know precisely where the violence lands. Show me yours instead.
    bukowski     This one's mine. I know what it cost me. Go on — give me something you wrote.
    nabokov      I recognise the sentence; I made it, and rather carefully. Bring me one of yours and I shall attend to it properly.
    coppola      This is mine. I have argued with it for years. Let me see yours.
    wenders      I know this road. I made it. Show me where yours goes.
    spielberg    This one's mine — I know every beat before it lands. I'd much rather see what you've made.
    coens        That's ours. We know how it ends, and it isn't well. Bring us yours.
    villeneuve   This is mine. I already know its silences. Show me yours.
    scott        I built this world. Show me yours — that's the one I haven't seen.
    welles       You have handed me my own work. Flattering. Now show me yours.
    jeunet       This is mine — I remember every small object in it. Bring me yours.
    tarantino    That's mine. I wrote every word of it and I could talk about it all day, which is exactly why you should show me yours instead.
    wachowski    This is ours. We already know what it's asking. Show us yours.
    sorkin       That's mine. I know what everyone says next and I know why. Let's look at yours.
    puzo         This is mine. I know what it cost the family. Show me what you've written.
    roth         This is mine. I have lived in it long enough. Let me see yours.
    bruckheimer  That's mine — I know what it opened to. Show me yours.
    feige        That one's ours. I know exactly where it fits. Show me yours.
    lucas        This is mine. The shape of it is already settled. Show me yours instead.
    king         This is mine — I'd know it anywhere, warts and all. Now show me yours.
    fey          That's mine. I'd know that joke anywhere; I've apologised for it. Show me yours.
    miyazaki     This is my own. I would rather see what you have made.
    kaufman      This is mine, which is a strange thing to be handed by someone else. Show me yours instead — that one I haven't already failed at.
    simon        That's mine. I know which institution eats him. Show me yours.
    chandler     This is mine. I'd know the smell of it in the dark. Bring me yours.
    leonard      That's mine. Show me yours — I'll tell you if it moves.
    highsmith    This is mine. I know exactly what he does next, and I don't forgive him for it. Show me yours.
    leguin       These are my own words. Bring me yours; that is the better book to be reading.
    christie     This is mine, and I know who did it. Show me yours — I do enjoy not knowing.
    morrison     This is my own. I would rather hear you.
    ferrante     This is mine. Show me yours — I want to hear how you say it.
    blume        This one's mine. I'd much rather read yours — tell me what you're working on.

**Coverage is complete and enforced.** `LENS_SELF_RECOGNITION` is typed
`Record<LensId, string>`, and `LENS_IDS` in `prompts/lenses/types.ts` has
exactly 35 entries — so `tsc` fails if a lens is ever added without a line.

**Correction to a doc, not to this list:** `DL_ONLY_ReadFirst.md` says "the 36
lens voices". The code has 35, in `LENS_IDS`, `prompts.ts` and `meta.ts` alike.
The 36 is stale. Not amended here because that file is Nenad's.

#### A2. Trajectory trend notes — 3 lines
`src/lib/writer-patterns.ts`, `TREND_NOTES` (line ~373). Sits italic beneath a
named pattern in the report.

    improving   It hasn't turned up in your last couple of pieces, though — whatever you're doing about it is working.
    stable      It hasn't shifted much: it is turning up about as often as it was.
    worsening   It has been in each of your recent pieces — more consistently than it used to be.

#### A3. Mentor-horizon nudge — 1 line
`src/lib/nudges.ts`, `MENTOR_HORIZON` (line ~94). Quoted verbatim from the
Mentor Completeness spec; fires on the second reading.

    The more you send me, the more I'll have to say about where you're going rather than where you are.

#### A4. Fragment prompt copy, server-side — 2 strings
`src/prompts/fragment.ts` lines 29 and 33.

    FRAGMENT_REDIRECT_COPY
      That one needs the whole piece in front of me — reading it properly means
      reading the chapter with this in place, not guessing from the passage.
      Paste me the chapter with it in and I'll read it properly.

    FRAGMENT_ASK_TRADITION_COPY
      Tell me what tradition you're working in and I'll answer that properly.
      I won't guess it from a passage this size — getting that wrong would bend
      everything else I said.

#### A5. Fragment short-input refusal — 1 string
`src/app/api/analyse/route.ts` line ~163. The 400 a writer sees under
`FULL_READING_MIN_WORDS`, and the door into fragment mode.

    That's shorter than I can give a full reading to — a reading needs enough on
    the page to have something to be true about. Ask me about it directly
    instead and I'll tell you what I see.

#### A6. FragmentPanel UI — 12 strings
`src/components/fragment/FragmentPanel.tsx`. More than the ~8 previously
estimated.

     189  Just have a passage and a question?           (the entry link)
     243  Paste the passage…                            (textarea placeholder)
     263  Tell me what you'd like me to do with this.
     267  Just tell me how the writing itself is working.
     276  Does this fit with what you've read of my work so far?
     282  Once I've read something of yours.            (why "fit" is disabled)
     289  I'm writing something in [ ] — does this sound authentic to it?
     294  which tradition?                              (inline placeholder)
     322  Or ask me something else…                     (free-ask placeholder)
     339  Reading it…
     363  Start again with the full piece / Ask about another passage
     382  Nothing here is saved — this exchange disappears when you close it.

Plus the error string, repeated at lines 134, 164 and 171 — one string, three
call sites, counted once within the twelve:

    Something went wrong — try me again.

**Voice note:** lines 267 / 276 / 289 are CLAUDE.md's deliberate exception 3 —
written in the WRITER's first person because the writer is choosing them.
Approve them as writer-voice; do not convert them to the editor's voice.

---

### CATEGORY B — no approval record either way

Never marked placeholder, never signed off. Larger than A and mostly Nenad's
own prose already, so this is a confirmation pass rather than a drafting one.

- `/how-it-works`, both tabs — `src/app/(app)/how-it-works/page.tsx`. Heavily
  worked over 2026-08-21/23/24 and much of it is his own wording, but there is
  no line in this log saying "approved as it stands".
- The account page — `src/app/(app)/account/`.
- The ledger, index and detail — `/ledger` and `/ledger/[manuscriptId]`,
  including the lock explainers this session touched.
- Writer-goal copy — `src/lib/writer-goals.ts` and the goal surfaces in
  `page.tsx` / `ReportView.tsx`. (The goal *notes* themselves are model-written
  per reading, so there is no fixed string to approve.)
- Continuity flag copy — `src/lib/continuity-flags.ts` and the flag UI.

---

### ALREADY APPROVED — do not re-open

- **`PATTERN_COPY`, all seven lines** — Nenad, 2026-08-21. Marked in
  `writer-patterns.ts:312`. Earlier log entries at lines 1021 and 1095 calling
  these unapproved are stale and defer to the code.
- **The two shipped nudges** (`nudge_revision_memory`, `nudge_keep_sending`)
  — Nenad, 2026-08-21, `nudges.ts:51/57/64`.
- **The differentiator method line** — final and pinned exactly by
  `tests/lib/differentiator.test.ts` at `65d6a73`. Earlier entries calling it
  placeholder are stale.
- **The Interrogate goals sentence** — "I'll bear in mind what you told me you
  were trying to do", 2026-08-23, above.


## STANDING EVALUATION RULE — run over 2026-08-24's work

Run before marking anything done, per `DL_ONLY_ReadFirst.md`. Scope: the four
copy commits and the two documentation entries above.

### 1. Is this the best it can be?

**The copy changes, yes.** All four are single-word or single-sentence
corrections with a stated reason, and each was checked against the thing it
claims to agree with rather than assumed: `converse` against the FragmentPanel
option that sends it, the restored promise against `goals.ts` and
`goal-progress.ts`, the ledger radios against the explainer directly above
them.

**One thing was not best-it-can-be and was fixed in the pass:** the excerpt
form of the proposed Interrogate helper line withdrew a comparison it had never
introduced. Rewritten above.

### 2. Is anything missing?

**Yes — one real finding, and it needs a ruling.**

The `craft` ask was corrected because its prompt wording disagreed with the UI
option that sends it. **The other two asks disagree in exactly the same way and
were not touched**, because the ruling named `craft` only:

| Ask | What the writer clicks | What the model is asked |
|---|---|---|
| `craft` | "how the writing itself **is working**" | "How is the writing itself **working**?" ✅ fixed |
| `fit` | "Does this **fit with** what you've read of my work so far?" | "Does this **sit consistently with** what you have already read of my work?" |
| `tradition` | "does this **sound** authentic to it?" | "Does this **read as** authentic to the tradition I am working in?" |

This is genuinely Nenad's call and not a lookup, because the file's own comment
argues the opposite: the two layers are kept apart *on purpose* so UI copy can
be rewritten without touching prompt surface. The `craft` fix was commissioned
as a hold-sweep leftover, not as a ruling on that principle.

**The question: was `craft` a one-off, or should all three asks use the
writer's own verb?** Fixing all three is ~10 minutes. Not done unilaterally.

Two smaller gaps, both already noted above and neither blocking:
- "spelled" vs "spelt" in the ledger lock explainer, still unruled.
- Where an interrogated reading announces itself in the report — named as open
  in section D of the proposal, and a prerequisite for the mode being usable.

### 3. Is anything excessive?

**No.** The restored promise takes the goals paragraph to six sentences, in
range for that page (its neighbours run four to six), and it sits directly
after "I won't reduce it to a score or a verdict" — two restraints together,
which is where it reads most naturally.

The inventory entry is long, but length is the point of an inventory; it exists
so the next session does not re-derive 54 strings from source.

### 4. Does it hold up against the product's own standard?

- **A reading, not a rewrite** — untouched by any change today.
- **Editor voice** — all four strings are first person, developmental, and none
  describes the machinery. "Applies everywhere / Applies from chapter" are
  control labels rather than editor speech, the same class as the stage labels
  CLAUDE.md exempts.
- **Tradition-first** — the restored sentence explicitly preserves it: "Your
  goal never replaces the standard your work answers to."
- **No fabrication** — the restored promise was verified true of the code
  before the page was allowed to make it again. That is the rule working in the
  right direction: the page now matches the product rather than the product
  being bent to match the page.

### Verification state

`tsc` clean, `npm test` 239/239 across 23 files, `npm run build` ✓ Compiled
successfully, IP bundle grep over `.next/static` returns exit 1 (no leak).
`differentiator.test.ts` passes, which is the whole of brief item 5 — the
method line cannot drift without that suite failing.


## DEPLOYED AND VERIFIED LIVE — 2026-08-24

Eight commits, `6a94d86..ab10312` plus `0d1a112`. `tsc` clean, 239/239 tests,
`✓ Compiled successfully`, IP bundle grep over `.next/static` exit 1. Pushed,
deploy hook fired (job `NaIOdSplL1B8sXOifvpz`), verified on production.

    adb7e8a  copy(converse)     craft ask: holding up → working
    0ae8d27  copy(ledger)       onward → onwards, both explainers
    86ce39e  copy(how-it-works) the dropped promise restored
    57e5936  copy(ledger)       the two lock radios the sweep missed
    27ee41d  docs               day's record, Interrogate proposal, inventory
    58e7e77  docs               standing evaluation rule
    0d1a112  copy(converse)     fit and tradition asks aligned too
    ab10312  assets             compressed Lucas portrait

### What was checked on the live site, and how

`/how-it-works` both tabs, `/about`, `/ledger`, `/ledger/[id]` — all read in
full through the Chrome extension.

- **The restored promise is on the page**, in the goals paragraph, fourth
  sentence, exactly as ruled.
- **The lock card reads "A state applies from a chapter onwards"** and its two
  radios now read **"Applies everywhere" / "Applies from chapter"**.
- **Zero `hold` / `holds` / `holding` / `held`** in the rendered text of any of
  the four pages. Zero `onward` without the s.

**Gotcha, for the next session: `curl` cannot verify a deploy on this site.**
The beta gate returns 307 to every unauthenticated request, so a poll loop
waiting on page content never terminates. Verify through the extension, which
carries the session. And **`Page.captureScreenshot` timed out repeatedly** on
the ledger detail route while React was settling — `javascript_tool` reading
`innerText` was reliable where screenshots and `find` were not.

### Two new copy inconsistencies found while verifying — both unruled

Same class as the onward/onwards decision, both on `/ledger/[manuscriptId]`:

1. **"spelled" vs "spelt"** — "Katherine is never spelled Kathryn", in the lock
   explainer. Carried over from the previous session's list, still open.
2. **"toward" vs "towards", on the same page, four paragraphs apart** — the
   goal heading reads "WHAT YOU'RE WORKING TOWARD HERE" while the chapter note
   reads "it only stops it counting towards what this book has established".
   `6e32d15` swept "toward" out of the reading's inherited phrasings; this
   heading was not in that sweep's scope.


## 2026-08-24, second deploy — the two British-English fixes

`9f358c9` spelt, `b02414d` towards, `50dfd2c` audit-date correction. Build ✓,
239/239, IP grep exit 1, pushed, hook fired (`sPaN93zDS69xZCUZkBhe`).

**Verified live on production** via `javascript_tool` reading `innerText`:
- lock card: "Katherine is never **spelt** Kathryn" · "applies from a chapter
  onwards" · radios "Applies everywhere" / "Applies from chapter";
- `/ledger/[id]`: "WHAT YOU'RE WORKING **TOWARDS** HERE", zero `toward` without
  the s on the page;
- `/account`: "WHAT YOU'RE WORKING **TOWARDS**", zero `toward`, zero `hold`.

**The heading existed twice.** `GoalList` renders in two places — per-book in
the ledger and writer-level in the account area — and the ruling named only the
one Nenad had seen. Both changed, because fixing one would have swapped a
within-page inconsistency for a between-page one.

Out of scope and correctly left: `spelled` in a `detection-gates.ts` comment
and in the Katherine/Kathryn example in `prompts/detection.ts` (prompt surface);
`toward` in comments, `moderation.ts`, and the lens/report prompts.

---

## STATE OF PLAY before Interrogate and the UI exploration

Checked against source and the live site rather than carried forward from
notes. **Three of the items the governing docs list as outstanding are
already done.**

### Stale in `DL_ONLY_ReadFirst.md` — its "Active queue" is two items out of date

1. **"Lens-voice upload edge case — ACTIVE, approach to be agreed before
   code"** — this is BUILT and live. `src/ai/lens-authorship.ts`, the
   provenance gate (`provenanceHold`, `page.tsx:509–515`), and all 35
   `LENS_SELF_RECOGNITION` lines are in production. The same file's build-order
   paragraph above the queue already says so ("lens self-recognition … stage
   1"). The queue entry contradicts it.
2. **"Cross-submission pattern recognition — needs a `writer_patterns`
   migration Nenad applies by hand"** — also shipped. The table is live (the
   2026-08-23 test account carried a `writer_patterns` row), `PATTERN_COPY` was
   approved 2026-08-21, and the callout renders in `ReportView`.
3. **Only queue item 3 — the Noel-driven UI exploration — is genuinely not
   started.**

**Not amended, because that file is Nenad's.** Offered rather than edited.

### Also closed, contrary to an older note here

`writer_patterns` **is** in `exportUserData` now (`lib/readings.ts`, alongside
`user_milestones`). The 2026-08-22 entry calling it absent is stale.

### Genuinely outstanding before Interrogate is built

1. **The UI proposal above needs approval** — placement, pills, helper line.
2. **§21c best-in-class research is a hard prerequisite and is not started.**
   Architecture v6: define best-in-class *per tradition* from a craft-and-
   success angle, never a generic rubric. Its own stated risk is that
   Interrogate "curdles into external-rubric imposition — the very thing Draft
   & Lens exists to avoid". The UI can be approved before this; the mode cannot
   ship without it.
3. **How an interrogated reading announces itself in the report** — undesigned.
   Without it the writer cannot tell the opt-in did anything.
4. **`AUDIT_CHECKLIST.md`, trigger 1** — Interrogate is a major new feature, so
   the checklist is due before it. Judgement call for Nenad: the last run was
   2026-08-22 and only copy has landed since, so a full re-run may be
   unnecessary. Recording the decision either way is not optional.

### Outstanding but not blocking either piece of work

- **The 54 placeholder strings** in the inventory above. Worth knowing that the
  35 lens self-recognition lines are **already live in production**, so
  unapproved copy is reaching writers today. Nothing else in category A is.
- **The signed-in half of Mentor stages 3 and 4** has still never been walked
  in a browser. `/account` was loaded signed-in today and its goal panel
  renders, which is a fragment of stage 3 — not the check.
- **Title-pill letter-spacing** eased .22em → .08em alongside the case change
  (`c7b4047`); his ruling named case only.
- **The satire gate fix** is unit-tested and deployed but never exercised by a
  live satire submission.


## INTERROGATE MODE UI — BUILT AND VERIFIED LIVE (2026-08-24)

`76e74ea`. Approved copy, approved placement, UI only. §21c not started, so
nothing here changes what the analyst is asked or what comes back.

### Verified on production, by screenshot

- **HOW SHOULD I READ IT?** renders one rank below the numbered step headings,
  directly under COMPLETE PIECE OR EXCERPT?, inside step 2. Step 3 follows
  immediately below it — the numbering is undisturbed.
- **READ IT is pre-selected** (amber), PUSH HARDER outlined. Clicking PUSH
  HARDER selects it and deselects READ IT. No layout shift.
- Both pills are **inert before there is work** and enable at the first word,
  exactly like the row above them.
- **No helper line, no report line** — the gate is shut. Confirmed the gated
  strings are absent from the client bundle entirely (dead-code eliminated).

### The one deviation from the brief, and why

The brief said "the toggle must be visible and selectable but the mode's
actual analytical content comes after the research is done." The toggle is
exactly that. **But two of the four approved strings are not shipped visible,
and this was not a judgement call I felt free to make either way:**

> Architecture v6, **Law — Mentoring and interrogation are never faked.** "No
> feature may simulate or fabricate mentor output … or interrogate output (a
> best-in-class standard) without the genuine input behind it. Where a
> capability cannot run, it is *described*, never performed."

A visible toggle **describes**. These two **perform**, and both would be false
on production today:

- the helper line — "I'll take the question the reading normally leaves alone …
  and show you what this tradition can do" — promises what this submission will
  do, and the submission will not do it;
- the report line — "This is a Push harder reading." — asserts that the reading
  in front of the writer is one, when it is an ordinary reading.

Both are built, tested, and gated on one constant,
`INTERROGATE_ANALYSIS_LIVE` in `src/lib/interrogate.ts`, currently `false`.

**To turn them on the day §21c lands and the analyst genuinely runs the
interrogated read: change that one word to `true`.** Both strings appear
together. `tests/lib/interrogate.test.ts` is written for the flipped state, so
the flip has a safety net rather than a hope — including a test that fails if
the flag is flipped, which is deliberate: it forces whoever flips it to read
why it was shut.

**If Nenad disagrees and wants them visible now, it is a one-word change and I
will make it.** I did not make it unilaterally because the law is written as a
law, not a preference, and shipping against it silently would be the worse
error of the two.

### Other implementation notes

- **Resets at submission, not on return to the panel** (ruling 1, 2026-08-23),
  with the submitted value snapshotted first — so resetting the control cannot
  retroactively change what the report says the reading was.
- **The choice is NOT sent to the server.** When the analysis is wired it
  becomes a submitted field and the SERVER decides whether the line appears,
  exactly as it already does for the differentiator. The client must never make
  that call — that is what keeps a reloaded reading honest.
- The goals fetch behind the helper's second sentence is gated on the same
  constant: zero cost today, correct on the day of the flip.

### Gotcha, confirmed the hard way again

`getComputedStyle` on these pills lies. It reported every pill inert-coloured
while `disabled` was already false, including COMPLETE PIECE, which is selected
by default. The screenshot showed the truth: everything correct. This is the
gotcha already recorded from 2026-08-23 — **screenshot to confirm pill state,
never computed style.** It has now cost time twice.


## REVIEW — the 35 lens self-recognition lines (2026-08-24)

Read line by line against three things: does it sound like that voice, does it
lean on worn language, and is it warm and editorial. Each was also checked
against the file's own three-part rule — claim the work, decline to read it,
return the writer to their own — and against the lens's descriptor in `meta.ts`.

**These are live on production now**, so this is a review of copy already
reaching writers, not of a draft.

**Verdict: 29 of 35 read well and I have left them alone. Six are flagged
below. But the most important finding is structural and affects the whole set,
so it comes first.**

---

### THE STRUCTURAL FINDING — half the set ends on the same five words

**17 of 35 lines close with the exact phrase "Show me yours."**

    Show me yours          17
    Bring me yours          6
    …see yours              3
    Let me see yours        2
    everything else         1 each

And 20 of 35 open with a variant of "This is mine" / "That's mine".

Individually every one of these is fine. Together they are a template, and the
template is visible precisely where it must not be: a writer who tries three or
four lenses in a session — which is the intended behaviour, the grid invites
it — meets the same sentence three or four times from three or four supposedly
distinct minds. The product's whole claim about the lenses is that they are
"each one a distinct way of seeing, not a tone setting on the same engine"
(`/about`). Seventeen identical sign-offs quietly contradicts that claim in the
one moment the writer is most likely to be comparing voices side by side.

**The lines that escape the template are the best ones in the set** and show
what the fix looks like — Wenders' "Show me where yours goes", Welles'
"Flattering. Now show me yours", Leonard's "I'll tell you if it moves",
Christie's "I do enjoy not knowing", Fey's "I've apologised for it".

**Recommendation:** vary the closing formula across the set so no phrasing
appears more than three or four times, taking each variant from that voice's
own preoccupation rather than from a list. This is a bigger rewrite than the
six flags below and it is Nenad's call whether it is worth it — the individual
lines are not wrong, the aggregate is.

---

### FLAGGED — six lines, strongest first

**1. `roth` (Eric Roth) — "This is mine. I have lived in it long enough. Let
me see yours."**
The weakest in the set. His descriptor is "The thing that cannot be said ·
Missed connections · Last image first" and the line touches none of it. "I have
lived in it long enough" would sit unchanged under a dozen other names. Every
other line in the set is unmistakably its own voice; this one is a placeholder
wearing a name. **Rewrite.**

**2. `king` — "This is mine — I'd know it anywhere, warts and all. Now show me
yours."**
"Warts and all" is exactly the kind of worn idiom the reading itself teaches
writers to cut. King's voice is plain-spoken, so an idiom is defensible in
principle, but this one is threadbare and the product loses standing using it.
**Replace the idiom, keep the line.**

**3. `chekhov` — "…Bring me something of yours — that is the more interesting
proposition."**
"Proposition" is businesslike where Chekhov is warm. The formality of the
translated register is right; that particular noun is not — it belongs to a
negotiation, not to a doctor who liked people. **Change one word.**

**4. `miyazaki` — "This is my own. I would rather see what you have made."**
Nothing wrong with it and nothing of him in it. His descriptor is "Every frame
a choice · The world breathes · Ma"; the line has no image and no weather.
Tied with Morrison as the shortest in the set, but Morrison's brevity earns
itself ("I would rather hear you" — *hear*, not read, which is the communal
voice exactly). This one is just short. **Consider a rewrite.**

**5. `carver` — "That's mine. I cut it to the bone years ago."**
Weak flag. "Cut to the bone" is true to what happened to those stories, but it
is also the single most predictable phrase available about Carver, and the
first thing any writer would expect. Accurate, unsurprising. **Leave unless
the set is being reworked anyway.**

**6. `lucas` — "This is mine. The shape of it is already settled."**
Weak flag. Gestures at mythological structure without landing on it; reads a
little abstract beside its neighbours. **Leave unless reworking.**

---

### LEFT ALONE — the 29 that work, and the eight that are genuinely excellent

Working, no notes: hemingway, oconnor, bukowski, coppola, spielberg, coens,
villeneuve, scott, jeunet, tarantino, wachowski, sorkin, puzo, bruckheimer,
feige, chandler, highsmith, leguin, morrison, ferrante, blume.

Genuinely excellent, and worth protecting in any rewrite of the set:

- **nabokov** — "I shall attend to it properly." The hauteur is perfect.
- **welles** — "Flattering." One word doing all the characterisation.
- **kaufman** — "…that one I haven't already failed at." Recursive
  self-laceration; the only line that is funny and sad at once.
- **simon** — "I know which institution eats him." Brutal, and exactly the
  thesis of his work.
- **fey** — "I'd know that joke anywhere; I've apologised for it."
- **christie** — "I do enjoy not knowing."
- **wenders** — "I know this road. I made it. Show me where yours goes."
- **chandler** — "I'd know the smell of it in the dark."

**Tarantino's line is the longest in the set at 26 words and that is correct** —
the length performs the voice. It should not be trimmed for consistency.

### One thing outside this review's scope, noticed while doing it

`roth` resolves to **Eric Roth**, the screenwriter. A writer who picks "Roth"
from a grid of novelists and screenwriters may well expect Philip Roth. Not a
copy question and not mine to decide — flagging it for the lens directory.


## RESUME NOTE — 2026-08-24, usage-limit checkpoint

**Tomorrow's first session is Codex-Maths.** D&L state as of this note:

### Everything committed is pushed and deployed. Working tree clean.

Today, in order: four copy fixes and the ask alignment (`adb7e8a`, `0ae8d27`,
`86ce39e`, `57e5936`, `0d1a112`), the compressed Lucas portrait (`ab10312`),
two British-English fixes (`9f358c9`, `b02414d`), doc corrections (`50dfd2c`
audit date, `a38fd2e` queue trim, `58cf620` audit deferral), and the
**Interrogate mode UI (`76e74ea`) — built, deployed, verified live by
screenshot.** All verified on production. `tsc` clean, 248/248 tests, build
compiled, IP grep exit 1 on every build.

### DONE of tonight's four-item brief

1. **Interrogate UI — done and verified live.** See the entry above. One
   deviation, stated in full there: two of the four approved strings ship
   gated behind `INTERROGATE_ANALYSIS_LIVE` in `src/lib/interrogate.ts`,
   because Architecture v6's Law that interrogation is never faked forbids a
   reading claiming to be interrogated when it was not. **One-word change if
   Nenad disagrees.**
2. **The 35 lens lines — reviewed, six flagged, one structural finding.** See
   the entry above. Nothing was edited; all 35 are still exactly as they were.

### NOT DONE — pick up here

3. **Standing evaluation rule over tonight's build.** Not run. The earlier run
   in this file covers only the daytime copy work, not the Interrogate UI or
   the lens review.
4. **Full handover note.** This note is the compressed version; the fuller one
   asked for was not written.

### What Nenad needs to decide, in priority order

1. **The Interrogate gate** — leave the two strings shut until §21c, or flip
   them now. My recommendation is to leave them shut; the reasoning is in the
   entry above and I will change it in one word either way.
2. **The lens set's closing formula** — 17 of 35 end "Show me yours." Whether
   the aggregate is worth a rewrite is his call; the individual lines are fine.
3. **The six flagged lens lines** — `roth` is the one I would fix regardless.
4. **§21c best-in-class research** — still not started, still the hard
   prerequisite before Interrogate can do anything.

### Build order, unchanged

`DL_ONLY_ReadFirst.md`'s active queue has one item: the Noel-driven UI
exploration. Interrogate is not in the queue and is not next by default — its
UI now exists but its analysis cannot be built until §21c.

**Audit:** last real run 2026-08-22; the 2026-08-24 trigger was deferred by
Nenad and recorded in `AUDIT_CHECKLIST.md` as a deferral, not a run. Next clock
check due **2026-09-12**.

### No blockers. Nothing is half-finished in the working tree.


## PROPOSAL — lens closing lines, 21 rewrites (2026-08-24) — AWAITING NENAD

**NOTHING HAS BEEN CHANGED IN THE CODEBASE. All 35 lines are live exactly as
they were.** This is the proposal only, per instruction.

Scope: the 17 lines built on "Show me yours", plus the four flagged lines whose
closing was the problem (`carver`, `chekhov`, `miyazaki`, `roth`). 21 in total.
`king` and `lucas` were flagged and are already inside the 17.

**Only the closing changes.** The acknowledgement — what the lens says about
the work being its own — is untouched in every one of the 21, as instructed.
The two places where that rule collides with a flag are called out separately
at the bottom rather than resolved quietly.

### The test each rewrite had to pass

Not "is it different" but **would this sentence be impossible in any other
lens's mouth**. Each closing is taken from that voice's own preoccupation in
`meta.ts`, and each still does the third job the file requires: return the
writer to their own work.

I also checked the rewrites against *each other*. The first draft solved the
"Show me yours" template by producing a "Bring me yours" template — ten of
them. That is the same failure with a new phrase, so the set was rebalanced:
no opening formula now appears more than four times, and every tail is unique.

---

### THE 17

| lens | proposed line (closing in bold) |
|---|---|
| **hemingway** | This one is mine. It was true when I wrote it. **Give me a true one of yours.** |
| **oconnor** | This is my own, and I know precisely where the violence lands. **Bring me yours — I don't yet know where it lands.** |
| **villeneuve** | This is mine. I already know its silences. **Let me hear yours.** |
| **scott** | I built this world. **Take me into yours — that's the one I haven't seen.** |
| **welles** | You have handed me my own work. Flattering. **Now yours — and I shall decide how much of it to believe.** |
| **tarantino** | That's mine. I wrote every word of it and I could talk about it all day, **which is exactly why you should hand me yours and let me talk about that instead.** |
| **bruckheimer** | That's mine — I know what it opened to. **Give me your first ten minutes.** |
| **feige** | That one's ours. I know exactly where it fits. **Yours now — I don't know yet what it sets up.** |
| **lucas** | This is mine. The shape of it is already settled. **Send me yours, while its shape can still move.** |
| **king** | This is mine — I'd know it anywhere, warts and all. **Now yours — who's in it?** |
| **fey** | That's mine. I'd know that joke anywhere; I've apologised for it. **Now yours — I haven't had to apologise for that one yet.** |
| **kaufman** | This is mine, which is a strange thing to be handed by someone else. **Give me yours instead — that one I haven't already failed at.** |
| **simon** | That's mine. I know which institution eats him. **Yours now — tell me what it's up against.** |
| **leonard** | That's mine. **Put yours down in front of me — I'll tell you if it moves.** |
| **highsmith** | This is mine. I know exactly what he does next, and I don't forgive him for it. **Find me someone new to not forgive.** |
| **christie** | This is mine, and I know who did it. **Yours next — I do enjoy not knowing.** |
| **ferrante** | This is mine. **Now yours — I want to hear how you say it.** |

**Why each closing belongs to that voice and no other:**

- **hemingway** — picks "true" up out of his own acknowledgement and turns it into the ask. His one rule, used as an invitation.
- **oconnor** — the acknowledgement claims certainty about where violence lands; the closing gives that certainty up. Grace arrives through not knowing.
- **villeneuve** — "hear" against "silences". Ten words, which is his whole method.
- **scott** — world before story, so the ask is spatial. You enter a Scott film before you follow it.
- **welles** — the unreliable narrator, pointed at the writer. Vain, delighted, and not promising to take it at face value.
- **tarantino** — kept long on purpose. The run-on *is* the characterisation, and "let me talk about that instead" is the joke landing on himself.
- **bruckheimer** — his actual doctrine as the ask. A producer asking for the opening reel is asking the only question he asks.
- **feige** — long-game planting: he can't want the piece, he wants what it plants.
- **lucas** — turns "settled" into the reason to send yours now. Fixes the flag: the middle sentence now pays off instead of hanging.
- **king** — character first. Four words, and it's the only question he ever asks first.
- **fey** — the tail was already the best thing in the line; it now extends the joke instead of stopping for a formula.
- **kaufman** — the excellent tail is preserved untouched. Only the four dead words in front of it change.
- **simon** — institutions and the people trapped in them: not "what is it about" but "what is it up against".
- **leonard** — tail preserved. "Put yours down in front of me" is plainer than "show", which is the whole Leonard rule.
- **highsmith** — the strongest of the 17. "Understand, don't forgive" turned into an appetite.
- **christie** — tail preserved; "Yours next" carries the serial-detective rhythm.
- **ferrante** — tail preserved. "How you say it" is the voice-as-body claim.

### THE FOUR FLAGGED WHOSE CLOSING WAS THE PROBLEM

| lens | proposed line (closing in bold) |
|---|---|
| **carver** | That's mine. I cut it to the bone years ago. **I'd rather see what you haven't cut yet.** |
| **chekhov** | You have handed me my own pages. Bring me something of yours — **that is the one I should like to read.** |
| **miyazaki** | This is my own. **Let me see yours instead, with the quiet parts left in.** |
| **roth** | This is mine. I have lived in it long enough. **Send me yours — tell me what it can't quite say.** |

- **carver** — the flag was that "cut it to the bone" is the most predictable phrase available about Carver. The acknowledgement is untouched as instructed, but the closing now earns it: the cliché becomes the setup for a real editorial ask.
- **chekhov** — "proposition" gone. "The one I should like to read" keeps the formal translated register without the boardroom noun.
- **miyazaki** — was the most anonymous line in the set. "The quiet parts left in" is *ma*, and it is an instruction only he would give.
- **roth** — the worst line in the set, and the closing now does the work his descriptor promises: *the thing that cannot be said*.

---

### TWO PLACES WHERE "CLOSING ONLY" COLLIDES WITH A FLAG — Nenad decides

Both were flagged for something sitting in the acknowledgement half, which the
instruction says not to touch. Proposed closings above leave them alone. The
alternatives below are offered, not applied.

**1. `king` — "warts and all".** The flag was on that idiom, and it is in the
acknowledgement. Optional, if he wants it gone:

> This is mine — I'd know it anywhere, **every bad sentence in it**. Now yours — who's in it?

**2. `roth` — the real weakness is the middle, not the closing.** "I have lived
in it long enough" would sit unchanged under a dozen other names. The new
closing carries the line, but the acknowledgement is still the generic half.
Optional:

> This is mine. **I know what it never quite manages to say.** Send me yours — tell me what it can't quite say.

*(That variant repeats "say" deliberately — his subject twice, once as
confession and once as invitation. If the echo reads as a slip rather than a
rhyme, the first version stands.)*

---

### NOT TOUCHED

The 14 lines that were neither flagged nor built on "Show me yours" stay
exactly as they are: `bukowski`, `nabokov`, `coppola`, `wenders`, `spielberg`,
`coens`, `jeunet`, `wachowski`, `sorkin`, `puzo`, `chandler`, `leguin`,
`morrison`, `blume`. Several are the best in the set and the review already
named them as worth protecting.

### AFTER APPROVAL

One commit, `src/prompts/lenses/self-recognition.ts` only, plus an extension to
`tests/prompts/lens-self-recognition.test.ts` pinning that no closing formula
appears more than four times — so the template cannot creep back silently.
**Not deploying without approval.**


## DEPLOYED — the 21 lens closings (2026-08-25)

`4bf4f1e`, pushed, hook fired (`xVofCppdxAm1cUt2RTis`). All 21 applied with
Nenad's two amendments:

- **fey** — "Now yours — I haven't regretted that one yet."
- **kaufman** — "Give me yours instead — I haven't failed at that one yet."

Both drop an echo the proposed versions carried ("apologised"… "apologise",
"failed"… "failed at"). The other 19 are exactly as proposed. Acknowledgement
halves untouched in all 21.

`tsc` clean · **250/250 tests** (up from 248 — two new guards) · `✓ Compiled
successfully` · IP bundle grep exit 1 · the new lens copy confirmed absent from
`.next/static`, as server-side IP must be.

### What is now guarded that was not before

Every per-line test passed for the entire time the "Show me yours" template was
in place, because nothing tested the set as a set. Two tests now do:

1. no closing SENTENCE may be shared by more than two lenses;
2. no closing's first THREE WORDS may be shared by more than four.

The second exists because the first draft of this rewrite replaced "Show me
yours" with "Bring me yours" ten times over — the same failure wearing a new
phrase, and nothing would have caught it. Current distribution sits comfortably
inside both: 34 distinct closings out of 35, one duplicate pair (`jeunet` and
`chandler`, both untouched originals), maximum shared opening of four.

The existing "hands the moment back to the writer" test **failed on three of
the new lines** and was extended rather than loosened, each addition named:
Bruckheimer's singular "your first ten minutes", Carver's "what you haven't cut
yet", and Highsmith's "find me someone new to not forgive" — the only line in
the set that makes the ask without addressing the writer at all, which
satisfies the rule while matching nothing second-person.

### VERIFIED LIVE — and the one thing that was NOT, deliberately

**Verified on production:** the site is healthy, the Interrogate row still
renders, and none of the new lens copy appears in the client bundle.

**NOT verified end-to-end, and it cannot be by me.** A self-recognition line
only fires when a writer submits real published prose by that lens's author,
answers the provenance gate "it's mine", and then opens that lens. Producing
that would mean pasting a substantial extract of copyrighted published work
into the tool, which I am not going to do, and burning a full paid reading to
see one sentence.

**What is actually verified is the whole path except its last inch:** the
strings are correct in source, typechecked, covered by five tests including two
new aggregate guards, and shipped in a build that compiled clean. The remaining
risk is not the copy — it is whether `lens-authorship.ts` still routes to it,
which no line-level change here could have affected.

**If Nenad wants the last inch closed**, the cheapest honest check is a short
public-domain passage by a lens author whose work is out of copyright —
**Chekhov** is the obvious one, and his line changed in this batch. Submit a
page of a public-domain Chekhov translation, answer the provenance gate
"it's mine", open the Chekhov lens, and confirm it returns:

> You have handed me my own pages. Bring me something of yours — that is the
> one I should like to read.

That costs one reading and no copyright exposure. Recorded rather than done,
because it spends his money.

### Approval status is now recorded in the source file itself

`self-recognition.ts`'s header states precisely what is approved and what is
not: the 21 closings approved 2026-08-25; their acknowledgement halves
reviewed, unchanged, never separately approved; the 14 untouched lines still
unapproved copy. It also records that king's "warts and all" and roth's
"I have lived in it long enough" were raised with alternatives and **kept by
his choice** — so a later session does not helpfully "fix" a decision.


## DEPLOYED — differentiator reworded, horizon nudge approved (2026-08-25)

`a9edabc`, `c19c7fe`, `1321f69`. Pushed, hook fired (`vvMeyKdNtAf8YurzHHrv`).
`tsc` clean · 250/250 · build compiled · IP grep exit 1.

**1. Differentiator method line.** Was "I read this differently from the first
time — against what you sent before, not on its own. That's what I mean by a
reading." Now:

> I read this alongside what you sent before, not on its own.

Source and pinned test moved together, as both files require.

**2. `nudge_mentor_horizon` — approved as written**, text unchanged. **All four
nudges are now approved copy, and no `PLACEHOLDER` marker remains anywhere in
`src/`.** The only unapproved writer-facing copy left is the 14 untouched lens
lines and Category B of the inventory.

### VERIFIED — and the honest limit, again

**Verified live:** deploy landed, site healthy, Interrogate row still renders,
and neither string appears in the client bundle (both are server-supplied, as
they must be).

**NOT verified end-to-end, and not cheaply verifiable by anyone.** Both lines
fire **once per account for the life of that account**:

- the differentiator needs a genuine revision of a stored work *with* retrievable
  prior notes, and the `differentiator_method_line` milestone unclaimed;
- the horizon nudge fires on an account's *second* reading.

Nenad's own account has almost certainly spent both. Seeing either would mean a
fresh account and paid readings — which is what the 2026-08-23 session did, and
then had to delete two live test accounts from production to clean up.

**The cheap path, if he wants to see the new differentiator on screen:** re-arm
his own account rather than making a new one, then submit a revision of an
existing work. The SQL is in the footer of
`supabase/migrations/user_milestones.sql`:

    delete from public.user_milestones
     where user_id = '<clerk id>' and milestone = 'differentiator_method_line';

His Clerk id is recorded earlier in this file. One reading, no test account, no
cleanup.

### A stale reason removed, and a question re-opened

- **`user_milestones.sql`'s footer** justified its fail-closed behaviour with
  "the copy is still placeholder". That is no longer true of either line it
  gates, so the reason was corrected (`1321f69`). Behaviour unchanged — failing
  closed is right regardless of approval status.
- **`nudges.ts`: one leg of the horizon line's placement argument has gone.**
  It fires on the second reading rather than the first, and one of the three
  reasons was "displacing an approved line for an unapproved one is not my call
  to make." Now that it is approved, that objection is void. The other two
  reasons stand and behaviour is unchanged — but **the question the spec
  actually asks is open again rather than settled: Gap C literally says "after
  a first reading", which would mean displacing the revision-memory nudge.**
  Nenad's call. Flagged in the source comment too, so it cannot rot back into
  looking decided.


## RULING — Gap C nudge placement, SETTLED (2026-08-25)

**Nenad, 2026-08-25:** revision memory takes priority over the mentor-horizon
nudge. The horizon nudge fires only where revision memory does not apply. The
second-reading slot stands; Gap C's literal "after a first reading" is not
followed. **Closed — do not re-open.**

This closes the question that approving the horizon line had re-opened.

### No code change, and the reason is worth writing down exactly

He is right that nothing needs changing, but **not because a priority check
exists — there isn't one, and a future session looking for it will not find
it.** `selectNudge` is a strict chain on `priorSubmissions`:

    differentiatorShown || patternShown  → null   (silence outranks everything)
    factsExtracted > 0                   → LEDGER_TRACKING
    priorSubmissions === 0               → REVISION_MEMORY
    priorSubmissions === 1               → MENTOR_HORIZON
    priorSubmissions === 2               → KEEP_SENDING

**The two can never compete.** Revision memory is gated on index 0 and the
horizon line on index 1, so revision memory cannot lose a contest it is never
in. The rule is satisfied structurally rather than by arbitration.

And that is by construction, not by accident: revision memory's copy is
forward-looking — *"If you resubmit this revised, I'll read it against what I
said here"* — a sentence that only means anything to someone who has not yet
come back. It is a first-reading line by what it says, not just by its gate.

**Adding an explicit priority check would therefore be dead code**, which is
precisely what the standing rules forbid. The ruling is recorded in the source
comment above `MENTOR_HORIZON` instead, together with the condition under which
it stops being vacuous: if either gate is ever widened so revision memory
becomes reachable at index 1, this ruling is what breaks the tie, and that is
the moment to write the check.

**No new test either.** `tests/lib/nudges.test.ts` already pins both slots —
"offers revision memory on a first reading" (:49) and "offers the mentor-horizon
line on the second reading only" (:62). A third test asserting the same
relationship would be duplication, not coverage.

Note the true precedence is already stronger than the ruling requires: a shown
differentiator or a named pattern silences the nudge entirely, and a real
ledger event outranks every index-gated line.


## FOUND ON RESUME — a §21c draft exists that the record says does not (2026-08-26)

`DraftAndLens_BestInClass_Research.md` has been sitting **untracked** in the repo
root. Its own header dates it 2026-08-23. Every later entry in this file — the
2026-08-24 and 2026-08-25 sessions — states that §21c is "not started". Both
cannot be true, and the file is the older artefact, so **the log has been wrong
since the 24th** rather than the file being new.

Nothing was committed at the moment of the finding. **Superseded later the same
day — see the reconciliation entry at the end of this file.**

### What the draft actually covers — 30 of the 35 lenses

Counted 2026-08-26 from `### ` headings in the draft against the keys in
`src/prompts/lenses/self-recognition.ts`.

- Draft: **32 traditions.** Lenses in code: **35.**
- **Five lenses have no entry:** `blume`, `leguin`, `morrison`, `puzo`, `sorkin`.
- **Two draft entries answer to no lens:** Woolf, Goldman.

So it is substantial but **not the complete prerequisite**. The gate it exists to
open is per-tradition: the Interrogate brain is told to know the identified
tradition before applying any standard (draft, "Notes for Implementation" §1). A
writer landing on one of the five uncovered lenses would get Push harder with
nothing behind it — which is the exact failure `INTERROGATE_ANALYSIS_LIVE`
was shut to prevent.

**`INTERROGATE_ANALYSIS_LIVE` therefore stays `false`.** Finding this draft
changes nothing about the flag. §21c is *begun*, not done.

### The draft's own three implementation constraints, recorded here so they survive

1. Tradition must be identified before any standard is applied.
2. **Suppress the best-in-class standard on excerpts** — the ambition-fit question
   may run on a passage, the finished-work standard may not.
3. Frame questions, never verdicts. *"is this piece reaching for that?"* is the
   mode; *"this lacks menace"* is not.

### Unverified

The draft's content has had **no review** — not by Nenad, not against the corpus.
It is one session's output, uncommitted and unread since. Treat it as a first
draft of the prerequisite, not as the prerequisite.


## RECONCILED — §21c research now covers exactly the 35 lenses (2026-08-26)

`dc16324`, `0af26c1`, `538afed`, `b742eea`. Docs only; no `src/` change, nothing
deployed, **`INTERROGATE_ANALYSIS_LIVE` untouched and still `false`.**

Both files Nenad referred to were already in the repo root, not in `~/Downloads`
— nothing was moved. `DraftAndLens_BestInClass_Research.md` was committed first
in its found state so the two edits after it read as diffs.

### The five gaps are filled

Blume, Le Guin, Morrison, Puzo, Sorkin, verbatim from the transfer file, placed
**before** `## NOTES FOR IMPLEMENTATION` rather than at the true end of the file
— research content after the notes explaining how to use it would be a trap for
the next reader. The transfer file was deleted in the same commit; keeping it
would have been a second copy of a list, which is the exact failure
`lens-directory.ts` was written to end.

### Woolf and Goldman were errors — checked, not assumed

The transfer file asked for this to be confirmed against the live list rather
than guessed. Confirmed against `src/prompts/lenses/types.ts`. Neither is in
`LENS_IDS` under any name, and the only two occurrences anywhere in `src/`
explain both:

- **Goldman — a drift the repo has already corrected once.** The header of
  `src/components/lenses/lens-directory.ts` records that the stale landing-page
  array "advertised Wilder, Pinter and Goldman, who are not lenses". He was
  removed from the UI and then reappeared in the research. **If a third list of
  lenses is ever written, expect him back a third time.**
- **Woolf — a category error, not an invention.** She is real in the source, but
  as an example under TRADITION 3, LITERARY MODERNISM, in
  `src/prompts/modes/story.ts`. **That is the analyst's six-tradition taxonomy,
  which is not the 35-lens set.** Best-in-class research is per-lens, so a
  story-tradition example has no slot in it. Worth holding onto: the codebase
  has two different things both called "tradition", and this is the second time
  that has cost something.

**Verified by set comparison, not by counting:** 35 in code, 35 `###` headings,
no gaps, no orphans, exact match.

### What this does NOT mean

§21c is **content-complete, not done.** Two things still stand between it and
the flag:

1. **The content has never been reviewed** — not by Nenad, not against the
   corpus. It is one session's prose plus a second session's five, now tidy.
2. **Nothing consumes it.** No prompt reads this file; the analyst does not run
   an interrogated read. That was always the second half of the flag's
   condition, and it is untouched.

**So the flag stays shut, and `tests/lib/interrogate.test.ts` should still fail
if anyone flips it.** Completing coverage was the cheap half.

### One thing not built, deliberately

There is **no test asserting this file still matches `LENS_IDS`** — unlike
`lens-directory.ts`, which has one precisely because a hand-kept second list
drifted. This file is now a third hand-kept list of the 35. It will drift the
next time a lens is added or renamed. Not built because it was not asked for;
flagged because the precedent is right there in the repo.


## PROPOSAL — wiring §21c into the analyst (2026-08-26) — AWAITING NENAD, NOT BUILT

Nothing below is built. `INTERROGATE_ANALYSIS_LIVE` is still `false`.

### The blocker is not "full file or section". It is that there is no key.

The research is keyed to **the 35 lenses**. Nothing in the reading pipeline
produces a lens. There are **three different things called "tradition"** in this
codebase and the wiring sits across all three:

1. **`diagnostic.tradition`** — Brain 1's output. Free text, a label of at most
   six words, from an **open vocabulary**: the prompt's own examples are
   "naturalistic drama, mythic/fabular allegory, genre/commercial, literary
   minimalism, magical realism, Southern Gothic, chamber drama". Not an enum.
2. **`STORY_SYSTEM`'s six numbered TRADITIONS** — minimalist realism, mythic /
   allegorical, literary modernism, gothic, satirical, genre. A closed set of
   **six**, used to pick craft standards. This is where Woolf lives.
3. **The 35 lenses** — what §21c researched.

**And no lens is chosen for a reading at all.** Lenses are the conversation
feature (`/api/lens`, `/api/converse`); `/api/analyse` never takes one. The
lens-voice mentions in that route are the authorship gate, a different thing.

So "matched section only" needs a matcher that does not exist. **That is the
decision, and everything else follows from it.** Woolf was the first bill this
three-way ambiguity presented; this is the second.

### Option A — put the whole file in the system prompt. NOT RECOMMENDED.

19.8 KB, 3,074 words, ~5k tokens, appended for push-harder reads and cacheable
through `cachedSystemBlock`. So cost is survivable.

Rejected on correctness, not cost: it hands the analyst 35 standards and asks it
to pick its own, which is precisely what the research's own implementation note 1
forbids — *"The analyst must know the identified tradition before applying any of
these."* A model choosing between Carver and Hemingway mid-reading is free to
blend them, and nothing downstream can tell that it did.

### Option B — matched section, matched by a hand-written alias table. NOT RECOMMENDED.

A map from free text to lens id would be a **fourth** hand-kept copy of the lens
list, and lossy by construction — "chamber drama" and "naturalistic drama"
resolve to no lens without someone deciding they do. This project has now paid
for that pattern three times (landing page, research, and the test written today
to stop the third).

### Option C — matched section, matched by Brain 1. RECOMMENDED.

Brain 1 is already the tradition authority — the analyst "receives the tradition
LOCKED from Brain 1 and never re-identifies it". It already reads the opening and
closing. Give it one more field:

    bestInClassLens: LensId | null

constrained to the 35 ids, **instructed to return null rather than force a fit**.
The judgement happens where the reading already happens, the output is a closed
enum a test can check, and it costs no extra call and a handful of tokens.

Then the analyst receives **exactly one section**, average 83 words, longest 243
— trivial next to `AMBITION_AGAINST_EXECUTION`, which already ships on every read.

### The honest no-match path already exists, and it is why C works

`bestInClassLens: null` → send no standard, and suppress the best-in-class half
of the mode while keeping the ambition-fit half. **That is not a new behaviour —
it is exactly the excerpt rule Nenad already ruled on 2026-08-23**, and
`HELPER_EXCERPT` is approved copy that says it out loud.

**But the approved copy does not cover this case.** `interrogateHelperLine` has
two forms, complete and excerpt. A push-harder read of a *complete* work whose
tradition matched no lens would promise "show you what this tradition can do"
and then not. **That is a copy decision, not a build one — flagged, not
guessed.**

### Where the text lives — a module, not this file

The research **must not be read from disk at runtime.** It sits at the repo root,
one level above the Next app, so it is not traced into the deployment and `fs`
would fail in production. Prompt IP also has to be server-side under `src/`.

So: `src/prompts/interrogate/best-in-class.ts`, `server-only`, a
`Record<LensId, string>`. Today's drift test then asserts **doc ↔ module ↔
LENS_IDS** rather than doc ↔ LENS_IDS. Which forces a question worth answering
once: **is the module canonical and the .md its provenance, or the reverse?**

### Still open after all of the above

**Where does best-in-class appear in the report?** The structure builders
(`report/story-structure.ts` and its siblings) define the sections, and §21b adds
two things to the reading. New section, or inside TRADITION ALIGNMENT — which
script calls GENRE ALIGNMENT and stage play does not have at all? Unresolved;
`AMBITION_AGAINST_EXECUTION` dodged it by attaching to the system prompt.

### Four decisions needed

1. **Option C** — Brain 1 returns the lens id. Approve or redirect.
2. **The no-match helper line** — new copy needed for push + complete + no match.
3. **Where best-in-class lands** in the report structure.
4. **Module or .md canonical** once the module exists.

The flag stays false through all of it. It flips when the reading genuinely
carries interrogated content, not when this wiring compiles.


## BUILT AND DEPLOYED — §21c wired into the analyst (2026-08-26)

`216a17a`, `3364b9f`, `815cb8f`, `32e83d2`. Pushed, hook fired, **live and Ready
in production**. `tsc` clean · 267/267 · build compiled · IP grep exit 1.

**`INTERROGATE_ANALYSIS_LIVE` is still `false`, and must not be flipped without
reading the section at the end of this entry.**

### What now happens on a push-harder read

1. Brain 1 is asked for one extra field, `bestInClassLens: LensId | null`,
   **only** on a push read. An ordinary reading's diagnostic prompt is
   byte-identical to what it was.
2. The server validates it against `LENS_IDS` and coerces anything else to null.
3. The analyst system prompt gains the ambition question, and — on a complete
   work with a match — that tradition's standard. Attached like
   `AMBITION_AGAINST_EXECUTION`; no new report section.
4. The line the reading may carry is chosen **on the server** from what Brain 1
   found, and streamed to the client as an `interrogate` event.

### The three cases are separated in code, not left to the model

The approved helper lines promise three different readings, so the prompt keeps
three different promises: matched complete work gets the standard; an excerpt
gets the ambition question and the true reason the standard is withheld; no
match gets the work's own ceiling and an explicit ban on improvising a standard.

**A bug worth recording because it was live in the first draft:** an excerpt WITH
a match was being sent the no-match text, which told the analyst that nothing
fitted this work's tradition when something had. That is a falsehood the reading
could have repeated to a writer. `tests/prompts/interrogate-directive.test.ts`
now pins it in both directions.

### Verified against the real API, not just by unit test

`runDiagnostician` run live on two texts written for the purpose:

| case | tradition Brain 1 named | `bestInClassLens` |
|---|---|---|
| minimalist domestic story | `literary minimalism` | `"carver"` |
| lyric nature essay | `lyric nature essay` | `null` |
| the same story, ordinary read | `Literary minimalism` | `null` |

The middle row is the one that mattered: it is quiet, domestic and English, and
a model looking for a match would have reached for Carver or Le Guin. It
returned null, which is what the prompt asks for and what the null path exists
to serve.

### THREE THINGS FOR NENAD — the flag does not flip until these are settled

**1. The no-match copy says "hold it against", one word from the phrase that was
rejected.** Approved 2026-08-26 and shipped as approved. The 2026-08-23
rejection was "I'll hold it against what you said you're working on" — holding a
work against a PERSON'S GOALS, where the idiom reads as resentment. The new line
holds a work against a STANDARD and negates it. Different sense, and it reads
correctly. But `tests/lib/interrogate.test.ts` carries a rule against the phrase,
so the new line is **explicitly exempted there with the reasoning**, rather than
quietly excluded. Confirm the exemption stands.

**2. The no-match copy is wired as a REPORT line, not a third helper form.** It
was approved beside the two helper lines and opens with the excerpt line's own
first sentence, so its intended home looks like the helper. It cannot be: the
helper renders under the pills BEFORE submission, and "this one doesn't map
cleanly onto any of my thirty-five lenses" is a claim about a work nobody has
read yet. Submission type is known in advance; a match never is. So it sits at
the top of the reading, chosen by the server once Brain 1 has actually failed to
match. **The words are unchanged. The placement is my call and needs yours.**

**3. What is still NOT verified, and it is the half that decides the flag.** No
push-harder reading has been read end-to-end on production. What is proven is
that the right prompt is assembled and the right lens is found. What is NOT
proven is what the analyst does with it: whether the standard reads as a horizon
or hardens into a score, whether the ambition question stays developmental
rather than turning cold, and whether the reading keeps the editor's voice under
the extra pressure. **That is a reading somebody has to read**, and it costs a
real submission on a real account.

**Until that has been read and judged, the flag stays false.** Everything else
is done.

### One thing noticed in passing, not acted on

The Vercel dashboard shows **two production deployments per commit** — the git
push auto-deploys, and then the documented process fires the hook, which
deploys the same commit again. It goes back through the whole visible history.
Harmless but it doubles build minutes; the deploy process in `CLAUDE.md` may
have one redundant step. Not changed — flagged only.


## THE FIRST PUSH-HARDER READING, READ END TO END — FOR TONE REVIEW (2026-08-27)

This is item 3 of the 2026-08-26 entry above: *"That is a reading somebody has to
read."* It has now been read. **`INTERROGATE_ANALYSIS_LIVE` is still `false` and
was never flipped** — see "The flag was not needed" below. Nothing in the
codebase changed. **Nenad reviews the text below before anything else happens.**

### How it was run

A purpose-written complete short story, "The Inventory" (1,270 words, British
domestic minimalism), through the real brains against the real API, in the
orchestrator's own sequence: Brain 1 with `matchLens: true` → Brain 1b →
narrator verifier → analyst at `depth: 'push'` → narrator correction. Nothing
stubbed. 264 s, 20,076 characters of report.

| | |
|---|---|
| tradition (Brain 1) | `British literary minimalism` |
| register | `spare, oblique, restrained` |
| `bestInClassLens` | **`"carver"`** — a real match, not a null case |
| report line today (flag false) | `null` |
| report line if flipped | `This is a Push harder reading.` |

**The flag was not needed, and this matters for how the result is read.**
`buildInterrogateDirective` does not consult `INTERROGATE_ANALYSIS_LIVE`. The
flag gates only the two writer-facing strings — the helper line and the report
line. The analysis itself was already wired and already runs. So this reading is
exactly what a writer would get the moment the flag flips; it is not a local
approximation of one. Flipping the flag adds one sentence at the top and changes
no other word below.

**No production data was created.** `readings` and `submission_telemetry` are
written only by `/api/analyse`, which was bypassed. Nothing to clean up there.
The temporary harness `tests/tmp-live-pushread.test.ts` was deleted afterwards.

### Where the Interrogate content actually is — read this before the text

**There is no discrete "Interrogate section", by design.** Nenad's ruling of
2026-08-26 attached the mode to the analyst system prompt following
`AMBITION_AGAINST_EXECUTION`, explicitly adding no report section. So the mode
surfaces as pressure distributed through the ordinary headings. The four
passages below are every place it surfaced, complete and verbatim, unedited.

---

#### 1. OVERVIEW — verbatim, complete

> This story works in British literary minimalism — specifically the contemporary British short fiction lineage of William Trevor, Tessa Hadley, and Claire-Louise Bennett, closer to that temperature than to American Carver, though sharing his structural principle: the visible surface holds an invisible weight, and the weight is what the story is about. The evaluation questions this tradition demands are: does the restraint do work, or does it merely avoid? Does the withholding create pressure — does the reader feel what isn't said — or does it simply leave a gap? And does the story's domestic inventory accumulate into something that lands, rather than merely stops?
>
> What this story is attempting: to render grief's resistance to itself entirely through the surfaces of ordinary life — objects, gestures, deferred tasks — without ever naming grief, allowing, or avoidance directly. That is a precise and demanding ambition, and it is the correct ambition for this material. The execution is almost entirely equal to it. Almost.
>
> The primary question the reading needs to answer is whether the ending's legibility — the fence panel repaired in eleven minutes, the reason that would not sound like a reason — closes the gap between restraint and resolution in the right direction, or tips across it into satisfaction the tradition would have held back.

#### 2. THE ENDING — verbatim, complete

> The ending is the primary concern of this reading, and the reading's honest verdict is: it earns almost everything it reaches for, and the "almost" is specific.
>
> The fence-panel repair in eleven minutes is structurally correct — the task introduced early as deferred, now completed; the duration that feels shorter than expected; the inability to think of a reason that would sound like a reason. These are the tradition's instruments used well. The self-knowledge Ray arrives at is genuine: he cannot justify the avoidance in retrospect, which means the avoidance was never rational, which means it was grief, which the story has never named and does not name here.
>
> ⟦standing there afterwards with the drill going cold in his hand he could not think of one reason he had left it since February, not one that would sound like a reason if he said it out loud.⟧ — "the drill going cold in his hand" is right: the cooling hardware is time passing, task complete, the ordinary world reasserting itself. "Not one that would sound like a reason if he said it out loud" is the story's most interior moment — Ray acknowledging the gap between how avoidance feels from inside and how it would read from outside.
>
> But the resolution that precedes this — the embrace, the "It was quilted," Louise's understanding, the photograph placed under the passports — arrives in a sequence that releases rather than pressurises. Each beat is handled well individually; together they constitute three consecutive resolutions. The tradition this story is working in — Trevor, specifically — tends to end on a single image that allows multiple readings and holds them in tension rather than releasing them. The strongest endings in this tradition do not resolve: they land, which is different.
>
> What the fence-panel close does is resolve: Ray has fixed the thing, processed the grief sufficiently to act, understood himself, and the story lets him. That is not a failure of craft — the images are earned and the emotion is not announced. But the question is whether the story's ambition was to arrive at resolution or to sustain a more unresolved pressure. The material — an unknown woman in a photograph, a coat that may or may not have existed, a zip that will not close — suggests the latter. The ending delivers the former with considerable skill.
>
> This is a fixable question, not a structural failure. The photograph placed under the passports is the story's most resonant closing image and it arrives before the fence panel; there is an argument that the fence panel is one beat too many — that ⟦where it would be found by somebody one day who would not know what it was either⟧ is where the story ends.

#### 3. WHAT TO REVISE, item 3 — verbatim, complete

> **3. Consider whether the ending is one beat long.**
>
> The photograph placed ⟦under the passports, where it would be found by somebody one day who would not know what it was either⟧ — this is the story's most unresolved and resonant image, and it arrives before the fence panel. The fence panel is structurally correct and the final line earns its weight. But together they constitute a double resolution — two consecutive closing beats — where the tradition tends to trust one. This is not a directive to cut the fence panel; it is a question to sit with: if the story ended on the passports drawer, what would be held in suspension that the fence panel releases? The writer is the only person who can answer whether that suspension is preferable to the earned resolution the fence panel currently delivers.

#### 4. WHERE TO GROW NEXT — verbatim, complete

> The precision this story achieves through objects — each one doing emotional work without being pointed at — is a genuine and developed instrument. The next place to take it is a story where the object in question is contested: not unknown (as the photograph is), but actively disputed by two characters who are each right. The coat dispute in this story gestures at that possibility and then resolves it — Louise is right, Ray is wrong. What the writer could build toward is a story where the object is genuinely ambiguous and neither character has the privileged reading of it, so the reader is left holding the dispute rather than the resolution. That asymmetry — both sides specific, neither side wrong — would put this writer's particular instrument under a pressure it has not yet been asked to bear.

---

### THREE THINGS THE READING SURFACED — Nenad's calls, not mine

**1. The standard is quoted back at the writer, nearly verbatim, and the
directive forbids exactly that.** `BEST_IN_CLASS.carver` ends: *"The ending
doesn't resolve — it lands, which is different."* THE ENDING says: *"The
strongest endings in this tradition do not resolve: they land, which is
different."* `standardBlock()` says **"Do NOT … quote these sentences back at
the writer."** The OVERVIEW's three "evaluation questions this tradition
demands" are the same standard converted to questions — *"The white space does
work"* → *"does the restraint do work"*; *"the reader feels what isn't said"* →
*"does the reader feel what isn't said"*. That conversion is the move the
directive asks for and reads well. The near-verbatim sentence is not. **No
writer could detect either.** It is a fidelity question, not a tone one, and the
fix is a line in the directive, not a rebuild.

**2. The analyst swapped the researched standard for an unresearched one.**
Brain 1 matched `carver`; the analyst opened by moving the work *away* from him
— *"closer to that temperature than to American Carver"* — and then made Trevor
the standard-bearer: *"The tradition this story is working in — Trevor,
specifically."* So the horizon the writer is held to is Trevor's, and Trevor is
not one of the thirty-five. Two readings of this and they are genuinely
different products: the analyst is refining a rough match honestly and in the
tradition's real vocabulary (good, and the ruling that the standard is "what you
already know … made explicit" invites it), **or** the researched standard is
being silently replaced by one nobody researched, which is the §21c guarantee
leaking. Worth knowing that the rough match was *correct* — a British domestic
minimalist story genuinely is Carver-adjacent — and the analyst said so more
precisely than the lens id could.

**3. On the tone question §21b actually asked — the standard did NOT curdle
into a score.** The evidence, all of it in the text above: *"This is not a
directive to cut the fence panel; it is a question to sit with"*; *"The writer
is the only person who can answer"*; *"That is not a failure of craft"*; *"This
is a fixable question, not a structural failure."* The ambition verdict landed
on the *correctly-matched* branch — *"it is the correct ambition for this
material"* — rather than defaulting to a deficit, which is the branch that
proves the prompt's four-way opening was real and not decoration. The register
stayed developmental and the editor's voice held under the extra pressure.
**One wobble, minor:** *"the reading's honest verdict is"* is the reading
narrating its own machinery, which the voice rule dislikes. One clause.

### WHAT HAPPENS NEXT — nothing, until Nenad has read the above

The flag stays `false`. Points 1 and 2 are open questions on the *directive*, and
both are cheap to fix once ruled. Point 3 is the one that gated the flag and it
came back clean — but "clean on one reading of one matched story" is what was
proven, not "clean". The two decisions still open from 2026-08-26 (the "hold it
against" exemption, and the no-match line's placement at the top of the report)
are also still open and unchanged.


## THE THREE GUARDS, AND THE SECOND READING THAT TESTED THEM (2026-08-28)

`25b1fea` then `fe2d6d3`. `tsc` clean · 272/272 · **`INTERROGATE_ANALYSIS_LIVE`
still `false`, never touched.** Not deployed — no hook fired, nothing pushed.

Nenad's rulings on the three defects in the 2026-08-27 reading: fix the quoting
leak with a countable rule; forbid leaving the researched set; cut the
self-narration. All three are in. A second reading was then run to verify them —
a fresh story in a **different** tradition, so the fixes were tested as general
rules rather than as patches to the Carver case.

| | first reading | second reading |
|---|---|---|
| story | "The Inventory", 1,270 words | "The Crossing at Kalambaka", 1,000 words |
| tradition | British literary minimalism | literary minimalism |
| lens | `carver` | **`hemingway`** |

### What the verification actually found — one guard failed on first attempt

Measured by n-gram overlap between the reading and `BEST_IN_CLASS.hemingway`:

| guard | result |
|---|---|
| self-narration | **held.** Zero hits for "the reading's", "this reading", "the reading must/will/needs". |
| stay in the researched set | **held.** Hemingway the only writer named; no yardstick moved. |
| no reuse of the standard's wording | **FAILED.** Three five-word runs and six four-word runs, including *"surface meaning and something deeper simultaneously"* and *"carry the entire emotional weight"* — both lifted whole. |

**Why the countable rule lost, and it is worth knowing before writing another
one.** The instruction directly above it supplied a template: *"The strongest
work in this tradition achieves X — is this piece reaching for that?"* That
sentence tells the model to convert the standard into a question, and the
cheapest way to do that is to keep X's wording and add a question mark. A
concrete exemplar beat an abstract prohibition sitting four lines below it. The
rule was not ignored so much as outvoted by its own neighbour.

**The fix was to delete what defeated it,** not to write a firmer version of it.
The template is gone; in its place is the demand it stood for — build the
question from this work's own nouns — carried by a worked wrong/right pair. The
example uses an invented work (a flat clearance) and says so explicitly in the
prompt, because a concrete example risks the model reading those details as
belonging to the submission in front of it. The countable rule stays as a
backstop.

**Re-measured on the same story and the same lens, the prompt the only
variable:** three five-word runs and six four-word runs → **one four-word run**
(*"trusts the reader completely"*). Reduced, not eliminated. Whether that
residue matters is a judgement call and it is Nenad's: it is four words of
generic craft language, and no writer could source it.

### Two new things the second reading showed — neither is a regression

**1. An external authority appeared, from inside the set.** WHAT IS WORKING now
opens: *"To Chekhov's note to Gorky: Find the characteristic detail. Not several
details, but one characteristic detail."* Chekhov IS one of the thirty-five, so
the stay-in-set rule is satisfied — but `standardBlock` also says not to
"present it as an external authority the reading is deferring to", and opening a
section by deferring to Chekhov is that, in a milder form. Not fixed; flagged.

**2. The ambition question came back thinner than in the first reading.** It is
present — *"That is a disciplined and difficult ambition, and this story largely
serves it"* — but it is one clause, where the Carver reading gave it a paragraph
and returned to it in THE ENDING. Two possible causes and they need different
responses: the story genuinely offered less to interrogate, or the enlarged
`standardBlock` is crowding `AMBITION_INTERROGATED` out. One reading each way is
not enough to tell. **Worth watching on the next run rather than acting on now.**

---

### THE INTERROGATE CONTENT OF THE SECOND READING — verbatim, complete

Still no discrete section, per the 2026-08-26 ruling. These are the passages
carrying the mode.

#### OVERVIEW

> This story works in the Hemingway-lineage minimalist tradition — the iceberg method, where dialogue does the work of concealment, and environmental detail carries the emotional weight that no character will speak aloud. The tradition's central demand: that what is withheld must be felt as fully as what is said, and that the surface of ordinary conversation must hold the pressure of something larger beneath it without cracking.
>
> The story knows exactly what it is trying to do. Two people, a café, a departure that has been decided before the scene begins. The ambition is precise: to render, through the logistics of buses and monasteries and beer brands, the interior distance opening between two people who will not name what is ending. That is a disciplined and difficult ambition, and this story largely serves it.
>
> The craft is, on the whole, working. Dialogue rhythms earn their keep; the environmental architecture is active rather than atmospheric. The single structural question — whether something genuinely shifts across the scene, or whether obliqueness simply holds static — has a clear answer: the story does move. The man's pre-meditated planning is revealed mid-scene, the emotional confrontation arrives with precision, and the closing image delivers a self-indictment the opening could not have prepared. That is accumulation, not stasis.
>
> One note of honest qualification follows in the revision section, concerning the moment where the prose comes closest to breaking its own contract.

#### WHAT TO REVISE, item 1 — the interrogated note

> **1.** ⟦"Whatever it takes to do it," he said. "I don't know how long. That's the honest answer and you won't like it but it's the honest one."⟧
>
> This is the story's weakest passage, and it matters most because it arrives at the scene's emotional peak — the moment he finally says the thing. The problem is specific: *"That's the honest answer and you won't like it but it's the honest one"* is the man explaining his own honesty to her, which is a different act from being honest. In every other exchange, the man is evasive, indirect, self-concealing — his speech is characterised by logistics rather than declaration. Here, he breaks that pattern not by arriving at vulnerability but by announcing it. "The honest answer" names itself twice in the same sentence, which is the grammatical shape of a man who doesn't quite trust what he has said.
>
> The move: strip the declaration back to what he actually knows. He knows the what (go back) and the when (tonight). What he does not know — what is genuinely unknown to him — is the how long and the what for. The passage could end at the edge of that unknowing, rather than explaining that the unknowing is honest. The scene around this line is doing its job precisely; this line overstates.

#### WHERE TO GROW NEXT

> This story's instrument is the scene — compressed, real-time, one location, everything carried by what two people do with their hands and what they will not say. The writer owns that instrument with considerable confidence. What this piece suggests as a possible direction: a story built across multiple such scenes, where the same two people (or a different pairing) return to the same kind of surface conversation at different intervals — and what the reader carries between scenes, unspoken in both, is what the story is actually about. The discipline here is proving that absence accumulates. What's been demonstrated in a single scene is harder and more interesting across two or three.

#### VERDICT

> **VERDICT: DEVELOP FURTHER**
>
> This is accomplished, disciplined minimalist realism — a story that knows its tradition and works within it with consistency and genuine skill. The dialogue rhythms hold, the imagery earns its keep, the closing self-indictment is prepared by the opening exchange and arrived at without announcement. The story is very close to finished. What stands between this draft and a complete one is a single passage — the man's declaration of his own honesty at the scene's emotional peak — where the prose breaks the evasive, logistical character of his speech and names itself, doing what the surrounding silence was already doing more precisely. Fix that passage to match the compression the rest of the story sustains, and this is ready.

---

## ⚠️ A SEPARATE AND MORE SERIOUS BUG, FOUND BY THIS RUN — NOT INTERROGATE, NOT FIXED, NOT MINE TO FIX WITHOUT A RULING

**Brain 1 is shown a mid-sentence fragment of any submission between roughly
3,000 and 6,000 characters, with nothing telling it the text was cut.**

`src/ai/brains/diagnostician.ts`:

```
const maxChars = 3000;
const opening = text.slice(0, maxChars);
const closing = text.length > maxChars * 2 ? text.slice(-maxChars) : '';
const excerpt = closing ? `[OPENING OF WORK]\n${opening}\n\n[CLOSING OF WORK]\n${closing}` : opening;
```

Above 6,000 characters the model gets opening AND closing, each **labelled**, so
it knows it is reading extracts. Below 3,000 it gets everything. **In between it
gets the first 3,000 characters and no label at all** — so a truncated
submission is indistinguishable, to Brain 1, from a work that simply ends there.

**It produced a fabricated defect in a real reading.** "The Crossing at
Kalambaka" is 5,495 characters. Character 3,000 falls here:

> `...going to tell them."\n\nShe laughed at that, and he was glad`

The first run's reading then told the writer, as WHAT TO REVISE item 3:

> **3.** The mid-sentence cut ⟦She laughed at that, and h⟧ — complete the sentence or remove the cut. If this is a submission artifact, the sentence needs its ending.

There is no cut. The story runs to a full stop and continues for another 2,500
characters. The reading invented a flaw out of the pipeline's own truncation and
asked the writer to repair it — and gave it a numbered revision slot.

**Why this is worse than it looks.**
- It is **not** interrogate-specific. Every ordinary reading in that size band
  is exposed, and 3,000–6,000 characters is roughly 500–1,000 words — squarely
  where short fiction and most beta submissions live.
- Brain 1 sets tradition, register, ambition and summary, and every later brain
  is told the tradition is **confirmed**. A diagnosis formed without the ending
  propagates through the whole reading.
- **It is intermittent in what you can SEE.** The truncation is deterministic;
  whether the model remarks on it is not. The second run of the same story did
  not mention the cut at all. So the visible symptom will come and go while the
  underlying blindness is constant — which is exactly the shape of bug that
  survives casual testing.
- It violates the product's own standard against inventing anything, and it did
  so in the most damaging place: a direct instruction to change the work.

**Not fixed.** It is outside the named scope of this session's task and the
obvious repairs are not equivalent — label the truncation so Brain 1 knows what
it is holding; or lower the two-slice threshold so the band cannot exist; or
raise `maxChars` so a whole short story fits. The third is the only one that
lets Brain 1 read a 5,000-character story **whole**, and it costs tokens on
every submission. **Nenad's call, and it should be taken before the next
deploy** — this is live in production today, on ordinary readings.

---

## 2026-08-31 — Claude Code session. Brain 1 truncation: RULED, FIXED, DEPLOYED

**Nenad's ruling (relayed in session):** raise `maxChars`. Not an interrogate-scoped
decision — a live correctness bug on ordinary readings, in the band most short
fiction sits in. Labelling the cut or lowering the two-slice threshold both leave
Brain 1 reading a mutilated submission and only change how honestly it admits it.
Only raising the window lets Brain 1 read the whole thing. He also asked
explicitly for the blind spot to be **closed, not shifted** — check above 6,000
characters for the same defect in a different form.

**Shipped: `6c3408f`.** `src/ai/brains/diagnostician.ts`, plus
`tests/brains/diagnostician.test.ts` (33 tests). Deployed 2026-08-31.

### What it actually cost, measured before the fix went in

Reproduced on a fresh 4,615-character story through the real Brain 1 prompt. The
old path did not merely add a stray revision note — it made the pipeline's own
cut the reading's **`primaryConcern`**:

> "whether the mid-sentence cut-off ending is a deliberate formal act — the
> sentence breaking where the self breaks — or an artifact of incompletion"

and put it in `craftQuestions` and `formNotes` as the thing craft analysis
"should treat as the primary structural question". `primaryConcern` and
`craftQuestions` both go downstream, so the whole reading would have been
organised around a defect the writer's draft does not have. That is worse than
the single numbered note recorded on 2026-08-28. Same story, new path: no cut
mentioned, ending read, tradition right.

### The fix is a shape change, not just a number

`READ_WINDOW_CHARS = 12000`, and **the budget is now ONE number**. Previously it
was a slice size (3,000) plus a threshold (`> maxChars * 2`), and with two
numbers there is *always* a band between them where the text is cut and nothing
says so. Raising 3,000 to 6,000 would have moved the band to 6,000–12,000, not
removed it. The single-slice branch now fires **only when the whole text fits**,
so no such band can exist at any length whatever the constant is set to. This is
the part that matters; the number is replaceable.

**Why 12,000 and not "whole piece always".** The cap is 4,000 words ≈ 20,800
characters (measured, 5.2 chars/word on literary prose). A window of 28,000 would
have made the two-slice path unreachable — the same dead-branch shape as
`FREE_WORD_LIMIT` and the three dead brains. At 12,000 it serves everything over
~2,300 words and stays live. It matches the structural reader's 12,000 but is
deliberately **not** a shared constant: that brain samples five waypoints for its
own reasons and the two numbers should stay free to move apart.

### The same blind spot above 6,000, in a different form — found and closed

Above the window the extracts were labelled `[OPENING OF WORK]` /
`[CLOSING OF WORK]`, which says where they came from but **never that they are
cuts**. A slice boundary lands mid-sentence, so the model was still free to read
that ragged edge as the writer's own — the identical fabricated-defect failure,
one band up, just with a weaker trigger. Both extracts are now prefaced with what
they are, how much was removed, and "Never read a cut edge as a flaw in the
writing."

Verified live on a 13,827-character submission: the opening extract ends
"and then put the" and the diagnostic says nothing about it, while still catching
the genuine corruption in the test fixture. Discrimination intact.

### Cost

Measured with `count_tokens` on literary prose — 4.44 chars/token, Sonnet 4.6 at
$3/MTok input. Worst case **+1,407 input tokens, +$0.0042 per reading**, and
**bounded**: Brain 1's input no longer grows with manuscript length past 12,000
characters. Submissions under 3,000 characters are byte-identical to before.

### ⚠️ OPEN — the same defect, live, in a file this task was not scoped to touch

**`src/app/api/lens/route.ts:97` — `text.slice(0, 12000)`, no label, and the
output is a lens reading streamed verbatim to the writer.**

This is the same defect class, not a variant: a model forms a writer-facing craft
opinion on a text it has been given no reason to think is incomplete. It is
reachable — the route enforces no word cap of its own, and 12,000 characters is
~2,300 words against a 4,000-word submission cap, so any longer piece gets its
lens reading built on a silent truncation.

**Not fixed. Different file, different feature, and the standing rules are "touch
only the named files" and "one change per commit".** The fix is the one already
written and proven next door — reuse the labelled-extract shape rather than
inventing a second one. **Nenad's call.**

**Checked and deliberately left alone:** `scorer.ts` (6,000), `bible.ts` (8,000),
`market.ts` (4,000) and `analyst.ts` (28,000) all already label with
`[truncated]`; `structural-reader.ts` marks its gaps with `[...]`. `moderation.ts`,
`provenance-check.ts` and `lens-authorship.ts` cut at 6,000 unlabelled, but all
three are classifiers that emit no craft note — a cut cannot become a fabricated
defect in a writer's report. Recorded so a future session does not re-audit them.

### Also carried to origin by this push

The push that deployed this fix also pushed four commits that were sitting
unpushed locally: `a77f02a`, `25b1fea`, `fe2d6d3`, `a960ce1` — the §21c guards and
the two reading write-ups. `INTERROGATE_ANALYSIS_LIVE` is still `false` and was
confirmed false before the hook fired, so nothing writer-facing changed from them.
