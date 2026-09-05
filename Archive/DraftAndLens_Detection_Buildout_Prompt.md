I'm stepping away for a while. Work through the following, in order. Each section is scoped so you can complete it independently — commit small verified chunks, don't leave anything half-finished, and flag genuine judgement calls clearly rather than guessing.

═══════════════════════════════════════════════
LEVEL 1 — Foundational, do first (cheap, unblocks everything else)
═══════════════════════════════════════════════

1a. BRAIN MODEL/EFFORT TIER AUDIT
List every brain in the pipeline (diagnostic/Brain 1, analyst/Brain 2, brains 3/4/5, narrator, extraction, and any others), its current model tier and effort level, and what kind of task it's actually doing — mechanical/extractive (pulling a stated fact out of text) vs. interpretive/judgement (weighing craft, comparing meaning, deciding severity). Report back which tier each currently runs on and whether that matches the nature of its task. Do not change any tiers yet — this is a report, not an action. I'll review and confirm before anything is changed.

1b. LEARNED CORPUS REVIEW
Read LearnedCorpus.md (or wherever the current version lives) in full. Report back: does it still reflect everything decided this session — the annotation self-consistency fix (diagnosis + direction, not just labelling, including for notes about strengths not just problems), the tradition-detection scoping question raised by Noel's A24 comparison issue, and anything else relevant from tonight's work? Flag anything that looks stale or contradicted by what's actually been built. Do not edit it yet — report findings first.

═══════════════════════════════════════════════
LEVEL 2 — Detection design and build (the main event, needs care)
═══════════════════════════════════════════════

2a. DETECTION SCOPE — explicitly bounded, not "catch everything"
Build detection to cover MECHANICAL facts only: stated names, ages, dates, physical descriptions, explicit stated world/plot rules, and direct factual claims. Detection must NOT attempt to judge: pacing consistency, deliberate unreliable narration, intentional misdirection/red herrings, or any interpretive craft judgement. This is not a shortcut — it matches the explicit, acknowledged industry-wide limit for this category of tool (mechanical fact-checking is AI's job; higher-level narrative judgement is not, and no serious competitor claims otherwise). State this scope boundary in the code/design docs so it isn't silently expanded later without a deliberate decision.

2b. TWO-PASS VERIFICATION, not a single confident check
A candidate contradiction should never be shown to the writer on the strength of one model call. Structure detection as: (1) an initial pass identifies a candidate contradiction between two stored facts, (2) a second, independent verification pass checks specifically whether the candidate could be explained by something other than a real contradiction (e.g. dialogue vs. narrator assertion, a granularity difference like "35" vs "mid-thirties" that are actually compatible, a stated revision/correction in the text itself). Only contradictions that survive both passes get shown to the writer. Candidates that fail verification are not silently discarded either — see 2c.

2c. SEVERITY TIERS, never silent-by-default
Nothing should be silently dropped just because it's ambiguous. Three outcomes only:
- High confidence, survives both passes → flag as a clear contradiction, cite both source chapters/quotes.
- Genuine ambiguity (plausible either way after both passes) → flag as "worth checking" severity, WITH the reasoning shown (why it might or might not be a real contradiction) — never just silence.
- Clearly not a contradiction (e.g. compatible age ranges, explained by dialogue/register) → correctly not flagged, and this is a true negative, not negligence.
The distinction between "correctly not flagged" and "silently dropped because uncertain" must be real and testable — write tests that confirm genuine ambiguous cases produce a "worth checking" flag, not silence.

2d. MODEL TIER FOR DETECTION
Detection should NOT default to the same tier as mechanical extraction brains. It requires comparative judgement closer to the analyst's (Brain 2) level of interpretive work, and a false contradiction is a direct, first-person trust hit on the writer (a factual claim about their own book, not a stylistic opinion) — worse than a weak craft note. Use the analyst's tier, or justify explicitly if a different tier is chosen, and report which was used and why.

2e. TEST SET — adversarial pairs, both directions
Before considering detection built, create a test set (similar in spirit to DraftAndLens_Annotation_Test_Set.md from earlier) with paired examples:
- Genuine contradictions detection MUST catch (e.g. stated eye colour changes with no narrative explanation, a character stated dead then acting in a later scene with no resurrection/flashback framing, an explicit age stated two different ways with no time-skip).
- Compatible statements that must NOT be flagged (e.g. "35" and "mid-thirties", a physical description given once by an unreliable narrator character in dialogue vs. the narrator's own later description, a stated fact later explicitly corrected by the text itself).
Run the real pipeline against this set and report pass/fail per case before calling detection done.

═══════════════════════════════════════════════
LEVEL 3 — Standing practice, set up but don't execute yet
═══════════════════════════════════════════════

3a. PERIODIC LIGHTWEIGHT AUDIT PRACTICE
Propose a lightweight audit checklist (aim for something completable in 15-30 minutes) to run periodically — suggest a sensible trigger (e.g. before starting any major new feature, or every N sessions) covering: dead code, duplicated logic patterns (the kind found tonight — e.g. the `!error`-without-row-check pattern that appeared in three separate functions), unused exports, and stale documentation that contradicts actual behaviour (like tonight's CLAUDE.md 26-vs-25 sidebar count conflict). Write this up as a doc/checklist for future use. Do not run a full audit right now — just produce the checklist and propose where it should live (e.g. CLAUDE.md or a dedicated AUDIT_CHECKLIST.md).

═══════════════════════════════════════════════
STANDING RULES THROUGHOUT
═══════════════════════════════════════════════

- Complete pieces only contribute facts to the ledger — not excerpts (ruling 4, unchanged).
- Commit small, verified chunks with clear messages. Never leave anything half-finished.
- Don't guess on genuine judgement calls — flag clearly at the top of your next message and wait, don't decide alone. If something in Level 2 turns out to need a design decision not covered above, stop and log it rather than picking an answer.
- Retry Bash/tools yourself on refusal; only ask for a manual command if genuinely stuck.
- Do NOT touch the pre-paid-launch checklist, the long-form chunking architecture, grammar-check, or the legal/solicitor file cluster — all explicitly out of scope.
- Do NOT start Mentor mode or differentiator messaging yet — those come after detection and timeline reasoning.
- Timeline reasoning (ledger phase 3) comes after detection is solid — don't start it until 2a-2e are genuinely complete and tested, since timeline reasoning depends on detection's fact-comparison logic already working correctly.

If you hit the usage limit wall: stop cleanly at the next safe commit point, never mid-edit. Leave a clear status note in SESSION_LOG.md covering what's done, in progress, and blocked, organized by the Level 1/2/3 structure above. Wait — don't guess at anything requiring my judgement while stopped. When usage resets and you resume, re-read SESSION_LOG.md before continuing, and pick up from where the status note left off.
