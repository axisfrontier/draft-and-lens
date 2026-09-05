# Level 1 Audit — 2026-08-17

Two reports commissioned before detection work. **Nothing was changed** — both are findings only, awaiting Nenad's review.

---

# 1a — BRAIN MODEL / EFFORT TIER AUDIT

## The headline finding

**Only one brain in the entire pipeline uses extended thinking or an effort setting: the analyst.**

`BrainCall` in `src/ai/brains/_shared.ts` accepts exactly `model`, `maxTokens`, `brain`, `system`, `user`. There is no thinking or effort parameter, so every brain except the analyst runs at provider defaults. The analyst is the sole exception because `runAnalyst` bypasses the shared helper and calls the SDK directly with `thinking: { type: 'adaptive' }` and `output_config: { effort }`.

That is not necessarily wrong — but it means "effort tier" is currently a one-brain concept, and several genuinely interpretive brains have never had the option.

## The table

| Brain | Model | Thinking / effort | Task nature | Match? |
|---|---|---|---|---|
| moderation | `claude-sonnet-4-6` | none | **Mechanical** — safety classification against policy | ✅ |
| **diagnostician (B1)** | `claude-sonnet-4-6` | none | **Interpretive** — identifies tradition, register, ambition | ⚠️ **see below** |
| structuralReader (B1b) | `claude-sonnet-4-6` | none | Mixed — maps structure, collects evidence, explicitly "does not evaluate" | ✅ |
| **narratorVerifier** | `claude-sonnet-4-6` | none | **Interpretive** — classifies narrator lines as elevation / restatement / world-establishment | ⚠️ **see below** |
| narratorCorrector | `claude-opus-4-8` | none | Interpretive — applies the verifier's classification | ⚠️ **see below** |
| analyst (B2) | `sonnet-4-6` < 3000 words<br>`opus-4-8` ≥ 3000 words | thinking ON at all tiers; effort `low` < 3000 words, `ANALYST_EFFORT` (default `medium`) above | **Interpretive** — the core craft reading | ✅ (but see cliff) |
| scorer (B3) | `claude-sonnet-4-6` | none | **Interpretive** — craft scores, tradition alignment, arc beats | ⚠️ |
| market (B4) | `claude-sonnet-4-6` | none | Mixed — studio/publisher matching, known-work recognition | ⚠️ **see 1b gap 3** |
| bible (B5) | `claude-sonnet-4-6` | none | **Mechanical** — "records only what is explicitly in the text" | ✅ |
| lens (B6) | `claude-sonnet-4-6` | none | Interpretive — but deliberately partial, per SCOPE | ✅ arguable |
| conversation (B7) | `claude-sonnet-4-6` | none | Interpretive — follow-up Q&A over a finished reading | ✅ arguable |
| continuityExtractor | `claude-sonnet-4-6` | none | **Mechanical** — extractive, hard verbatim-quote gate behind it | ✅ |

## The four mismatches worth a decision

**1. The diagnostician is the highest-leverage interpretive call in the pipeline and runs on the cheap tier with no thinking.**
Principle 1 of the corpus — and `analyst.ts`'s own prompt — make the tradition *locked* before Brain 2 runs: *"This work has already been read… established fact — do not re-identify, do not override."* So a wrong tradition is not a recoverable error; it propagates into every craft judgement downstream, and the analyst is explicitly forbidden from correcting it. This is the single place where a cheap call has the most expensive consequences. Noel's A24 complaint (1b, gap 3) is plausibly downstream of exactly this.

**2. The narrator pair is inverted.** `narratorVerifier` (Sonnet) makes the classification; `narratorCorrector` (Opus) applies it. The judgement is made at the cheap tier and the expensive tier only executes it. If one of the two should be Opus, the argument for it being the verifier is stronger.

**3. The scorer produces numbers that look objective.** Craft scores and tradition-alignment ratings are rendered as a dashboard with status dots. Numeric presentation implies a precision the cheap tier may not support, and a wrong score is harder for a writer to argue with than a wrong sentence.

**4. The analyst has a sharp cliff at 3,000 words.** A 2,999-word story gets Sonnet at `low` effort; a 3,001-word story gets Opus at `medium`. Deliberate and documented, but worth knowing it is a step change rather than a ramp, and that most beta submissions so far sit below it.

## MEASURED LATENCY (added at Nenad's request)

Not estimates — aggregated from `submission_telemetry`, 40 real production runs. Median word count 695, range 97–3,927.

| Stage | Model | n | Median | Min | Max | Avg output tokens |
|---|---|---:|---:|---:|---:|---:|
| analyst | opus-4-8 | 1 | **128.0 s** | 128.0 s | 128.0 s | 8,089 |
| analyst | sonnet-4-6 | 20 | **60.6 s** | 7.6 s | 101.4 s | 2,539 |
| bible | sonnet-4-6 | 19 | 25.6 s | 3.8 s | 30.8 s | 1,060 |
| market | sonnet-4-6 | 21 | 25.0 s | 6.9 s | 29.0 s | 1,032 |
| diagnostician | sonnet-4-6 | 21 | 16.1 s | 6.1 s | 24.9 s | 580 |
| scorer | sonnet-4-6 | 21 | 8.6 s | 6.2 s | 14.2 s | 449 |
| moderation | sonnet-4-6 | 31 | 1.9 s | 1.2 s | 9.1 s | 37 |
| resolveRevision | (supabase) | 31 | 0.66 s | 0.32 s | 2.7 s | — |

**Whole run:** median 49.1 s, range 0.5 s (cached/unchanged) – 153.2 s.

Latency tracks output tokens closely, which matters for sizing detection: a brain producing a few hundred tokens costs seconds, not minutes, even at the expensive tier. The one Opus analyst run cost 128 s for 8,089 tokens — but that is a *long-form generative* call, not a comparator for a short adjudication.

### Three brains are unreachable — they have never run, and cannot

`TESTER_WORD_CAP = 4000` rejects any submission above 4,000 words server-side (HTTP 413). But `STRUCTURAL_READER_MIN_WORDS = 5000` gates three brains:

- `structuralReader` (Brain 1b)
- `narratorVerifier`
- `narratorCorrector` — **the only other Opus-tier brain in the pipeline**

Nothing can reach 5,000 words, so none of the three can ever execute. Confirmed by their total absence from 40 runs of telemetry. `FREE_WORD_LIMIT = 10000` is similarly unreachable for the same reason.

This is dead code under current settings rather than a tier problem — and it means the narrator-pair inversion flagged above is currently **moot in practice**, though it would become live the moment the cap rises. Worth deciding deliberately: either the cap rises, or the gate drops to something below 4,000, or these three are acknowledged as dormant. Right now the pipeline silently contains three brains that no submission can trigger.

### Extraction latency is not measured, and cannot currently be

`continuityExtractor` does not appear in telemetry at all, despite having run today. It executes after the pipeline's `withCostTracking` scope has closed, so `recordBrainUsage` finds no active store and silently drops the entry — **the identical failure mode the code comments already describe for moderation** ("recordBrainUsage found no store and silently dropped it — which is exactly how a full LLM call gating every submission stayed invisible in the numbers").

So extraction's latency and token cost are both currently invisible. Measured directly instead during the standalone brain test: a 97-word chapter took roughly 8–12 s wall clock end to end. That is a floor, not a representative figure — a 4,000-word chapter yielding 20–30 quoted facts will be substantially higher.

**This should be fixed before detection ships**, or detection's cost will be equally invisible — and detection is the piece whose cost most needs watching, since it is two calls per candidate rather than one per submission.

## Two observations, not recommendations

- **Model IDs are `claude-sonnet-4-6` and `claude-opus-4-8`.** These are not the current generation (Claude 5 family: `claude-opus-5`, `claude-sonnet-5`; plus `claude-haiku-4-5`). They may be deliberately pinned — but since this audit is explicitly about tiers, it is worth confirming the pinning is intentional rather than inherited from the June migration.
- **No brain below Sonnet exists.** Haiku is unused. Two brains are purely mechanical with hard validation behind them (`bible`, `continuityExtractor`) and are plausible candidates if cost ever matters, though neither is a bottleneck today.

---

# 1b — LEARNED CORPUS REVIEW

**File read in full:** `DraftAndLens_LearnedCorpus_v2.9.md`, 401 lines, Principles 1–27 plus SCOPE, Illustrative Examples, and the Core Principle.

## Version numbering is inconsistent in three places

| Source | Says |
|---|---|
| Filename | `_v2.9.md` |
| Document header (line 2) | `Version 2.11` |
| `CLAUDE.md` governing-docs list | `DraftAndLens_LearnedCorpus_v2.7.md` |

Three different numbers for one document, and `CLAUDE.md` points at a filename that does not exist on disk. A session following `CLAUDE.md` literally would fail to find the corpus.

## GAP 1 — the annotation self-consistency fix is absent

Built and deployed this session (`106eafe`, `d66cc20`): `ESTABLISHED CONTEXT JUSTIFIES THE CHOICE`, plus its `NAMING THE CONTEXT IS NOT ENOUGH` clause. Before flagging a verb as vague, dialogue as flat, or repetition as a vocabulary weakness, the analyst must check whether the manuscript's own established context already motivates the choice — and if it does, must not then recommend changing it anyway.

This is a genuine editorial principle and it is nowhere in the corpus. It is the same *shape* as Principle 9 (device vs instance) and Principle 11 (load-bearing vs floating abstraction) — all three are "verify function before faulting" rules — which is an argument for it sitting alongside them as a numbered principle rather than living only as prompt text.

## GAP 2 — the corpus documents only half the annotation rule (Nenad's specific question)

The corpus's **"Teaching the move" (v2.5 addition)** is explicitly scoped to problems: *"where a note names a line-level craft problem…"*. Nothing in the corpus governs a note that names a **technique or a strength**.

That is precisely the gap `NAME THE MECHANISM, THEN THE REACH` was built to close (committed `3e594f7`, verified live 2026-08-13 — the log records the fix working on Nenad's own flagged line). A strength note must give **mechanism** (what specifically makes it work, not the adjective) and **reach** (where that instrument is live elsewhere).

So the answer to *"does the corpus reflect diagnosis + direction, including for strengths?"* is: **no. It reflects it for problems only.** The corpus is a half-statement of a rule the product now fully implements.

## GAP 3 — tradition detection says nothing about *medium* scoping (Noel's A24 issue)

Feedback tracker item #7 remains **Open**: screenwriter and A24-style comparisons surfaced for a prose book manuscript.

Principle 1 governs identifying the *tradition*. Nothing in the corpus governs scoping comparisons to the *medium* — that a prose novel should not be matched against film studios regardless of how well its tradition maps.

Compounding this: **SCOPE explicitly binds only "the editorial reading (the analyst)" and exempts the voices. Brain 4 (market) is not mentioned at all.** So the brain that produced Noel's complaint is, as the corpus currently reads, governed by nothing. That is a real hole rather than an oversight of wording — and it is the likeliest root of the complaint, alongside the diagnostician tier question in 1a.

## GAP 4 — the continuity ledger's editorial positions are absent

The feature built across this session carries editorial principles as load-bearing as anything in the corpus, none of which appear in it:

- **Detection, not prevention** — the ledger reads text already written; it never feeds a generating model.
- **Precision over recall** — a missed fact costs nothing; a wrong one destroys trust.
- **"These two passages disagree — you decide"**, never "you got this wrong".
- **Never resolve ambiguity on the writer's behalf** — surface it.
- **The ledger is never an input to generating prose** — a direct extension of the corpus's own ghostwriter line, and explicitly framed in the design as a change of product *position* rather than a feature increment.

That last one especially belongs in a document whose job is encoding the product's editorial stance.

## GAP 5 — Principle 23 and ruling 4 are complementary but disconnected

P23 says an excerpt is read on its own terms, never as a deficient whole. Ruling 4 says an excerpt contributes **no facts** to the ledger, because a draft mid-revision is not canonical. These agree, and the second is a natural consequence of the first — but the corpus does not connect them, so a future session could plausibly "fix" one without knowing about the other.

## What is NOT stale — checked and confirmed correct

- **Principle 26's floor** (Overview, What Is Working, the prioritised revisions, Verdict) exactly matches `EVIDENCE_GATING` in `src/prompts/report/shared.ts`. ✅
- **Principle 27's gloss rule** is implemented as its own always-included block in `src/prompts/register.ts`, as the v2.11 note claims. ✅
- **Principle 25's "35 lens voices"** matches `LENS_IDS` in the code. Note the *test* is the stale artefact here, not the corpus — `client-ip-guard.test.ts` asserts 27 and has been failing all session. The corpus is right; the test needs updating.

---

# SUMMARY OF WHAT NEEDS A DECISION

Nothing in this document has been acted on.

**1a — tiers:** four candidate mismatches (diagnostician, narrator pair inversion, scorer, analyst cliff), plus confirmation of whether the `4-6`/`4-8` model pinning is intentional.

**1b — corpus:** five gaps. Gaps 1 and 2 are new principles to add; gap 3 is a hole in SCOPE with a live tester complaint attached; gap 4 is an entire feature's editorial stance missing; gap 5 is a cross-reference. Plus the three-way version-number inconsistency, which is cheap to fix and currently makes `CLAUDE.md` point at a file that does not exist.
