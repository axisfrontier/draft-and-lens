# Code Prompt — Revision Awareness, Moderation & Open Sections (MVP, single HTML file)

> For `DraftAndLens.html`. The MVP has no backend and no login, so revision-awareness works **within one browser session only** — it remembers the last submission in memory and forgets on refresh. That is the honest limit and a good demo. Do NOT add a database or auth here; that's the production job. Legal documents are NOT code — see `DraftAndLens_Legal_Policy_Starter.md`.

---

## CHANGE 1 — Open all report sections by default
- The section-by-section reading currently defaults to 01–05 open, 06–13 collapsed.
- Make **all sections open by default**; keep them individually collapsible.
- Reason: collapsing signals "less important" or causes sections to be missed, and the reading is the product.

---

## CHANGE 2 — Content moderation gate (applies even with no storage)
Even though the MVP stores nothing server-side, a submission must NOT be sent to the API if it is prohibited content. The CSAM absolute applies regardless of storage.

- **CSAM (sexual content involving minors):** absolute zero tolerance, no literary exception. Do not send to the API; refuse with a clear message.
- **Illegal-to-transmit content** (per the operating jurisdiction) and **pornographic content with no literary purpose** (brand line): refuse.
- **CRITICAL — tune for literature.** Serious fiction depicting sex, violence, abuse, or crime is literature, NOT pornography. The line is NOT "contains sex/violence" — it is the narrow prohibited set. Err toward allowing serious work; hard-block only the narrow illegal set + CSAM absolute + the porn brand line. Keep the check isolated and tunable.
- Implementation: a moderation check before the analyse call. On block, refuse citing the Acceptable Use Policy; do not proceed.

---

## CHANGE 3 — Revision awareness (session-scoped)
Hold the **last submitted text + its reading** in a JavaScript variable (in-memory, session-scoped — NOT localStorage, NOT a DB). Keep **one version only** (the last). On each new submission, compare and branch:

- **Unchanged** (identical, or differs only by punctuation/whitespace/a typo — below a tunable threshold) → **re-display the stored reading verbatim. Do NOT call the API.** Protects a note whose exact wording mattered, and saves a call.
- **Changed** (above threshold) → run a **full fresh reading of the whole piece** as a new overall assessment, passing a short *what-changed* note (rough magnitude + location) into the prompt so the reading acknowledges the revision (e.g. "you've reworked the ending — here's how the whole piece now reads"). Store this new version + reading as the new "last."

### The diff
- Plain JS text diff (token or line based). **No API call to decide whether text changed.** One named threshold constant; start conservative.

### Honest framing
- When returning a stored reading unchanged, show a small line: "No changes detected since your last reading — showing your previous reading."
- When reassessing, the reading names the revision (via the prompt note).

### Different works
- A script, then a short story, then a play are DIFFERENT works, not revisions. In-session, only treat a resubmission as a revision if it closely matches the last text; a clear format/content change = new work, fresh reading. (Full work-matching is the production job.)

### Constraints
- In-memory only; one stored version; forgets on refresh (next upload treated as new). Expected.
- No other behaviour changes.

### Lens voices (optional, default OFF)
- Revision logic feeds the editor only; the 27 voices re-read cold.
- To let a voice acknowledge a revision, pass the same change-summary into the lens prompts — but **never feed the editorial corpus into the lens prompts** (it sands the voices toward neutral and breaks the feature). Keep off by default unless explicitly asked.

---

## Cost & security (note — stated for clarity, mostly no action)
- **Cost:** effectively zero. One JS variable, no infrastructure; the unchanged path *saves* an API call.
- **Security:** safer than persistence — nothing leaves the browser, nothing stored, no data to breach. It's the user's own pasted text in their own tab.
- **GDPR data-protection obligations (RLS, encryption, deletion, export, retention) do NOT apply to the MVP** — there's no stored data. They belong to the production Supabase build. (The moderation gate DOES apply here, because it's about what's sent to the API, not about storage.)

---

## Verify
- All report sections open on first render.
- Moderation: a CSAM-category input is refused and never sent to the API; a dark-but-literary input is allowed.
- Upload → reading; re-upload identical → same reading verbatim, no API call (check console/network); edit the ending → fresh full reading acknowledging the revision; refresh then re-upload → treated as new.
