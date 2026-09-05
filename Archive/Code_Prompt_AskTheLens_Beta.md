# Code Prompt — Corpus Addition (Scene/Subplot Principles) + Ask the Lens (Beta)

> Read CLAUDE.md and DraftAndLens_LearnedCorpus_v2.8.md first.
> Model: Sonnet / High (Part A is corpus writing, Part B is a real feature with IP boundary implications — worth the higher effort).
> Audit first. Show plan. Wait for go. One commit per part minimum.
> tsc before each commit. Chrome extension to verify live after deploy.

---

## PART A — Corpus Addition: Scene/Sequence and Subplot Principles

### Source
Learnings from analysing Tom Vaughan (Story and Plot), a working professional screenwriter with 28+ years experience and a large teaching practice. Not a lens voice candidate — his approach is instructional/systematic rather than a distinctive authorial reading sensibility, so this is a corpus addition, not a new lens.

### Add as Principle 24 in LearnedCorpus (v2.8 → v2.9)

```
Principle 24 — Scenes and sequences are the true unit of structure, not "plot."

A script or story's structure is best evaluated at the scene and sequence level, not through abstract plot-point labels. When assessing structure, ask what each scene is doing on its own terms — what changes within it, what it costs the character to get through it — rather than checking whether it hits a generic beat-sheet marker. A script can technically "hit" all the expected plot points and still fail if its scenes and sequences aren't individually doing dramatic work.

Subplots are not separate from the main story — they are the main story's other dimensions. Do not evaluate a subplot in isolation as a "B story" that either works or doesn't. Evaluate whether it deepens, complicates, or tests the same central question the main plot is asking. A subplot that runs parallel without ever touching the main thread is a structural weakness, even if it is well-written in isolation.
```

### Where this applies
This principle should inform Brain 1b's structural mapping (scene/sequence identification) and Brain 2's structure-related sections for script and treatment modes specifically — it's most relevant to those formats, less directly applicable to prose short stories.

### Verify
Read Brain 1b and Brain 2's structure-related prompt sections. Confirm Principle 24 integrates without contradicting existing structural principles (particularly Principle 1's tradition-first requirement — Principle 24 should refine how structure is read within a tradition, not override tradition-awareness).

One commit: `feat: LearnedCorpus v2.9 — Principle 24, scene/sequence and subplot structure`

---

## PART B — Ask the Lens (Beta Feature)

### What this is
A writer can select any lens voice and ask it a specific question about their submitted work — grounded in the actual text, not a general opinion. This uses the existing "Speak with your editor" UI pattern already built (conversation panel with Address-to chips), extended to support any of the 35 lens voices as a target, not just "Editorial."

### Critical guardrail (non-negotiable)
The lens must answer from the submitted text only. If a question cannot be answered from what's on the page, the lens must decline in character rather than invent an answer.

Example: Chandler — *"You haven't shown me the room yet. Ask me again once I can see it."*

Add this as a corpus principle before building the chat logic:

```
Principle 25 — A lens voice answers from the text, or declines in character.

When a lens voice is asked a direct question, it must ground its answer in the submitted text. If the question cannot be answered from what is actually on the page — asking about something not written, or asking for a general opinion untethered from the work — the lens must decline in character, consistent with its own voice and sensibility, rather than invent a plausible-sounding answer. A lens voice hallucinating an ungrounded opinion is a worse failure than declining to answer.
```

### Audit first
Read the existing conversation panel component (referenced as "Speak with your editor" — the input styling with `--surface-input` background, amber border, italic placeholder, matched-height send button, and the "Address to" chip row with Editorial + lens targets). Confirm:
1. Where this UI currently lives and whether it's already wired to any backend
2. Whether the "Address to" chip pattern already supports selecting individual lens voices, or whether that needs building
3. How the existing lens system prompts (in `prompts.ts`) are structured, to confirm they can be reused for Q&A rather than full readings

Report findings. Wait for go.

### What to build

**1. UI — reuse existing conversation panel styling exactly**
The input field for Ask the Lens must match the existing "Speak with your editor" input precisely: `background:var(--surface-input)`, `border:1px solid var(--amber-d)`, italic white placeholder, `border-radius:18px`, matched-height send button (`min-height:72px`, `align-self:stretch`). Do not create a new input style — reuse the existing one exactly, per the existing conversation UI already built.

The "Address to" chip row already supports this pattern (Editorial + lens chips + "+ More lenses"). Wire this so selecting a lens chip routes the question to that lens's system prompt rather than the general editorial voice.

**2. Backend — lens Q&A endpoint**
- New or extended API route that accepts: submitted work (already stored), selected lens ID, and the writer's question
- Constructs a prompt combining: the lens's existing system prompt (from `prompts.ts`, server-side only), the submitted text, and the question
- Includes Principle 25's guardrail explicitly in the prompt construction — the lens must be instructed to decline in character if it cannot answer from the text
- Returns the lens's answer, staying in that lens's voice and sensibility (not a generic assistant tone)

**3. IP boundary — critical**
This is a new surface where lens prompt content could leak if built carelessly. Confirm:
- The lens system prompt is only ever used server-side to construct the API call
- The client never receives the lens's system prompt — only the final answer text
- Run the standard bundle IP grep after this is built, extended to check for any lens-specific prompt fragments in `.next/static`

**4. Scope for beta — keep it simple**
- Whole-work Q&A only (the lens answers based on the full submitted work already read) — no selective/passage-scoped Q&A yet, that's part of the dormant long-form spec (`DraftAndLens_LongFormArchitecture_Spec.md`, section 5) and out of scope here
- No conversation history/memory across questions needed for beta — each question can be answered fresh, though showing the prior Q&A in the same session's thread (as the existing UI already does) is fine since that's already built
- This is NOT the full Brain 7 chat panel from the long-form spec — it's a simpler, beta-appropriate version scoped to short-form submissions only, using the existing UI shell

### What not to build
- No passage/chapter-scoped selective reading (dormant, long-form spec territory)
- No new visual design — reuse the existing conversation panel exactly
- No changes to how the main analysis/reading pipeline works — this sits alongside it, not inside it

### Verify
1. `npm run build` — clean
2. Deploy
3. Chrome extension: submit a test piece, select a lens voice via the Address-to chips, ask a question answerable from the text — confirm a grounded, in-character answer
4. Ask a question NOT answerable from the text — confirm an in-character decline, not a hallucinated answer
5. Confirm input styling matches the existing "Speak with your editor" panel exactly
6. Run bundle IP grep — confirm no lens prompt content leaks to `.next/static`
7. Report all six results

One commit for backend, one for UI wiring, one for verification fixes if needed.
