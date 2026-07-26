# Code Prompt — Notes panel: fix blank first note + add glossary linking

> Sonnet / Medium. Audit before touching anything. One fix per commit, tsc before each.

## FIX 1 — Note 01 is blank/just quoting the anchored text
The first note in the notes panel is rendering as just a repetition of the anchored text span with no editorial observation. This is a generation or rendering bug — the note content is empty or missing, so the system falls back to displaying the anchor text.
- Investigate whether this is a generation issue (Brain 2 not producing a note for the first anchor) or a rendering issue (the first note's content field is empty/null and falls back to the span text).
- Fix at source. A note with no content should either not render at all, or render a placeholder that makes clear no note was generated for that span — never repeat the anchored text as if it were a note.
- Audit, report findings, wait for go.

## FIX 2 — Glossary linking in the notes panel
Technical craft terms appear in notes without explanation or linking — e.g. "exposition" in Note 04. The main report sections already have glossary linking (§19 system). The notes panel does not.
- Wire the same glossary term detection and linking to the notes panel that the main report sections use.
- Terms to prioritise: exposition, subtext, register, syntax, motif, irony, elision, bathos, anachronism, juxtaposition — and any other terms already in the glossary.
- On hover/tap, the tooltip or link should show the plain-language definition, same as in the main report.
- Additive only — do not change the glossary system itself, just extend its reach to the notes panel.

## FIX 3 — Duplicate note guard
While in this area: add a dedup check so identical or near-identical note content cannot render twice in the notes panel (related to the existing dedup fix in Code_Prompt_Perfect_Notes.md — confirm whether that fix already covers the notes panel or only the main report sections).

## Rules
- Audit before each fix. One commit per fix. tsc clean. Confirm render.
- Do not touch the glossary system itself or the main report sections.
- Do not touch codex-maths.
