# SESSION_LOG.md — Draft & Lens

Append-only log of decisions made in any session (Claude Code or relayed from a claude.ai chat) that will matter to a future session. Write the entry the moment the decision is made — don't reconstruct from memory afterward. See CLAUDE.md → Session Discipline.

Format per entry: date, source (Claude Code session / relayed from claude.ai chat), the decision, and why.

---

## Pending Decisions

- **Continuity ledger (item 1): design at v1.2, AWAITING FINAL REVIEW, not built.** See `DraftAndLens_ContinuityLedger_Design_v1.md`. Eight open questions in its §11 still need Nenad's judgement. Do not start building until reviewed.

**Rulings on the continuity ledger, 2026-08-10 (Nenad):**
1. **v1 scope narrowed** to names, physical descriptions, stated ages/dates, explicit relationships. Timeline and geography deferred until this is proven low-noise. Design line that keeps stated dates in while keeping timeline out: *compare assertions, never compute chronology.*
2. **Contradictions get their own dedicated report section, severity-tiered** (hard contradiction vs. worth checking) — not inline flags. Section appears only when populated, per Principle 26.
3. **Approach validated against the market.** Extract facts → store persistently → flag rather than infer intent matches Bunsho, EPOS-AI and Novarrium. Direction confirmed; not a reason to copy further.
4. **Locked facts adopted** (Novarrium's term): the writer marks certain facts permanently invariant, flagged in their own tier above the severity ladder. Design splits these into **rule locks** (chronology-free, genuinely unambiguous) and **state locks** (a character's death — depends on the chronology reasoning ruling 1 deferred, so it demotes to worth-checking unless the manuscript is declared linear). *Worth carrying forward: the most intuitive lock a writer will reach for is the one current scope handles least confidently. Argues for promoting timeline in v2 — open question 7.*
5. **Detection, not prevention — stated as a boundary.** D&L's ledger reads already-written text; most competitors' equivalents feed a generating model. Opposite obligations: prevention optimises recall and resolves ambiguity, detection needs precision and must surface it. Recorded so generation-side patterns aren't borrowed unexamined. **Hard line: the ledger is never an input to generating or suggesting prose** — that is the ghostwriting D&L exists not to do, and any future proposal to use it that way is a change of product position, not a feature increment.
- **Handover items 3–7 not started.** Item 2 (file upload) is done — see log below. Remaining: spell-check (in scope; grammar-check explicitly NOT), colour/font fix, Visualizer design exploration, surfacing the three differentiators, spidergram collapsible-vs-fix. Full detail in `DraftAndLens_Handover_2026-08-02.md`.
- **Spidergram fix-vs-cut: still undecided**, needs more tester data than Noel alone. Building collapsible is fine either way.
- **Differentiator messaging prominence: start subtle**, flag back before escalating to anything more marketing-like.

### Commands blocked by the Bash classifier outage on 2026-08-10 — run when convenient

1. **Deploy.** Nothing from 2026-08-10 is live yet; `origin/main` is at `1337565` but no deploy has fired. Needs the Vercel hook on the clipboard:
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens" && HOOK="$(pbpaste)" && case "$HOOK" in https://api.vercel.com/v1/integrations/deploy/*) curl -X POST "$HOOK";; *) echo "REFUSING: not a Vercel deploy hook";; esac`
   A first attempt was correctly **refused by the guard** — the clipboard held something else at the time.
2. **Delete four stray empty files** (confirmed zero-byte, stray shell redirects):
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens/draft-and-lens" && rm -f Fetched main next "draft-and-lens@0.1.0"`
3. **Stop git paging** (the pager swallowed several sessions' worth of output today):
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens" && git config core.pager cat`
4. **graphify query** for the continuity-ledger architecture — never ran (classifier down). The design was written from direct reads of `readings.ts`, `analyse/route.ts` and the upload path instead, so it is grounded in the actual code, but a graph query may surface call sites those reads missed.
5. **Commit the two uncommitted files** (design doc + this log) — written but never committed, Bash was refused:
   `cd "/Users/nenadkojic 1/Projects/Draft&Lens" && git add DraftAndLens_ContinuityLedger_Design_v1.md SESSION_LOG.md && git commit -m "docs: continuity ledger design v1 for review; log blocked commands and retention finding" && git push origin main`

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
