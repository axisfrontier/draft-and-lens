# Draft & Lens — Competitor Analysis
## May 2026

---

## Overview

The market divides into two categories that do not directly compete:

**Category A — Writing assistance** (Sudowrite, Type.ai, NovelAI)
Help writers generate, draft, expand, and polish prose. The AI writes *with* you.

**Category B — Analysis and coverage** (Callaia, Greenlight Coverage, ScriptReader.ai, Prescene, ScreenplayIQ, Script Reader Pro, Marlowe)
Evaluate what you have already written. The AI reads *your* work and responds.

Draft & Lens is Category B. Type.ai is Category A. They are not direct competitors. The comparison frame is the analysis tools.

---

## The Analysis Tools

### Callaia
**Positioning:** Professional-grade AI script coverage. Trusted by Sony and WB.
**Pricing:** ~$65 per script.
**What works:** Depth and detail that feels professional. Provides project comps ("It's Inception meets The Insider") and cast suggestions. Users describe it as "the most in depth and comprehensive script coverage I've seen by human or AI."
**What's missing:** Tradition awareness. Register sensitivity. Mentorship register — it diagnoses but rarely shows what better looks like.
**User verdict:** Trusted for depth. Frustrated by notes that could apply to any script.

### Greenlight Coverage
**Positioning:** Instant premium script analysis. Subscription model (~$65/month).
**What works:** Speed. Quality praised as "articulate and sensitive." The follow-up Q&A feature — after receiving analysis, the writer can ask specific questions in live chat. This is the most-praised feature in the category. Users say it's "more than I could have thought possible."
**What's missing:** Tradition awareness. Personalised suggested prompts. Mentorship register.
**User verdict:** The Q&A feature is what writers come back for. The initial analysis is good. The conversation is what makes it sticky.

### ScriptReader.ai
**Positioning:** Granular scene-by-scene scoring. $9.99 per script.
**What works:** Accessibility. Extreme detail. Very low price point.
**What's missing:** Human context for scores. Prone to hyperbole and flattery — "purple politeness" is a documented user complaint.
**User verdict:** Useful for a first pass structural check. Not trusted for nuanced craft notes.

### ScreenplayIQ (WriterDuet)
**Positioning:** WGA-compliant analysis. Deliberately avoids scores.
**What works:** Commitment to not rewriting the work. Generates images alongside analysis to show what the story might look like visually. Character dial adjustments.
**What's missing:** Tradition awareness. Specific craft notes with direction.
**User verdict:** Non-judgmental framing appreciated. Notes sometimes too generic.

### Prescene
**Positioning:** For film and TV professionals. Used by Paradigm Talent Agency.
**What works:** Market insights — checks your script against upcoming A24 releases. Production scheduling and budgeting features. Cut coverage time by 95% for Paradigm.
**What's missing:** Mentorship register. Craft depth for writers (oriented toward industry professionals, not developing writers).
**User verdict:** Excellent for producers. Less useful for writers developing craft.

### Script Reader Pro (human)
**Positioning:** Human coverage from working screenwriters. $89–$499+.
**What works:** Genre-matched human readers with lived experience. Inline margin notes. "Extraordinary — the degree of thoughtful feedback took my breath away." The gold standard for what good coverage feels like.
**What's missing:** Speed. Accessibility. Scalability.
**User verdict:** The benchmark. But slow and expensive.

### Marlowe / Authors.ai (fiction)
**Positioning:** AI beta reader for novels. Studied bestsellers and reverse-engineered what works.
**What works:** Plot beat placement across novel-length work. Identifies structural inconsistencies. "Won't write passages for authors — studies what resonated with readers."
**What's missing:** Tradition awareness. Prose register sensitivity (applies same framework to all fiction).
**User verdict:** Strong on structure. Weaker on voice and register.

---

## What Users Actually Want — The Consistent Signal

Across every forum, review, and user comment, the same frustrations appear repeatedly:

**"Purple politeness"** — the most common complaint. AI feedback that is too generic or overly positive. Users stop trusting tools that encourage rather than diagnose.

**Generic notes** — notes that could apply to any script. Users want notes specific to *their* work and *their* tradition.

**Speed valued, but not at the expense of depth** — writers are not paying for fast. They are paying for useful.

**Follow-up conversation** — Greenlight's Q&A is the most praised feature in the category. Writers want to interrogate feedback, not just receive it.

**Comps and market positioning** — knowing where the work sits ("It's X meets Y") is consistently valued for pitching.

**Not being rewritten** — the commitment to diagnosis rather than prescription is praised wherever it exists.

**What good looks like** — the consistent gap. Every tool tells writers what is wrong. Almost none show what better looks like.

---

## Type.ai — Specifically

Type.ai is an AI-native document editor. The AI is integrated into every layer of the interface. It uses GPT-5 and Claude 4.5 Sonnet. It is for writers who already know what they are doing and want to write faster. It assumes craft knowledge and provides AI co-writing assistance. It does not analyse completed work.

No direct overlap with Draft & Lens. Different category, different user need.

---

## What Draft & Lens Does That Nobody Else Does

**Tradition-aware analysis** — no competitor does this. Every tool applies a generic craft framework. Draft & Lens identifies the tradition first (Brain 1) and applies only the principles appropriate to it (Brain 2). A mythic allegory is not evaluated on social realist standards. A fabular narrator is not criticised for altitude. This is the most significant differentiator.

**7-brain architecture** — no competitor uses specialist AI brains for specialist cognitive tasks. The diagnostician does one thing. The analyst does one thing. The conversation brain does one thing. Each is excellent at its specific job.

**Lens voices** — no competitor offers this. Reading a script through the specific craft intelligence of Hemingway, Villeneuve, or the Coens, with their confirmed tradition context, is unique. It turns analysis from a verdict into a perspective.

**Editorial conversation** — Greenlight's Q&A is the closest comparison. Draft & Lens's Brain 7 is categorically different: it holds the full analysis, the diagnostic, and the conversation history. It can examine pushback ("that note about Emine was wrong — she's observed humanity for years") and say plainly: "You're right." The conversation is grounded in understanding, not retrieval.

**Fiction and stage plays** — most tools are screenplay-only. Draft & Lens covers all three forms with tradition-aware analysis for each.

**Revision notes** — no competitor generates specific revision instructions from the conversation and tracks their status. Writers leave with not just feedback but an actionable revision list, generated from the dialogue, referenced to the text.

**Mentorship register** — no competitor explicitly commits to showing what good looks like. Every note in Draft & Lens includes an illustrative direction ("As an illustration:") — not a rewrite, a sight line. This is the most useful thing a mentor does. No tool in this market does it systematically.

---

## Features to Add to the MVP

**YES — Add these:**

**Follow-up Q&A / Conversation** (Greenlight's most praised feature, now built as Brain 7)
Already implemented in the prototype. The most important missing feature in the category is now Draft & Lens's most architecturally sophisticated feature.

**Project comps** ("This work sits in the tradition of X and would appeal to audiences of Y and Z")
One or two sentences, generated from the Brain 1 diagnostic. Cheap to add. Immediately useful for pitching.

**Suggested prompts from diagnostic**
Brain 1 identifies the craft questions that matter most for this specific work. These become the suggested prompts in the conversation panel — specific to this submission, not generic.

**Revision notes from conversation**
Already implemented. Generated automatically from Brain 7 responses. Status tracking (To Do / In Progress / Done).

**NO — Don't add:**

**Scene-by-scene numerical scoring** (ScriptReader.ai)
Scores are meaningless without human context. Prone to flattery. The radar chart and dimension scores in Draft & Lens already serve the orientation purpose better.

**Cast suggestions** (Callaia, Greenlight)
A marketing feature, not an editorial one. Entertaining but not useful for a writer developing craft.

**Writing assistance** (Sudowrite territory)
Draft & Lens is an analysis tool. Adding generation would dilute the identity. The market is crowded with writing assistants. It is not crowded with honest, tradition-aware editorial intelligence.

**Production breakdown / scheduling** (Prescene, RivetAI)
For producers. Out of scope for the product's identity.

---

## The Market Gap Draft & Lens Owns

Every tool in this market either:
- Analyses without tradition-awareness → generic notes
- Praises without honesty → purple politeness
- Diagnoses without direction → tells you what's wrong, not what better looks like
- Covers scripts but not fiction or stage plays

The market's own self-assessment: "AI tools like Callaia offer instant feedback, but can't match human taste, empathy, or genre nuance."

That is the gap. Draft & Lens, done properly, addresses all of it simultaneously. The 7-brain architecture makes tradition-awareness structurally enforced. The mentorship register makes direction mandatory. The conversation makes depth possible. The lens voices make the analysis a dialogue rather than a verdict.

The competitive position is defensible precisely because it required the foundational thinking that this project eventually produced.

---

*Document version 1.0 — May 2026 · Draft & Lens*
