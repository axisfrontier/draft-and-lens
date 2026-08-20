# Draft & Lens — Depth, Scenarios Page & Contextual Nudges (Spec)

**Status: design, not built. Written 2026-08-21. Opus/High session.**

---

## Part 1 — Two analytical depth gaps

### Gap 1: Tradition identification doesn't distinguish aspiration from achievement

**The problem**
D&L correctly identifies a writer's tradition and applies tradition-specific craft rules. What it doesn't do is distinguish between a writer *working within* a tradition and a writer *failing to reach the standard they're aiming for*. A real editor makes this distinction immediately — the diagnosis is completely different in each case.

A writer in the Carver tradition whose prose is genuinely spare and controlled gets one reading. A writer *attempting* the Carver tradition whose prose collapses into thinness rather than compression gets a different reading. Currently D&L treats both the same way — it identifies the tradition and critiques accordingly, but doesn't name the gap between ambition and execution.

**What best-in-class looks like**
The editor says: "You're working in the Carver tradition, and the compression is real in places — but this passage isn't spare, it's thin. Spare prose has load-bearing weight in every word. This one doesn't." That's a different, more useful note than "the prose is economical."

**What needs building**
An additional analytical pass — or an extension to Brain 2 — that:
1. Identifies not just the tradition but the writer's apparent *ambition level* within it (are they reaching for the tradition's ceiling, or using its surface features?)
2. Diagnoses the gap between ambition and execution explicitly, in tradition-specific terms
3. Distinguishes between primary instruments of the tradition (not failures) and genuine shortfalls against the tradition's own standards

This must key on the LearnedCorpus's existing tradition-specific craft rules, not generic quality judgements. The diagnosis must be in the tradition's own terms.

---

### Gap 2: Cross-submission pattern recognition

**The problem**
Mentor Part B adds revision memory — D&L can compare a revision against a prior reading of the same work. What it can't do is recognise recurring tendencies *across works and submissions*. A real mentor builds a picture of a writer's habitual moves, not just their progress on one piece.

The most valuable thing a mentor says is: "This is the third time you've reached for abstraction at the moment the prose needs to be most concrete." D&L cannot say that yet.

**What best-in-class looks like**
After several submissions from the same writer, patterns emerge: they consistently over-explain emotional states, or their openings are strong and their endings diffuse, or they reach for imagery when the scene needs action. A mentor who knows this can name it. D&L currently resets on every new work.

**What needs building**
A cross-submission pattern store — per writer, not per work:
1. After each reading, extract recurring tendencies (Brain 2 already identifies these within a piece — they need capturing to a per-writer store, not just appearing in the report)
2. After 3+ submissions, surface named patterns in the Mentor section: "I've noticed across your work that..."
3. Gate strictly: patterns only named when evidence exists across multiple works, never inferred from one submission
4. Writer can see and dismiss patterns they disagree with (same dismissal logic as continuity flags)
5. Must work on the work's own terms per LearnedCorpus rules — never generic creative writing advice

**Storage shape**
A `writer_patterns` table, per user_id, with pattern text, evidence (reading_ids it was extracted from), first_seen, confirmed_count. Supabase migration required — same process as continuity_flags and user_milestones.

---

## Part 2 — Scenarios page ("How I read")

**Purpose**
D&L's depth is non-obvious on first use. A writer submitting their first piece sees a reading — they don't see the continuity ledger, the tradition pipeline, the mentor memory, or the cross-submission pattern recognition. The gap between what they experience and what the product is capable of is a retention and trust problem.

This page closes that gap with concrete scenarios, written in the editor's voice, that show not tell.

**Page location and behaviour**
- Sits alongside About and Glossary in the navigation
- When closed, returns to the reading the writer came from (not the homepage)
- Written in the editor's first person throughout — not product marketing copy, not feature lists
- No competitor names. The contrast with "other AI writing tools" is implicit in the specificity of what's described.
- Page title: "How I read"

**Page structure**

### Opening — what kind of thing I am
Two short paragraphs in the register of:

"I read the way an editor reads — against a tradition, not against a rubric. I'm not looking for errors. I'm looking for where the writing is doing something and where it isn't, and why."

"What I can do depends on what you send me and how often you come back. A first reading is one thing. Ten readings of the same work in revision is something else."

### Scenarios — concrete, specific, varied

Each scenario is a short paragraph, written as the editor describing what happens. Not "Draft & Lens will analyse your..." — "If you send me..."

**Scenario 1 — First submission, short story**
What tradition identification actually does. How the reading is shaped by it. Why the same prose would receive a different reading in a different tradition.

**Scenario 2 — Script submission**
How structural mapping works differently for a script. What the analyst looks for that prose doesn't need.

**Scenario 3 — Revision resubmission**
What Mentor Part B does — reading against the prior version, not on its own. What the revision banner means. The differentiator line in context.

**Scenario 4 — Multi-chapter work**
What the continuity ledger tracks and why it matters. How facts accumulate across chapters. What a continuity flag means when it appears.

**Scenario 5 — Returning writer, multiple works**
What cross-submission pattern recognition surfaces over time. Why the third reading of a different work is more useful than the first. What a named pattern looks like in the Mentor section.

**Scenario 6 — Fragment or single paragraph**
What the upfront ask is doing. When D&L will redirect to a full read and why. What a craft-level fragment response looks like versus a full reading.

### Closing — what I don't do
One short paragraph:

"I don't rewrite. I don't generate prose. I don't tell you what your work should be — only what it is, and where it could be more fully itself."

---

## Part 3 — Contextual nudges in the report

**Purpose**
Show writers what D&L can do at the exact moment it's relevant, without littering the report or appearing on every reading.

**The rules**
- One nudge per reading maximum — never multiple nudges in one report
- Dismissible, never returns after dismissal (uses existing user_milestones table, same mechanism as the differentiator line)
- Only appears when the relevant feature was actually used or is directly applicable to the reading in front of them
- Written in the editor's voice, never product-speak
- Quiet — a single italic line, not a panel or a flag

**Nudge catalogue**

| Trigger condition | Placement | Copy |
|---|---|---|
| First reading, no prior submissions | Below Mentor/WHERE TO GROW NEXT section | "If you resubmit this revised, I'll read it against what I said here." |
| Facts extracted to continuity ledger | Below continuity section or ledger link | "I'm tracking names and details across your chapters." |
| Fragment submitted, full read redirected | Below the redirect response | "When you're ready to send the whole chapter, I'll read it properly." |
| Third submission from same writer | Below Mentor section | "The more you send me, the more I'll notice across your work." |
| First reading where tradition gap was identified | Below tradition section | "If you want to know how this tradition handles this problem, ask me below." |

**What never gets a nudge**
- Readings where the relevant feature already fired
- Second or later appearances of the same nudge (user_milestones prevents this)
- Any reading where a nudge already appeared (one per reading, hard limit)

---

## Dependencies and build order

1. **Tradition depth gap (Part 1, Gap 1)** — extends Brain 2, no new storage. Build first.
2. **Scenarios page (Part 2)** — no backend, copy and a new route. Build in parallel with Gap 1.
3. **Contextual nudges (Part 3)** — depends on user_milestones table (already exists). Build after Gap 1.
4. **Cross-submission pattern recognition (Part 1, Gap 2)** — requires new Supabase migration. Build last.

## Open questions — resolved

- Scenarios page title: "How I read" — confirmed.
- Nudge copy: all placeholder, final wording to Nenad for approval before shipping, same process as the differentiator line.
- Pattern dismissal UX: same as continuity flag dismissal, in the ledger view — pending confirmation from Nenad.
