# Code Prompt — Note Quality: Dedup, Complete-the-Set, and Teach-the-Move Tasters

> **WHEN TO RUN THIS:** only after ALL of the following are done — (1) the 3 keys rotated (Anthropic, Clerk secret, Supabase service_role); (2) CHANGE 4 built (export / per-work delete / full account-wipe / view / rename / undo-delete); (3) data-protection verification passed; (4) the security re-check clean (bundle grep exit:1, RLS test, deletion test). If any of those is outstanding, STOP — finish it first. This is a separate, later build; do not interleave it with the security work.

> **HOW TO START:** read this whole prompt first, plus `DraftAndLens_LearnedCorpus_v2.5.md` (the "Teaching the move" clause it implements). Then tell me your plan and which files you expect to touch BEFORE writing any code — audit before building. I will also give you two before-state screenshots of the circus-story reading; the "Before-state evidence" section below describes exactly what they show. Work one fix at a time, commit each as an isolated commit, and stop after each to tell me what changed and how to verify it.

> Three connected fixes to how notes are generated and rendered, driven by a real reading where "adjective density is high" appeared three times with only one of five instances addressed and no guidance on the move. Governing law: `DraftAndLens_LearnedCorpus_v2.5.md` — the extended "Illustrative Examples → Teaching the move" clause. This is mostly an **analyst (Brain 2) prompt change + a report-rendering fix**, not new infrastructure. Keep the IP boundary intact (analyst prompt stays server-side); re-run the bundle grep if any client surface changes.

> The one law that governs all three: **teach the move, never fix the work.** Demonstrate a technique on one instance so the writer applies it themselves. Never hand back a corrected line or a corrected set. "Here's the move, yours to take across the rest" is editor; "here's your paragraph, fixed" is ghostwriter.

---

## FIX 1 — De-duplicate identical notes (report-rendering / note-generation bug)

In the sample reading, "Adjective density is high: [same five words]" rendered as Notes 04, 07, AND 09 — identical, three times. Also "Strong sonic patterning: [same examples]" appeared twice (02, 10).

- A note making the same point with the same content must appear **once**, not pinned to multiple lines.
- If the underlying issue spans several lines, that's ONE note that *names* the multiple locations — not N copies of the same note.
- Implement as a de-duplication pass over the note set before render (collapse notes with the same point/content; merge their line references). Investigate whether the duplication originates in the analyst output or the anchoring/rendering — fix at the source if it's generation, at render if it's anchoring.

---

## FIX 2 — A note that names a SET must account for the SET (analyst prompt)

Note 04/07/09 listed five adjectives (burnt yellow, broken, inky, solitary, corridor of light) but only Note 08 / the general note addressed ONE ("solitary"). The writer is told there's a problem across five and given a path for one.

- When the analyst names a problem with multiple instances, it must **address the set**: either demonstrate the move on one and explicitly name that the same move applies to the others, or briefly note which instances are load-bearing vs cuttable.
- It must NOT name five and silently resolve one. Either the set is the note, or pick the single strongest instance and say so — no dangling "here are five problems, here's one answer."

---

## FIX 3 — Teach-the-move tasters (the centrepiece — analyst prompt)

This implements the v2.5 corpus clause. Where a note names a **line-level craft problem with a shape** (adjective density, editorialising, telling-not-showing, generic image, etc.), the analyst offers a **demonstration of the move** — optional, in the editor's voice, framed as one direction.

**It MUST:**
1. **Teach the technique on ONE instance**, so the writer can apply it to the rest. E.g. adjective density → "test each adjective by removing it and seeing if the image survives — 'a yellow caravan' may already do the work of 'a burnt yellow caravan'." The writer learns the *test*, then runs it themselves.
2. **Make the craft term legible.** When the note uses a term the writer may not know, the taster doubles as a plain-language definition AND links the glossary (§19) term. Goal: next time the writer meets "adjective density," they know what it means and what to do — without D&L. (This is explicit hand-holding for writers who don't know grammatical/craft terminology — a core user need.)
3. **Demonstrate on one, name that it applies to others** — never silently fix the set.

**It MUST NOT (the ghostwriter line):**
- Hand back the writer's line rewritten ("here's your sentence, fixed").
- Hand back the corrected set (all five adjectives pre-cut).
- Present the example as *the* fix rather than one demonstration of a move.
- Introduce a new demand the note didn't already name.

**Scope:** tasters attach to *line-level craft notes that have a teachable move*. They do NOT attach to structural notes (e.g. "the ending tells us what to think" — Note 13 — is a telling-not-showing note and CAN carry a move; but "the second act sags" is structural and may not). Use judgement: if there's a repeatable technique, teach it; if the note is observational or structural, leave it.

**Tone (Principle 8 + Principle 10):** the taster carries the mentor disposition — developmental, encouraging, "here's a way in," never "you did this wrong, do this instead." It's the hand that makes a stuck writer un-stuck, on their own terms.

---

## Worked example (use as the standard to match, from the real sample)

The sample's Note 04/07/09 ("Adjective density is high: burnt yellow caravan, broken lightbulbs, inky dark, solitary figure, corridor of light") should become ONE note, roughly:

> **Adjective density.** Several images here stack a describing word before the noun — *burnt yellow* caravan, *inky* dark, *solitary* figure. That's not wrong in this heightened, sonically dense tradition — but when every noun arrives pre-described, the reader stops doing the seeing. *The move:* test each adjective by removing it and asking whether the image survives without it. "A figure steps out" is already solitary; "the dark" may not need "inky" if the lightbulbs have done the work. Run that test across the five and keep only the ones that earn their place. *(adjective density →* glossary link *)*

Note that this: names the term, makes it legible, teaches ONE test, applies it across the set, keeps every actual cut the writer's decision. That's the target.

---

## BEFORE-STATE EVIDENCE (real screenshots, 21 June — the concrete target)

Two screenshots of the circus-story reading captured the exact faults this prompt fixes. Use these as the before-state; re-analysing the same paragraph after the build must not reproduce them.

**The duplication is severe (Fix 1) — observed in the Notes-on-the-text column:**
- Notes 02, 03, AND 04 were **word-for-word identical** ("the risk: three adjectival pairings stack in the first sentence alone (bluff and blustery, sea without a shore, then urgent wind / toothless tune / swaying trees…").
- Notes 05, 07, AND 13 were identical to each other ("Decide whether the present tense (sits, clicks, looks down) is the register for the whole piece — at 201 words you cannot afford the tense uncertainty…").
- Notes 08 and 12 were identical ("Make the solitary figure descent moment carry one specific physical detail of the crone — a hand on the rail, the sound of her breath…").
- Note 14 ("The sentences are long, image-dense, and almost all built on subordinate or participial extension…") appeared in the notes column AND again under "general notes (not pinned to a line)."

So out of 17 pinned notes, a large share were duplicates of three or four underlying points. **Target: each underlying point appears ONCE, naming its multiple line locations.** Investigate whether the duplication is in note generation or in anchoring (the same note pinned to multiple lines) and fix at source.

**The guidance was uneven (Fix 2 + Fix 3):**
- Some notes already taught a move well ("test each adjective by removing it"; "carry one specific physical detail — a hand on the rail, the sound of her breath"). Keep that standard.
- Others stopped at a verdict the writer couldn't act on ("Decide whether the present tense is the register") — named a question, taught no move. These are the ones to lift.
- The adjective-density note named the set but the per-line guidance still didn't account for all instances (Fix 2).

**What was already good (do not regress):** the Action Plan and What To Fix Next had become genuinely actionable ("Cut one adjectival pair from the opening sentence"); the tradition ID and tone were intact. The fix is to the *notes column* quality and duplication, not the action boxes.

---

## Where this fits the pipeline
- Fixes 2 and 3 are **analyst (Brain 2) prompt** changes — server-side IP.
- Fix 1 is a **note-set processing / render** change.
- None touches the lens voices (they have their own register and their own example rule per the corpus SCOPE clause — do NOT apply the editor's taster spec to them; a voice's example is already governed separately).
- The glossary linking reuses the existing §19 system — no new glossary infrastructure.

## Verify
- The sample paragraph re-analysed: "adjective density" appears ONCE, names the set, teaches one move, links the term — no triple-repeat, no dangling single fix.
- No note hands back a rewritten line or a corrected set.
- A structural note (no teachable move) correctly carries NO taster.
- Glossary term links resolve.
- Lens voice notes unchanged (editor taster spec not applied to them).
- IP boundary intact; bundle grep PASS if client surface changed.
