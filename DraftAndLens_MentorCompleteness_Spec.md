# Draft & Lens — Mentor Completeness: Progress Tracking & Writer Goals (Spec)

**Status: design, not built. Written 2026-08-21. Opus/High session.**
**Context: written after applying the standing evaluation rule — identified as the two gaps that separate an observational mentor from a developmental one.**

---

## Why these two gaps matter

Cross-submission pattern recognition (Gap 2, now built) tells a writer what they do repeatedly. That's observational. A developmental mentor does something more: it tells the writer whether they're getting better at it, and it measures progress against somewhere the writer is trying to get to. Without those two things, the paid mentor tier is a sophisticated pattern-spotter — genuinely useful, but not yet a mentor in the full sense.

---

## Gap A: Progress tracking over time

### The problem
D&L currently knows a tendency exists and how many times it's appeared. It doesn't know whether it's improving. "You've reached for abstraction instead of the concrete image in three pieces" is useful. "You've done this in three pieces, but significantly less in the last two — it's becoming less dominant" is developmental. The second is what a real mentor says at the third or fourth session.

### What best-in-class looks like
A mentor tracks trajectory, not just presence. The question isn't "does this writer have a tendency" but "is this writer moving." A tendency that's worsening needs a different response from one that's improving, and silence on the distinction is a missed opportunity at best and misleading at worst.

### What needs building

**In the writer_patterns store:**
- `trend` field: `improving` / `stable` / `worsening` / `insufficient_data`
- `trend_note` field: one sentence, in the editor's voice, stating what the trajectory shows — not a score, not a percentage, a sentence the mentor can surface verbatim
- Trend derived from confirmed_count trajectory across reading_ids — needs at least 3 data points before any trend is named (insufficient_data until then)
- Trend recalculated on each new extraction that touches the pattern

**In the Mentor section:**
- When a pattern is surfaced and trend is available, the trend_note appears beneath the pattern statement — same quiet italic serif, same dismissal control
- "You've reached for this less in recent work" is a different, more valuable note than restating the pattern exists
- Trend note is never shown without the pattern note — it contextualises, doesn't lead

**What must not happen:**
- No numerical scores or percentages — "37% improvement" is false precision on qualitative data
- No trend claimed from a single work or from revisions of the same work (work_ids is the counter, not reading_ids)
- No positive spin on stable patterns — stable means it hasn't moved, which is honest, not encouraging

---

## Gap B: Writer-set goals

### The problem
D&L currently reads on its own terms only. A writer who says "I'm trying to write in the Carver tradition" gets a tradition-identified reading — but that identification comes from the text, not from the writer's stated intent. A writer who says "I want this to feel more urgent" gets no response to that goal at all.

A real mentor works toward what the writer is trying to achieve. The difference between "this is what your prose does" and "this is whether your prose is doing what you said you wanted" is the difference between feedback and mentorship.

### What best-in-class looks like
The writer states a goal — for this work, or for this session, or as a standing ambition — and the mentor holds it. Every reading that follows measures against it explicitly. "You said you wanted this to feel more urgent. The opening has moved in that direction; the third scene hasn't."

### What needs building

**Goal storage:**
- Per-work goals (tied to manuscript_id): "I want this to feel more urgent", "I'm trying to write in the Carver tradition", "I want the ending to earn its ambiguity"
- Per-writer standing goals (tied to user_id): "I'm trying to write tighter", "I want to stop over-explaining"
- Goals entered by the writer in plain text — never inferred by the system
- Goals displayed back to the writer at the top of the Mentor section
- Goals can be edited or dismissed by the writer at any time

**In the reading pipeline:**
- When goals exist, Brain 2 receives them as additional context — not as a rubric to score against, but as a lens to hold alongside the tradition
- The Mentor section opens with goal progress before pattern recognition: "You said you wanted X. Here's what I see against that."
- Goal progress is qualitative, in the editor's voice — never scored, never reduced to met/not-met

**What must not happen:**
- Goals must never override tradition-first reading
- Never infer goals from the text
- Never surface a goal the writer dismissed
- Never fabricate progress — if a goal hasn't been measurably addressed, say nothing

**UI placement:**
- Goal entry alongside the "anything I should know?" field that already exists — optional, low-friction, single text field
- Per-work goals shown at manuscript level in the ledger view
- Per-writer standing goals shown in the account area

---

## Gap C: "How I remember" page and paid-tier visibility

### The problem
The paid Mentor tier's value is invisible until a writer has already paid. The /how-i-read page shows what D&L does; there is no equivalent showing what persistent mentorship looks like over time.

### What needs building
A companion page to /how-i-read — title "How I remember" — written in the same editor voice, same show-don't-tell approach, covering:
- What revision memory does (Part B)
- What named patterns look like after multiple works
- What progress tracking shows over time (Gap A)
- What working toward a stated goal looks like (Gap B)

No comparison table. No feature matrix. No "free vs paid" framing. The page describes what the mentor relationship becomes over time — the paid tier's value is felt in the description, not listed as bullet points.

One quiet in-reading line added to the free-tier Mentor section after a first reading: "The more you send me, the more I'll have to say about where you're going rather than where you are." — not a CTA, not a button. The honest limit of what one reading can do.

**Build after Gap A and Gap B exist** — the page must describe features that are real.

---

## Relationship to existing features

- **Mentor Part B (revision memory):** goal progress is most meaningful across revisions.
- **Cross-submission patterns (Gap 2):** a writer-set goal of "I want to stop over-explaining" directly maps to narrated_not_accumulated and restatement tendency keys.
- **Interrogate/push-harder mode (specced, unbuilt):** writer-set goals are the natural entry point. Build after Gap B.

---

## Build order

1. Gap A — progress tracking (extends writer_patterns, additive migration or new fields)
2. Gap B — writer-set goals (new goals table, Supabase migration — flag SQL to Nenad before applying)
3. Gap C — "How I remember" page and free-tier quiet line (no backend, copy and new route)
4. Interrogate mode — after Gap B

---

## Open questions — Nenad's calls

1. Goal field placement: alongside "anything I should know?" or replacing it?
2. Standing goals vs per-work goals: unified list or surfaced differently?
3. Trend language: "You've reached for this less in recent work" — does this match the established editor voice?
4. Migration timing for Gap B: same manual-apply process as all previous migrations.
