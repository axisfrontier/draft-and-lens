# Draft & Lens — Beta Feedback Tracker

Living document. One row per distinct piece of feedback. Add new tester notes at the bottom of the log; pull anything actionable up into the relevant table above it.

---

## How to use this

- **Type** sorts what kind of problem it is, because each type needs a different owner:
  - **Bug** — broken, should just work (fix in Code, no debate needed)
  - **UX** — works, but confusing or hard to use (fix in Code, design judgement needed)
  - **Product** — the feature itself doesn't deliver value, even working correctly (needs a decision from you first)
  - **Positioning** — not a build problem at all; it's about what D&L claims to be or how it's framed
- **Severity** — Critical (blocks the core value prop) / High / Medium / Low
- **Status** — Open / Scoped / In progress / Done / Won't fix (with reason)

---

## 1. Critical — core value proposition

| # | Issue | Source | Type | Severity | Status | Notes / proposed solution |
|---|---|---|---|---|---|---|
| 1 | "How is this better than pasting into Claude directly?" — output doesn't yet feel distinctively different from generic Claude critique | Noel Lyons | Product/Positioning | Critical | Open | Three real differentiators exist (consistency without skilled prompting, persistent cross-manuscript memory, enforced tradition-specific framework) but aren't yet showing up sharply enough in output quality. Needs the differentiation to be *provable* in the actual analysis, not just claimed in marketing copy. |

---

## 2. Bugs

| # | Issue | Source | Type | Severity | Status | Notes / proposed solution |
|---|---|---|---|---|---|---|
| 2 | .docx upload fails silently — takes user to analysis page just to say it can't read the file, no clear path back | Noel Lyons | Bug | High | Open | Likely a file-size or parsing limit. Needs: (a) fix the actual read failure if fixable, (b) regardless, a clear "try a different format" path that doesn't dead-end the user |
| 3 | .md upload not supported at all | Noel Lyons | Bug/Feature gap | Medium | Open | Obsidian and other markdown-native writers are a natural audience for this tool. Should be a straightforward addition alongside existing supported formats |
| 14 | Annotation self-consistency (Test 1, "lightbulb/storm") — note still asks for a "more specific verb" on a choice the manuscript's own established context (the storm) already motivates | Internal test set (`DraftAndLens_Annotation_Test_Set.md`) | Bug | Medium | Done | 2026-08-15: added an "ESTABLISHED CONTEXT JUSTIFIES THE CHOICE" mandatory block to `src/prompts/analyst.ts` (same family as DEVICE vs INSTANCE / ABSTRACTION IS NOT AUTOMATICALLY A FAULT) and reran all 3 adversarial snippets through the real pipeline (Brain 1 + Brain 2, no mocks). Tests 2 (flat dialogue) and 3 (repetition as device) now pass cleanly. Test 1 partially improved — the IMAGERY note now explicitly names the storm ("The storm's chaos is already established — the umbrella cartwheeling is doing that work") rather than ignoring it, but WHAT TO REVISE still marked it **START HERE** and asked to "Give the image its sharpest verb," arguing "danced wildly" needs to tighten toward something "percussive, brittle, unpredictable." That's the opposite of the test's expected reading: imprecision is earned by the storm, and a more deliberate verb would work against the depicted chaos. Exact note text: *"⟦danced wildly⟧ is the one moment the prose loosens where it should tighten. The test: remove the adverb and ask whether the verb alone carries the action. 'Danced' without 'wildly' is too light for broken glass on metal... needs a verb that matches that physical reality: percussive, brittle, unpredictable."* Needs a second pass on the prompt block — likely has to state explicitly that acknowledging context is not sufficient; the note must not still recommend tightening a choice it has just conceded is motivated. **2026-08-15, second pass:** strengthened the block with a "NAMING THE CONTEXT IS NOT ENOUGH" clause — if a note's own justification contradicts its own recommendation, delete the recommendation rather than softening it. Reran Test 1 alone. Result changed shape but did not converge: the note no longer asks to *sharpen* the verb (the literal pattern the test names); instead it reframes "wildly" as a *redundant intensifier* given the storm is already established ("'wildly' is redundant against a storm the reader has already understood as violent") and recommends cutting it — still landing in WHAT TO REVISE / START HERE. This sidesteps the test's literal "fails if" wording (no longer asks for a "more specific verb," does acknowledge the storm) but arguably still contradicts the test's *intent*: established context is still being used as the springboard for a revision note rather than as a reason to leave the line alone. Whether "cut the redundant intensifier" is a legitimate, different craft judgement (distinct from "vague verb needs sharpening" — closer to the prompt's own NARRATOR RESTATING principle) or the same context-blindness failure wearing different words is a genuine judgement call, not a bug with a clean fix — flagged for Nenad rather than iterated on further blind. **Nenad's ruling (2026-08-15):** second read is correct — "cut the redundant intensifier" is a legitimate, distinct craft note, not the vague-verb pattern this test targets. Closed. |

---

## 3. UX issues

| # | Issue | Source | Type | Severity | Status | Notes / proposed solution |
|---|---|---|---|---|---|---|
| 4 | Nav and header text — light grey on black — hard to read; copy size too small | Noel Lyons | UX | Medium | Open | Contrast/accessibility fix. Check against WCAG AA at minimum |
| 5 | Umber colour tones read as "generic AI design" | Noel Lyons | UX | Low–Medium | Open | Aesthetic judgement call — worth a design pass once other fixes land, not urgent alone |
| 6 | Spidergram and pacing chart — not clear what to *do* with the information | Noel Lyons | UX/Product | High | Open | A visualisation with no prescriptive next step is decoration. Either (a) make it actionable — annotate what the shape means and what to fix, or (b) cut it if it can't be made useful |

---

## 4. Product-shape questions (need your decision before Code touches anything)

| # | Issue | Source | Type | Severity | Status | Notes / proposed solution |
|---|---|---|---|---|---|---|
| 7 | Comparisons to screenwriters/A24 etc. surfaced for a prose book manuscript | Noel Lyons | Product | High | Open | Suggests tradition/medium detection isn't scoping comparisons tightly enough to the actual form submitted. Worth checking against the "identify tradition before applying any craft rule" principle — sounds like a real gap between intent and behaviour |
| 8 | Writer comparisons too broad — wants 2–3 specific, well-chosen reference points rather than a scattergun | Noel Lyons | Product | Medium | Open | Depth over breadth. Aligns with the tradition-aware positioning — should be an easy philosophical fit, mainly an execution/prompt-tuning question |

---

## 5. Feature gaps (things Noel wants that don't exist yet)

| # | Feature | Source | Type | Severity | Status | Notes |
|---|---|---|---|---|---|---|
| 9 | Quick chapter read — what's working, what's not, at a glance | Noel Lyons | Feature request | Medium | Open | May already exist in some form via the analyst brain — question is whether it's surfaced clearly enough as its own quick view |
| 10 | Detailed grammar/tense/passive-voice/clunky-sentence check | Noel Lyons | Feature request | Medium | Open | Different job from craft/tradition analysis — more line-editing than structural. Worth deciding if this is in scope for D&L or a deliberate non-goal (there are dedicated tools like ProWritingAid for this — Noel named it directly) |
| 11 | Continuity ledger — flag contradictions against earlier chapters | Noel Lyons | Feature request | **High — likely the strongest differentiator** | Open | This is the one hardest to do well in a raw Claude chat (no persistent state across a long manuscript) and most natural for a purpose-built tool. Candidate for the next real build, not just a bug fix |

---

## 6. Competitive context

| # | Note | Source |
|---|---|---|
| 12 | ProWritingAid named as a comparable tool with multiple themed analysis modes | Noel Lyons — https://prowritingaid.com/ |
| 13 | Speed was explicitly *not* an issue for this tester — deprioritise further latency work relative to output quality | Noel Lyons |

---

## Raw feedback log

### 2026-08-02 — Noel Lyons (first review, 3 manuscripts tested)

> Thanks for sharing this. I used it with three different pieces of writing. Here are my thoughts
>
> It was a little tricky to use. I initially tried to upload .md files (I mostly use obsidian to write in, and that uses markdown). So then I tried using a docx file. It couldn't read that. But it tried. It took me to the analysis page, but it was mostly just to inform me it wasn't able the read the doc - maybe it was too big? There was no easy way to get back to upload copy another way. I clicked the back button and copy and pasted a chapter in. It was able to process that.
>
> It gave useful feedback, not too different to if I'd pasted it into Claude. The spidergram and pacing chart didn't make much sense to me, I'm afraid. I looked at it, but it wasn't super clear what I would do with the information.
>
> The comparisons with other writers and fitness to submit to various companies was interesting, but as I was writing a book, not a script, I'm not sure of the relevance of A24 etc. The choice of writers was very broad and as a result not too useful. 2-3 specific reference points is probably more useful.
>
> The nav at the top and other information, especially when it's light grey on black, I found hard to read. The copy is really small. And the umber tones are very suggestive of AI design, which is worth being aware of.
>
> I think it's an interesting idea, and there are quite a few options on the market that do a bit more of a specific job. https://prowritingaid.com/ is a good one to look at. It has a number of different themed analysis modes which allows you to get a different take on things.
>
> I wouldn't worry about the speed - I didn't find that an issue. The main challenge for me is - how is this any better than pasting a chapter into Claude or ChatGPT? Having a visual representation of pacing is an interesting idea, but I personally didn't find it useful.
>
> When I am writing, I tend to want:
> - A quick read of a chapter - what's working, what's not
> - A detailed check on grammar, tense, clunky sentences and passive forms
> - A continuity ledger - have I said something here that contradicts something earlier
>
> I hope this helps. More than happy to have another look.
>
> Thanks
> Noel

---

## Open questions for Nenad (not yet decided)

- [ ] Is line-editing (grammar/tense/passive voice) in scope for D&L, or a deliberate non-goal given the "reading, not a rewrite" positioning? (Related to item #10)
- [ ] Should the continuity ledger (#11) be prioritised as the next major build?
- [ ] Should the spidergram/pacing chart be made actionable or cut entirely? (#6)
- [ ] Is the A24/screenwriter comparison bug (#7) a tradition-detection failure or a scoping failure in the comparison brain specifically?
