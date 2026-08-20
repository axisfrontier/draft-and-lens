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
