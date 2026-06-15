# Draft & Lens — A Case Study in Building AI Editorial Intelligence
## The effort, the errors, the learning, and what it produced

---

## The Numbers

This project ran across two sessions spanning four days in May 2026.

**Session 1:** 15 May 2026, 11:23 → 16 May 2026, 00:19
13 hours over one day and into the early hours of the next.

**Session 2:** 19 May 2026
Approximately 8 hours of continued development, correction, and deepening.

**Combined effort: approximately 21 hours of active development.**

---

### What happened in those 21 hours

**From Session 1 transcript (verified):**
- 147 tool calls (code executions, file operations, web searches)
- 50 Python/bash command executions
- 54 file read/write operations
- 4 web research sessions
- 353 text exchanges
- 266 timestamped events
- 3 major documents produced (Architecture v2, Competitor Analysis, Thinking Discipline)
- 1 HTML file built from nothing to a functioning 276KB prototype

**From Session 2 (this conversation):**
- The HTML file grew from 276KB to 343KB through iterative correction
- Approximately 80 further exchanges
- 45+ specific feedback corrections applied
- The architecture evolved from single-pass to 3-pass multi-brain
- 5 documents updated or created (Architecture v3, Competitor Analysis v2, Architectural Evolution, Learned Corpus, Case Study)
- The model string was updated (deprecated → claude-sonnet-4-6 / claude-opus-4-6)

**Research conducted across both sessions:**
- Professional screenplay coverage standards (BBC, BFI, Film4)
- Literary editorial practice (manuscript notes, publisher feedback)
- Royal Court and National Theatre dramaturgical methods
- Maxwell Perkins editorial method (Fitzgerald, Hemingway, Wolfe)
- Gordon Lish editorial method (Carver, Hannah)
- Terrence Malick on narrator and visual writing
- Apocalypse Now production history (Michael Herr's voiceover)
- García Márquez on fabular technique
- Melville on allegorical characterisation
- Chekhov's letters to writers (1886)
- Competitor analysis: Callaia, Greenlight Coverage, ScriptReader.ai, ScreenplayIQ, Prescene, Script Reader Pro, Marlowe, Type.ai
- Claude model comparison (Sonnet 4.6 vs Opus 4.6 capabilities and pricing)
- Anthropic's research on training aligned behaviour

---

## What Was Learned — In Detail

### 1. The foundational error in building AI tools

The most important lesson: **understanding must precede building**. Not preparation for building — the actual work. A prompt is a delivery mechanism for understanding. It cannot create understanding that does not exist.

Every significant failure in this project came from skipping the understanding step. The single-pass analysis produced wrong notes about Avarice because no one had researched what the mythic allegorical tradition actually requires before writing the prompts. The tool built on wrong foundations produced wrong output, which was corrected, which revealed deeper wrong foundations, which were corrected — a cycle of remediation dressed as progress.

The correct sequence: understand the domain completely → define what good looks like → then build. The project followed the reverse sequence for its first 6 hours.

### 2. Tradition-aware craft analysis

Perhaps the most technically significant learning: **every tradition has its own primary dramatic instruments, and applying the wrong tradition's rules produces wrong notes regardless of how well those rules are encoded**.

The tool initially applied a single implicit tradition — minimalist social realism — to all work. This produced:
- Screenplay format criticised as "prose failure" (wrong: scene headings are professional conventions)
- Court scenes in moral allegory flagged as "exposition failure" (wrong: they are the tradition's primary dramatic instrument)
- Elevated narrator commentary flagged as "telling not showing" (wrong: this is how mythic allegory works)
- Atmospheric description flagged as "announced allegory" (wrong: this is world-establishment)

The fix required learning six distinct traditions for scripts, six for fiction, five for stage plays — each with their own craft standards — and embedding the differences architecturally, not just instructionally.

### 3. The distinction between narrator elevation and restatement

A nuance that took multiple correction cycles to land precisely:

**Restating** (failure): The narrator explains what the work has already made clear. Announces what the reader/audience has already felt.

**Elevating** (correct): The narrator adds a dimension the work cannot reach without it. "Not death, but withdrawal. The sea had called her children home" — this is not the narrator summarising the empty trawlers. It adds volition, tenderness, and moral weight that the visual alone cannot carry.

**World-establishment** (neutral, never flag): Atmospheric description creating the tonal register. "Slow-moving obsidian waves, the size of mountains." This is not allegory-announcement. It is the work establishing its contract with the reader.

This distinction matters for all narrative forms — scripts, fiction, plays — anywhere a narrator or elevated prose voice operates alongside visual or performed action.

### 4. The architecture of editorial reasoning

The key architectural insight came late: a human editor doesn't read once and write notes. They read multiple times, each pass doing different cognitive work.

**Pass 1:** What is this? What tradition? What ambition?
**Pass 2:** What is actually here? Evidence. Specific moments. Structure.
**Pass 3:** Given what it is and what it contains — what is working and what isn't?

Collapsing these into one call means the model is identifying the tradition and evaluating craft simultaneously. Under that pressure, tradition identification fails first. The result: pattern-matched output applying familiar rules before the work has been understood.

The multi-brain architecture separates these passes. Brain 1 identifies. Brain 1b maps and collects evidence. Brain 2 evaluates and never has to identify — it arrives knowing what it is reading. This is architecturally closer to how editorial judgment actually works.

### 5. Juxtaposition — the right craft question

Repeated corrections across multiple exchanges established this: **the existence of a juxtaposition is not the craft problem. The specificity of the weaker side is**.

The news montage in Avarice was flagged repeatedly as a register failure. The writer correctly identified it as intentional structural argument — the contemporary world living the consequences of Jack's ancient greed, without knowing Jack exists. The critique was not wrong to note tension. But the correct question was never "should this exist?" It was: "are these contemporary voices specific enough to earn their place beside the mythic material?" Borrowed phrases ("We grew fat on greed," "amusing ourselves to death") lack the earned weight of the surrounding sequences. That is the note.

This applies to all juxtaposition in all forms: tonal, temporal, modal. The question is always specificity, not existence.

### 6. What character notes require

A character note claiming absence ("she has no desires of her own") is wrong if the text establishes the thing claimed absent. This seems obvious in retrospect. In practice, the tool was generating notes about missing character development without verifying what was actually in the text.

The rule learned: **verify what is there before noting what is absent**. This applies to character desires, structural elements, backstory, thematic development — any claim of absence requires textual verification first.

### 7. Authentic lens voices require authentic research

The difference between a lens voice written as description ("Hemingway valued restraint") and one written as authentic craft thinking ("The test of a sentence is whether it still works when you've taken out everything you can take out") is the difference between knowing about someone and understanding them well enough to think as they think.

The former produces derivative summary. The latter produces voice. And voice is what makes a lens genuinely useful — the writer reading Bukowski's response to their work should feel they are encountering a distinct intelligence, not a rephrased version of the generic analysis.

Achieving this requires research into primary sources: interviews, letters, essays, documented working practice. Not summaries of their reputation.

### 8. The correction loop is irreplaceable

The most valuable input to this development was not any of the research. It was a writer with genuine craft knowledge who pushed back precisely when the feedback was wrong, and explained why.

Each correction revealed a systemic assumption rather than a localised error. The court scene note revealed that the tool didn't understand what tradition it was reading. The Emine note revealed the tool was claiming absence without verification. The montage correction established the juxtaposition principle. The narrator correction established the elevation/restatement/world-establishment distinction.

No amount of prompt engineering produces these insights. They require a person who knows what good looks like and is willing to say when the tool is producing something else.

### 9. Prompts are delivery mechanisms, not sources of understanding

The insight that connects all the others: **you cannot write a good prompt for a domain you don't understand deeply**. A prompt that says "identify the tradition before applying craft rules" produces nothing useful if the author of the prompt doesn't know what the traditions are and what each one requires.

The research is not preparation for the prompt. The research is the work. The prompt delivers the understanding. Where the understanding is absent or shallow, the prompt delivers nothing.

### 10. The genuine limits of what AI tools can achieve

After all the research, architecture, and correction — there remains a gap that cannot be closed by prompting.

The tool holds the conclusions of corrections that were made. It cannot generate new ones from submissions it has not encountered. When it meets a tradition not in its calibration, it will fall back on what it knows. The correction loop — being wrong, being shown why, and having to revise the understanding — produces something that static prompts cannot: judgment calibrated by consequence.

The tool's value is as a rigorous, tradition-aware first pass. It will not catch everything. It will not always know when it is wrong. It should not claim otherwise.

---

## The Cumulative Change: From First Version to Current

**Architecture:**
- v0: Single-pass analysis (one API call for everything)
- v1: Two-pass (diagnostic + analysis)
- v2: Three-pass (tradition + structure + evidence → evaluation)
- v3: 8-brain architecture (tradition, structure+evidence, analysis, scores, studios, bible, lenses, conversation)

**System prompts:**
- v0: One generic prompt per mode, no tradition awareness
- v1: Tradition identification added as instruction
- v2: Six traditions per mode with named craft standards
- v3: Inviolable rules, learned corpus, worked examples, tone principles

**Lens voices:**
- v0: One-line descriptor per lens
- v1: craftPhilosophy paragraph added
- v2: Tradition awareness added (each lens confirms tradition before applying philosophy)
- v3: Three key lenses (Bukowski, Hemingway, Pinter) rewritten with authentic voice from primary research. Remaining 19 require the same treatment.

**Documents produced:**
1. Architecture v3.0 (build standard and law)
2. Competitor Analysis (market positioning and feature decisions)
3. Architectural Evolution (record of every decision and why)
4. Thinking Discipline (the philosophy of correct problem-solving)
5. Learned Corpus v2 (8 generalised editorial principles from session work)
6. This Case Study

---

## On Brain Count: How Many Are Actually Needed?

The current structure has 8 brains (Brains 1, 1b, 2, 3, 4, 5, 6, 7). The question of whether this is right requires a first principles analysis.

### The methodology for determining brain count

**Step 1: List every distinct cognitive task the tool must perform**

| Task | What it requires | What it must not do simultaneously |
|---|---|---|
| Tradition identification | Fast, focused, confirmed output | Must not evaluate — only identify |
| Structure mapping | Full text, confirmed tradition | Must not evaluate — only map |
| Evidence collection | Full text, confirmed tradition and structure | Must not evaluate — only find |
| Full analysis | Evidence + tradition + structure + craft knowledge | Must not identify — only evaluate |
| Scoring | Quantitative assessment of 6 dimensions | Must not produce prose analysis |
| Market matching | Title, tradition, genre | Must not know the text content |
| Bible generation | Full text, character extraction | Must not evaluate quality |
| Lens voice analysis | Full text, confirmed tradition, specific craft philosophy | Must not identify tradition |
| Conversation | Full analysis context + history | Must not re-read the text |

**Step 2: Which tasks compete if combined?**

Identification and evaluation compete fatally — this is the core failure the multi-brain architecture was built to solve. Structure mapping and evaluation compete because a model mapping what is there tends to also evaluate it. Evidence collection and analysis compete because finding evidence and judging it are different cognitive modes.

**Step 3: Which can be combined without competing?**

Brain 3 (scores) and Brain 4 (studios) are both lightweight JSON calls that run in parallel and don't compete. They could be one call. The cost: one larger JSON response to parse. The benefit: one fewer API call.

Brain 1b currently combines structure mapping and evidence collection. These compete slightly — a model mapping structure tends to note whether it is good or bad. The benefit of combining them is speed. The cost is that evidence quality is sometimes lower than a dedicated evidence collector would produce.

**Step 4: What is missing?**

**A fact-verification pass** is absent. The current architecture has no brain whose sole job is to verify factual claims about the text before Brain 2 makes notes. The Emine error (claiming she had no desires when the text established she did) is exactly the kind of error a verification pass would catch. This would be Brain 1c: given the structural map and evidence, verify all character descriptions, desires, and structural claims against the actual text before Brain 2 writes a single note.

**A comparison brain** for revision analysis is absent. When a writer submits a second draft alongside the first, there is no brain whose job is to compare them — what changed, what improved, what was lost. For a production tool, this is a genuinely useful capability.

**Step 5: The optimal brain structure**

For the current MVP prototype:

| Brain | Task | Model | Status |
|---|---|---|---|
| Brain 1 | Tradition identification | Sonnet 4.6 | ✓ Built |
| Brain 1b | Structure + evidence (combined) | Sonnet 4.6 | ✓ Built |
| Brain 2 | Full evaluation | Opus 4.6 | ✓ Built |
| Brain 3 | Scores | Sonnet 4.6 | ✓ Built |
| Brain 4 | Studio matching | Sonnet 4.6 | ✓ Built |
| Brain 5 | Bible generation | Sonnet 4.6 | ✓ Built |
| Brain 6 | Lens voices (×22) | Sonnet 4.6 | ✓ Built |
| Brain 7 | Conversation | Sonnet 4.6 | ✓ Built |
| Brain 1c | Fact verification | Sonnet 4.6 | ✗ Missing |
| Brain 8 | Revision comparison | Sonnet 4.6 | ✗ Missing (future) |

**The honest assessment:** 8 brains is close to right for the current MVP. The missing brain is Brain 1c — fact verification. Its absence is what allowed the Emine error and will allow similar errors on other submissions. It is cheap to add (lightweight JSON, targeted questions against the text) and prevents a class of errors that damages writer trust.

Brains 3 and 4 could be merged into one parallel JSON call without quality loss, reducing the call count by one. The saving is marginal but clean.

For the production build, Brain 8 (revision comparison) adds genuine value for returning users and should be planned from the start.

---

## Conclusion

21 hours. 226 tool calls. 353 exchanges. 8 research areas. 4 architecture versions. 10 distinct learning principles. 6 documents. 343KB of working prototype.

The effort is documented here not as a measure of how hard it was, but as evidence of how much is required to do this properly. An AI tool that aims for genuine editorial intelligence — that understands traditions, applies appropriate craft standards, gives honest and specific notes, and shows what better looks like — is not built in an afternoon. It requires domain research, iterative correction by genuine experts, architectural thinking grounded in how the cognitive task actually works, and the discipline to understand before building.

What makes this exercise genuinely instructive as a case study is not the tool that was built. It is the demonstration — across a visible, documented record — of what happens when the understanding step is skipped, and what becomes possible when it is not.

---

*Two sessions across four days, May 2026. Draft & Lens development.*


---

## Addendum — Session 2 Continued (19 May 2026)

### Additional exchanges and time

Session 2 ran longer than initially documented. The full session covered approximately 80 exchanges over 10 hours. The combined total for both sessions is approximately 23 hours of active development.

Key areas covered in the later part of Session 2:

**Multi-brain architecture finalised:** Brain 1b and 1c merged into a single combined pass (structure + evidence together), then re-separated as the quality difference between them became apparent. The final architecture: Brain 1 (tradition), Brain 1b (combined structure and evidence), Brain 2 (evaluation only, Opus 4.6), Brains 3-5 parallel lightweight calls, Brain 6 (all 22 lenses), Brain 7 (conversation). The missing Brain 1c (fact verification) was identified as the gap that allowed the Emine error — checking what is in the text before claiming it is absent.

**Lens voice authenticity:** All 22 lens voices were rewritten from authenticated sources. The previous versions were either generic ("Bukowski valued rawness") or in some cases written with the wrong person's philosophy (Hemingway's text appeared in Bukowski's entry and vice versa). The corrected versions draw from documented interviews, essays, letters, and known working practice. Welles from his interviews with Bogdanovich. Chekhov from his actual letters to writers. O'Connor from her essays in Mystery and Manners. Puzo from The Godfather Notebooks. Each voice is written as that person would speak, not as a description of them.

**The montage/juxtaposition correction, repeated:** The same error — flagging the contemporary news montage in Avarice as a register failure — appeared in the Spielberg lens, the Bukowski lens, and the generic analysis across multiple sessions. The root cause: the inviolable rules and learned corpus were embedded in Brain 2 but the lens system prompt had a competing instruction structure that overrode them. Fixed by embedding the inviolable rules directly at the top of the lens system prompt before the craftPhilosophy is read.

---

### How errors were occurring and the methodology for preventing them

The most important observation from Session 2 was about how errors in the code were being created and detected.

**The pattern of failure:**

Every significant coding error in this session followed the same sequence:
1. A change was needed
2. A replacement script was written based on what the string *should* look like
3. The script ran but the string didn't match exactly (different escaping, slightly different phrasing)
4. The replacement silently failed or partially applied
5. A verification check revealed "False"
6. A second script was written to fix the first script's failure
7. Which sometimes introduced new errors

This is the equivalent of the original project failing — building on assumptions rather than confirming the foundation first.

**The correct approach, established by the end of Session 2:**

**Read before writing.** Every change begins with reading the exact string to be replaced, confirming it exists, and copying it verbatim. Not writing what it should contain — reading what it actually contains.

**Verify after writing.** Not just syntax. Confirm the specific content change occurred: "does the string I intended to insert now appear in the file?" If no — stop, diagnose, do not write another script over the broken state.

**One sweep.** All related changes in a single Python pass. Not multiple scripts applied sequentially, each potentially failing silently and leaving the file in an inconsistent state.

**Trace to root cause.** When something is wrong, ask: what assumption led to this? Not just what string failed, but what was not understood that produced the wrong string. The Bukowski/Hemingway swap happened because the replacement was written without verifying what Bukowski's current craftPhilosophy actually said.

**The proactive check that should run after any significant change:**

```python
# After any content change, verify:
checks = [
    ('specific string from new content', 'description of what it verifies'),
    # ...
]
for term, desc in checks:
    status = '✓' if term in html else '✗ MISSING'
    print(f"{status} {desc}")
```

This is not a test suite. It is a habit: confirm that what you intended to add is actually there before closing the file.

**What this means for the production build:**

The production Next.js build should have unit tests for prompt content. Not just that the prompt file exists, but that the specific craft principles are present: "INVIOLABLE RULES FOR THIS LENS" in the lens system prompt. "TRADITION FIRST" in the Brain 1 system. "Bukowski" craftPhilosophy contains the word "fish" (or something equally specific). These tests run on every commit and catch the kind of silent replacement failures that cost multiple correction sweeps in the prototype.

---

### What else needed updating

After the Session 2 work, the following were updated or required updating:

**Architecture v3.0** — The brain count analysis was added. Brain 1c (fact verification) identified as missing. The lens voice section updated to reflect that 22 voices require primary source research, not descriptor paragraphs.

**Learned Corpus v2** — Generalised from Avarice-specific to apply across all forms and traditions. Eight principles, each with worked illustrations rather than Avarice-specific rules.

**Architectural Evolution** — Should document the lens voice discovery: that craftPhilosophy paragraphs written as descriptions produce generic analysis regardless of what they say, because the structural frame of the prompt dominates. The fix: instructing the model to inhabit the voice, not apply it.

**Case Study** — This document (see addendum).

**The HTML prototype** — 344KB at close of session. Fully functional with all 22 authentic lens voices, 3-pass multi-brain architecture, conversation panel with Brain 7, revision notes, where-to-begin rendering fixed, footer padding, conversation panel with prominent serif header, learned corpus and inviolable rules embedded in both Brain 2 and Brain 6.

---

### The single most important thing learned in Session 2

That the quality of a correction depends entirely on understanding what was wrong before writing the fix.

Every time a coding correction was written from assumption rather than confirmed understanding, it failed or partially applied. Every time a craft correction was written from research rather than pattern-matching, it held. The principle is identical whether the domain is JavaScript string replacement or editorial craft philosophy: understand before acting. Read before writing. Confirm before replacing.

This is the same principle the entire project was built to demonstrate. It applies at every level of the work.

---

*Case study complete. Two sessions. Approximately 23 hours. 22 lens voices. 8 brains. One principle that kept proving itself true.*



---

## Final Addendum — Completeness Review

### Sections added to the tool

**About, Glossary, Feedback, Contact, Disclaimer** were identified as missing from the MVP and added. Each is necessary:

The **Glossary** was on the original research agenda (areas 36-38) and never built until now. Every craft term used in an analysis — tradition, register, narrator altitude, elevation, restatement, juxtaposition — is now defined in plain English accessible to writers at all levels.

The **Disclaimer** is specifically required for the lens voices, which use real people's names. The legal requirement: AI-generated analytical perspectives inspired by documented craft philosophies. Not affiliated with, endorsed by, or representative of those individuals or their estates.

The **Feedback** section formalises the correction loop that was the most valuable input to this development. Without a feedback channel, errors accumulate silently.

### Lens categories corrected

The fiction writers (Hemingway, Carver, Chekhov, O'Connor, Bukowski, Nabokov) were incorrectly placed inside the Directors section. They now have their own Writers section. Puzo — primarily a novelist, secondarily a screenwriter — was moved from Screenwriters to Writers.

Final lens categories: Directors (10), Writers (7), Screenwriters (3), Producers (2). 22 total.
