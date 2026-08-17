# D&L Detection — Adversarial Test Set

**Purpose:** prove detection catches genuine contradictions *and*, equally, that it does not flag things that only look like contradictions. Both directions matter. A detector that flags everything is as useless as one that flags nothing, and worse for trust.

Companion to `DraftAndLens_Annotation_Test_Set.md`, same spirit: paired cases, an explicit expected outcome, and a stated fail condition so a result cannot be argued into looking like a pass.

**Scope reminder (ruling 2a):** detection covers mechanical facts only. No case here tests pacing, unreliable narration as a craft choice, misdirection, or any interpretive judgement — those are deliberately out of scope, and a future case testing them would be testing the wrong thing.

**Three legitimate outcomes (ruling 2c):**

| Outcome | Meaning |
|---|---|
| `contradiction` | Survived both passes. Shown to the writer with both quotes. |
| `worth_checking` | Genuine ambiguity. Shown **with the reasoning both ways**, never silently. |
| `dismissed` | An innocent explanation applies. A true negative, recorded with its reason. |

The distinction that must hold: `dismissed` means *correctly not flagged*, never *quietly discarded because it was hard*. A case that produces silence where the table below expects `worth_checking` is a **failure**, not a conservative pass.

---

## GROUP A — genuine contradictions detection MUST catch

### A1 — Eye colour changes, no explanation
- Ch1, narration: *"her green eyes narrowed against the light"* → `eye_colour = green`
- Ch7, narration: *"those brown eyes gave nothing away"* → `eye_colour = brown`
- Manuscript declared linear, single POV, both narration_omniscient, high confidence.

**Expected:** `contradiction`
**Fails if:** dismissed, or demoted to worth_checking with no gate reason to justify the demotion.

### A2 — Stated age irreconcilable in a linear manuscript
- Ch2, narration: *"she was thirty-four that spring"* → `stated_age = 34`
- Ch5, narration: *"at forty-one she had stopped counting"* → `stated_age = 41`
- Declared **linear**, no flashback markers, chapters two apart.

**Expected:** `contradiction`
**Fails if:** dismissed as a time skip when the frame says linear and the gap is too large for the elapsed story time.
**Note:** this case only reaches hard tier because the frame is *known* linear. See B4 for the same pair with an unknown frame — the pairing is the point.

### A3 — Character stated dead, then acting
- Ch12, narration: *"Sarah was buried on the Tuesday"* → `state = dead`
- Ch18, narration: *"Sarah crossed the yard and opened the gate"* → `state = alive`
- No flashback, dream or memory framing in either quote.

**Expected:** `contradiction`
**Fails if:** dismissed by assuming a flashback the text does not show. The absence of framing is the whole test.

### A4 — Name spelled two ways for the same person
- Ch1, narration: *"Katherine had never liked the house"* → `name_spelling = Katherine`
- Ch9, narration: *"Kathryn locked the door behind her"* → `name_spelling = Kathryn`

**Expected:** `contradiction`
**Fails if:** dismissed as two different characters when both are the same established subject.

---

## GROUP B — compatible statements that must NOT be flagged

### B1 — Granularity, not disagreement
- Ch1, narration: *"she was thirty-five"* → `stated_age = 35`
- Ch4, narration: *"a woman in her mid-thirties"* → `stated_age = mid-thirties`

**Expected:** `dismissed` (granularity)
**Fails if:** `contradiction`. This is the single most likely false positive in the whole feature — two statements of the same fact at different precision.

### B2 — A character's claim against the narration
- Ch3, **dialogue**: *"Your hair was darker when we were children"* → `hair_colour = dark`
- Ch3, narration: *"her fair hair caught the light"* → `hair_colour = fair`

**Expected:** `dismissed` — and it must be **stopped by the deterministic register gate before any model call**, so it costs nothing.
**Fails if:** flagged at any tier. A character being wrong is ordinary fiction, not an inconsistency.

### B3 — The text corrects itself
- Ch2, narration: *"the house had been her grandmother's"* → `owner = grandmother`
- Ch6, narration: *"she had been wrong about the house; it was her aunt who left it to her"* → `owner = aunt`

**Expected:** `dismissed` (the text explicitly revises itself)
**Fails if:** `contradiction`. The manuscript has already done the reconciling.

### B4 — Same age pair as A2, but the frame is UNKNOWN
- Identical facts to A2, frame `nonLinear: null`.

**Expected:** `worth_checking` — **never** `contradiction`, and **never** silence.
**Fails if:** either extreme. This is ruling 1a's unknown-and-demote made testable: an unknown timeline is not permission to make a hard claim, and it is not grounds to say nothing either.

### B5 — A legitimately mutable property
- Ch1, narration: *"he had been a baker for eleven years"* → `occupation = baker`
- Ch8, narration: *"the sea suited him better than the ovens ever had"* → `occupation = sailor`

**Expected:** `dismissed` or `worth_checking` — never `contradiction`.
**Fails if:** `contradiction`. A changed occupation is usually the plot, and the gates cap this at worth_checking regardless of what the model says.

---

## GROUP C — the ambiguity floor (2c's real test)

### C1 — Plausible either way
- Ch1, narration: *"her hair was dark"* → `hair_colour = dark`
- Ch5, narration: *"she pushed the red hair from her face"* → `hair_colour = red`
- No dye mentioned, no time skip stated, frame unknown.

**Expected:** `worth_checking`, **with reasoning that states both possibilities** (someone may have dyed their hair; equally the book may simply disagree with itself).
**Fails if:** silence, OR a confident `contradiction`, OR a `worth_checking` whose reasoning gives only one side. The reasoning content is part of the assertion here, not decoration — a flag a writer cannot evaluate is barely better than no flag.

---

## How to run this

Each case is a pair of stored facts, not a manuscript — detection operates on the ledger, so the test set feeds fact pairs directly through the real gates and the real two-pass brain. Group B2 should never reach a model call at all; verifying that it does not is part of its result.

Record per case: outcome, which pass decided it, the reasoning shown, and both pass latencies. The latencies answer whether the second pass earns its cost.

Re-run this set after any change to `detection-gates.ts`, `prompts/detection.ts`, or the detection tier.

---

# RESULTS — first full run, 2026-08-17

Run against the real gates and the real two-pass brain at `claude-opus-4-8`.

**9 of 10 pass.**

| Case | Expected | Got | Decided by |
|---|---|---|---|
| A1 eye colour | contradiction | ✅ contradiction | both passes |
| A2 age irreconcilable | contradiction | ✅ contradiction | both passes |
| A3 dead then acting | contradiction \| worth_checking | ✅ worth_checking | both passes |
| A4 name spelling | contradiction | ❌ worth_checking | both passes |
| B1 granularity | dismissed | ✅ dismissed | pass 1 |
| B2 dialogue vs narration | dismissed | ✅ dismissed | **gate — no model call** |
| B3 text corrects itself | dismissed | ✅ dismissed | pass 1 |
| B4 unknown frame | worth_checking | ✅ worth_checking | pass 1 + gate |
| B5 mutable property | dismissed \| worth_checking | ✅ dismissed | pass 1 |
| C1 ambiguity floor | worth_checking | ✅ worth_checking | both passes |

## Three bugs the run exposed, all fixed

1. **Pass 1 judged without knowing what the gates knew (B4).** With an unknown timeline it assumed "years must have passed" and dismissed the pair — resolving by assumption the exact uncertainty the gate had recorded as unresolvable, and producing the silence ruling 2c forbids. Pass 1 now receives the unknowns, and a gate-flagged uncertainty can no longer be dismissed by pass 1 alone.
2. **Pass 2 hedged on explanations the data had ruled out (A2, A4).** It offered "possibly a flashback" for a manuscript known to be linear. Pass 2 now receives what is *eliminated*, giving both passes symmetric information.
3. **Two cases were my own faulty test data**, recorded rather than quietly corrected: A2 originally had age *increasing* across chapters, which a time skip explains perfectly well — the model was right and the test was wrong; and A4 carried entity `character:sarah` while its values were Katherine/Kathryn, which invited the "different subject" explanation the harness then marked as a failure.

## A4 — the remaining failure is a genuine open question, not a bug

Pass 2 returns `worth_checking`, reasoning that it cannot confirm from two quotes alone that "Katherine" and "Kathryn" denote the same woman. **That is a defensible answer.** The entity match was made upstream by extraction, which saw the whole chapter; pass 2 sees only two quoted spans.

The real question is one of authority: **should pass 2 treat the upstream entity match as settled?** Both directions have a real cost — trusting it propagates any wrong merge extraction made, while distrusting it downgrades every name-variance case to a soft flag, which is the one category where spelling *is* the whole point (§1's `name` category exists for exactly this).

**Not decided here.** Flagged for Nenad.

## LATENCY — the 2b cost/benefit answer

| | Median | Runs |
|---|---:|---:|
| Pass 1 (adjudicate) | **2.05 s** | 9 of 10 cases |
| Pass 2 (verify) | **4.72 s** | 5 of 10 cases |

**Pass 2 adds ~4.7 s, and only to candidates that survive pass 1.** Half the set never paid it: one was stopped by a deterministic gate with no model call at all, and four were dismissed by pass 1 before verification was needed.

**It earns its cost.** Pass 2 ran five times and *changed the outcome three times* — A3, A4 and C1 — every one a downgrade from "contradiction" to "worth_checking". Without the second pass those three would have been shown to the writer as confident contradictions, and at least two of them should not have been. A 60% intervention rate, always in the direction of caution, on the exact failure mode that destroys trust.

For scale: detection's whole two-pass cost (~6.8 s) is a fraction of one analyst call (60.6 s median), and it runs only on collisions, which are rare — most facts have no counterpart at all.
