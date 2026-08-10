# SESSION_LOG.md — Draft & Lens

Append-only log of decisions made in any session (Claude Code or relayed from a claude.ai chat) that will matter to a future session. Write the entry the moment the decision is made — don't reconstruct from memory afterward. See CLAUDE.md → Session Discipline.

Format per entry: date, source (Claude Code session / relayed from claude.ai chat), the decision, and why.

---

## Pending Decisions

- **Handover items 1, 3–7 not started.** Item 2 (file upload) is done — see log below. Remaining: continuity ledger (priority build), spell-check (in scope; grammar-check explicitly NOT), colour/font fix, Visualizer design exploration, surfacing the three differentiators, spidergram collapsible-vs-fix. Full detail in `DraftAndLens_Handover_2026-08-02.md`.
- **Spidergram fix-vs-cut: still undecided**, needs more tester data than Noel alone. Building collapsible is fine either way.
- **Differentiator messaging prominence: start subtle**, flag back before escalating to anything more marketing-like.

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
