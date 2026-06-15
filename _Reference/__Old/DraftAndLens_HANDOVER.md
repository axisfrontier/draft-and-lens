# Draft & Lens — Handover Note for a New Chat
*Paste this at the start of a new conversation so the assistant has full context. Upload `DraftAndLens.html` and the four spec docs alongside it.*

---

## What Draft & Lens is

A single-file HTML web app that gives writers an **editorial reading** of film scripts, short fiction, and stage plays. It is a *reading* tool, not a generator: it reads each work **on its own terms** (tradition first), names craft problems, points to where the work is reaching — but **never rewrites**. Positioning: "A reading, not a verdict." Pro-craft, not anti-AI. The differentiator vs competitors (e.g. Greenlight Coverage) is **tradition-aware analysis** + **27 master "lens" voices**, rather than scoring every work against one fixed rubric.

It calls the Anthropic API directly from the browser using the user's own API key (stored in sessionStorage). The user (Nenad) runs it locally via `file://` and pastes back console output / screenshots — the assistant cannot run live analysis (no browser, no key).

## Files in play

- **`DraftAndLens.html`** — the working prototype (~616KB). The live product. All edits happen here.
- **`DraftAndLens_Architecture_v5.md`** — the build "law" for the production Next.js version. Read it before any structural decision.
- **`DraftAndLens_CursorPrompt.md`** — paste-in prompt to convert the HTML to a secure server-side Next.js app.
- **`DraftAndLens_BetaNDA.md`** — one-page beta tester agreement.
- **`DraftAndLens_SetupChecklist.md`** — plain-English Vercel/Clerk/API-key setup.

## Standing working rules (Nenad's, persistent — follow these every time)

1. **Token economy.** Do NOT re-read or over-analyse the whole 616KB file. Grep for the exact lines, edit those, move on. He insists on this repeatedly.
2. **Mandatory verification before every handoff.** After any code change: confirm every called function is defined; extract the main `<script>` and run `node --check`; confirm the file ends with `</html>\n`; grep-confirm the specific change landed. He calls this the "standing system check."
3. **Fix only what's asked.** Don't break or restyle other areas. No unrequested refactors.
4. **Keep responses short.** No apology theses, no over-explaining. Be useful, not merely helpful — push back when he's wrong, flag foundational issues before building on assumptions.
5. **After editing:** copy `/home/claude/DraftAndLens.html` → `/mnt/user-data/outputs/DraftAndLens.html` and `present_files` it.
6. **Tone in product copy:** brief, confident, no metaphors in formal copy, no critical/alarmist language. Informational over alarm (e.g. free-tier notices are amber, not red).
7. He wants **best-in-class, senior-developer-grade** code and architecture — neat, organised, no duplication, no broken areas, clearly explained.

## Architecture: the 7-brain pipeline (all in the HTML now; moves server-side in production)

Sequential pre-passes (each depends on the prior — cannot be parallelised):
- **Brain 1** `runDeepRead` / `PASS1_SYSTEM` — diagnostician: identifies tradition/register/ambition. (now wrapped in 35s timeout)
- **Brain 1b** `runStructuralReader` / `STRUCTURAL_READER_SYSTEM` — evidence map. (45s timeout)
- **Narrator verify** `runNarratorVerifier` — classifies narrator lines. (30s timeout)

Then parallel (`Promise.all`):
- **Brain 2** `runMainAnalysis` — the analyst, Opus 4.7, streaming, 8000 tok, adaptive thinking, effort:high. **Now has an AbortController stall guard: 45s to first token, 20s between chunks; aborts and shows an error instead of hanging.**
- **Brain 3** `runDashboardScores` — craft + tradition-alignment scores (JSON).
- **Brain 4** `runStudioMatching` — market matching; **now recognises known produced works (§14) and names comparables instead of pitching to the maker.**
- **Brain 5** `runBibleGeneration` — character bible.

On demand: **Brain 6** `runLensAnalysis` (27 lens voices, `LENS_DATA` + `getLensSystemPrompt`), **Brain 7** `sendConvMessage` (conversation).
Post-stream: `runNarratorCorrection` rewrites (never deletes) any note that wrongly flags verified narrator elevation.

Mode prompts: `SCRIPT_SYSTEM`, `STORY_SYSTEM`, `PLAY_SYSTEM`. Format detection: `detectModeFromText()` (prose vs script vs play, by markers + paragraph length). **NEVER** use budget_tokens (breaks Opus 4.7).

There is an **EDITORIAL IP INDEX** comment block in the HTML (just before `SCRIPT_SYSTEM`) mapping every prompt/lens/brain to its server-side destination file.

## Key design tokens

`--paper:#f5f1e8` `--black-band:#14120e` `--amber:#a86c10` `--amber-d:#7a4e08` `--amber-l:#c88c30` `--teal:#2a7a7a` `--green:#2a5030` `--tension:#b03010` `--red:#8b2020`. Fonts: Libre Baskerville (headlines), IBM Plex Sans (body), IBM Plex Mono (labels). `FREE_WORD_LIMIT = 10000`.

## What's been built recently (all verified in the current file)

- **Two-column homescreen** (pitch left, upload right, vertical divider, lenses full-width beneath, footer). Logo block removed. Headline "An editorial intelligence. / Not a ghostwriter." ("Not a ghostwriter" weight 300). Single-line headline + quote; page max-width 1320, gap 4.5rem. Intent field removed.
- **Standalone nav pages**: About / Glossary / Feedback / Legal each render alone (hide upload + report + sidebar via `openNavSection`); all four populated with real content.
- **Free-tier over-limit** = permanent law: >10,000 words truncates to first 10k on a word boundary, never blocks. Amber (not red) informational notice; white limit label; "Upload new file" secondary button (auto-width). Separate `#truncationBanner` at top of truncated reports.
- **Partial-read honesty (§13)**: `currentTruncated`/`currentTotalWords` set in `startAnalysis`; `PARTIAL_READ_DIRECTIVE` prepended to the analyst prompt when truncated — be confident about the opening, provisional about the whole, never invent a third-act problem it didn't read.
- **Known-work matching (§14)**: studio brain recognises produced works (confidence-gated), shows a `#studioKnownWork` note, pivots to comparable companies.
- **Title auto-fit** `fitTitle()`: keeps the title on one line, shrinks font to a 1.4rem floor, ellipsis beyond; diagnostic titles trimmed to drop subtitles.
- **Tradition-alignment bars**: `--teal` was undefined (bars invisible) → now defined.
- **docx upload** via mammoth.js; per-format error messages explaining *why* a file can't be read.
- **Conversation panel** reordered: input + revision notes above, message thread below; "Editorial / Mentor feedback" label; writer message full-width, label left; input restyled to match homescreen.
- **Stall guards**: 3 pre-passes wrapped in `withTimeout`; main streaming analysis wrapped in AbortController (the most recent fix).

## Open items / known issues

- **Format misdetection on prose-style scripts.** The *Terminator* upload is a **treatment** (continuous prose, no scene headings), so `detectModeFromText` classified it as "Story" and ran the story pipeline. This is the current live problem: detection by paragraph shape can't tell a prose treatment from a short story. Consider: respect the user's manual mode toggle over auto-detect, or detect "treatment" as a third script sub-type. **The user will likely raise this next.**
- **Speed at scale** (Arch §14b): real wins are prompt caching, scaling Brain 1b's read to input length, right-sizing extraction models, earlier analyst start, honest staged labels. "More brains" is the wrong answer. Pre-passes must stay sequential.
- **Tradition-bias testing** (pending, pre-launch): confirm Brain 1 correctly IDs non-allegorical traditions (kitchen-sink, minimalist, comedy) without drift toward the Avarice/allegory calibration.
- **Studios "unavailable" empty state** = live API/key failure (401/no key on file://), not a code bug.
- **Server-side migration is the gating launch step** — prompts must move off the client before ANY tester touches it (DevTools currently exposes everything). Order: server-side first → Clerk gating → small known cohort → light NDA.

## Two persistent editorial frameworks (saved to memory; apply to D&L decisions)

1. **Learned Editorial Corpus v2.0** — identify tradition before any craft rule; narrator = world-establishment / elevation / restatement (only restatement fails); a tradition's primary instruments aren't failures; juxtaposition is about specificity not existence; verify text before claiming absence; tone preserves author confidence; tradition ID is the load-bearing dependency.
2. **Discipline of Correct Thinking** — attention before understanding before solution; find the question beneath the question; strip assumptions via first principles; five thinking categories (empirical, structural, historical, ethical, synthetic); never move to solution before the problem is fully understood.

## How to extract + verify the script (the standing system check)

```bash
# Extract main script and syntax-check
python3 -c "
data=open('DraftAndLens.html',encoding='utf-8').read()
s=data.find('<script>',26026); o=data.index('>',s)+1; c=data.rfind('</script>')
open('v.js','w',encoding='utf-8').write(data[o:c])"
node --check v.js
# Confirm file integrity
python3 -c "print(open('DraftAndLens.html').read().endswith('</html>\n'))"
```

## Latest state

The most recent edit added the AbortController stall guard to the main analysis (Brain 2), because the previous "timeout" only logged to console and never actually aborted — so a stalled stream hung forever and the thinking timer vanished. The pre-passes already have `withTimeout`. Next likely topic: the Terminator-treatment format misdetection (Story vs Script).
