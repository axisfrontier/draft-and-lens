# Draft & Lens — System Integrity Audit

> Read CLAUDE.md first.
> Model: Opus / High. Own session. Do not run alongside any other session.
> This is a read-and-report audit. Do not fix anything until the full report is written and Nenad has confirmed which items to action.
> No commits until go is given. No deploys until go is given.
> Use Chrome extension for all live verification.

---

## PURPOSE

Multiple build sessions have touched the brain pipeline, corpus, lens voices, and UI across separate commits. This audit checks that nothing has drifted, conflicted, or silently broken across those sessions. It is not a full codebase audit — it is a targeted integrity check on the seven areas listed below.

---

## AUDIT 1 — Brain Pipeline Integrity

Read all five brain system prompts in full:
- Brain 1: tradition identification
- Brain 1b: structural reader
- Brain 2: analyst (the most-edited brain — StoryScope bias guards, note quality fixes, genre corpus additions, excerpt mode, all added in separate sessions)
- Brains 3/4/5: scorer, parallel readers, narrator correction

For each brain, report:
1. **What it does** — one sentence
2. **What it receives** from the previous brain
3. **What it outputs** to the next brain
4. **Any conflicts** — instructions that contradict each other within the same prompt
5. **Any redundancy** — the same instruction stated twice or more
6. **Token estimate** — approximate length of the system prompt in tokens

Then report on the pipeline as a whole:
- Is the handoff between each brain clean?
- Are there any gaps — something Brain 2 expects from Brain 1 that Brain 1 doesn't reliably produce?
- Does Brain 2 correctly receive and act on the "READING MODE: EXCERPT" flag from Brain 1?
- Is the token budget safe across all five brains for a 4,000-word submission at the top tier?

---

## AUDIT 2 — LearnedCorpus v2.8 Consistency

Read `DraftAndLens_LearnedCorpus_v2.8.md` in full (all 23 principles).

Report:
1. Are any principles in direct conflict with each other?
2. Are any principles redundant — saying the same thing in different words?
3. Does the ordering still make logical sense? (Tradition-first principles should load-bear everything that follows — Principle 1 is the dependency for all others)
4. Are all 23 principles actually referenced or enforced in Brain 2's prompt, or are any orphaned (in the corpus but not reaching the analyst)?
5. Are the six new genre principles (17–22) integrated consistently with the original literary principles (1–16), or do they feel bolted on?
6. Is Principle 23 (excerpt readings are not deficit readings) correctly positioned and consistent with the excerpt mode additions to Brain 2?

---

## AUDIT 3 — All 36 Lens Voices Functional Verification

Using the Chrome extension, submit a short test piece (3–4 paragraphs of literary fiction) and select each of the 36 lens voices in turn. For each:

1. Does the lens card render correctly? (Portrait image, name, description visible)
2. Does selecting the lens produce a reading? (No silent failure, no error state)
3. Does the reading reflect the lens voice's documented philosophy, or is it generic?

Flag any lens that:
- Fails to render
- Produces an error
- Produces a reading indistinguishable from the default (suggesting the lens prompt isn't loading)

You do not need to read all 36 readings in full — spot-check for generic output on the 8 new voices (Chandler, Leonard, Highsmith, King, Le Guin, Christie, Morrison, Ferrante) and the 9 new/upgraded voices added in Session 3 (Blume, Lucas, plus the 7 from Part B). The 27 original voices are lower risk.

Also confirm:
- All 36 voices appear in the correct genre group in the UI
- The header reads "36 Ways of Looking" (or equivalent)
- Portrait images are rendering in grayscale for the new voices

---

## AUDIT 4 — Sign-in Gate Edge Cases

Using the Chrome extension, test these specific flows:

1. **Text preserved after sign-up:** Paste text into the upload panel (logged out), see the gate overlay, click "Create account", complete sign-up — is the pasted text still there when you return?
2. **Text preserved after sign-in:** Same flow but clicking "Sign in" instead of "Create account"
3. **Mobile width:** Resize browser to 375px. Does the overlay render correctly? Are both buttons tappable?
4. **Already signed in:** Load the homepage while logged in — confirm the overlay does not appear
5. **Session expiry:** If Clerk session expires mid-use, what does the user see?

Report each flow: pass / fail / partial, with details on any failure.

---

## AUDIT 5 — Password Gate Still Active

Confirm:
1. Visit draftandlens.com in an incognito window (not logged into the beta password). Is the password gate the first thing shown?
2. Confirm the beta password is stored in an environment variable in Vercel, not hardcoded in the codebase (grep for any hardcoded password strings)
3. Confirm the password gate is not bypassable by navigating directly to `/analysis` or other internal routes

---

## AUDIT 6 — Word Count Accuracy at the Limit

Test the word count counter with:
1. A prose submission of exactly 4,000 words — does the counter read 4,000? Does the Analyse button remain active?
2. A prose submission of 4,001 words — does the counter flag the limit? Is the Analyse button disabled?
3. A script submission of 4,000 words — scripts have different formatting density (slug lines, action lines, dialogue). Does the counter handle script formatting correctly, or does it under/overcount?

Report: accurate / inaccurate, with details on any discrepancy.

---

## AUDIT 7 — Excerpt Mode Handoff

Confirm the excerpt mode declaration flows correctly end-to-end:

1. On the homepage, select "Excerpt" from the submission type toggle
2. Submit a short passage that begins mid-scene (no setup, no resolution)
3. Confirm the reading opens with "This is a reading of an excerpt..."
4. Confirm Brain 2's reading does NOT flag missing arc, missing setup, or missing resolution as faults
5. Confirm Brain 1's output includes "READING MODE: EXCERPT" and that this is visible in any debug output or logs you can access

Then repeat with "Complete piece" selected and the same passage — confirm the reading does NOT open with the excerpt header, and that the reading treats it as a complete piece (which it isn't — this will reveal how Brain 2 handles the ambiguity, worth noting).

---

## OUTPUT FORMAT

Produce the report in this structure:

### Executive Summary
- Overall system health: Good / Needs attention / Critical issues found
- Three most important findings, in order of priority

### Audit 1 — Brain Pipeline
[Findings per brain, then pipeline-level findings]

### Audit 2 — LearnedCorpus
[Findings per principle group, then overall]

### Audit 3 — Lens Voices
[Pass/fail per new voice, any rendering issues, genre group accuracy]

### Audit 4 — Sign-in Gate
[Pass/fail per flow]

### Audit 5 — Password Gate
[Pass/fail with notes]

### Audit 6 — Word Count
[Accurate/inaccurate per test]

### Audit 7 — Excerpt Mode
[Pass/fail end-to-end]

### Issues Requiring Action
List every issue found, in priority order:
- **Issue:** what is wrong
- **Where:** file/line or UI location
- **Why it matters:** impact on users or output quality
- **Recommended fix:** what to do

### What's Working Well
List what passed cleanly — be specific, not generic.

---

## IMPORTANT
Do not fix anything during this audit. The value of this session is a clean, honest report before any further building. Fixes go in a separate session after Nenad reviews the findings and confirms which items to action.
