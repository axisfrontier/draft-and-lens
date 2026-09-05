# Code Prompt — Make the analysis notes perfect (Brain 2 / report)

> Governing law: `DraftAndLens_LearnedCorpus_v2.6.md` (Principles 9, 10, 11 + "Teaching the move"). This is mostly an analyst (Brain 2) prompt change + report-render fix — not new infrastructure. Keep prompt/lens IP server-side; re-run the bundle grep if client surface changes.

## OPERATING PROTOCOL (every edit)
Audit first → show me the plan and which files → wait for my "go" → additive edits only, never rewrite a component → one fix per commit → run `tsc` and confirm the page renders after each → revert, don't patch, on breakage. Sonnet/Medium.

## The goal, in plain terms
Every note must be: **non-repetitive, complete, actionable, and legible.** No note that names a problem without showing what to do. No duplicates. No vague or jargon terms left unexplained. This is the standard a confused but serious writer should feel helped by.

## The five fixes (one commit each, in this order)

1. **Dedup.** An identical or near-identical note must appear ONCE, naming its multiple line locations — never 3–4 copies. (Check whether duplication is in generation or anchoring; fix at source.)

2. **Account for the set.** A note that names several instances (e.g. five adjectives) must address the set — demonstrate the move on one and state it applies to the others — not flag five and resolve one. No dangling instances.

3. **No hanging notes — teach the move.** Every note that names a craft problem with a fixable shape must show HOW to fix it, demonstrated on ONE example, so the writer applies it themselves. Never just the verdict ("too many adjectives"); always the move ("test each by removing it — does the image survive? 'a yellow caravan' may already do the work of 'a burnt yellow caravan'"). NEVER hand back the rewritten line or a corrected set — teach, don't ghostwrite.

4. **No vague/hard terms left cold.** When a note uses a craft term a non-expert may not know, make it legible in plain language AND link the glossary (§19). Goal: the writer learns the term + the move, and won't need D&L for it next time. No bare jargon.

5. **Don't fault abstraction mechanically (Principle 11).** Distinguish load-bearing abstraction (names a perception the concrete can't carry — e.g. "destitute-inspired fashion" = the crone reading the girl as real, not fashionable-poor — DO NOT fault) from floating abstraction (replaces needed concrete / restates what the image already showed — e.g. "story to tell" — flag this). Verify function before faulting.

6. **Anchoring (do AFTER dedup).** Every highlighted span links to the note that actually discusses it. Rebuild the mapping against the final (deduped) note set.

## Scope
- Line-level craft notes only. NOT structural/observational notes (those carry no "move").
- Editor (Brain 2) only — do NOT apply this to the lens voices; their examples are governed separately (SCOPE clause), and never feed them the corpus.

## Before-state test (pass/fail)
Re-analyse the circus-story paragraph. PASS = no duplicate notes; "adjective density" appears once, names the set, teaches one move, links the term; "destitute-inspired fashion" NOT faulted; "story to tell" flagged as floating; every highlight links to the correct note; no note states a problem without a path to fix it.

## Verify
- Each fix: `tsc` clean, page renders, isolated commit.
- Final: the circus paragraph passes the before-state test above.
- Bundle IP grep PASS if client surface changed; lens voices unchanged.
