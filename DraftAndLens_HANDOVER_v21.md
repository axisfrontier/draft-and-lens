# Draft & Lens — Handover Note v21
**Date:** 15 July 2026
**Branch:** main
**Last commit:** StoryScope bias guards (analyst.ts) — live on draftandlens.com
**Live site:** https://draft-and-lens.vercel.app (beta — domain deferred until after beta)
**Supersedes all earlier handovers including v20

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

## What happened this session (12–15 July 2026)

### Sessions completed
- **Sign-in gate (Option A)** — deployed, verified live ✅
- **Note quality (5 fixes)** — deployed, verified live ✅
- **Session 3 — 35 lens voices + genre groupings** — fully complete including Parts D/E/F/G (genre UI, disclaimer — was missed, now fixed, IP check — verified clean). Total: 35 voices (not 36 — Lucas added, King was existing upgrade not new, Blume was the 8th genuinely new voice). No "Ways of Looking" header exists in code.
- **Excerpt mode** — built and deployed. Complete/Excerpt toggle above Analyse button, inactive by default. Report tiering added (Micro/Short/Full by word count) — Story keeps Revision Notes in Tier 1 per Nenad's call.
- **Note quality refinements** (register slip precision, world-building move, dual reading) — confirmed genuinely live, not just reviewed
- **System Integrity Audit** (code-level, Opus/High) — clean overall. 3 real issues found and fixed: stale `TOKEN_LIMITS.analyst` constant, dead `LENS_CATEGORIES` (was missing Wenders — 34/35), duplicated Brain 2 bias guards
- **Bare-quote/lowercase note bugs** — fixed in anchor.ts (root cause of the "Note 09" issue Nenad flagged)
- **UI polish** — radar chart overflow, button typography, Story Arc legend dots, spacing
- **Glossary page bug** — was silently breaking prod builds (missing 'use client'), fixed
- **Dead sidebar anchor** — fixed
- **Short-form cost logging** — built and deployed. New Supabase table, per-brain token tracking, USD cost estimate per submission. Feeds the financial model shell.

### Product strategy work (this session)
- **Long-form architecture spec** written — `DraftAndLens_LongFormArchitecture_Spec.md`. Chapter pipeline, diff/ripple detection (with dependency graph, informed by Graphify), selective reading, Lens Q&A (Brain 7 spec). 120k word ceiling. **DORMANT — do not build until after beta feedback is incorporated.**
- **Long-form build guide** written — `DraftAndLens_LongFormBuildGuide.md`. 12 phases, each with model recommendation, ending in mandatory dormancy verification before any live activation.
- **Financial model shell** written — `DraftAndLens_FinancialModel_Shell.md`. Structured placeholder, TBD fields await Phase 11 (long-form) cost data. Short-form cost logging now live feeds real data into this immediately.
- **Competitor research** — Inkshift confirmed as closest competitor (single-pass, up to 250k words, generic rubric, no tradition-awareness, no lens voices). D&L's architecture is deeper by design, not simpler.

### Still blocked
- **Live browser verification** — Analysis-links bug + System Integrity Audit Audits 3-7 (lens rendering, sign-in gate flows, password gate incognito check, word count live test, excerpt mode live test). Blocked by an Anthropic-side tool outage, reported to support. Will retry.



### Product & Strategy
- **Genre gap identified** — D&L is literary-fiction biased. The corpus, lens voices, and all outreach have skewed literary. A large gap exists in crime/thriller, horror/speculative, and genre fiction broadly.
- **35-voice set designed** — 8 new genre lens voices added (Chandler, Leonard, Highsmith, King, Le Guin, Christie, Morrison, Ferrante) bringing total from 27 to 36. Genre groupings defined for UI (7 groups).
- **Competitor analysis** — Versey AI (content publishing, not direct competitor). Inkshift (closest competitor — full manuscript feedback, genre-rubric approach, no tradition-awareness, no lens voices, no script/play coverage, free tier up to 10k words). D&L differentiation is real and structural.

### Lens voices — status
- **24 profiles compiled** across two documents: 16 upgraded existing + 8 new genre voices. All saved in `DraftAndLens_NewLensVoices_Profiles.md`.
- ⚠️ **Bukowski — incomplete.** Profile cut off mid-sentence. Needs completion before Code session.
- ⚠️ **Nabokov — missing entirely.** Not in either document. Needs profile or confirmation to keep at current depth.
- Once Bukowski and Nabokov resolved: `Code_Prompt_NewLensVoices_GenreGrouping.md` is ready to run (Sonnet/High).

### Genre groupings (confirmed, use in Code prompt):
| Group | Voices |
|---|---|
| Literary Fiction | Hemingway, Carver, O'Connor, Bukowski, Nabokov, Chekhov, Morrison, Ferrante |
| Crime, Thriller & Suspense | Chandler, Leonard, Highsmith, Christie, Puzo |
| Horror & Speculative | King, Le Guin |
| Art Cinema | Welles, Wenders, Jeunet, Miyazaki, Coppola, Villeneuve, Kaufman, Wachowskis, Coens |
| Popular Cinema | Spielberg, Tarantino, Scott, Bruckheimer, Feige |
| Screenplay & Television | Sorkin, Roth, Fey, Simon |
| Young Adult | Blume |

### Sign-in UX — decision made
- **Option A selected** — gate visible from the start. Text area visible but locked behind warm semi-transparent overlay. No bait-and-switch. User sees requirement immediately on landing.
- Code prompt ready: `Code_Prompt_SignIn_UX_OptionA.md`

### Outreach — letters ready to send
- 5 institutional: Royal Court Theatre, London Writers Centre, Arvon Foundation, Curtis Brown Creative, McSweeney's
- 5 individual: Bernardine Evaristo, Matt Haig, Nikesh Shukla, Joanna Kavenna, Kazuo Ishiguro
- 1 DM: Stanley Tucci (Instagram @stanleytucci, frame around Big Night / screenwriting)
- All in `DraftAndLens_BetaOutreachLetters.md`
- Matt Haig contact: Judith Murray at Greene & Heaton — `jmurray@greeneheaton.co.uk`
- Nikesh Shukla contact: nikesh-shukla.com/contact (form)

### What happened in previous session (v19)
- **What happened this session (9 July 2026)**
- StoryScope bias guards shipped and all 5 verified live ✅
- Legal pages clean ✅, Clerk URLs set ✅, hello@draftandlens.com live ✅
- Fast Mode waitlist submitted ✅

## What happened this session (9 July 2026)

### Shipped and live
- **StoryScope bias guards** — added to Brain 2 analyst prompt (`src/prompts/analyst.ts`): five guards (roughness, earned ambiguity, emotion-mode neutrality, familiarity-bias check, authorship firewall). IP boundary confirmed clean. Committed, pushed, live on draftandlens.com.
- **Legal pages** — audited /privacy, /terms, /acceptable-use — all clean, no placeholders remaining, hello@draftandlens.com correct throughout.
- **Legal docs updated** — `DraftAndLens_Legal_Document_Drafts.md` updated with hello@draftandlens.com (all 5 instances).
- **Clerk legal pages** — Privacy and Terms URLs added to Clerk dashboard. Consent flow active.
- **Business email** — hello@draftandlens.com live via Zoho Mail.
- **Fast Mode waitlist** — submitted at claude.com/fast-mode.

### Bias guards verification — ALL FIVE FULLY VERIFIED ✅
- ✅ Guard 1 — Roughness: fragmentation treated as craft, not error. Discriminates real weaknesses vs punishing roughness on sight.
- ✅ Guard 2 — Earned ambiguity: unresolved states not collapsed into a "real meaning"
- ✅ Guard 3 — Emotion-mode neutrality: cold/spare register treated as legitimate
- ✅ Guard 4 — Load-bearing vs floating abstraction: discriminated correctly
- ✅ Guard 5 — Authorship firewall: identical craft judgment on identical text regardless of claimed authorship. Model explicitly named the guard before proceeding. StoryScope bias-guard verification complete.

### Domain
- draftandlens.com live ✅ — stale "buy domain" bullet removed from outstanding list

### Shipped and live on draftandlens.com
- **Analysis skeleton** — raw text dump during streaming replaced with a properly styled skeleton (sidebar present with muted 26 links, section headers, shimmer placeholders). Sidebar now visible from analysis start, not just after report completes.
- **Progress animation strengthened** — flashing stage pill + sweeping progress bar now visibly reads as "working"
- **Sidebar link text darkened** for readability
- **Password beta gate** — single shared password, env-var driven (`BETA_PASSWORD` in Vercel), no redeploy needed to change it. Fixed a 405 bug after first deploy.
- **Both domains confirmed** — draftandlens.com and draft-and-lens.vercel.app both resolve to the same deployment
- **anchor-directive.ts** — double-escaped `\n\n` bug fixed (one-line)

### Beta is now open
- Beta password set in Vercel environment variables ✅
- Brad Brookes LinkedIn message sent ✅
- LinkedIn beta recruitment post published ✅
- draftandlens.com live and password-protected ✅

### Domain and email
- draftandlens.com purchased via Vercel, DNS valid, live ✅
- www.draftandlens.com also valid ✅
- Zoho Mail paid (£1/month Mail Lite) — account access issue with Zoho support, `nenad@draftandlens.com` pending resolution
- Fast Mode waitlist — needs business email first, on hold until Zoho resolved

### Shipped and verified live (all passing on draft-and-lens.vercel.app)
- Styling during analysis phase ✅
- Amber animation running ✅
- All 13 report sections render ✅
- Sidebar exactly 26 links ✅
- Scores dashboard qualitative labels ✅
- Document label uses var(--ink-soft) ✅
- IP boundary grep PASS (exit:1) ✅
- Time estimate shown during analysis (A5) ✅
- Fast Mode reverted — no 429 errors ✅
- Token ceiling: all tiers 16,000 (decoupled from word count)
- Long-form architecture constraint added to handover (parallel processing mandatory)
- Handover v16 committed to git (3ce7dd2)
- Junk terminal debris files cleaned from project

### Fast Mode — on waitlist
Fast Mode is in research preview — org quota is 0 until Anthropic provisions it. Joined waitlist at claude.com/fast-mode using nenad.kojic@draftandlens.com (Zoho Mail account created). When approved, tell Code to re-apply the speed: 'fast' and anthropic-beta: 'fast-mode-2026-02-01' header to Brain 2 in analyst.ts.

### Business email created
nenad.kojic@draftandlens.com via Zoho Mail (mail.zoho.com). Use this for all business correspondence.

### DNS — deferred
draftandlens.com has no DNS zone — domain purchase deferred until after beta. Live URL for beta is draft-and-lens.vercel.app.

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

## Outstanding — next Code sessions (in order)

### Session 1 — Blocked, retry when tool available
- **Live browser verification** — Analysis-links bug + Audits 3-7 (lens rendering/generic-output check, sign-in gate 5 flows, password gate incognito, word count live test, excerpt mode live test). Not a code issue — Anthropic-side outage, reported.

### DORMANT — do not build yet
- **Long-form architecture** (`DraftAndLens_LongFormArchitecture_Spec.md` + `DraftAndLens_LongFormBuildGuide.md`) — 12-phase build, Opus/High, multiple sessions. Only begins after beta feedback is incorporated and short-form is stable. Feature-flagged, does not touch current 4,000-word pipeline.

---

## Non-Code outstanding
- ⚠️ **IPO Class 42 trademark** — "Providing online, non-downloadable software as a service" — STILL NOT FILED. Oldest outstanding item in the project. File immediately.
- **Solicitor review** — required before paid launch
- **Custom domain purchase** — mentioned by Code as outstanding; draftandlens.com is already purchased and live — this may be a stale note, confirm with Code what specifically is meant
- **Beta outreach** — confirm which of the 11 letters/DMs have actually been sent (`DraftAndLens_BetaOutreachLetters.md`)
- **Zoho email** — nenad@draftandlens.com access issue — hello@draftandlens.com works as interim, confirm if original issue needs resolving

---

## Key files

| File | Purpose |
|------|---------|
| `DraftAndLens_HANDOVER_v21.md` | Current handover |
| `DraftAndLens_LearnedCorpus_v2.8.md` | Current corpus — 23 principles |
| `DraftAndLens_LongFormArchitecture_Spec.md` | DORMANT — post-beta build spec |
| `DraftAndLens_LongFormBuildGuide.md` | DORMANT — 12-phase Code build guide |
| `DraftAndLens_FinancialModel_Shell.md` | Placeholder financial model — TBD fields |
| `DraftAndLens_NewLensVoices_Profiles.md` | All 35 (36 incl. Lucas) lens profiles |
| `DraftAndLens_BetaOutreachLetters.md` | 11 outreach letters/DMs |
| `CodebaseAudit_MasterPrompt.md` | Reusable audit prompt for any project |
| `CLAUDE.md` | In project root — auto-loaded by Code |

---

## Permanent build rules (in CLAUDE.md)
1. Chrome extension for all live verification
2. Analysis phase must show full styling throughout
3. Token cap 16,000 all tiers (short-form)
4. Sidebar link count matches current lens/section total — verify after any ReportView change
5. No margin stacking
6. Never ask Nenad to run terminal commands Code can handle itself — exception: when Bash/tools are down and truly blocked
7. After every deploy, verify live with Chrome extension before declaring done
8. Never touch codex-maths during a D&L session
9. Site must remain password-protected until solicitor review
10. Long-form word cap (120k) stays DORMANT until explicitly activated post-beta
11. Switch Clerk from Development to Production mode before paid launch

---

## Positioning
**Tagline:** "A reading, not a rewrite."
**Core differentiators:** Tradition-aware (not a generic rubric) · Never generates prose · Teaches the craft move · 35 lens voices · No training on user submissions · Film scripts, treatments, short stories, stage plays · Excerpt mode for partial submissions
