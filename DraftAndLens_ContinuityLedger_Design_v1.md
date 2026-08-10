# Continuity Ledger — Design v1.2 (for review, not yet approved)

**Status:** proposal. Nothing built. Written 2026-08-10 for Nenad's review.
**Source:** `DraftAndLens_Handover_2026-08-02.md` item 1 — "the priority build, not squeezed in alongside bug fixes." Answers Noel Lyons' third want-list item (flag contradictions against earlier chapters).

**Why this feature and not another:** it is the one item on the tester's list that a raw Claude chat genuinely cannot do. A chat window has no persistent state across a manuscript; by chapter 12 it has forgotten chapter 2. This is the strongest available answer to "how is this better than pasting a chapter into Claude?"

### Changes in v1.2 — 2026-08-10

Nenad checked the approach against the market: the structural pattern here (extract facts → store persistently → flag rather than infer intent) matches how the serious competitors — Bunsho, EPOS-AI, Novarrium — all do it. Direction confirmed. Two additions:

4. **Locked facts** (§5.7), Novarrium's term — the writer marks certain facts permanently invariant, flagged with their own tier above the severity ladder. Split into **rule locks** and **state locks** because a death lock turns out to depend on the chronology reasoning ruling 1 deferred.
5. **Detection, not prevention** (§1.1) stated explicitly, so patterns from generation-side tools are not borrowed unexamined.

### Changes in v1.1 — Nenad's rulings, 2026-08-10

1. **Scope narrowed for v1** to names, physical descriptions, stated ages/dates, explicit relationships. Timeline and geography deferred until this is proven low-noise. (§1, §3)
2. **Contradictions surface as their own dedicated, severity-tiered section** — hard contradiction vs. worth checking — not inline flags. (§6)
3. **New §5 added** answering his question: how the design separates a real contradiction from a deliberate craft choice.

---

## 0. Two findings that constrain everything below

Both from reading the code, not assumption.

### 0.1 Chapters are not grouped — this blocks the feature outright

`resolveRevision` matches a submission to a prior work by **text similarity**: word-bigram Sørensen–Dice, `SAME_WORK_SIMILARITY = 0.4` (`src/lib/readings.ts:29`). Correct for its purpose — telling a *revision* of a chapter from a different chapter — but it means chapter 2 of a novel shares almost no bigrams with chapter 1, scores far below 0.4, and is stored as **a separate work with a new `work_id`**.

There is no concept of "manuscript." Only "work = one text, revised up to 5 times." Verified against `listWorks`, which groups on `work_id` alone.

**Manuscript grouping is a prerequisite, not a sub-task.**

### 0.2 `MAX_VERSIONS = 5` prunes history

`pruneVersions` (`src/lib/readings.ts:245`) hard-deletes rows beyond the newest 5 per `(user, work)`. Anything inside `reading_json` is destroyed with them — by chapter 20 the chapter-1 facts are long gone. **The ledger lives in its own table with its own lifecycle.**

---

## 1. What the feature is (and is not)

**Is:** across a manuscript, notice when a later chapter asserts something that contradicts an earlier one, and show the writer both passages so *they* judge.

**Is not:** correcting it. Consistent with "a reading, not a rewrite." Never rewrites, never says "the correct version is X," never silently picks a winner.

### 1.1 Detection, not prevention

The competitor scan confirms the structure, but most tools in this space are built for a **different job**: holding a story bible that feeds a *generating* model, so contradictions are prevented before text exists. D&L's ledger reads text the writer has already written. Same data structure, opposite obligations — and the patterns do not transfer:

| | Prevention (generation-side) | **Detection (D&L)** |
|---|---|---|
| Failure mode | A missed constraint lets a contradiction be written | A wrong flag tells a writer their book is broken when it isn't |
| Optimise for | **Recall** — a slightly wrong constraint just nudges generation | **Precision** — every flag is a claim shown to a human about their own work |
| Ambiguity | Resolve it, pick a value, keep generating | **Surface it.** Never resolve on the writer's behalf |
| Ledger quality bar | Complete and canonical | **Defensible** — every entry traceable to a verbatim quote |
| Tolerable noise | Fairly high; invisible to the user | Near zero; each error is seen and costs trust |

This is why precision-over-recall (§5.6) and the mandatory verbatim quote (§3) are load-bearing rather than fastidious — they follow from the job.

**And a harder line: the ledger is never an input to generating or suggesting prose.** Feeding it forward — "here's what your book established, here's the next paragraph" — is the ghostwriting D&L exists not to do. The ledger reads; it does not write. Any future proposal to use it generatively is a change to the product's position, not a feature increment, and should be treated as such.

### v1 scope (ruling 1)

In scope — four categories only:

| Category | Example |
|---|---|
| **Names** | spelling and form: *Katherine* / *Kathryn*, *Mrs Dell* / *Ms Dell* |
| **Physical description** | eye and hair colour, height, scars, build |
| **Stated ages and dates** | "she was thirty-four"; "born in 1971" |
| **Explicit relationships** | "her brother Tom"; "his second wife" |

Deferred: **timeline** (event ordering, elapsed duration) and **geography** (spatial consistency, travel times). Both are higher-value and much noisier; they wait until the four above are proven low-noise in real use.

**The line that keeps stated dates in scope without dragging timeline in: compare assertions, never compute chronology.** "Born in 1971" in chapter 2 and "born in 1968" in chapter 9 is a clash of two stated values — in scope. Whether chapter 9 happens before chapter 2 is timeline reasoning — out of scope, and §5.4 explains why that boundary is load-bearing rather than merely tidy.

**Also out of scope:** grammar-check (ruled out, handover item 3), auto-fixing, plot-hole invention, anything touching the spidergram decision.

---

## 2. Prerequisite: manuscript grouping

A writer uploads chapter 1, gets a reading. Next week, chapter 2. Today those are unrelated works.

| | How | Risk |
|---|---|---|
| **A. Automatic, by entity overlap** | If a new submission shares enough named entities with an existing manuscript, attach it | Silent wrong grouping. Two novels sharing a "Sarah" get merged and the ledger reports contradictions between unrelated books, with no way for the writer to see why |
| **B. Fully explicit** | At upload: "New work" or "Add to —" | Friction on every upload |
| **C. Suggest, then confirm** | Overlap *proposes* ("This looks like it belongs with **The Salt House** — chapters 1–3. Correct?"), writer confirms or overrides | Slightly more to build |

**Recommendation: C.** The suggestion does the work; confirmation makes a wrong guess harmless and visible. A misgrouping caught at upload costs one click; a misgrouping *not* caught poisons every subsequent flag undiagnosably.

It also does handover item 6 in its subtlest form: when the product says *"this looks like chapter 4 of the manuscript you've been working on,"* it has demonstrated persistent memory without a word of marketing.

**Schema.** New table `manuscripts`: `id`, `user_id`, `title`, `format`, `narrative_frame` (§5.1), `created_at`, `deleted_at`. `readings` gains nullable `manuscript_id` and `sequence_index` (writer-orderable — writers don't draft in order). Nullable is deliberate: existing readings keep working, ungrouped, with no data migration.

---

## 3. What gets stored

New table `continuity_facts`, one row per checkable claim:

| Column | Purpose |
|---|---|
| `manuscript_id`, `user_id` | Scope + ownership |
| `entity` | Normalised subject — `character:sarah` |
| `category` | One of the four in §1 — anything else is not extracted |
| `attribute` | `eye_colour`, `stated_age`, `sibling_of` |
| `value` | Short, normalised — `green` |
| `mutability` | `immutable` \| `slow` \| `volatile` (§4) |
| **`register`** | **Who asserts it, and how — see §5.2. The single most important column for precision** |
| **`pov_character`** | **Whose viewpoint the chapter is in, if any (§5.3)** |
| `evidence_quote` | Verbatim span, enough to locate it |
| `reading_id`, `sequence_index` | Which chapter/version |
| `confidence` | Extractor confidence, 0–1 |
| `reconciled_at`, `reconciled_reason` | Writer marked this pair intentional (§5.5) — never raised again |
| `superseded_by` | A later fact legitimately replaces this one |
| `created_at`, `deleted_at` | Lifecycle, matching `readings` |

Only **checkable** claims: concrete, falsifiable, and in one of the four categories. "Sarah has green eyes" — yes. "Sarah feels distant in this scene" — no. Themes and craft observations stay in the reading; a ledger of interpretations would generate noise and invite the product to police meaning.

---

## 4. Mutability — change over time is not contradiction

A character's eye colour cannot change between chapters. Their job, address or loyalties absolutely can — that is *plot*. A naive differ flags both and is useless immediately, because it fires hardest on the deliberate developments a writer is proudest of.

- **immutable** — eye colour, birth order, date of birth, sibling count. Conflict is almost always error. **Can reach hard tier.**
- **slow** — occupation, city, marital status. Can change, but should be *shown* changing. **Worth-checking tier at most.**
- **volatile** — mood, opinion, intention. **Never flagged.**

Under ruling 1's narrowed scope most v1 facts are immutable, which is precisely why this scope is a good place to start: it is the highest-precision corner of the problem.

---

## 5. Distinguishing craft from error

*Answering Nenad's question of 2026-08-10. This section is the difference between a feature writers keep on and one they switch off after the first bad flag.*

**The premise: the tool cannot reliably infer authorial intent, and any design that depends on inferring it will be confidently wrong.** Asking a model "is this unreliable narration or a mistake?" produces a fluent, plausible answer that is wrong often enough to destroy trust — and wrong *invisibly*, because it reads as certainty.

So the design never tries to detect intent. Five structural mechanisms instead, roughly in order of how much precision each buys.

### 5.1 Ask the writer once, up front

At manuscript creation, three questions with safe defaults:

- Does this book use an **unreliable narrator**?
- Is the **timeline non-linear** (flashbacks, reordered chapters)?
- Does it use **multiple POV characters**?

One screen, once per manuscript, editable any time. This is not a fallback — it is the highest-leverage precision gain available, because it converts the hardest inference in the whole feature into a fact the writer simply tells us.

It is also the honest move: the tool asks rather than guesses, and the question itself signals that it understands these are legitimate techniques rather than mistakes.

Effects: unreliable narrator → narration is demoted to a character's claim, not the book's (§5.2). Non-linear → stated-age and date clashes can never reach hard tier (§5.4). Multiple POV → cross-POV clashes demote (§5.3).

### 5.2 Register — who asserts this, and with what authority

This is the mechanism doing most of the work, and it is largely textually determinable rather than inferred. Every fact records how it was asserted:

| Register | Authority | Example |
|---|---|---|
| `narration_omniscient` | The book's own claim | *Her eyes were green.* |
| `narration_pov` | True as far as this POV knows | (in close third on Tom) *Her eyes were green.* |
| `interiority` | A belief, not a fact | *He was sure her eyes were green.* |
| `dialogue` | A claim by a person | *"Your eyes are green," he said.* |
| `document` | In-world artefact, as reliable as its writer | a letter, a diary entry |

**Rule: a contradiction requires both sides to be at comparable authority.**

Two omniscient-narration claims that clash — that's the book contradicting itself. A dialogue claim clashing with narration is not a contradiction at all: it is a character being wrong, mistaken, or lying, which is the ordinary condition of fiction. **A character lying is never flagged**, because the design never treats speech as the book's assertion in the first place.

This resolves Nenad's "deliberate lie by a character" case completely and structurally — not by detecting the lie, but by never having miscategorised it as a fact.

Register is detectable from the text with reasonable reliability: quotation marks and speech tags mark dialogue; free indirect style and verbs of cognition mark interiority. Where the extractor is unsure of register, the fact is stored with lower confidence and **cannot reach hard tier**.

### 5.3 POV scoping

In a multi-POV manuscript, two POV characters can perceive the same thing differently — that is often the point of the form. A fact asserted in POV-A's chapter that clashes with POV-B's is *perspectival* and demotes to worth-checking, never hard.

### 5.4 Flashbacks, and why stated ages are the exposed edge

Ruling 1 keeps **stated ages and dates** in scope while deferring timeline. That combination has one sharp edge worth naming, because it is where this feature is most likely to embarrass itself:

> "Sarah was thirty-four." (ch. 2) … "Sarah was twelve." (ch. 9)

If chapter 9 is a flashback, that is not a contradiction — it is the most ordinary device in fiction. And with timeline reasoning out of scope, the ledger cannot work out that chapter 9 is set earlier.

**Handling:** stated ages and dates can only reach hard tier when the manuscript is declared linear (§5.1) *and* no flashback marker is present in either chapter. Otherwise they demote to worth-checking, phrased so a flashback is the obvious first explanation:

> *Sarah's stated age differs between these two passages. If one is a flashback, ignore this.*

This is the clearest case where **narrowing scope narrows the reasoning available**, so the *honest* response is to lower the claim rather than guess. Better a quiet question than a confident accusation.

### 5.5 One-click dismissal, permanent and informative

The real safety valve. The tool does not have to be right about intent — it has to be **correctable once**.

Every flag carries *"This is intentional."* One click reconciles that fact-pair permanently for that manuscript; it is never raised again, in any later chapter.

Dismissal also teaches the frame without interrogating the writer. Dismiss two or three flags on the same narrator and the product can ask, once and quietly: *"Should I treat this narrator as unreliable throughout?"* — which sets §5.1's flag from behaviour rather than a questionnaire. Friction only where it has been earned.

### 5.6 Language, and the default of silence

Never "error," "mistake," or "wrong." A flag says *these two passages disagree* and shows both. Worth-checking flags presume competence explicitly: *"If this is deliberate, ignore it."*

And silence is a normal outcome. **A manuscript with zero flags is a success, not a failure of the feature.** Nothing in the design should ever pressure it toward finding something.

### 5.7 Locked facts — the writer asserting an invariant

*Novarrium's term. The positive counterpart of dismissal (§5.5): where dismissal says "this pair is fine," a lock says "this must never change."*

The writer marks a fact permanently invariant — a character's death, a core world rule, a name's spelling. Locks are **writer-authored, not extracted**, which is what makes them different in kind from everything else in the ledger: there is no extraction risk on the lock side, and the §5 machinery for guessing at frame does not need to run on it. The writer has already told us.

Locks are created by promoting an existing ledger entry (one click in the ledger view, §6b) or by adding one directly. They are deliberately few — a handful per manuscript. That is the point: high value, low volume, no maintenance burden.

This also gives the ledger view a job beyond display. It becomes the place a writer curates what the book must hold to.

#### Two kinds, because they are not equally checkable

**Rule locks — chronology-free, genuinely zero-ambiguity.**
An invariant that must hold *everywhere*: *magic always costs blood*; *Katherine is never spelled Kathryn*; *the ship has no windows*. Nothing about narrative order affects whether it holds, so a violation can be flagged flatly, with none of the §5.1–5.4 demotions. This is the case where locking delivers exactly what it promises.

**State locks — chronology-dependent, and the honest handling is weaker.**
A fact true from a point onward: *Sarah dies in chapter 12*; *the bridge is destroyed in chapter 8*. The trap:

> Sarah dies in chapter 12 and speaks in chapter 18.

That is not a violation. Flashback, memory, dream, hallucination, a ghost, someone imagining her — all ordinary. Deciding whether chapter 18 is set after chapter 12 *is* the timeline reasoning ruling 1 deferred, so the ledger cannot settle it.

So a state lock's violation condition is narrower than it first appears: the character must appear as a **live participant in present-tense narration** (§5.2 register) at a later sequence position, with no flashback or dream marker. Where that can be established and the manuscript is declared linear (§5.1), it flags at the locked tier. Where it cannot, it demotes to worth-checking and names the likely explanation first:

> **Sarah is locked as dying in chapter 12.** She appears in narration in chapter 18. If that's a flashback or a memory, ignore this.

Worth being plain about the consequence: **the most emotionally obvious lock a writer will reach for — a character's death — is the one the current scope handles least confidently.** That is an argument for prioritising timeline reasoning in v2, and a reason not to over-promise locking in any copy that describes the feature.

#### Storage

No new table. `continuity_facts` gains:

- `source` — `extracted` | `writer`
- `lock_kind` — `null` | `rule` | `state`
- `lock_from_sequence` — for state locks, the chapter from which it holds

Reusing the table keeps the GDPR cascade (§8) to the two tables already planned, and lets a locked fact sit in the same view as the extracted ones it was promoted from.

### 5.8 What this still gets wrong

It will produce some false positives. Dream sequences, in-world fiction, deliberate Rashomon-style contested accounts, and a narrator who is unreliable in one chapter only will all slip through as worth-checking. The design's answer is not that this won't happen — it is that a false flag costs one click, is never repeated, and is phrased so that dismissing it feels like a normal reading interaction rather than correcting a broken tool.

Overclaiming precision here would be the actual failure. **The feature's promise is "here are two passages that disagree — you decide," and that promise stays true even when the tool has misjudged.**

---

## 6. How it surfaces (ruling 2)

### Dedicated section, severity-tiered

A **Continuity** section of its own, appearing **only when there are flags** — Principle 26, section count follows evidence. No "No contradictions found ✓": that is config-driven, and it would imply an all-clear the system cannot guarantee.

Three tiers. Tier is determined by *frame confidence*, not just fact confidence:

**Locked** (§5.7) — the writer declared this invariant and the text departs from it. Sits above the ladder rather than on it, because one side is writer-authored and carries no extraction risk. Rule locks always qualify; state locks qualify only where chronology can be established (§5.7).

> **Locked: magic costs blood.** Chapter 14: *"she raised the ward with a word, and nothing was taken from her."*

**Hard contradiction** — all of:
- immutable attribute (§4)
- both sides `narration_*` at comparable authority (§5.2)
- same POV, or single-POV manuscript (§5.3)
- for ages/dates: manuscript declared linear, no flashback markers (§5.4)
- verbatim quote on both sides

> **Sarah's eyes.** Chapter 2: *"her green eyes narrowed."* Chapter 7: *"those brown eyes gave nothing away."* Both can't be true unless the change is deliberate.

**Worth checking** — anything a legitimate frame could explain: cross-register, cross-POV, slow-mutable, flashback possible, or lower extraction confidence.

> **Sarah's stated age.** Chapter 2 has thirty-four; chapter 9 has twelve. If chapter 9 is a flashback, ignore this.

Two quotes, the locations, one sentence. No score, no percentage, no verdict. Craft terms glossed in the same breath (Principle 27).

**Sidebar impact:** a new section changes the sidebar link count, which the standing rule fixes at 26. Because this section is conditional, the count becomes 26 or 27. The rule needs restating as "26, plus Continuity when present" — flagging now so the check isn't read as a regression.

### Between readings — the ledger view

A per-manuscript view of what is being tracked, by character. The differentiator made visible (handover item 6) at its most subtle: the writer sees an actual accumulated memory of their book. No "unlike ChatGPT" copy — the thing itself argues the case.

It is also where locks are curated (§5.7): each entry carries a one-click lock, which turns the view from a display into a working surface — the place a writer states what the book must hold to.

It is also where a writer diagnoses a bad flag: if the ledger has misread something, they can see *why* rather than concluding the tool is arbitrary. And it is useful alone — a character sheet nobody had to maintain.

---

## 7. Risks

| Risk | Handling |
|---|---|
| **False positives destroy trust** | §5 entire; precision over recall; silence is a normal outcome |
| **Flagging legitimate craft** | §5.1 frame declaration, §5.2 register, §5.3 POV, §5.4 flashback demotion, §5.5 dismissal |
| **Wrong manuscript grouping** | Confirm at upload (§2), never silent |
| **Ledger grows unbounded** | Narrow v1 scope; immutable facts are few |
| **Cost/latency** | Extraction concurrent with pipeline; adjudication only on collision |
| **Extractor hallucinates a fact** | Verbatim quote mandatory; no locatable quote → dropped |
| **GDPR** | §8 — a real gap |
| **Feels like grading** | "These disagree," never "you got this wrong" |
| **Death locks over-promise** | The most intuitive lock is the least checkable without timeline reasoning (§5.7); demote to worth-checking rather than guess, and don't over-claim it in copy |
| **Drift toward generation** | §1.1 — the ledger is never an input to generating prose; any such proposal is a position change, not a feature |

---

## 8. GDPR — a real obligation this creates

Every user-data function in `src/lib/readings.ts` touches only `TABLE = 'readings'`. Two new tables mean each must be extended or the launch checklist's deletion-cascade test fails:

- `deleteAllUserData` — must wipe `continuity_facts` and `manuscripts`
- `softDeleteWork` / `restoreWork` — must cascade
- `exportUserData` — the ledger is the writer's data
- `purgeExpiredDeletions` — must purge both

Related finding, logged separately: `purgeExpiredDeletions` **is** already auto-called (`works/route.ts:21`), contrary to the checklist — but only on `GET /api/works`, so a writer who never opens their library keeps soft-deleted data past the 30-day window.

---

## 9. Detection pipeline

**Stage 1 — Extract** (per submission, one model call, server-side IP). Pull claims in the four v1 categories with entity, attribute, value, mutability, **register**, **POV**, and a verbatim quote. Runs *concurrently* with the main pipeline, the pattern moderation and revision-awareness already use (`analyse/route.ts:126`) — costs its own latency only, never delays the reading.

**Stage 2 — Candidate match** (deterministic, no model call). Join new facts against stored on `(entity, attribute)`. Zero tokens. Most facts have no counterpart and stop here.

**Stage 3 — Adjudicate** (model call, only on collisions, only immutable/slow, only where §5 gates allow a flag at all). Genuine contradiction, or legitimate development / same thing said differently? Only survivors become flags. **No collision, no cost** — the common case.

---

## 10. Phasing

1. **Manuscript grouping** (§2) + **frame declaration** (§5.1). Prerequisite. Useful alone — a real library, chapters ordered.
2. **Extraction + ledger view** (§3, §6b). Builds and shows the memory. **No flagging yet** — lets us inspect extraction quality, and especially register-detection accuracy, on real manuscripts before anything is called a contradiction. *Possibly locks too — see open question 8; they need no extraction to be useful and would give writers something to do in this view.*
3. **Detection + Continuity section** (§6a, §9) once (2) demonstrably produces clean facts.
4. **GDPR cascade** (§8) — with (1), not after.

Phase 2 before 3 is the important call: we see what the extractor actually produces before telling writers their book contradicts itself.

---

## 11. Open questions — still need Nenad's judgement

1. **Frame declaration UX** (§5.1) — three questions at manuscript creation: acceptable, or should it be inferred silently and corrected via dismissal (§5.5) alone?
2. **Grouping friction** (§2) — is confirm-on-upload acceptable for a first-time user?
3. **Ledger view placement** — inside account/works, or its own route? (Relates to the parked `/reading/abc123` stable-URL item.)
4. **Excerpts** — should they contribute facts, or only complete pieces? An excerpt may be mid-revision and not yet canonical.
5. **Word cap** — `TESTER_WORD_CAP` is 4,000, so a novel is 25+ submissions. Does the ledger raise the priority of lifting it?
6. **Sidebar count** (§6) — confirm "26, plus Continuity when present" as the new standing rule.
7. **Does locking change v2 priority?** (§5.7) — state locks (character death) are what writers will reach for first and are the least checkable without timeline reasoning. Does that promote timeline from "deferred" to "next"?
8. **Locking in phase 2 or 3?** (§10) — locks need no extraction to be useful, so they could ship with the ledger view in phase 2, giving writers something to *do* there before any flagging exists.

*Resolved in v1.1:* scope (ruling 1), surfacing format and severity tiers (ruling 2).
*Resolved in v1.2:* locked facts adopted (§5.7); detection-not-prevention boundary stated (§1.1).

---

## 12. What I have NOT done

No code. No schema migration. No dependency added. This document is the deliverable; the build waits for review.
