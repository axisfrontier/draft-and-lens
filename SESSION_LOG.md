# SESSION_LOG.md — Draft & Lens

Append-only log of decisions made in any session (Claude Code or relayed from a claude.ai chat) that will matter to a future session. Write the entry the moment the decision is made — don't reconstruct from memory afterward. See CLAUDE.md → Session Discipline.

Format per entry: date, source (Claude Code session / relayed from claude.ai chat), the decision, and why.

---

## Pending Decisions

- **Continuity ledger (item 1): design at v1.2, AWAITING FINAL REVIEW, not built.** See `DraftAndLens_ContinuityLedger_Design_v1.md`. Eight open questions in its §11 still need Nenad's judgement. Do not start building until reviewed.
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

### Queued item B — duplicate copy above/below the story title
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
