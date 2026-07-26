# Draft & Lens — Managed Build: Report Page Finish (styling → Three Things → chat)

> Reference files (use these — they are the visual source of truth):
> - `DraftAndLens_Prototype_Component_CSS.css` — the prototype's FULL component CSS, verbatim.
> - `DraftAndLens_DesignSystem.md` — tokens/fonts summary.
> - The prototype report-page screenshot (the target look).
>
> This prompt covers three phases. **You will do them strictly in order, and you will STOP for my explicit "go" between every step.** Do not run ahead. The goal is zero errors and zero breakage — this page is close, so we protect what works.

---

## ⛔ OPERATING PROTOCOL — applies to EVERY edit, no exceptions

1. **Audit before touching anything.** Before any edit, read the relevant file(s) and tell me: what's there now, what you'll change, the exact files and the specific lines/classes. Then WAIT for my "go." No editing before I confirm.
2. **Additive only — never rewrite or restructure a component.** Adjust classes, CSS, spacing, markup additions. If a change appears to need restructuring or rewriting a component, STOP and ask me — do not proceed.
3. **One change per commit.** One component, or one small feature part, per commit. After each commit, confirm the page still renders cleanly (nav present, all sections present, nothing dropped) and tell me — then WAIT for "go" before the next.
4. **Touch only the files named in the current step.** Anything outside that list — including the upload screen and `layout.tsx` nav structure — is OFF LIMITS unless I approve it.
5. **Revert, don't patch, on breakage.** If any render breaks, return to the last good commit rather than layering fixes on a broken state.
6. **Protect what works.** The upload screen is correct, the sidebar fix is in, 7 of 12 report components render. Do not regress any of it.
7. **IP boundary intact.** Prompts/lenses stay server-side. Re-run the bundle grep on any step that adds client surface or an API path.
8. Sonnet/Medium effort for phases 1–2; phase 3 only if/when I say so.

If at any point a step looks bigger than described, STOP and tell me before doing anything.

---

## PHASE 1 — Styling pass (match the prototype). One component per commit.

For EACH component below: audit → show me the plan → wait for "go" → make additive edits → commit → confirm render → wait for "go" → next. Match `DraftAndLens_Prototype_Component_CSS.css`.

1. **Title block + DOCUMENT panel** — large serif title (Libre Baskerville); doc-stats box (Pages/Words/Mode). Add the missing **byline** (`.story-byline`, italic) and **summary** (`.title-summary-text`, bordered paragraph) here.
2. **Verdict band** — `.verdict-row` / `.verdict-accent` (4px amber) / `.verdict-inner` / `.verdict-ruling` / `.verdict-sep` / `.verdict-detail`.
3. **Craft Balance dashboard** — `.dashboard-header*`; radar + tradition-alignment bars, mono labels, rules, spacing.
4. **Story Arc** — `.arc-section` / `.arc-header` / `.arc-label` / `.arc-legend(+dot)` / `.arc-wrap` / `.arc-note` / `.arc-tooltip`; tension/pace/emotion colours.
5. **Report sections (01–13)** — section framing, numbered kicker, serif headings, body line-height 1.88, inter-section spacing/rules.
6. **Editorial Lenses grid** — `.lens-section-header/-label/-title` / `.lens-group-label` / `.lens-strip` / `.lens-pill` (+hover/active amber) / `.lens-thumb` / `.lens-pill-name` / `.lens-pill-works`.
7. **Market / Studio Match panel** — dark band, amber kicker, framing/spacing.
8. **Brighter active nav (top-right)** — active type tab + ABOUT/GLOSSARY/FEEDBACK/LEGAL links to the prototype's amber (small CSS; this is the only `layout.tsx`-area change permitted, styling only, nav structure untouched).

**End of Phase 1:** show me the full report page renders matching the prototype, list all commits, confirm upload screen + functionality untouched. STOP for my go before Phase 2.

---

## PHASE 2 — Build the "Three Things" band (small, self-contained)

Audit first. Reference: `.three-band` / `.three-band-title` / `.three-band-sub` / `.three-grid`.
- Additive new component at the sidebar's `#sec-three` anchor (currently a dead link).
- Source content from the analyst output that already drives the action/fix sections — **no new model call, no pipeline change.** If unclear where the data is, ask before wiring.
- One commit. Confirm the sidebar link now scrolls to a rendered, prototype-styled band. STOP for my go before Phase 3.

---

## PHASE 3 — Build "Speak with your editor" chat + revision notes (its own focused work — only on my go)

Audit first. This is a FEATURE, not styling — treat with extra care. Reference: prototype chat/conversation + revision-notes CSS and screenshot.
- **Part A — chat panel:** conversation input, "ADDRESS TO" (editorial voice or a named lens), message history, amber SEND. Runs through the **server-side Brain 7 (conversation)** prompt — browser sends only the message + chosen voice; prompt/lens IP never ships to client. A lens voice answers from its **own character sheet — never the editorial corpus** (SCOPE clause). No prose rewriting, no fabricated best-in-class; same mentor disposition (developmental, not directive).
- **Part B — revision notes:** add manually ("+ ADD NOTE") and/or generate from the conversation; lists tasks.
- Confirm where conversation state is stored before wiring (Supabase row vs session) — ask if unclear.
- Isolated commit per part. Re-run bundle IP grep (PASS exit:1). Confirm prompts/lenses absent from client bundle.

---

## Final verification (after all phases)
- Report page matches the prototype: serif titles, framed sections, styled lens grid, dark bands with amber, correct spacing, Three Things band live, chat working.
- Nav intact, upload screen untouched, all existing functionality works.
- Bundle IP grep PASS. All commits listed.
