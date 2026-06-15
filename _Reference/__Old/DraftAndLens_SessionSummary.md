# DRAFT & LENS — COMPLETE SESSION SUMMARY
## For continuity in a new chat session

---

## THE PRODUCT

**Draft & Lens** is a single-file HTML AI editorial analysis application for film scripts, short fiction, and stage plays. It calls the Anthropic API directly using the user's own API key (stored in browser session storage). No server, no database.

**Current file:** `/mnt/user-data/outputs/DraftAndLens.html` — 403KB, syntax OK, balance 0.

**Key documents:**
- `/mnt/user-data/outputs/DraftAndLens_MasterPrompt.md` — 96KB complete specification
- `/mnt/user-data/outputs/DraftAndLens_Architecture.md` — architecture v4.0
- `/mnt/transcripts/` — all prior session transcripts

---

## CURRENT STATE OF THE FILE

**What is working:**
- 7-brain pipeline (1, 1b, 2c, 2, 2d, 3/4 parallel, 5, 6, 7)
- 27 lens voices at full depth, standalone prompts, correctly classified by profession
- Brain 2 on Opus 4.7 with adaptive thinking (`thinking: { type: 'adaptive' }, output_config: { effort: 'high' }`)
- Brain 2c narrator verifier (Opus 4.7)
- Brain 2d narrator correction pass — rewrites not deletes (Opus 4.7)
- Narrator verdicts at top of Brain 2 user message framed as facts
- Action plan at section 3 in both report structures
- Studio section styling applied to action plan and craft directives panels
- 27 lens pills: surname only, no descriptor text
- Lens groups: Directors(12), Novelists & Short Story Writers(7), Screenwriters(4), Showrunners(2), Producers(2)
- No "Extended Voices" group
- Conversation panel same width as content (860px), margin-top:3rem gap above
- "Continue the conversation" label and dividing line removed
- Elapsed timer/counter hidden
- Lens images hidden in analysis output
- Single dividing line in lens panel
- Spider graph and bar chart in dashboardSection (displays post-analysis)
- Lens results cached per session
- Brain 2 thinking parameter correct for Opus 4.7

**Known pending issues:**
- File is currently corrupted — `getLensSystemPrompt` function and content are floating before `<head>` without a script wrapper. The file starts with `<!DOCTY\n// imgFallback...` — the DOCTYPE is cut off and JS starts immediately. The file has two `</script>` closing tags (at chars 274872 and 662458) but only one `<script>` opening tag (at 387524). The reconstruction attempt created a 646KB file.
- The UI fixes from the last session (studio styling on action plan, conv panel, "Continue the conversation" removal) may or may not be correctly in the file given the corruption state
- Step-by-step action text colour fix may need re-verification
- Points 01 and 09 in "What to Fix Next" logic issue — the filter regex `/^\d+\./` doesn't catch zero-padded numbers like "01." — was attempted but may have been lost in corruption

**CRITICAL — THE FILE NEEDS CLEAN REBUILD** before next testing session. The corruption happened because script insertions kept landing outside script tags. The clean approach is to extract both script blocks, verify each independently, and reconstruct the HTML properly.

---

## THE BRAIN ARCHITECTURE

```
Brain 1 — Diagnostician (Sonnet 4.6, ~2s)
  → Confirms tradition, register, ambition. Locked JSON. No evaluation.

Brain 1b — Structural Reader (Sonnet 4.6, ~10s)
  → Maps text: narrative structure, timeline, register map, strongest/weakest,
    narrator behaviour (elevating/restating/worldEstablishment), juxtapositions.
    Returns JSON only. No evaluation.

Brain 2c — Narrator Verifier (Opus 4.7, ~5s)
  → Independently classifies each narrator line: ELEVATION / WORLD_ESTABLISHMENT / RESTATEMENT
    Test: "Could reader reach this from image alone?" Yes=restatement, No=elevation/world-est.
    Returns locked JSON verdicts.

Brain 2 — Analyst (Opus 4.7, adaptive thinking effort:high, ~60-90s, streaming)
  → Receives: narrator verdicts (top of user msg, framed as facts) + structural map +
    report structure + submitted text. Writes full analysis.

Brain 2d — Narrator Correction (Opus 4.7, ~8s)
  → Post-processing failsafe. REWRITES (never deletes) any passage that incorrectly
    flags a verified-elevation line. If fails, returns original unchanged.

Brains 3+4 — Scorer + Market (Sonnet 4.6, parallel, ~5s)
  → Scores for radar chart. Studio/publisher matching.

Brain 5 — Bible (Sonnet 4.6, on demand)
Brain 6 — Lens ×27 (Opus 4.7, on demand, cached)
Brain 7 — Conversation (Sonnet 4.6, on demand)
```

**CRITICAL API CONFIG FOR OPUS 4.7:**
```javascript
model: 'claude-opus-4-7',
max_tokens: 8000,
stream: true,
thinking: { type: 'adaptive' },
output_config: { effort: 'high' }
```
`thinking: { type: 'enabled', budget_tokens: N }` returns 400 error on 4.7. This was the bug causing analysis to stop after the dashboard.

---

## THE INVIOLABLE RULES

### Narrator distinction (most critical, most violated)
Three categories — never confuse them:
- **WORLD-ESTABLISHMENT**: atmosphere/register creation. Never flag.
- **ELEVATION**: narrator adds what image cannot carry (time, moral weight, interiority). Never flag.
- **RESTATEMENT**: narrator explains what image already showed. The ONLY failure.

**Never say:**
- "The image should carry the full weight of meaning alone" (universal rule — wrong)
- "Gothic/mythic register is literary rather than cinematic"
- "The narrator explains what we already see" without Brain 1b + 2c verification

**Correct elevation example:** "The sea had been patient for two hundred and sixty-four years. It had not yet decided whether patience was the same as forgiveness." — adds temporal scale and moral ambiguity. Image cannot show this. Keep it.

### Juxtaposition rule
Contemporary voices (news, YouTube, TV) alongside mythic material = deliberate structural argument. Never say "belongs to a different film" or "breaks the register." Only question: are those voices specific enough? Fix = specificity, not removal.

### Character ambiguity
Never assume ambiguity = weak writing. Check whether it's intentional.

### Fact-checking
Never claim something is missing without searching the full text first.

### Tradition-specific evaluation
Mythic work ≠ naturalistic drama. Each tradition has its own craft standards.

### Avarice contamination
Avarice is the test script only. Jack, barnacled figure, prosthetic leg, goat-headed reverend, Emine, Jurassic coastline — never reference in any other submission.

---

## THE 27 LENS VOICES

All at full depth in the Master Prompt document. Summary classification:

**Directors (12):** Spielberg, Coppola, Coens, Villeneuve, Scott, Welles, Jeunet, Wenders, Tarantino, Wachowskis, Lucas, Miyazaki

**Novelists & Short Story Writers (7):** Hemingway, Carver, Chekhov, O'Connor, Bukowski, Nabokov, King

**Screenwriters (4):** Sorkin, Eric Roth, Kaufman, Puzo

**Showrunners (2):** Simon, Fey

**Producers (2):** Bruckheimer, Feige

**Key voice distinctions:**
- Coens/Wachowskis: use "we"
- Chekhov: always leads with genuine appreciation first
- Bukowski: quiet/sly/bar-conversation register, "follow the leg"
- Nabokov: finds the spine-shiver sentence
- Simon: names the institutional argument first
- Lucas: finds the binary sunset moment
- Miyazaki: asks if the world is alive (not beautiful — alive)

**Why standalone prompts (not shared template):** The shared template with craftPhilosophy injection produced same analysis flow in different registers. Standalone = voice IS the frame, not injected into one.

**Never compress lens prompts.** Cost difference = $0.006-0.009 per call. Negligible.

---

## REPORT STRUCTURE

Both structures have ACTION PLAN at section 3 — early, while token budget is full.

**Script:** Overview → First Impression → Action Plan → Structure → Character → Dialogue → Visual Writing → Tone → What's Working → Character Consistency → Tradition Alignment → Craft Directives → Where To Begin

**Story:** Overview → Opening Promise → Action Plan → Structure & Arc → Voice & Narrator → Character → Prose Rhythm → Imagery → Theme → The Ending → What's Working → Character Consistency → Tradition Alignment → Revision Notes → Craft Directives → Where To Begin

---

## DESIGN TOKENS
```css
--paper: #f5f1e8 | --cream: #ede8d8 | --black-band: #14120e
--amber: #a86c10 | --amber-d: #7a4e08 | --amber-l: #c88c30
--ink: #1a1710 | --ink-mid: #4a4540 | --ink-soft: #8a8070
--rule: #c8bfaa | --rule-l: #ddd5c0 | --teal: #2a7a7a
```
Fonts: Libre Baskerville (headlines), IBM Plex Sans (body), IBM Plex Mono (labels)

---

## KEY LESSONS LEARNED

1. **Never insert JS without verifying exact character position first.** Every corruption in this session came from insertions landing outside script tags.
2. **Always verify file size after every change.** If it doubles (403KB → 646KB), a script block was duplicated.
3. **Always run node --check and brace balance check before presenting any HTML file.**
4. **Never make scope/depth/cost decisions without checking with Nenad first.**
5. **Never compress lens prompts without authorisation.**
6. **Deletion of analysis passages creates gaps and broken arguments. Always rewrite.**
7. **The shared template approach for lenses fails. Standalone only.**
8. **Opus 4.7 breaking change: no budget_tokens. Use adaptive + effort:high.**
9. **brain 2 token exhaustion: action plan must be at section 3, not section 11.**
10. **The narrator instinct cannot be fixed by prompting alone — requires Brain 2c + 2d architecture.**
11. **Verified lens data before presenting file — check both data entries AND prompt keys match.**

---

## WHAT NENAD WANTS FROM THE PRODUCT

- Full depth, not compressed. Always.
- Every decision checked before made.
- Verify before releasing any file.
- Do not second-guess what is best — ask first.
- The narrator distinction must work reliably. It is the product's most critical craft judgment.
- The lens voices must be genuinely distinct — different entry points, different cognitive frames, not tonal variation on a shared structure.
- No "Extended Voices" dumping group.
- The product is for serious writers. The register is honest, specific, never sycophantic.

---

## API COSTS (Nenad's account)
- Current balance when last checked: -$0.22 (needed top-up)
- Per analysis run: ~$0.07–0.16
- Per lens call: ~$0.008–0.015
- £10 covers ~60-120 full analysis runs
- Auto-reload recommended

---

## WHAT STILL NEEDS DOING (in priority order)

1. **Fix the file corruption** — reconstruct cleanly from two script blocks
2. **Verify all UI fixes survived corruption** — studio styling on panels, conv panel spacing, label removal
3. **Verify zero-padded list numbering fix** (01., 09.) in craft directives
4. **Live test with Avarice** — verify narrator elevation/restatement fix actually works with credits
5. **Verify action plan renders reliably at section 3**
6. **Confirm 200s → 60-90s improvement** with reduced thinking budget and Opus 4.7
7. **Production Next.js build** when prototype is fully stable

---

*Session summary compiled May 2026*
*Full specification: DraftAndLens_MasterPrompt.md (96KB)*
