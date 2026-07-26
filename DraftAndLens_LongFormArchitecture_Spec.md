# Draft & Lens — Long-Form Architecture Spec (Live Launch)

> ⚠️ **CRITICAL — BUILT DORMANT.** This entire system must be built as a feature-flagged, isolated pipeline that stays inactive during beta. The current 4,000-word cap and existing pipeline remain completely untouched and unaffected. This system activates only when explicitly switched on at live launch. Do not raise the beta word cap as part of this build.

**Word count ceiling:** 120,000 words (covers the overwhelming majority of novels; optimise for the 70k-120k common case, not the extreme edge).

---

## 1. Why This Exists

The current pipeline reads a submission once, sequentially, through all 5 brains. At 4,000 words this takes ~173 seconds. At novel length, naive sequential chapter processing would take 10-20 minutes — commercially unviable. No writer waits 20 minutes for feedback.

Competitor analysis (Inkshift, the closest competitor) uses a single-pass, large-context read across up to 250,000 words. This is architecturally simpler but shallower — no tradition-awareness, no lens voices, no bias guards, generic rubric output. D&L's depth requires a different solution: parallelization, not brute-force context size.

---

## 2. Core Architecture — Chapter Pipeline

### 2.1 Chapter detection
On submission, split the manuscript into chapters using existing chapter breaks (headers, "Chapter N" markers, or scene breaks if no chapter structure exists). If no clear structure is detectable, fall back to even-sized segments (~4,000 words each, matching the beta unit size — deliberate consistency with the proven short-form pipeline).

### 2.2 Fast first pass (whole-work overview)
A single Haiku-tier pass skims the entire manuscript to:
- Lock tradition (once, for the whole work — never re-identified per chapter, consistent with existing Brain 1 behaviour)
- Build an initial character map
- Identify the throughline / spine
- Produce a whole-work overview (streams to the user within 30-60 seconds of submission)

This pass becomes the shared context every chapter-level call inherits — chapters do not each independently re-derive tradition or character context.

### 2.3 Parallelized chapter batches
Chapters are processed in concurrent batches (6-8 at a time, respecting API rate limits) rather than sequentially. Each chapter-level call:
- Runs Brain 2 (the full analyst) on that chapter's text
- Inherits the shared tradition ruling and character map from 2.2 (via prompt caching — see 2.4)
- Runs the appropriate report tier (Micro/Short/Full) based on chapter word count, using the existing tiering system built for beta
- Runs arc-beat scoring (Brain 3) per chapter — this is the one whole-work brain that genuinely needs a per-chapter pass

### 2.4 Prompt caching
The LearnedCorpus, the locked tradition ruling, and the character map are cached once via Anthropic's prompt caching and reused across all chapter calls. Each chapter call then only pays for its own text and notes — not the full system prompt every time. This reduces both cost and latency meaningfully (cached tokens process faster than fresh ones).

### 2.5 Whole-work brains run once, not per chapter
Brain 4 (market fit) and Brain 5 (character bible) are fundamentally whole-work concerns:
- **Market fit** runs once on the overview + sample chapters, not 30 times
- **Character bible** builds progressively as chapters complete, accumulating rather than restarting

### 2.6 Progressive delivery
The whole-work overview streams in within 30-60 seconds. Chapter notes populate progressively as each batch completes, using the same skeleton-then-fill pattern already built for short-form submissions (Session 1 work), extended to a chapter grid. The writer can start reading chapter 1 while chapters 20+ are still processing.

**Estimated total time:**
- 70k-120k words: 3-6 minutes total, with overview + first chapters visible in 60-90 seconds
- Perceived wait is close to zero because the writer is reading while later chapters complete

---

## 3. Diff and Ripple Detection (Resubmission Efficiency)

### 3.1 Chapter hashing
Each chapter is hashed and stored server-side against the writer's account. On resubmission, compare hashes chapter by chapter. Unchanged chapters are never reprocessed — their prior reading is served directly.

### 3.2 Local reprocess
Changed chapters get a full Brain 2 pass (as in section 2.3).

### 3.3 Ripple check

**Dependency graph approach (informed by how Graphify indexes a codebase — retrieve only relevant nodes, don't re-scan everything):**

Rather than re-asking a model to reason over the whole-work overview on every change, build a lightweight dependency graph once, at initial submission: which chapters establish what (characters, setups, plot mechanisms, foreshadowing), and which chapters depend on those established elements.

When a chapter changes, traverse the graph to find exactly which other chapters are affected — a direct lookup, not a fresh reasoning pass. Only those flagged chapters get the lightweight "does this still hold" recheck (Haiku-tier, as originally specced).

This is faster, cheaper, and more precise than re-scanning the overview on every resubmission. The graph itself only needs rebuilding when chapters are added or removed, not on every edit.

### 3.4 Shared infrastructure with Mentor tier
This hashing/diff/ripple system is the same technical foundation the Mentor tier roadmap item already requires ("Mentor activates on genuine resubmission of same revised work... gate strictly on real revision relationship"). Build once here; Mentor inherits it rather than needing its own implementation.

---

## 4. Selective Reading

A writer with a submitted long-form manuscript can select any chapter or passage and request:
- A fresh Brain 2 reading on just that selection (using existing excerpt mode from beta)
- A specific lens voice's reading of just that selection

This does not require resubmitting or reprocessing the whole manuscript — it operates on the already-stored, already-chapter-hashed text.

---

## 5. Lens Q&A (Brain 7 / Chat Panel)

This is the concrete spec for the previously-deferred "chat panel" — this conversation has defined its actual scope.

### 5.1 What it is
A writer can type a specific question to a lens voice about their submitted work — e.g. *"Would Highsmith say this scene earns its ambiguity?"* — and receive that lens voice's answer, grounded in the actual submitted text.

### 5.2 The critical guardrail
The lens must answer from the text, not invent a general opinion. If a question cannot be answered from what's on the page, the lens must decline in character rather than hallucinate.

Example: Chandler — *"You haven't shown me the room yet. Ask me again once I can see it."*

This must be a corpus-level rule (add to LearnedCorpus as a new principle when this is built), not a soft suggestion — hallucinated lens opinions not grounded in the actual text would be a serious IP and quality risk.

### 5.3 Two distinct modes under this feature
- **Whole-work Q&A** — question answered with awareness of the whole manuscript's overview/character map
- **Selective Q&A** — question scoped to a specific chapter or passage (uses section 4's selective reading)

---

## 6. Launch Dependencies

These must be resolved before this system is switched on, independent of the build itself:

1. **Higher API rate limits** — parallelized batches fire 6-8 concurrent calls; request via platform.claude.com/settings/limits once at 50%+ of current usage
2. **Feature flag infrastructure** — a clean on/off switch, defaulting to off, that doesn't require a code rollback to disable
3. **Solicitor review** — already a standing pre-paid-launch requirement; long-form processing of larger manuscripts increases the data handled and should be in scope for that review
4. **Clerk production mode** — already a standing pre-paid-launch requirement (memory #20)

---

## 6A. Cost Ceiling Per Read

**The flexible answer:** don't cap cost by limiting quality — cap it by limiting the *ceiling*, with the pipeline already scaling naturally underneath it.

Because prompt caching (2.4) and the tiered report system (already built for beta) both scale cost down automatically for shorter chapters, the real cost driver is chapter *count*, not depth. A 120k-word novel in ~30 chapters costs roughly 30x a single chapter call, minus caching savings on shared context (corpus, tradition, character map) — which is the majority of the token weight per call.

**Before launch pricing is set:** run 3-5 full internal test reads at realistic lengths (80k, 100k, 120k) and log actual token spend end-to-end. This gives a real cost-per-read figure rather than a projected one, and should directly inform whether long-form sits behind a paid tier only, or has its own pricing band. No architecture change needed — this is a measurement step to run during internal testing (spec section 8, phase 8), not a design decision to make now.

---

## 6B. Partial Failure Handling

**The flexible answer:** never fail the whole read for one bad chapter. Treat each chapter batch as independently retryable, and let the writer see a complete picture with one clearly marked gap rather than losing the entire submission.

**Design:**
- If a chapter's Brain 2 call fails (timeout, API error, rate limit), the rest of the batch and all other batches continue unaffected — failures are isolated per chapter, not per batch or per submission
- The failed chapter's slot in the UI shows a clear state: "This chapter's reading didn't complete — retry" with a single retry button, rather than a blank or broken slot
- Retry re-runs only that chapter's Brain 2 call, inheriting the same cached shared context — cheap and fast, not a full resubmission
- The whole-work overview and all successfully completed chapters remain visible and usable throughout — a partial failure never blocks the writer from reading what did complete
- If more than a threshold (e.g. 20%) of chapters fail in one run, surface a single system-level notice suggesting the writer wait and retry the whole submission, since a high failure rate likely indicates a transient outage rather than isolated chapter issues

This costs nothing in normal operation — the retry path only activates on failure — and directly protects output quality, since a writer never receives a silently incomplete read.

---

## 6C. Graph Staleness on Structural Reordering

**The flexible answer:** version the graph against chapter identity, not chapter position — so reordering is free and only genuine content changes trigger rebuilding.

**Design:**
- Each chapter is tracked by a stable identifier (assigned at first submission, not by its position in the manuscript) — the same identity the chapter hash (3.1) already uses
- The dependency graph stores relationships between chapter identities, not chapter numbers or positions
- If chapters are reordered but not edited (same identities, new sequence), the graph's *relationships* remain valid — what chapter A establishes and what chapter B depends on hasn't changed, only where they sit in the manuscript
- The only case that invalidates part of the graph: if reordering changes the *narrative logic* itself (e.g. a flashback moved earlier now precedes information it originally followed) — this is content-adjacent, not pure structure, and should be treated as a content edit to the affected chapters, triggering the normal diff/ripple flow (3.2-3.3), not a special case
- A full graph rebuild is only needed when chapters are added or removed entirely (already noted in 3.3) — reordering alone never requires one

This keeps the graph cheap to maintain and avoids unnecessary rebuild costs on what is often a purely editorial (not content) decision by the writer.

---

## 7. What Does NOT Change

- The existing 4,000-word beta pipeline is completely untouched
- The beta word cap stays at 4,000 until explicitly raised at live launch
- All existing brain prompts, corpus principles, and lens voices continue working exactly as they do now for short-form submissions
- This system only activates for submissions once the word cap is raised and the feature flag is switched on

---

## 8. Build Sequencing (when ready to build — NOT now)

This is Opus/High work, multiple sessions, each audited before the next begins:

1. Chapter detection + fast first-pass overview
2. Parallelized chapter batch processing + prompt caching
3. Progressive delivery UX (chapter grid, skeleton-then-fill)
4. Chapter hashing + diff detection
5. Ripple check system
6. Selective reading (chapter/passage-scoped)
7. Lens Q&A / Brain 7 (own session, given IP boundary sensitivity)
8. Feature flag wiring + dormant verification (confirm beta pipeline unaffected)

---

## 9. Standing Reminder

**This entire spec sits dormant during beta.** No part of it activates, no part of it affects the 4,000-word pipeline, until Nenad explicitly decides to build it and switches it on at live launch. Referenced here so it is never lost or forgotten between sessions.
