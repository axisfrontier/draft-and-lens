# Code Prompt — Speed Optimisation + Final Fixes + DNS

> **Model for Code: Sonnet / Medium** for all changes except where noted.
> Read CLAUDE.md first. Use Chrome extension for all live verification — never ask Nenad to do live tests. One commit per change. tsc before every commit. Audit before touching anything.

---

## PART A — SPEED OPTIMISATION (PRIORITY — do this first)

### Context
Brain 2 (the analyst) accounts for ~85–90% of total analysis time. On a 3,556-word piece, total time was 173 seconds. Target: 60–90 seconds for long pieces, 15–20 seconds for short.

### A1 — Upgrade Brain 2 to Opus 4.8 Fast Mode (biggest single win)
Opus 4.8 Fast Mode generates output tokens significantly faster. The cost premium (~2x) is negligible at beta scale (~£0.40–0.80 per long reading).

**Audit first:** read `src/ai/config.ts` and the orchestrator. Confirm:
- Which model string is currently used for Brain 2 (Opus 4.7 or 4.8?)
- Whether `speed: "fast"` is set
- Whether the `fast-mode-2026-02-01` beta header is present

**Then implement:**
- Update Brain 2's model to `claude-opus-4-8`
- Add `speed: "fast"` to the Brain 2 API call
- Add the required beta header `anthropic-beta: fast-mode-2026-02-01`
- Keep all other Brain 2 settings unchanged (maxTokens 16000, streaming, effort)
- One commit

### A2 — Add prompt caching to Brain 2's system prompt
The analyst system prompt (containing the LearnedCorpus principles) is sent on every call. Caching it saves ~90% on input tokens for the system prompt and reduces latency on repeated calls.

**Implement:**
- Add `cache_control: { type: "ephemeral" }` to Brain 2's system prompt content block
- This caches the system prompt for 5 minutes — covers revision-awareness re-runs and rapid retesting
- Do NOT cache the user's submitted text (the manuscript) — only the system prompt
- One commit

### A3 — Confirm streaming starts immediately
Brain 2 already streams. Confirm there is no buffering or wait-for-completion logic before the first tokens reach the UI. The writer must see text appearing within 5–10 seconds of submitting.

**Audit:** trace the streaming path from Brain 2's API call to the UI. If any await/buffer is delaying the first streaming chunk, remove it. Report findings.

### A4 — Confirm structural sampling is active for long texts
For pieces over the Brain 1b threshold (~5,000 words), confirm the orchestrator is using structural sampling (not sending the entire raw manuscript to Brain 2 without any sampling). If structural sampling is not implemented or is broken, flag it — do not implement from scratch without discussion.

### A5 — Add a time estimate to the UI (user expectation management)
When the user clicks Analyse, show a plain-text estimate immediately below the progress bar based on word count:
- < 800 words: "Your reading will be ready in about 20 seconds"
- 800–3,000 words: "Your reading will be ready in about 1 minute"
- 3,000+ words: "Your reading will be ready in 2–3 minutes"

Plain text only. No new visual elements. Disappears when the report arrives. One commit touching `page.tsx` only.

### A6 — Over-limit handling (future-proofing for live launch)
The current 4,000-word cap blocks submissions silently or with a basic message. Implement a proper over-limit experience:
- If submission exceeds 4,000 words, block analysis and show: "Draft & Lens currently reads pieces up to 4,000 words — a chapter, a short story, or a treatment. Paste an excerpt and we'll give it our full attention. Full-length script and novel support is coming."
- Show the current word count vs the limit clearly ("5,234 / 4,000 words")
- Do NOT just grey out the button with no explanation
- This message and limit value must be easy to update in one place when the cap changes at live launch

### A6 — Measure and report actual times
After implementing A1–A2, run timed tests using the Chrome extension:
- Submit the Royal Descent text (~467 words) — record actual time
- Submit a ~3,500-word piece — record actual time
Report both times. Target: 15–20s short, 60–90s long.

---

## PART B — DNS FIX

`draftandlens.com` and `www.draftandlens.com` show "Invalid Configuration" in Vercel. `draft-and-lens.vercel.app` works correctly.

**Using the Chrome extension:**
1. Navigate to the Vercel project → Settings → Domains
2. Read the exact DNS records Vercel requires for both `draftandlens.com` and `www.draftandlens.com` (A record, CNAME, or nameserver values)
3. Run a DNS lookup on `draftandlens.com` to confirm where it is currently managed
4. Report the exact records that need adding/changing and where to add them

**Do NOT make DNS changes yourself.** Report and wait for Nenad's explicit go-ahead. This is a production domain — one wrong change makes the site unreachable.

---

## PART C — FINAL STYLING AND REGRESSION VERIFICATION

Using Chrome extension on `draft-and-lens.vercel.app`, submit the Royal Descent text. Confirm all of the following. Fix any failures — one commit per fix:

1. Analysis phase shows full styling throughout (warm paper background, serif fonts, correct tokens — no bare/unstyled state at any point)
2. Amber animation visible and actually animating during analysis (not just present in DOM)
3. All 13 report sections render in order (Overview through Revision Notes)
4. Sidebar shows exactly 26 links across all sections
5. Tradition kicker text readable (using var(--ink-soft), not pale #c8b898)
6. Scores dashboard: qualitative labels visible (not numbers)
7. globals.css pillFlash keyframe uses var(--amber)/var(--amber-l) not hardcoded hex
8. ReportView.tsx Document label uses var(--ink-soft) not hardcoded #c8b898

---

## PART D — IP BOUNDARY CHECK

After all commits, run the bundle IP grep: `.next/static` must not contain any of the 5 IP markers. Report result. Must return exit:1.

---

## PART E — AFTER EVERYTHING

1. Deploy all commits, fire Vercel hook, confirm `deploy:201`
2. Use Chrome extension to do a final live verification pass on `draft-and-lens.vercel.app`
3. Report: what was fixed, actual analysis times before/after speed optimisation, DNS records needed
4. Update CLAUDE.md with any new permanent lessons from this session
