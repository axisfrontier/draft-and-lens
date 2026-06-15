# Draft & Lens — Claude Code Starter Script
## Your first session, step by step · written June 2026

> This is a script to follow, not theory. Each **bold instruction** is something you type into Claude Code in plain English. The notes under it tell you what to expect and what to check. Do the steps in order. Don't skip the verification.

---

## BEFORE YOU START (one-time, outside Claude Code)

1. **One folder.** Put these six files in a single folder on your Mac (e.g. `~/DraftAndLens`):
   - `DraftAndLens.html` (the CURRENT one — corpus/CSS fixes included)
   - `DraftAndLens_Architecture_v6.md`
   - `DraftAndLens_CursorPrompt_v6.md`
   - `DraftAndLens_LearnedCorpus.md` (v2.3)
   - `DraftAndLens_HANDOVER_v6.md`
   - `ThinkingDiscipline.md`

2. **Git.** The folder must be a Git repository before Claude Code edits anything. If you're unsure whether it is, that's fine — Step 1 below has Claude Code check and set it up for you. This is your undo button. Non-negotiable.

3. **Install Claude Code** and log in with your Claude account (the install command is on Anthropic's site). Open Terminal, `cd` into your folder, and start Claude Code there.

---

## STEP 1 — LOAD CONTEXT (don't let it build yet)

**"Read DraftAndLens_HANDOVER_v6.md and DraftAndLens_Architecture_v6.md in full. Then tell me, in plain language: what Draft & Lens is, what state the build is in, and what the next action is. Do NOT change any files yet — just confirm you understand."**

- Expect: a summary that matches your handover — prototype is source of truth, prompts must move server-side, next action is the Stage-1 migration + browser security check.
- Check: if its summary is wrong or vague, say so and have it re-read before going further. This step is the bridge from your old chats to Claude Code. Get it right.

**"Check whether this folder is a Git repository. If it isn't, initialise one and make a first commit of everything as-is, so we can undo any change. Tell me when done."**

- Expect: confirmation Git is set up and a first commit made.
- Check: do not proceed until it confirms this. Everything after here must be reversible.

---

## STEP 2 — CONFIRM THE PLAN (still no building)

**"Read DraftAndLens_CursorPrompt_v6.md and DraftAndLens_LearnedCorpus.md. Following the Architecture, lay out the migration in stages. Show me Stage 1 only: moving every brain/system prompt and all 27 lens voices server-side so no prompt text ever reaches the browser. List the files you'll create and what goes in each. Wait for my approval before writing anything."**

- Expect: a file plan — server-side `src/prompts/` modules, an API boundary, the client sending only submitted text.
- Check: it should say the prompts go in server-only files and the browser receives only results. If it proposes shipping prompts to the client in any form, stop it.

---

## STEP 3 — TWO RULES IT MUST FOLLOW (paste before building)

**"Two rules for the whole migration. One: the 27 lens voices must draw on their OWN character definitions only — never inject the LearnedCorpus into a lens prompt; the corpus governs the editor (Brain 2) only. Two: preserve the brain pipeline exactly — Brain 1 (tradition) runs before Brain 2, which receives the tradition as locked; Brain 1b and the narrator verifier are skipped on works under 5,000 words; do not collapse the pipeline into one prompt. Confirm you understand both before building."**

- Why: these are the two easiest things for any tool to get wrong, and both break the product silently. The first protects the voices; the second protects the reading.

---

## STEP 4 — BUILD STAGE 1

**"Build Stage 1 as you laid it out. Move all prompts and the 27 lenses into server-only files, set up the API boundary so the browser sends only submitted text and receives only results, and keep the exact model assignments from the Architecture. Commit when done and tell me what changed."**

- Expect: new server-side files, a commit, a summary of changes.
- Check: nothing to verify by eye yet — that's Step 5. Just confirm it committed.

---

## STEP 5 — THE SECURITY CHECK (the whole point — do not skip)

**"Run the app locally and give me the local URL. Tell me the exact command if I need to do anything."**

Then YOU do this in Chrome (Claude Code can't do it for you):

1. Open the local URL in Chrome.
2. Right-click → **Inspect** → **Sources** tab.
3. Press **Cmd + Option + F** (search all loaded files).
4. Search these five strings, ONE at a time. Each must return **ZERO results**:
   - `STEP ONE — IDENTIFY THE TRADITION`
   - `WHAT A TREATMENT IS`
   - `You are Steven Spielberg reviewing`
   - `⟦`
   - `sk-ant-`

- **All five zero** → Stage 1 is genuinely done. Tell Claude Code: *"All five strings return zero in the client bundle — Stage 1 verified. Let's plan Stage 2."*
- **Any hit** → tell Claude Code: *"This string is still reachable in the client bundle: [paste it]. It must be server-only. Fix it and tell me what you changed,"* then re-run the check.

(Allowed to appear — these are NOT secret IP: glossary definitions, the anchor *resolver* code. Only the five strings above matter.)

---

## IF YOU GET STUCK

- You can always say, in plain English: *"Undo the last change"* or *"Show me what you changed in the last step."*
- If a change goes wrong and you have Git (Step 1), say: *"Revert to the last commit."*
- You never have to write code. Describe what you want and what's wrong; let it do the work; check the result.

---

## WHAT COMES AFTER (not this session)

Stage 2 is prompt caching, the lens taster behaviour (Architecture §17 items 13–14), and the rest of the roadmap. Don't start it until Stage 1 passes the security check above. One stage at a time.

---

*Pairs with DraftAndLens_HANDOVER_v6.md and DraftAndLens_Architecture_v6.md. The handover is the source of truth for state; this is just the running order for day one in Claude Code.*
