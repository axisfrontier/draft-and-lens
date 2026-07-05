# Draft & Lens — Handover Note v16
**Date:** 5 July 2026
**Branch:** main
**Last commit:** see git log — multiple commits this session (styling pass Components 2–8, token fix, sidebar fix, notes panel, scores dashboard)
**Live site:** https://draftandlens.com
**Supersedes:** all earlier handovers including v14

---

## Deploy process (unchanged — must follow every time)
1. `npm run build` — must show `✓ Compiled successfully`
2. `git commit`
3. `git push origin main`
4. `curl -X POST "$(pbpaste)"` — paste Vercel hook URL to clipboard first
5. Verify: `git log origin/main..HEAD --oneline` should be empty before firing hook

---

## Current state (from v13 — confirmed live)
- Beta open; word limit 4,000 words; live at draftandlens.com
- All spacing, pill animation, banner alignment, scroll issues resolved
- Brain 3: three independent arc lines (tension/pace/emotion)
- Legal pages live (/privacy, /terms, /acceptable-use, /about, /feedback, /glossary) with ← Close links
- Clerk consent active (Privacy + Terms URLs set, "Require express consent" enabled)
- DPAs complete: Anthropic ✅ Vercel ✅ Clerk ✅ Supabase ✅ (signed via PandaDoc)
- ICO data-protection fee paid ✅
- Chrome extension installed — Code can now inspect the live site directly

---

## What happened this session (4–5 July 2026)

### Shipped (committed and deployed)
- Phase 1 styling pass: Components 3–8 (Craft Balance, Story Arc, Report Sections, Lens Grid, Market Panel, Nav active states)
- Scores dashboard: qualitative labels, tradition subheading, bars removed
- Notes panel: blank Note 01 fixed, glossary linking, dedup confirmed
- Analysis animation: amber progress bar (d6f1c7e)
- Token cap raised to 16000 — all 13 sections now render
- Sidebar: all 26 links present and wired correctly
- Audit fixes: duplicate sections, dead StageIndicator, hex→token swap

### Known regressions — MUST FIX NEXT SESSION
- **Styling disappears during analysis phase** — full fix prompt written
- **Animation not visibly rendering** — needs Chrome extension diagnosis
- **General styling still not matching prototype** — regression check needed
- **Code accumulated technical debt** — audit needed

### Permanent lessons (now in Claude memory + CLAUDE.md)
1. Use Chrome extension to verify live — never ask Nenad to do live tests
2. Analysis phase must always show full styling
3. Token cap must support 13 sections (16000 top tier)
4. Sidebar must show 26 links after any ReportView change
5. No margin stacking — each component owns bottom spacing only
6. Never ask Nenad to do things Code can do itself
7. After every deploy, verify live with Chrome extension before declaring done

### Shipped (all committed, deployed, live)
- **Sidebar** confirmed working at desktop width; narrow viewport overflow fix committed (`e764e65`)
- **Component 1 styling** — title kicker colour (#c8b898 → --ink-soft), margin fixed, amber ::before removed, title overflow guard, summary paragraph (with typeof string guard to prevent crash)
- **Scores dashboard** — numeric 1–10 replaced with qualitative labels (Fully earned / Landing well / Developing / Needs attention / Not yet landing); tradition shown dynamically in subheading; "scored 1–10" line removed
- **Kicker colour** darkened for readability (`3297d0b`)
- **Tradition alignment** — progress bars removed; labels recoloured by tier; single-column layout (no wrapping)
- **DOCUMENT panel** — moved left (grid gap reduced)
- **Audit fixes** — duplicate section rendering fixed; New Analysis button wired; StageIndicator.tsx deleted (dead code); hardcoded hex → CSS token swap; stale StoryArc comment fixed
- **Notes panel** — blank first note fixed (anchor.ts fallback removed, honest placeholder added); glossary linking extended to notes panel; exact-match dedup confirmed
- **Analysis animation** — amber progress bar with pulse animation during analysis phase (`d6f1c7e`)
- **CLAUDE.md + audit.md** — in project root ✅ (auto-loaded by Code every session)

### Corpus — v2.7 (in folder ✅)
Principles 12–16 added (StoryScope bias guards: roughness, earned ambiguity, emotion-mode neutrality, familiarity-bias check, authorship firewall).

### Folder state
- CLAUDE.md ✅ in root
- audit.md ✅ in root  
- Corpus v2.7 ✅
- **Archive these (stale):** `DraftAndLens_CodePrompt_MentorRegister_Addendum.md`, `DraftAndLens_CodePrompt_RevisionAwareness.md`, `DraftAndLens_DesignSystem.md`

### Legal & compliance — COMPLETE for free beta
- All four DPAs accepted/signed
- ICO registration and fee paid
- Clerk consent flow active
- ⚠️ **IPO REMINDER (confirm when done):** File D&L trademark under Class 42 — "Providing online, non-downloadable software as a service." Class 9 not needed. Confirmed by IPO (Darrel, Newport). NOT YET CONFIRMED AS ACTIONED.

### Corpus updated — v2.6
- **Principle 11 added (additive only):** Abstraction is not automatically a fault — load-bearing (names a perception concrete can't carry, never fault) vs floating (replaces needed concrete work, flag this). Illustrated from the circus reading ("destitute-inspired fashion" wrongly grouped with "story to tell"). File: `DraftAndLens_LearnedCorpus_v2.6.md` — replace v2.5 in project folder.

### StoryScope analysis — completed
- Full analysis of Jenna Russell et al. StoryScope paper against D&L
- D&L's tradition-first architecture already neutralises most LLM-judge bias risk
- Five targeted corpus additions recommended (roughness-and-discontinuity, earned ambiguity, emotion-mode neutrality, familiarity-bias self-check, authorship-framing firewall)
- Stored in: `compass_artifact_wf-7c58a17f...` (in project folder) — review and decide which to add to corpus

### Partnership/acquisition research — completed
- Prioritised shortlist of 10-15 production houses and publishers for beta-writer sourcing and potential acquisition
- Stored in: `compass_artifact_wf-49ac6c14...` (in project folder)
- Warm leads: McSweeney's, Royal Court Theatre, Curtis Brown Creative, Film4, Warp Films, Faber Academy

### Marketing — ready to publish
- Reddit beta recruitment post: written, tested, ready. Use the version WITHOUT the em dashes.
- Safe subs to post: r/alphaandbetausers, r/roastmystartup, r/SideProject
- Check rules before posting to r/screenwriting or r/writing
- LinkedIn post: written (personal-origin angle)
- Instagram video script: 25-30 sec, text-on-screen, no IP exposure, Canva-ready
- LinkedIn message to Brad Brookes (screenwriter): written and ready to send
- Lens voices disclaimer confirmed needed in-app AND in Terms: "Interpretive lenses inspired by each writer's published style — not the actual people, not affiliated or endorsed."

### AUP clarification confirmed
- "Serious literature engaging with dark, difficult, violent, or sexual themes is welcome here" — CORRECT and intentional. The ban is on pornographic content with no literary purpose + CSAM. Subject matter ≠ prohibited. Do not change this line.

---

## Outstanding — NEXT SESSION FIRST (regressions before anything new)

### Immediate — use `Code_Prompt_FullFix_Regressions.md`
Fix all regressions from today before any new work:
1. Styling during analysis phase
2. Animation not rendering
3. Verify all 13 sections and 26 sidebar links
4. Token cap confirmed live
5. Styling regression check vs prototype
6. Code quality audit

### Then continue in order
- StoryScope bias guards (`Code_Prompt_StoryScope_BiasGuards.md`) — Sonnet/Medium
- Note quality (`Code_Prompt_Perfect_Notes.md`) — Sonnet/Medium
- Chat panel — Opus/High, own session

### Non-Code
- IPO Class 42 trademark — NOT YET DONE
- Reddit/LinkedIn posts ready to publish
- Solicitor review before paid launch
- Replace CLAUDE.md in project root with updated version (in outputs folder)

### Session 1 — Sonnet/Medium
- Styling pass remaining Phase 1 components (`Code_Managed_Build_ReportPage.md`) — verdict band, dashboard, story arc, report sections, lens grid, market panel, brighter nav, byline
- Three Things band (Phase 2 of managed build)

### Session 2 — Sonnet/Medium
- StoryScope bias guards (`Code_Prompt_StoryScope_BiasGuards.md`) — Brain 2 analyst prompt
- Note quality (`Code_Prompt_Perfect_Notes.md`) — dedup, teach-the-move, abstraction (Principle 11), anchoring

### Session 3 — Opus/High (its own session)
- Chat panel (Phase 3 of managed build) — Brain 7, IP boundary, own verification

### Non-Code outstanding
- ⚠️ **IPO trademark: file Class 42 "Providing online, non-downloadable software as a service"** — NOT YET DONE
- Solicitor review of legal docs (before paid launch)
- Reddit/LinkedIn beta recruitment posts ready to publish
- LinkedIn message to Brad Brookes ready to send
- CLAUDE.md + audit.md already in project root ✅
Code was mid-diagnosis when session ended. Resume with:
> The Chrome extension is connected. Inspect the live site at draftandlens.com — navigate to the report page (submit text to generate a reading). Inspect the sidebar element directly: is it in the DOM? Rendering but invisible, collapsed, or genuinely absent? Check globals.css for any override collapsing the grid. Report before touching anything. Sonnet/Medium, diagnosis only.

### 2. Styling pass — `Code_Managed_Build_ReportPage.md`
Once sidebar confirmed: apply component-level CSS from `DraftAndLens_Prototype_Component_CSS.css`. One component per commit under the protocol. Three phases: styling → Three Things band → chat panel.

### 3. Note quality — `Code_Prompt_Perfect_Notes.md`
Brain 2 prompt fixes: dedup, set-accounting, teach-the-move, abstraction (Principle 11), anchoring. After design pass is stable.

### 4. CLAUDE.md styling guide
Waiting on Code's styling-extract report (prompt written but not yet run). After styling pass complete.

---

## Post-beta / paid launch
- Solicitor review of legal docs
- Custom domain already live ✅
- Mentor memory (paid tier) — cross-session revision tracking
- Expert View — same reading, less scaffolding
- Help AI — navigation/explainer only, never editorial voice
- Chat panel (Phase 3 of managed build)
- ⚠️ **LONG-FORM ARCHITECTURE** — named pre-launch milestone (must build before raising word cap): current pipeline produces slow/generic readings above 4,000 words. Design constraint: parallel chapter/section processing is mandatory — sequential per-chapter analysis scales to 20-40+ minutes and is the failure mode to design against. Output length must be capped by report structure not input size (macro pass over full structure + micro pass sampling representative passages). Two-pass architecture for scripts/plays 10k–25k words, chapter pipeline for novels 70k–100k words. Do NOT raise the word cap until this is built.
- Broadening to new forms: TV pilots, memoir — only where tradition engine transfers

---

## Key files (unchanged from v13)
| File | Purpose |
|------|---------|
| `src/app/(app)/page.tsx` | Homepage + analysis flow |
| `src/app/layout.tsx` | Scroll-to-top inline script |
| `src/app/globals.css` | pillFlash keyframe (hex colours) |
| `src/components/analysis/ReportView.tsx` | Report layout, banners, title block |
| `src/components/analysis/StoryArc.tsx` | Three independent arc lines |
| `src/prompts/scorer.ts` | Brain 3 prompt |
| `src/prompts/types.ts` | Server-side types |
| `src/components/analysis/types.ts` | Client-side mirror types |

## Governing docs (give to Code)
- `DraftAndLens_Architecture_v6.md`
- `DraftAndLens_LearnedCorpus_v2.6.md` ← USE THIS, not v2.5
- `ThinkingDiscipline.md`
- `DraftAndLens.html` (prototype, IP source of truth)

## Amber colour values
- `--amber`: `#a86c10`
- `--amber-l`: `#c88c30`
- `--teal`: unchanged, used for "No changes detected" banner

## Positioning north star
**Draft & Lens is the most useful tool for writers who don't want to be rated against a generic rubric, and don't want an AI to write for them.**

---
*Draft & Lens — Handover v16 · July 2026 · pairs with Architecture v6.0 (§21 amended), LearnedCorpus v2.7, ExpertMode_Spec, CLAUDE.md, the Code prompts, and the legal/compliance record files*
