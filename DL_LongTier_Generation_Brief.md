# Draft & Lens — Long-Tier Generation Cost: Diagnostic & Options Brief

**For:** Claude Code (Opus, Effort High)
**Prepared:** 23 July 2026
**Project folder:** Draft & Lens. **Verify the folder path at session start.** Do not touch the Codex-Maths repository.

---

## Context

Tonight's evidence-gating work fixed the backwards latency curve. Short pieces went from 184s to 76s at 650 words. The 4,000-word tier moved the other way, from a pre-fix 109s to roughly 127–149s across two runs.

That long-tier number is not acceptable as a resting position. A beta tester submitting a full 4,000-word excerpt is a realistic case, not an edge case, and the word ceiling is expected to rise. Whatever is done here has to hold up when submissions get larger, not just survive at today's cap.

Two things are already established and are **not** to be re-litigated:

- The report at 4,000 words is **not padded**. Nine distinct items in WHAT TO REVISE, each quoted and specific, nothing restating anything else. Confirmed by direct reading.
- **Cutting earned analysis is not the lever.** Principle 26 exists precisely to make section count follow the evidence. Reducing depth to buy seconds reverses tonight's work and is out of scope.

Therefore the only legitimate target is **the cost of generating the reading**, not the amount of reading generated.

---

## Governing principle

Same discipline as the latency diagnostic: **measure first, change nothing without approval.** Every proposal in Phase 3 is report-and-recommend. The analyst is where Draft & Lens's quality lives, so no change to its model, effort, or structure ships without a quality check alongside the timing number.

---

## Phase 1 — Establish a real baseline

Two runs (126.8s and 149.1s on identical input) is not a baseline. The 18% spread is nearly as large as the effect being investigated.

- Run the 4,000-word slice **n=5**, same text, current code.
- Report mean, median, min, max, and standard deviation.
- Do the same at 3,000 words, n=3.
- Report the analyst's share of total at both rungs, and its output token count per run.

Deliverable: a defensible number to optimise against, and a variance figure so future comparisons can tell signal from noise.

---

## Phase 2 — Where the generation cost actually sits

The analyst is 83–91% of total wall-clock and its runtime is dominated by token generation, not input reading. Establish, from data:

1. **Output token count at 4,000 words**, mean across the Phase 1 runs. Compare against the 650-word tier. How much more is it actually writing?
2. **Tokens per second.** Is generation throughput constant across tiers, or does it degrade at length or with a larger context?
3. **Thinking time versus emission time.** The 283-word run showed a long silent stretch consistent with extended thinking running before visible tokens. Determine, as precisely as the telemetry allows, how the analyst's stage time splits between internal reasoning and text emission at 4,000 words. This determines which of the Phase 3 options is even relevant.
4. **Does the analyst re-read the full source for every section**, or is the source in context once? Trace whether structure or prompt design causes redundant re-processing.

---

## Phase 3 — Options, report and recommend only

Three candidate levers. Assess each against the Phase 2 data. Do not implement any of them.

### 3A — Model and effort at the long tier

Currently ≥3,000 words runs Opus with thinking on. Assess whether the analyst's work at this tier genuinely requires that configuration throughout, or whether some of what it produces would survive a lower setting.

**This cannot be proposed on timing alone.** Any recommendation must be accompanied by a quality test design: a fixed 4,000-word piece with a known set of correct craft observations, run under both configurations, compared on whether the same observations are found, whether tradition identification holds, and whether the writing degrades in register or specificity. Report the test design before running it.

Note the precedent from tonight: turning thinking *off* at one tier made things slower, not faster, because the model wrote more to reach the same conclusions. Do not assume a cheaper setting is a faster one. Measure.

### 3B — Parallelising the report itself

This is the option with real structural headroom and it has not been examined.

The analyst currently produces the entire report as one sequential generation. The report is composed of largely independent sections — Overview, Voice, Structure, Imagery, and so on — each grounded in the same source text and the same locked tradition from Brain 1.

Assess honestly:

- Could sections be generated in parallel across multiple calls rather than one long sequential pass, with the tradition and diagnostic shared as common context?
- What breaks if they are? Specifically: cross-section coherence, the deduplication rule (one observation, one home), the unified WHAT TO REVISE list which by design must see everything, and the evidence-gating decision which currently has whole-report visibility.
- Is there a hybrid: parallel diagnostic sections, then a single sequential pass for WHAT TO REVISE and the verdict which need the full picture?
- What would the expected saving be, given the analyst's measured token throughput?

Report the architecture honestly including the risks. This is the option most likely to change the shape of the curve rather than shave seconds off it, and it is also the one most relevant to long-form later, so a clear-eyed assessment matters more than an optimistic one.

### 3C — Streaming perception at the long tier

Independent of the above. At 4,000 words the reader waits over two minutes. Assess what currently appears on screen during that window and whether more of the completed work could surface progressively, in the same spirit as the scorer/market/bible streaming already shipped.

This does not reduce the number. It may substantially change whether the number matters.

---

## Phase 4 — Deliverable

A written report containing:

1. The real 4,000-word baseline with variance (Phase 1).
2. Where the generation cost sits — tokens, throughput, thinking versus emission (Phase 2).
3. Each of 3A, 3B, 3C assessed with an expected saving in seconds and an honest statement of risk.
4. A ranked recommendation, with the quality-test design for anything touching the analyst's configuration.

Nothing built. Nothing changed. The report is the deliverable.

---

## Constraints

- Verify the project folder path at session start.
- Audit before edit. Additive changes only. One commit per component.
- All brain prompts and lens voices remain server-side.
- No change to LearnedCorpus principles or lens voices is in scope.
- Principle 26 stands. Reducing the amount of earned analysis is not an option under consideration.
- Verify the live site after any deploy, before declaring anything done.
- Do not ask the user to perform steps Claude Code can perform itself.
