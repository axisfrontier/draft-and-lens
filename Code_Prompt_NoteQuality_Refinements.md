# Code Prompt — Brain 2 Note Quality Refinements (Real Submission Evidence)

> Read CLAUDE.md and DraftAndLens_LearnedCorpus_v2.7.md first.
> Model: Sonnet / Medium. Brain 2 analyst prompt only — no UI, no lens voices, no other files.
> Audit first. Show the specific lines you plan to change. Wait for go before touching anything.
> One commit. tsc. Deploy. Verify live.

---

## Context — what a real submission revealed

A real piece was submitted and the notes identified three specific weaknesses in Brain 2's behaviour. These are not edge cases — they are systematic gaps that will recur on every submission with similar craft patterns.

---

## Gap 1 — Register slip notes are too blunt

**What happened:** Brain 2 flagged "Mind you, this new way to travel was at a time of great social and industrial change, both here and abroad" as a register slip. The note was not wrong, but it was imprecise. "Mind you" is vernacular — it keeps the narrator's voice. The slip is in the clause that follows, not the sentence as a whole.

**The rule Brain 2 is missing:** When flagging a register slip, identify WHICH part of the sentence slips — the opener, the clause, the final phrase — not the whole sentence. A note that condemns a sentence wholesale when only half of it has slipped is less useful than a note that shows the writer exactly where the voice breaks down and where it holds.

**Add to Brain 2 prompt:** When flagging register inconsistency, distinguish between the part of the sentence that holds the narrator's voice and the part that slips into exposition or explanation. Demonstrate on an invented example how the slipping clause could be recast to stay in the narrator's experiencing consciousness. Never condemn a sentence that is half-working — identify the fault precisely.

---

## Gap 2 — Expository world-building notes don't teach the move

**What happened:** Brain 2 correctly identified that Notes 08 and 09 involved the narrator becoming a tour guide rather than a man in the middle of his morning. But the notes named the problem without showing the writer HOW to deliver the same world-building information through the narrator's experiencing consciousness.

**The rule Brain 2 is missing:** When a narrator slips from experiencing to explaining — especially in speculative or historical fiction where world-building is necessary — the note must not just name the slip. It must demonstrate (on an invented example, never the writer's own words) how the same information could be delivered through what the character sees, smells, hears, resents, or finds funny, rather than through summary.

**Add to Brain 2 prompt:** When flagging expository world-building (narrator stops experiencing and starts explaining), the note must include a brief invented example showing how the same information could be carried through the narrator's immediate sensory or emotional experience. The writer needs to know the destination, not just that they've taken the wrong road.

Example of the move (for Brain 2's reference, not to be reproduced verbatim in notes):
Wrong: "This new way to travel was at a time of great social and industrial change."
Right: "Mind you, old Fletcher down at the depot had lost his licence three times since they brought in the Zones — every man and his dog had an opinion about where you were and weren't allowed to be."
The information (social disruption, new system) is the same. The register is the narrator's.

---

## Gap 3 — Notes must acknowledge dual readings before declaring a fault

**What happened:** The line "Looks good there Arthur. It's about time someone wrote something worth reading eh?" was flagged only for pronoun ambiguity ("He chuckled" — Charlie or Arthur?). Brain 2 missed that this line also works as a man reflecting warmly on social progress — not just a closing beat. A note that only flags the ambiguity without acknowledging the line's warmth and social resonance is incomplete.

**The rule Brain 2 is missing:** Before declaring a line a fault, check whether it is doing more than one thing simultaneously. A line can be warm AND ambiguous, earned AND static, funny AND expository. The note should acknowledge what the line is doing well before identifying what it could do better. Notes that only prosecute are less useful than notes that first establish what the writer got right.

**Add to Brain 2 prompt:** Before flagging any line as a weakness, state what it is doing correctly. If a line has a dual reading — where one reading is a strength and another reveals a fault — acknowledge both explicitly before recommending a fix. Never write a prosecution without first establishing the defence.

---

## Implementation

These are three additions to the Brain 2 system prompt in `src/prompts/analyst.ts`. They do not replace existing instructions — they extend them. Add them as a clearly labelled section: "Note Precision Rules" or similar, after the existing note-writing instructions.

Read the current Brain 2 prompt first. Show me exactly which section you plan to extend and the new text you plan to add. Wait for go before editing.

One commit: `fix: Brain 2 note precision — register slip, world-building move, dual reading`
