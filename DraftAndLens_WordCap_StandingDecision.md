# Word Cap — Standing Decision (2026-08-20)

## The bug (confirmed, recurring)
Any fixed *minimum* word threshold for internal features (e.g. structural map needing "≥4,000 words") recreates the exact same dead-zone problem as the original bug, just at a different number. 2,999 vs 3,000 is the same failure as 4,000 vs 4,001. A second threshold is not a fix.

## The actual fix
There is only ONE boundary allowed in the system: the hard submission ceiling (4,000 words). Nothing else gates on word count internally.

1. **At submission**: if pasted/uploaded text exceeds 4,000 words, reject before it reaches any brain. Show a warm, editor-voiced rejection message (not a cold system error) — e.g. something like: *"This one's a little over the line for Beta — I can only take pieces up to 4,000 words right now. Trim it down and send it my way."* Exact copy to be written in the Editor's established voice once that voice is finalised.

2. **Below the ceiling, at any length**: all brains must function correctly and proportionately. Nothing internal should have its own separate minimum-word gate. A 500-word piece gets lighter, appropriately-scaled analysis — not a broken one, not a null one, not degraded quality from an artificial cutoff.

## Why this matters
This was raised and agreed in a prior session but not written down — cost real time to re-derive. This file is the permanent record so it cannot be lost again.

## Action for Code
Remove any secondary word-count minimum gates (e.g. the structural map's ≥4,000 threshold). Structural mapping and all other brains should scale to whatever is submitted, up to the 4,000 ceiling, with no internal cutoff.
