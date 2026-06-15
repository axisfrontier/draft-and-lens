# Draft & Lens — Architectural Evolution
## A Record of Every Structural Decision and Why It Was Made
### May 2026

---

> This document records every significant architectural change made to Draft & Lens across the full build session. It exists because understanding *why* a decision was made is as important as knowing *what* was decided. Every change here was either forced by a failure or derived from research. Neither is decoration.

---

## The Problem This Document Solves

Draft & Lens was built with a fundamental error: it went to implementation before understanding. Code was written, patched, corrected, rebuilt, and patched again — each correction revealing that the previous fix was built on an unexamined assumption. This document is the record of what those assumptions were, when they broke, and what replaced them.

It is organised chronologically — in the order the problems were discovered, not the order they should have been discovered.

---

## Evolution 01 — Single System Prompt → Tradition-Aware System Prompts

**What existed before:**
A single system prompt for each mode (script, story, play) that applied one implicit set of craft principles to all work. The underlying assumption: good writing = concrete, specific, dramatised action. Show don't tell. Earn the epiphany. Trust the image.

**What broke it:**
Avarice — a mythic allegorical screenplay submitted as a test. The analysis applied minimalist realist craft rules to a work operating in the Conrad/Malick tradition. Results included:
- "Screenplay format breaks the mythic contract" — wrong. A screenplay can be mythic allegory. The Tree of Life is a screenplay.
- "The court scene that pronounces judgment is exposition failure" — wrong. In the mythic tradition, the court scene is the primary dramatic instrument.
- "The narrator claims altitude without earning it" — partially right but misdiagnosed. The narrator sometimes restates the image (failure) and sometimes adds what the image cannot carry alone (correct). The analysis did not distinguish between the two.
- "Emine's wisdom is not supported by her background as a tavern keeper" — wrong. This is a class prejudice dressed as a craft note.

**What the research established:**
Six distinct traditions for scripts, six for fiction, five for stage plays. Each has its own craft rules. Applied to the wrong tradition, every craft principle produces wrong notes. A minimalist realist framework applied to mythic allegory is not weaker analysis — it is wrong analysis.

**What was built instead:**
System prompts that require tradition identification before any craft principle is applied. Each tradition is named with examples, its specific craft rules, and critically — what NOT to apply from other traditions. The Avarice failure is now addressed by explicit instruction: "Do NOT apply social realist rules to mythic allegory. A court scene that pronounces judgment is the form's primary instrument, not an exposition failure."

**The critical protection clause (embedded in all script and story prompts):**
```
TRADITION 2 — MYTHIC / ALLEGORICAL
CRITICAL: Do NOT apply social realist rules to mythic allegory.
A court scene that pronounces judgment is not exposition failure —
it is the genre's primary instrument.
A narrator who speaks of centuries is not telling when it should show —
it is the form speaking.
The question is whether these choices are executed with
discipline and earned weight.
```

---

## Evolution 02 — One-Pass Analysis → Two-Pass (Diagnostic + Informed Analysis)

**What existed before:**
A single API call that simultaneously: identified the tradition, applied craft principles, produced structured sections, evaluated character consistency, and maintained consistent voice. All in one pass.

**What broke it:**
The recognition that these are competing demands. Under the weight of a 5,000-word submission, tradition identification — the most critical step — failed first. The AI defaulted to pattern-matched craft rules regardless of what was submitted.

**The root cause:**
A single-pass API call cannot reliably replicate sustained editorial reasoning. An editor reads a text first, forms a view of what it is, and only then applies craft principles. The single-pass approach collapsed these stages into simultaneous execution, which produced the Avarice problem and would produce the same class of error on any work operating outside the dominant realist tradition.

**What was built instead:**
A two-pass architecture:

**Pass 1 — Diagnostician** (Brain 1)
Fast, cheap, structured output only. Reads opening + closing ~3,000 characters. Returns JSON:
```json
{
  "tradition": "mythic allegory in the Melville/Conrad tradition",
  "register": "mythic",
  "ambition": "what this work is trying to achieve",
  "formNotes": "what the writer is doing formally",
  "craftQuestions": ["the 2-3 most important craft questions"],
  "strengths": ["genuine strengths quoted from the text"],
  "primaryConcern": "the single most important problem",
  "title": "Avarice",
  "summary": "one specific sentence"
}
```
Cost: ~$0.002. Time: ~2 seconds.

**Pass 2 — Analyst** (Brain 2)
Full text + diagnostic locked in as established fact. Receives this at the top of the system prompt:
```
ESTABLISHED DIAGNOSTIC — READ BEFORE EVALUATING
This is confirmed fact. Do not re-identify. Do not override.
TRADITION: [from Brain 1]
...
```

The analyst cannot re-identify the tradition because it is given. It cannot apply realist principles to Avarice because the diagnostic has already confirmed it is mythic allegory and the system prompt instructs it to apply only mythic/allegorical craft principles.

**Why this matters:**
The quality difference between a one-pass and two-pass analysis is not marginal — it is categorical. The one-pass model guesses the tradition under pressure and defaults to what it knows. The two-pass model receives the tradition as confirmed fact and applies its intelligence to evaluation rather than identification.

---

## Evolution 03 — Generic Lens Voices → Tradition-Aware Lens Voices

**What existed before:**
Each lens voice received the full text and a one-line craft descriptor. It was instructed to identify the tradition and apply its specific principles to what it found.

**What broke it:**
The lens voices had the same single-pass problem as the main analysis. They were asked to identify the tradition and apply their craft intelligence simultaneously. Villeneuve reading an unidentified submission would default to his known strengths regardless of what tradition the work was operating in.

**What was built instead:**
Each lens voice receives:
1. Its specific craft philosophy (a full paragraph, not a one-line descriptor)
2. The confirmed diagnostic from Pass 1 as established fact
3. The full submitted text

The lens is not asked to identify the tradition. It receives it as given. Villeneuve reading a confirmed mythic allegory applies his craft intelligence to that tradition — not to what he would have written. His note on the underwater sequences is grounded in the established register, not guessed.

**The `craftPhilosophy` field:**
Previously all 22 lens voices had a `descriptor` (one line). Now each has a `craftPhilosophy` field — a full paragraph of their actual craft principles derived from research into their interviews, essays, and documented working practice. Hemingway's craft philosophy draws from the iceberg theory and his Paris Review interview. Chekhov's draws from his letters to writers. Pinter's draws from his Nobel lecture and published essays. Villeneuve's from his production notes and documented working method.

---

## Evolution 04 — Mentor Standard Added to All Notes

**What existed before:**
Notes identified problems. Many left the writer knowing what was wrong but not what to do about it.

**What the research established (from Maxwell Perkins, Royal Court dramaturgical practice, professional coverage standards):**
A note without a direction is half a note. The most useful thing a mentor does is not identify the problem — it is show what the work might reach toward. Not a rewrite. A sight line. The writer finds their own version.

**What was built:**
A mandatory three-part structure for every note:
1. THE SPECIFIC PROBLEM — quote the exact moment
2. WHY IT MATTERS — the craft principle in plain language
3. WHAT BETTER LOOKS LIKE — a published example from the relevant tradition, or an illustrative sketch labelled "As an illustration:"

A note without the third element is incomplete. The prompts now say explicitly: "If you cannot show what better looks like, do not give the note."

**The example of a complete note (embedded in all system prompts):**
```
"The 1785 montage — 'Jack (19) talking to prostitutes in bars,
stealing, fighting with roughnecks, sailors, pubgoers, and the law'
— catalogues behaviour rather than accumulating moral weight.
In the mythic tradition, each image should earn its place by
carrying what the next cannot.
As an illustration: rather than listing behaviours, find the
single image that contains all of them — the moment Jack looks
at another man's wound and feels nothing. That image does the
work the whole list attempts. Kubrick cuts from a bone thrown
skyward to a spacecraft — four million years in a single edit.
The montage in a mythic screenplay should have that discipline:
fewer images, each one load-bearing."
```

That note is: quote + craft principle + published example + illustrative direction. Every note should be this complete.

---

## Evolution 05 — "Where to Begin" Section Added

**What existed before:**
The analysis ended with craft directives — 10-15 numbered actionable instructions, prioritised by impact.

**What the research established:**
Craft directives are useful but they require the writer to still rank them themselves. Professional editorial letters end with the most important thing. The dramaturgical standard (Royal Court, National Theatre): identify 2-3 overarching ideas for the writer to think about. The writer should leave the analysis knowing exactly what the two or three things are that matter most.

**What was built:**
A "WHERE TO BEGIN" section at the end of every analysis and every lens voice response. Three things, ranked. The single most important structural priority first. Plain language — no craft jargon. Ends with what the writer must protect: the genuine strength that the next draft must not lose.

---

## Evolution 06 — Static Lens Analysis → Brain 6 with Full Context

**What existed before:**
Each lens call sent the full text and asked the lens to analyse it. No diagnostic context. No tradition confirmation.

**What was built:**
Brain 6 — each of the 22 lens voices now receives:
- Their craft philosophy as the primary system instruction
- The confirmed diagnostic (tradition, register, ambition) as locked context
- The full submitted text up to the tier word limit

The lens call is now: "You are reading a confirmed mythic allegory. Apply your craft intelligence to this tradition." Not: "Read this and tell me what you think."

**No compression, ever:**
The lens receives the full text. No summaries, no compression. A compressed lens analysis is not a lens analysis — it is a guess dressed as craft insight.

---

## Evolution 07 — No Conversation → Brain 7 (Editorial Dialogue)

**What existed before:**
A static analysis report. The writer read it. No follow-up was possible.

**What the research established (from competitor analysis):**
Greenlight Coverage's most-praised feature is the follow-up Q&A. Writers want to interrogate feedback, not just receive it. They want to push back, ask for elaboration, address specific lens voices. This is closer to what a real editorial relationship feels like — not a report, a conversation.

**What was built:**
Brain 7 — the conversation brain. It holds:
- The full analysis text (up to 4,000 chars for context)
- The confirmed diagnostic JSON
- The full conversation history
- The submitted text excerpt

When a writer pushes back ("that note about Emine was wrong — she's observed humanity for years"), Brain 7 has the full context to examine whether they are right and say so plainly. It does not re-analyse from scratch. It engages with what the analysis said and what the writer knows about their own work.

**The Brain 7 principle:**
If a note was wrong, it says so plainly. "You're right. That note was wrong." This is not a failure — it is the conversation doing its job. The analysis is the starting point. The conversation is where understanding deepens.

---

## Evolution 08 — No Revision Tracking → Revision Notes System

**What existed before:**
Analysis was consumed and lost. Writers had no way to track what they had decided to act on.

**What was built:**
A revision notes system, generated from the conversation or added manually. Each note has:
- The specific change needed (plain language, referenced to the text)
- Where it came from (Editorial Dialogue / specific Lens voice / Manual)
- Status: To Do / In Progress / Done

Completed items remain visible as record — faded, struck through, but not deleted. The revision list is the writer's working document for the next draft. On the next submission, it can be passed as context to Brain 1 — the diagnostician can see what was changed and adjust accordingly.

---

## Evolution 09 — Generic Craft Principles → Research-Grounded Craft Principles

**What existed before:**
Craft principles stated as abstract rules. "The narrator must earn its altitude." "Every note must be actionable."

**What the research established:**
Research was conducted across 45 areas covering: professional editorial practice (Maxwell Perkins, Gordon Lish, Royal Court dramaturgy), the specific craft principles of each tradition with worked examples, lens voice accuracy (Chekhov's actual letters, Hemingway's documented principles, Villeneuve's production notes), and what users actually value in script analysis tools.

Key findings embedded in the prompts:
- **Malick and Apocalypse Now on mythic V.O.**: Willard's narration was written by journalist Michael Herr *after* filming because without it the journey had no structural legibility. Narrator in mythic screenplay is structural, not decorative.
- **García Márquez on fabular register**: The technique works because "fantastical events are treated as natural occurrences" — the writer establishes a contract and never breaks it.
- **Melville on allegorical human specificity**: Ahab is a symbol AND a specific man with a specific wound. The allegorical dimension is felt because the human dimension is real first.
- **Lish on minimalism**: "Limiting explanation in order to reveal mystery." This applies to minimalist realism. It does not apply to mythic allegory.
- **Maxwell Perkins on mentorship**: Genuine appreciation first, then specific and actionable. Holding both simultaneously.
- **Royal Court practice**: "Do not overwhelm writers with notes; place the writer at the centre; support them in producing their best work."
- **Chekhov's six rules (from his 1886 letter)**: Absence of lengthy verbiage, total objectivity, truthful description, extreme brevity, audacity, compassion.

---

## Evolution 10 — Basic Prompts → Accessible Language Requirement

**What was added:**
Every system prompt now contains an explicit instruction: when using any craft term (subtext, inciting incident, register, throughline, fabular, allegory), explain it in plain English immediately after. Never assume knowledge of industry terminology.

This tool is used by writers at all levels. The analysis must be accessible without being condescending.

---

## Evolution 11 — Existing Architecture Document → Architecture v3.0

The architecture document was rebuilt three times:
- v1.0: Basic structure, no tradition awareness, no multi-brain architecture
- v2.0: Five-layer architecture with proper folder structure and security checklist
- v3.0: Seven-brain architecture with full tradition framework, conversation brain, revision notes system, database schema for conversations and revisions, and the critical test that matters most

The v3.0 document is law. Every law in it exists because the project failed without it.

---

## The Architectural Principle This History Demonstrates

Every significant failure in this project came from the same source: implementing before understanding. The single-pass analysis was built before anyone understood what tradition-aware feedback required. The lens voices were built before anyone had researched what the lens voices actually believed. The system prompts were written before anyone had read Chekhov's letters, the Royal Court's dramaturgical practice, or Maxwell Perkins on mentorship.

The multi-brain architecture is not technically complex. It is simple. What made it necessary was understanding the problem first: the human reader forms a view before they write a note. The AI was being asked to form the view and write the notes simultaneously. Separating these stages — Diagnostician first, Analyst second — required no new technology. It required understanding what the problem actually was.

This is the principle the architecture now embodies: understand before building. The Thinking Discipline document describes it as a philosophy. This architectural history demonstrates what happens when it is not applied, and what becomes possible when it is.

---

*Document version 1.0 — May 2026*
*Draft & Lens*
*This document should be read before any future architectural decision is made.*


---

## Evolution 12 — Missing Brain Identified: Brain 1c (Fact Verification)

The Emine error — noting that a character had no desires when the script explicitly established she wanted to live with Jack and run the pub — revealed a structural gap in the brain architecture.

Brain 1b maps the structure and collects evidence. But it does not specifically verify factual claims about characters before Brain 2 makes notes about their absence or presence. The fact-checking step is missing.

Brain 1c would be a fast, targeted pass: given the structural map and the full text, verify specific claims before Brain 2 makes them. Does Emine have stated desires? Check. Is the backstory provided through a flashback structure? Check.

**What it prevents:** Notes that claim something is absent when it is present. Notes that misread the structure because they did not verify what was there.

**Status:** Not yet built. Cost: lightweight (Sonnet 4.6, small JSON output). Priority: high, because the class of error it prevents — factual inaccuracy about the submitted text — is the most damaging to writer trust.

---

## Evolution 13 — Lens Voice Authenticity

The lens voices were initially written as descriptions of each person's craft philosophy. This produced generic analysis regardless of the philosophy content, because the structural frame of the prompt dominated the voice.

The fix: the lens system prompt now instructs the model to inhabit the voice, not apply it. "You ARE Hemingway — not an editorial assistant applying Hemingway's principles. Speak in your own voice."

All 21 lens voices were then rewritten from primary sources:
- Hemingway: his Paris Review interview and documented working method
- Chekhov: his actual letters to writers, 1886
- O'Connor: Mystery and Manners
- Bukowski: documented interviews and essays
- Puzo: The Godfather Notebooks
- Villeneuve, Coens, Spielberg, Coppola: production interviews and documented craft statements
- Welles: interviews with Bogdanovich
- Wachowskis: philosophy statements on The Matrix and Cloud Atlas
- Eric Roth, Sorkin, Tarantino, Jeunet, Scott, Wenders: documented interviews

Each voice is written as that person would actually speak, not as a description of what they believed.

**The lesson:** Voice authenticity cannot be achieved by accurate description. It requires inhabiting the register.
