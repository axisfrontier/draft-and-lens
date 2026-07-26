# Code Prompt — Excerpt vs Complete Piece Mode

> Read CLAUDE.md and DraftAndLens_LearnedCorpus_v2.7.md first.
> Model: Sonnet / Medium. Touches UI (homepage upload panel), Brain 1, and Brain 2. IP boundary applies to all Brain changes.
> Audit first. Show plan before touching anything. Wait for go.
> One commit per logical change. tsc before each commit. Verify live with Chrome extension after deploy.

---

## The Problem

Brain 1 and Brain 2 are calibrated to read complete pieces. When a writer submits a chapter, a scene, or opening pages, the analyst looks for things that aren't there — setup, resolution, arc — and flags their absence as failures. That is wrong. An excerpt is not a failed short story. It needs a different reading.

Auto-detection is not reliable enough — too many false positives on experimental openings, in medias res starts, and flash fiction. The solution is a simple upfront declaration by the writer.

---

## PART 1 — UI: Pre-submission declaration (homepage upload panel)

### Audit first
Read the homepage upload panel component (`page.tsx` or equivalent). Find:
1. Where the submit / Analyse button is rendered
2. What state variables currently exist on the upload form
3. Where word count and mode (story/script/treatment/play) are currently handled

Report. Wait for go.

### What to build
Add a single toggle or radio button group directly above the Analyse button. It must be:
- Simple, not a form — two options only, one always selected
- Default: **Complete piece**
- Option 1: **Complete piece** (short story, script, stage play, treatment)
- Option 2: **Excerpt** (chapter, scene, opening pages from a longer work)

**Design requirements:**
- Match D&L's existing UI style exactly — same font, same colour tokens, same spacing as the mode selector
- Label: "What are you submitting?" or similar — short, clear, non-technical
- The selection must be stored in component state and passed to the API alongside the submitted text, mode, and word count
- No additional explanation or tooltip needed — the labels are self-explanatory

**What not to build:**
- No text field asking for context
- No dropdown
- No multi-step flow
- No modal

---

## PART 2 — API: Pass declaration to the brain pipeline

The excerpt/complete declaration must be passed from the UI to the API route that triggers the brain pipeline, and from there to Brain 1 and Brain 2.

### Audit first
Read the API route that handles analysis requests. Find:
1. What parameters it currently accepts from the client
2. Where it passes parameters to Brain 1 and Brain 2

Report. Wait for go.

### What to build
Add `submissionType: 'complete' | 'excerpt'` as a parameter to the API route. Pass it through to Brain 1 and Brain 2 system prompts. One commit.

---

## PART 3 — Brain 1: Tradition identification update

Brain 1 identifies the tradition a piece is working in. When the submission is an excerpt, Brain 1 must:
- Not expect a complete arc
- Focus on what can be determined from the pages given: register, voice, tradition markers, period, genre
- Explicitly note in its output that the reading is of an excerpt, so Brain 2 receives this context

### Add to Brain 1 system prompt (additive — do not replace existing content)

Add a new section after the existing tradition identification instructions:

```
SUBMISSION TYPE AWARENESS

If submissionType is 'excerpt':
- You are reading a fragment of a larger work, not a complete piece.
- Do not attempt to identify arc, resolution, or structural completeness — these are not present by design.
- Focus your tradition identification on what IS present: voice, register, period, genre markers, narrative stance.
- Begin your output with: "READING MODE: EXCERPT — this reading is calibrated for a fragment of a larger work."
- Pass this context clearly in your output so the analyst reads accordingly.

If submissionType is 'complete':
- Proceed as normal.
```

---

## PART 4 — Brain 2: Analyst update

Brain 2 gives the full craft reading. When the submission is an excerpt, the reading must shift from "does this work as a complete piece" to "does this work as a fragment — does it pull you in, does the voice sustain, does it make you want to read more."

### Add to Brain 2 system prompt (additive — do not replace existing content)

Add a new section clearly labelled EXCERPT READING MODE:

```
EXCERPT READING MODE

When the submission is an excerpt (submissionType = 'excerpt' or Brain 1 output begins with "READING MODE: EXCERPT"):

WHAT TO READ FOR:
- Voice and register — is it consistent and distinctive?
- Momentum — does the excerpt pull the reader forward?
- Scene construction — are individual scenes doing their work?
- The promise of the page — does this make you want to read what comes next?
- Craft at the sentence and paragraph level

WHAT NOT TO PENALISE:
- Missing setup or backstory — the writer may not have submitted earlier pages
- Unresolved plot threads — resolution belongs to a later chapter
- Absence of a complete arc — this is a fragment, not a failure
- An ending that doesn't resolve — the excerpt ends where the writer chose to cut it

WHAT TO FLAG DIFFERENTLY:
- If something feels like missing information rather than intentional withholding, note it as: "If this is mid-novel, the reader may already know X — if this is the opening of the work, consider establishing X earlier."
- Do not use the word "incomplete" to describe the submission. It is not incomplete — it is an excerpt.

OPENING NOTE IN THE READING:
Begin the reading with a single line: "This is a reading of an excerpt. The analysis focuses on what the pages offer, not on what a complete work would require."
```

---

## PART 5 — Corpus addition (LearnedCorpus v2.8)

Add the following as Principle 23 in `DraftAndLens_LearnedCorpus_v2.7.md` (updating it to v2.8):

```
Principle 23 — Excerpt readings are not deficit readings.

An excerpt submitted for analysis is not a failed complete work. It is a fragment evaluated on its own terms. The primary instruments of excerpt reading are voice, momentum, scene construction, and the promise of the page. Structural completeness, arc, and resolution are irrelevant to an excerpt reading and must never be flagged as absences. The question is not "does this work as a story?" but "does this work as a page?"
```

Update the corpus file version header to v2.8.

---

## ORDER OF OPERATIONS
1. Audit UI (Part 1) → wait for go → build toggle
2. Audit API (Part 2) → wait for go → add parameter
3. Update Brain 1 (Part 3) → one commit
4. Update Brain 2 (Part 4) → one commit
5. Update corpus to v2.8 (Part 5) → one commit

### After all commits
1. `npm run build` — must pass clean
2. Deploy
3. Verify with Chrome extension:
   - Homepage shows the toggle above the Analyse button
   - Default is "Complete piece"
   - Submit a short excerpt with "Excerpt" selected — confirm the reading opens with "This is a reading of an excerpt" and does not penalise missing arc or resolution
   - Submit a complete short story with "Complete piece" selected — confirm normal reading behaviour unchanged
4. Report both test results before declaring done
