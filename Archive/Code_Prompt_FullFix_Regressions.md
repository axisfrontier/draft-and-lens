# Code Prompt — Full Fix: Regressions and Outstanding Issues

> **Read CLAUDE.md first — every rule in it applies this session.**
> Sonnet / Medium for all fixes except the analyst prompt (Sonnet / High).
> Use the Chrome extension to verify every fix on draftandlens.com after deploying — never ask Nenad to do a live test.
> One fix per commit. tsc before every commit. Audit before touching anything.
> Never touch codex-maths.

---

## Before starting — run a full audit
Check git log and identify every commit from today's session. List what was shipped vs what was planned but not confirmed live. Use the Chrome extension to inspect the current live state of draftandlens.com. Report findings before fixing anything.

---

## FIX 1 — Styling disappears during analysis phase (REGRESSION)
The analysis phase (stage pills active, content streaming) loses all styling — bare page, wrong fonts, no warm paper background.
- Find what renders during the analysis phase and why it loses the design system.
- Fix so the full design system (fonts, tokens, warm paper background) is present throughout the entire analysis phase, from the moment the user clicks Analyse to the moment the report is fully rendered.
- This must never regress again — add a note to CLAUDE.md after fixing.

## FIX 2 — Analysis animation not showing
The amber progress bar animation (committed as d6f1c7e) is not visibly rendering during analysis.
- Use the Chrome extension to check whether it's rendering.
- If not: diagnose whether it's a CSS issue, a timing issue, or whether the element isn't mounting. Fix at source.
- Animation must be visible on analyses of any length, not just long ones.

## FIX 3 — Sidebar missing sections 07–13 (REGRESSION — now fixed but verify)
Previously the sidebar Analysis section was truncated at 06. Confirm all 13 sections now show in the sidebar on the live site. Expected full list:
- Overview: Title & summary, Verdict, Character bible (3)
- Dashboard: Dimension map, Story arc (2)
- Analysis: OVERVIEW through REVISION NOTES (01–13 = 13)
- Action: Three things, Editorial lenses, Studio match (3)
- Reference: About, Glossary, Feedback, Contact, Disclaimer (5)
Total: 26 links. Verify with Chrome extension. Fix any that are missing or broken.

## FIX 4 — Token cap causing silent section truncation
The analyst maxTokens cap was silently cutting the report before section 07. Confirm the fix (16000 tokens for top tier) is live and working. Submit the Royal Descent text via Chrome extension and confirm all 13 sections render in the report.

## FIX 5 — General styling pass regression check
The overall styling still looks wrong compared to the prototype. Use the Chrome extension to compare the live site against `DraftAndLens_Prototype_Component_CSS.css`. Identify any components that regressed during today's work and list them. Fix only clear regressions — do not restart the styling pass from scratch.

## FIX 6 — Code quality audit
Run `/audit` on `src/components/analysis/` and `src/app/`. Report dead code, duplication, and inconsistencies introduced today. Fix high-priority issues (functional bugs) in isolated commits. Flag medium/low for the handover.

---

## After all fixes
1. Use Chrome extension: submit the Royal Descent text, confirm full report renders with all 13 sections, correct styling throughout, animation visible during analysis, sidebar complete.
2. tsc clean, bundle IP grep PASS (exit:1).
3. Deploy and confirm live on draftandlens.com.
4. Update CLAUDE.md with any new lessons learned.
5. Give Nenad a clean summary: what was fixed, what was committed, current state.
