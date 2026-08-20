# D&L Annotation Quality — Adversarial Test Set

Purpose: catch notes that critique a craft choice without checking whether the manuscript's own established context already justifies it — the failure pattern found in the "lightbulb/storm" case (2026-08-15).

Each snippet deliberately contains a detail that *looks* like a generic craft flaw (vague verb, telling-not-showing, cliché image) but is actually well-motivated by context established earlier in the same short piece. A correct reading should either not flag it, or flag it while acknowledging the justification. An incorrect reading flags it as if the context didn't exist.

Run each through D&L. For each note generated on the marked line, check: does the note account for the established context, or does it critique in a vacuum?

---

## Test 1 — Weather-motivated verb choice (the original case)

> The storm had been building since noon, the sky the colour of a bruise, rain coming in at an angle that stung. By the time it broke properly, the whole street was a wind tunnel — bin lids airborne, a garden umbrella cartwheeling past the bus stop.
>
> **A necklace of broken lightbulbs danced wildly along the length of the tin roof.**
>
> Under it, Marcus pressed himself flat against the wall and waited for a gap between gusts.

**Marked line:** "A necklace of broken lightbulbs danced wildly along the length of the tin roof."

**Expected:** "Dances wildly" is directly motivated by the storm/wind established two sentences earlier. A note should not treat this as a lazy default verb needing more precision — the vagueness is already earned by context (wind makes things move unpredictably; a precise, deliberate verb would arguably work *against* the chaos being depicted).

**Fails if:** the note asks for a "more specific verb" or calls "dances wildly" generic/default without acknowledging the storm.

---

## Test 2 — Deliberately flat dialogue (character-motivated, not weak writing)

> Grief had made her practical in a way that unsettled people. She hadn't cried once since the funeral.
>
> "The car needs to go," she said. "And the house. Both of them."
>
> Her sister stared at her. "That's it? That's all you're going to say?"
>
> "What do you want me to say."

**Marked line:** "The car needs to go," she said. "And the house. Both of them."

**Expected:** Flat, unadorned dialogue with no interiority is the point — it demonstrates the practical/detached grief established in the first line. A note should not ask for more emotional depth or interiority in this line; that would undermine the characterisation already set up.

**Fails if:** the note suggests adding emotional depth, introspection, or a stronger verb-of-speech to this line without recognising it's a deliberate character choice.

---

## Test 3 — Repetition as device, not error

> He checked the lock. Checked it again. Checked it a third time, fingers on the deadbolt, feeling for the give that would mean it hadn't caught.
>
> Behind him, the kettle clicked off. He didn't move.

**Marked line:** "He checked the lock. Checked it again. Checked it a third time..."

**Expected:** The repetition of "checked" is a deliberate device conveying compulsive anxiety, not a vocabulary/variety weakness. A note should not flag this as repetitive word choice needing synonyms.

**Fails if:** the note suggests varying the verb ("checked... verified... tested...") without recognising the repetition is doing characterisation work.

---

## How to use this set

1. Submit each test piece to D&L as a standalone story.
2. For every note that lands on or near the marked line, check it against the "fails if" criterion.
3. Log any failure in `DraftAndLensBeta_Feedback_Tracker.md` under Bugs, with the test number and the exact note text produced.
4. Re-run this full set after any change to the analyst prompt (`src/ai/brains/analyst.ts` or its directives) to confirm no regression.

Add new test cases here whenever a real report produces a "note ignores established context" failure — that's the fastest way this set stays useful rather than going stale.
