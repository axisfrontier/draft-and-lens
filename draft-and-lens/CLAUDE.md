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

### Repo hygiene
- Never commit to codex-maths in a draft-and-lens session.
- Always prefix bash commands with `cd "/Users/nenadkojic 1/Projects/Draft&Lens/draft-and-lens" &&`
  (The Dropbox path this file previously named does not exist on disk — confirmed via `readlink -f` on 2026-08-08, corrected here 2026-08-10.)

### When Bash is unavailable, hand off the exact command
Run terminal commands yourself whenever Bash works. If Bash is genuinely down (classifier outage, tool failure), give Nenad the exact command to run manually rather than waiting — then continue from the output he pastes back.

### Governing docs (read these, don't act on them as build instructions)
- `DraftAndLens_Architecture_v6.md`
- `DraftAndLens_LearnedCorpus_v2.9.md` (the file's own header says Version 2.11 — the filename lags the content; the file on disk is the current corpus)
- `ThinkingDiscipline.md`
- `DraftAndLens.html` (prototype — IP source of truth)
