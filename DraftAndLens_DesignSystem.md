# Draft & Lens — Design System (extracted from the HTML prototype, the source of truth)

> This is the canonical visual spec, extracted verbatim from `DraftAndLens.html`. The Next.js production build must match it. Goal: the production app looks like the prototype — warm-paper literary instrument, serif + mono character — without breaking any existing functionality.

---

## 1 · FONTS (the most likely thing missing in production)
Three Google fonts, loaded in the prototype via:
```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,300&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">
```
Usage:
- **Libre Baskerville** (serif) — page titles, section headings, the verdict, the reading body, big numbers. This font carries the "literary" character. Weights 400/700, italic 400.
- **IBM Plex Mono** — all kickers, labels, the nav, sidebar, technical/editorial chrome (the small uppercase letter-spaced labels). Weights 300/400/500, italic 300.
- **IBM Plex Sans** — body/UI default. Weights 300/400/500, italic.
- **Body default:** `font-family: 'IBM Plex Sans', sans-serif;` at `font-size: 15px;` on body.

In Next.js: load all three (next/font/google preferred, or the same `<link>` in the root layout). The font-family declarations below must resolve to these, not system fallbacks.

## 2 · COLOUR TOKENS (CSS variables — :root)
```
--paper:      #f5f1e8;   --cream:      #ede8d8;   --warm-mid:   #ddd8c8;
--rule:       #b8b0a0;   --rule-l:     #d8d2c4;
--ink:        #1a1710;   --ink-mid:    #3a3628;   --ink-soft:   #5a5448;   --ink-faint:  #8a8478;
--amber:      #a86c10;   --amber-d:    #7a4e08;   --amber-l:    #c88c30;
--red:        #8b2020;   --green:      #2a5030;   --teal:       #2a7a7a;   --blue:       #1a3a5c;
--tension:    #b03010;   --pace:       #1a6030;   --emotion:    #2a4880;
--black-band: #14120e;
--nav-h:      52px;       --sidebar-w:  200px;
/* Upload screen surfaces */
--surface-input: #1a1814; --surface-deep: #0f0e0b; --border-dark: #2e2a22; --border-deeper: #2a2820;
/* Semantic states */
--error: #c05050;         --success: #6a9a72;
/* Light text on dark */
--paper-dark: #c8c0a8;
/* Form label amber */
--label-amber: #A96C10;
```

## 3 · CORE LOOK
- **Page background:** `--paper` (#f5f1e8, warm off-white). Text `--ink`.
- **Signature accent:** amber (`--amber` #a86c10). Used for kickers, the 24px rule before titles, active states, verdict accent bar, big verdict text (`--amber-l`).
- **Dark bands:** `--black-band` (#14120e) for verdict strip and the "Where This Could Go" / industry section; light text (`--paper-dark`, amber-l) on them.
- **Tradition/arc line colours:** tension `#b03010`, pace `#1a6030`, emotion `#2a4880`.

## 4 · TYPE SCALE & TREATMENTS (key patterns)
- **Page title:** Libre Baskerville, `clamp(2.5rem, 5vw, 4rem)`, weight 700, line-height 1.05, letter-spacing −.02em, color --ink.
- **Subtitle/tagline:** Libre Baskerville italic, .95rem, --ink-soft.
- **Kicker (the small uppercase label above titles):** IBM Plex Mono, ~.72rem, letter-spacing .2–.22em, uppercase, amber (`#c8b898` on dark / `--amber-d` on light); often preceded by a 24px×1px amber rule (`.title-kicker::before`).
- **Section heading:** Libre Baskerville, ~1.4rem, weight 700, letter-spacing −.01em, --ink.
- **Reading / section body:** ~.92rem, line-height 1.88, --ink-mid; `strong` → --ink, weight 500.
- **Note text:** ~.78rem, line-height 1.7, --ink-soft.
- **Nav:** IBM Plex Mono, .95rem, letter-spacing .2em, uppercase; logo span in --amber-l.
- **Sidebar links:** IBM Plex Mono, small, uppercase, letter-spaced; active = --amber-d text + amber left-border + faint amber bg `rgba(168,108,16,.06)`.
- **Verdict number/title:** Libre Baskerville 700, ~1.7rem, --amber-l on the dark band.
- **Big "things" numbers:** ~2.75rem, weight 700, muted.

## 5 · COMPONENT NOTES
- **Layout vars:** nav height 52px, sidebar width 200px.
- **Anchor-note hover:** background → --warm-mid.
- **Cards/stat panels:** 1px `--rule-l` border, `--cream` background, mono labels.
- **Inputs (upload screen):** dark surfaces (`--surface-input` #1a1814) against the paper page — the paste box is dark.
- **Smooth scroll:** `html { scroll-behavior: smooth; }`.
- **Rules/dividers:** `--rule` / `--rule-l` hairlines throughout.

## 6 · THE FEEL (so it's not just tokens)
A warm-paper editorial instrument: serif for everything that's *the reading*, mono for everything that's *the apparatus* (labels, nav, metadata). Amber is the single accent — used sparingly, for emphasis and active state. Dark bands punctuate (verdict, industry). Restrained, precise, literary — not flashy, but distinctly *designed*. The character comes from the serif/mono contrast + warm paper + amber accent; lose the fonts and it collapses to generic, which is the current production symptom.
