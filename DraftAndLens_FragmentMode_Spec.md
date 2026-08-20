# Draft & Lens — Fragment Handling & Revision Loop (Spec)

**Status: design, not built. Written 2026-08-20. Supersedes the earlier draft of this file.**

## The problem

The pipeline has one mode: full analysis. Everything submitted runs the whole brain sequence regardless of size or intent. Removing the internal word-count gate (2026-08-20) correctly eliminated the dead zone, but exposed the real gap: a 300-word excerpt paying ~55s of structural mapping is both wasteful and answering a question nobody asked.

A writer pasting one revised paragraph is not asking "read this 80 words on its own terms." They are asking whether it fixes something, whether it fits, or simply testing what D&L does.

## The governing principle

**When context is insufficient for D&L's method to run cleanly, ask rather than proceed.**

This is not a fallback for edge cases. It is the correct editorial behaviour and the only rule that scales to inputs nobody anticipated. The system never needs to identify what a strange input is — only whether it can do its job on it, and say so plainly.

This directly prevents the two failure modes that would discredit D&L: producing nothing, or producing confident nonsense.

## The architectural decision

**Route on available context, not on input size.**

Fragment-vs-full is a proxy variable, and every proxy variable needs a threshold, and every threshold recreates the dead-zone bug in a new place. Context-available-or-not is binary, knowable without inference, and has no boundary to get wrong.

A paragraph with a read manuscript behind it is context-rich. A full chapter from a first-time user is context-poor. Size is not the variable.

## What fragment handling actually needs to do

Smaller than first assumed. Most valuable fragment asks resolve to existing features reached through a different door. Fragment mode uniquely needs to:

- Ask what the writer wants, when intent isn't obvious
- Give a real line-level craft read when that is what's wanted
- Route back to a full read when the question genuinely needs one

Everything else is Mentor mode or Ask the Lens.

## What is answerable at fragment scale

- Line-level craft: rhythm, verb load, concreteness, specificity, where a sentence goes slack
- Register consistency — but only against prior context
- Revision judgement — only with a prior version present
- Authenticity to a tradition — only if the writer names the tradition

The pattern: almost everything valuable needs either prior context or writer-supplied framing.

## What must not be attempted

- **"Is this good?" answered cold.** No frame, no honest answer. Ask what they're going for.
- **Tradition identification from a fragment.** Tradition-first is D&L's load-bearing dependency; a paragraph cannot establish one. Guessing here breaks the method at its foundation.
- **Scoring.** A score on a paragraph is noise dressed as signal.
- **Market or comparison judgements.** Meaningless at this scale.
- **Continuity extraction.** Already covered by the standing rule: complete pieces only, never excerpts.
- **Structural judgement of any kind.**

## The redirect, and why it isn't a decline

"Add this to the previous version and tell me if it's cohesive now" cannot be answered well from a fragment — doing it properly means re-reading the chapter with the substitution applied, which is a full read.

The response is an editor's response: *"Paste me the chapter with it in place and I'll read it properly."*

This is not a refusal. It routes the writer back onto a path that already works — and in practice they will often have simply forgotten to do this. Once they paste the amended chapter, it is an ordinary revision, and Mentor mode already handles it: same work, actually changed, judge whether it landed.

An editor declining to half-do something is credibility, not failure. A confident answer to an unanswerable question is worse than any redirect.

## The upfront ask

When a fragment arrives and intent isn't clear, D&L asks in the editor's voice — something in the register of "Tell me what you'd like me to do with this."

Three options plus a free text box. Not a long menu — a long menu reads as form-filling, which is the generic-product tell the redesign exists to avoid.

Options must be context-aware. "Does this fit with what I've read of chapter one?" can only be offered if chapter one exists in the system. A first-time user with no prior work gets a different, smaller set.

Illustrative shape (exact copy to follow the Editor voice once finalised):

- "I'm writing something in [genre] — does this sound authentic to it?"
- "Does this fit with what you've read of my work so far?" (context-dependent)
- "Just tell me how the writing itself is holding up."
- Free text.

## The revision loop — closing it

1. Writer makes amends to a chapter or full work — whether prompted by D&L's notes or their own instinct
2. They resubmit the amended work
3. Mentor mode judges whether the revision achieved what they set out to do (against prior flags, and against their own stated intent where given)
4. The writer can then go to the Editor section and ask questions about those amends — interrogating the judgement conversationally rather than only receiving it

Step 4 is the piece that makes the loop feel like working with an editor rather than receiving a verdict.

## Output shape

Fragment responses are not reports. A few paragraphs of prose in the lens voice. Seconds, not a minute. If the complaint is that a paragraph shouldn't cost 55 seconds, the answer must feel conversational, not ceremonial.

## The risk to guard hardest

"Does this sound good?" invites "here's a better version." The no-rewrite stance is under most pressure at fragment scale, because the fix seems small and obvious. It must hold hardest here, not least.

## Which lens speaks

- Context exists → the manuscript's existing lens carries over
- No context → the writer picks

Tradition cannot be identified from a fragment, so it is never inferred.

## Open questions — Nenad's calls, not to be guessed

- **Usage accounting.** Fragment responses skip structural mapping and report generation entirely — much cheaper. Do they count the same against limits?
- **Persistence.** Are fragment answers revisitable, or ephemeral like current Ask the Lens?
- **Exact copy** for the upfront ask and the redirect — waits on the Editor voice being finalised.

## Dependencies and build order

- Depends on Mentor mode existing (needs prior readings and flags to answer against)
- Extends Ask the Lens rather than duplicating it
- Must never write to the continuity ledger

Sequence: Mentor mode → fragment handling → differentiator messaging.
