## Session start protocol — read this first, every session
Before doing anything else in this repo, read DL_ONLY_ReadFirst.md in full. This is not optional and not conditional on the task.

# CLAUDE.md — Draft & Lens

## Standing rules (apply every session, no exceptions)

### Code quality
- Clean, non-duplicated, consistently structured code at all times.
- Before committing any change, check the affected module for dead code, duplication, and inconsistency introduced by the edit. Fix in the same commit.
- Do not accumulate technical debt. Flag refactor needs immediately rather than building on top of mess.
- Principal Engineer standard throughout — professionally organised, best-in-class, no waste.

### Build discipline
- Audit before editing. Never rewrite or restructure a component — additive edits only unless a rewrite is explicitly approved.
- One change per commit. Run `tsc` before committing. Confirm render after each commit.
- Revert, don't patch, on breakage.
- Touch only the named files. Anything outside the list requires explicit approval.

### Periodic audit — two triggers, not one (standing rule, 2026-08-21)
`AUDIT_CHECKLIST.md` runs on BOTH of these, independently:

1. **Before starting any major new feature** — the original trigger. Enter a build with a clean floor.
2. **Every 2–3 weeks regardless of feature boundaries** — new. A feature-gated audit only ever runs when someone is about to build something, so a quiet fortnight of small fixes accrues drift that nothing looks at. The first run (2026-08-18) found real defects on a codebase nobody thought was dirty.

**Record the date of every run** in `AUDIT_CHECKLIST.md`'s run log, so the gap between runs is visible rather than assumed. If the last recorded run is more than three weeks old, run it before doing anything else that session.

**Run log lives in `AUDIT_CHECKLIST.md`. Last run: 2026-08-18.**

### Writer-facing copy — the editor's voice (standing rule, 2026-08-21)
Every string a writer can read is the editor speaking. First person, direct, developmental. It does not explain the product, name the product in the third person, or describe its own machinery.

- **Never**: "your submission", "analysis complete", "analysis failed", "please try again", "Draft & Lens reads…", "Could not delete that work". Passive-voice system failures are the commonest slip — the editor says "I couldn't delete that one. Nothing has changed."
- **Errors are still the editor.** A failure is something that happened to the two of you, not a status code: "Something went wrong before I could start reading. Give it a moment and send it again."
- **Developmental, never directive** — the same disposition the reading itself carries (Mentor addendum Part A).

**Four deliberate exceptions. These are not oversights; do not "fix" them.**
1. **The legal statement.** "Your work is yours. We never train AI on it" stays in the first person plural. It is a company-level claim sitting beside the privacy policy, not editor copy. Nenad's ruling, 2026-08-21.
2. **Developer-facing 400s** — "Invalid JSON.", "workId is required.", "Unknown action.", "No message provided." Only reachable when the client misbehaves. No writer ever sees them, and dressing them in the editor's voice would be theatre.
3. **The fragment upfront ask.** Its options are written in the WRITER's first person — "Does this fit with what you've read of my work?" — because the writer is choosing them. Converting them to the editor's voice breaks the grammar of the interaction.
4. **Stage labels** — "Reading your work", "Mapping the structure", "Writing the reading", "Final check". Already in voice and honest about what is happening.

Full sweep done 2026-08-21 (`0983ad2`, `c2d618b`). Before adding any new writer-facing string, read this section; after adding one, grep for the banned phrases above.

### IP boundary (non-negotiable)
- All prompt and lens IP stays server-side. Browser sends only submitted text, receives only results.
- Run bundle IP grep (`.next/static` for the 5 IP markers, must return exit:1) after any change that touches client surface.

### Deploy process
1. `npm run build` — must show `✓ Compiled successfully`
2. `git commit`
3. `git push origin main`
4. `curl -X POST "$(pbpaste)"` — Vercel hook URL on clipboard first
5. Verify: `git log origin/main..HEAD --oneline` should be empty before firing hook

## Working directory (non-negotiable)
This project lives at: `/Users/nenadkojic 1/Projects/Draft&Lens/draft-and-lens`

Every bash command must be prefixed with:
`cd "/Users/nenadkojic 1/Projects/Draft&Lens/draft-and-lens" &&`

(The Dropbox path referenced in earlier sessions does not exist on disk — confirmed via `readlink -f` on 2026-08-08. Only the path above is real.)

**Never touch codex-maths. Ever. It is a completely separate project in a different folder. If the shell resets to codex-maths between commands, ignore it — always prefix commands with the path above and work only in draft-and-lens.**

### Governing docs (read these, don't act on them as build instructions)
- `DraftAndLens_Architecture_v6.md`
- `DraftAndLens_LearnedCorpus_v2.9.md` (the file's own header says Version 2.11 — the filename lags the content; the file on disk is the current corpus)
- `ThinkingDiscipline.md`
- `DraftAndLens.html` (prototype — IP source of truth)

## Session Discipline

### No record, no proceed
Claude Code has no memory across sessions except what's actually written into the repo (code, this file, `SESSION_LOG.md`). Decisions get made either in chat with Claude (claude.ai, not Claude Code) or in a separate Claude Code session, and don't always make it into the repo before being relayed as settled. If Nenad says something was "already agreed" or "already exists" and there's no record of it in the repo, stop and ask for the source before proceeding. Don't assume he's wrong, but don't take it on faith either — an unrecorded decision is indistinguishable from an unfounded claim without a repo record.

### Write decisions down at the moment they're made
Any decision made in a session that will matter to a future session — a scoping call, a design choice, "build X not Y," a deferred item — gets written into `SESSION_LOG.md` (or this file's Pending Decisions section) the moment it's made, not reconstructed from memory afterward. This applies equally to decisions made directly in a Claude Code session and decisions relayed from a claude.ai chat — both need to land in the repo the same way.

## Lessons learned — permanent rules (never repeat these mistakes)

### Use the Chrome extension first
When verifying anything visual or live on draftandlens.com — always use the Chrome extension to inspect the live site directly. Never ask Nenad to do a live test when the extension can do it. Never reason from code alone when the live site can be checked.

### When Bash is unavailable, hand off the exact command
Run terminal commands yourself whenever Bash works. But if Bash is genuinely down (classifier outage, tool failure), do NOT state the problem and wait — give Nenad the exact command to run manually, in a copy-pasteable block, and continue from the output he pastes back. Blocking on a dead tool is slower than handing off. (Supersedes the earlier "never ask Nenad to run terminal commands" rule, removed 2026-08-10 at his instruction.)

### Staging/analysis phase must always be fully styled
The analysis phase (stage pills active, report streaming) must show the full design system at all times — warm paper background, correct fonts, tokens. A bare/unstyled analysis phase is a regression. Check this after every deploy that touches page.tsx or layout.tsx.

### Token budget — check before shipping long prompts
Before any analyst prompt change, verify maxTokens is high enough for a full report at the top tier. A cap that silently truncates sections is a regression. Current target: 16000 tokens, set per-tier in `adaptiveAnalystConfig` (`src/ai/config.ts`) — NOT in `TOKEN_LIMITS`.

**Section count is not a valid test.** Since 2026-07-23 section inclusion is evidence-gated (Principle 26, see `src/prompts/report/story-structure.ts`): the model includes a section only where the text earns it, so a short piece legitimately produces far fewer sections than a long one. Counting to a fixed number will produce false alarms.

**Distinguishing truncation from gating** — the two look identical mid-stream, because `ReportSkeleton` renders the *whole* expected section list as placeholders and fills each as its `## HEADING` arrives. Gaps during streaming mean nothing. The real test: reload the FINISHED report. A section still absent was never written; sections that populate were just streaming. Then check that the sections that DID appear are complete rather than cut off mid-sentence — that is what truncation actually looks like.

### Sidebar links — always verify after any ReportView change
**This is the single source of truth for the count. Counted from `ReportView.tsx` on 2026-08-17 — any other document stating a different number is stale and defers to this one.**

The fixed groups are Overview (3), Dashboard (2), Action (3), Reference (5) = **13 constant links**. **The Analysis group is variable by design** — derived from `parsed.sections` in `ReportView.tsx`, so it tracks whatever the evidence-gated report contained.

Story mode defines 14 sections (13 until `WHERE TO GROW NEXT` was added on 2026-08-19), but `parseReport` lifts `WHAT TO REVISE` out into its own callout (`report.ts`, the `WHAT TO REVISE`/`REVISION PRIORITIES` branch) — and lifts only that one, so `WHERE TO GROW NEXT` stays in `parsed.sections` and lands in the Analysis group. The Analysis maximum is therefore **13** and the base maximum is **26**.

Two conditional links sit on top of that, so the ceiling depends on what the reading has:

| State | Max links |
|---|---|
| Base — standalone reading | **26** |
| + **Continuity ledger** link (Overview group; present only when the reading belongs to a grouped manuscript) | **27** |
| + **Continuity section** (Analysis group; §6a, built 2026-08-18 — appears only when detection surfaced something) | **28** |

So Overview is 3 links, or 4 when the reading is grouped.

**A count below the ceiling is not a regression** — evidence-gating (Principle 26) means a short piece legitimately earns fewer sections.

*History: the ledger design v1.2 asserted 26 as the base and ruling 6 confirmed that figure without deriving it. Recounted from source 2026-08-17: the base is 25. 26 is correct only once the Continuity ledger link is present.*

What to actually verify after a ReportView change: every sidebar link resolves to a section that exists, and no section rendered in the body is missing from the sidebar. Sidebar/body agreement is the invariant — not a magic total.

### No margin stacking between components
Each component owns its own bottom spacing only — never top margin. When adding bottom spacing to one component, check if the next component has a matching top margin that will double the gap.

### After every deploy — use Chrome extension to verify
After firing the Vercel deploy hook, use the Chrome extension to confirm the live site renders correctly before declaring a fix complete. Never declare done without visual confirmation.

### Commits must be isolated and atomic
One logical change per commit. Never bundle unrelated fixes. If a safety classifier outage blocks a commit, wait and retry — never skip tsc or the diff review.

### Never do a full read-modify-write on .env.local
Only single-line edits to a specific key, never a whole-file rewrite. The redaction layer turns secrets into the literal placeholder text `[SENSITIVE]` when read back into an AI session — a full-file read-modify-write risks writing that placeholder back out as if it were the real value, silently destroying the actual secret. This happened to `CLERK_SECRET_KEY` and several other keys in this file. Git cannot help recover from this: `.env.local` is gitignored, so there is no history to revert to.

