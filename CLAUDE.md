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
This project lives at: `/Users/nenadkojic 1/Dropbox/Mac/Desktop/AI tool builds/Draft&Lens/draft-and-lens`

Every bash command must be prefixed with:
`cd "/Users/nenadkojic 1/Dropbox/Mac/Desktop/AI tool builds/Draft&Lens/draft-and-lens" &&`

**Never touch codex-maths. Ever. It is a completely separate project in a different folder. If the shell resets to codex-maths between commands, ignore it — always prefix commands with the path above and work only in draft-and-lens.**

### Governing docs (read these, don't act on them as build instructions)
- `DraftAndLens_Architecture_v6.md`
- `DraftAndLens_LearnedCorpus_v2.7.md`
- `ThinkingDiscipline.md`
- `DraftAndLens.html` (prototype — IP source of truth)

## Lessons learned — permanent rules (never repeat these mistakes)

### Use the Chrome extension first
When verifying anything visual or live on draftandlens.com — always use the Chrome extension to inspect the live site directly. Never ask Nenad to do a live test when the extension can do it. Never reason from code alone when the live site can be checked.

### Never ask Nenad to run terminal commands
Code must run all terminal commands itself. Never ask Nenad to paste or run anything in Terminal unless Bash is genuinely down (classifier outage confirmed). If Bash is unavailable, state that explicitly and wait — do not hand off commands for Nenad to run manually.

### Staging/analysis phase must always be fully styled
The analysis phase (stage pills active, report streaming) must show the full design system at all times — warm paper background, correct fonts, tokens. A bare/unstyled analysis phase is a regression. Check this after every deploy that touches page.tsx or layout.tsx.

### Token budget — check before shipping long prompts
Before any analyst prompt change, verify maxTokens is high enough to return a full 13-section report. A token cap that silently truncates sections is a regression. Current target: 16000 tokens for top tier. Always verify all 13 sections render after any prompt change.

### Sidebar links — always verify after any ReportView change
The sidebar must show all sections: Overview (3 links), Dashboard (2), Analysis (01–13 = 13 links), Action (3), Reference (5). Total: 26 links. Verify this after every ReportView.tsx change.

### No margin stacking between components
Each component owns its own bottom spacing only — never top margin. When adding bottom spacing to one component, check if the next component has a matching top margin that will double the gap.

### After every deploy — use Chrome extension to verify
After firing the Vercel deploy hook, use the Chrome extension to confirm the live site renders correctly before declaring a fix complete. Never declare done without visual confirmation.

### Commits must be isolated and atomic
One logical change per commit. Never bundle unrelated fixes. If a safety classifier outage blocks a commit, wait and retry — never skip tsc or the diff review.

