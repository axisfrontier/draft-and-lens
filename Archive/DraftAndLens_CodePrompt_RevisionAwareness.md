# Code Prompt — Revision Awareness, Data Protection, Moderation & Open Sections (Production Next.js)

> This prompt covers everything Code can BUILD. Legal documents (Terms, Acceptable Use, Privacy Policy) are NOT in here — they live in `DraftAndLens_Legal_Policy_Starter.md` and need a human/legal review. Keep the IP boundary intact throughout — no prompts/lenses to the client; re-run the bundle security grep at the end.

> **Build in the order of the sections below.** Each block can fail independently; do not attempt it all in one shot. Nenad is non-technical — explain each step plainly and confirm before moving on.

---

## CHANGE 1 — Open all report sections by default

The section-by-section reading currently defaults to sections 01–05 open and 06–13 collapsed.

**Make all sections (01–13) open by default.** Reason: collapsing a section signals it's less important or causes it to be missed — D&L's value is the reading being read in full, and the free tier is never hobbled.

- Keep sections individually collapsible (a user may still fold one).
- Change only the *default* state to expanded for all. No other layout change.

---

## CHANGE 2 — Content moderation gate (BUILD THIS BEFORE STORAGE)

Submissions must pass a moderation check **before** they are stored or processed. This protects users, the product, and Nenad legally.

### The hard, non-negotiable block
- **CSAM (sexual content involving minors):** absolute zero tolerance, no literary exception. If detected, **block before any storage** — the text must NEVER be written to the database. Refuse, do not store, log only a minimal non-content event (timestamp + that a block occurred), and surface a clear refusal to the user.

### The narrow prohibited set (block)
- Content that is itself **illegal to possess/transmit in the jurisdiction where D&L operates and hosts** (not "illegal anywhere on Earth" — that's an impossible standard; gate on the operating/hosting jurisdiction + the universal CSAM absolute).
- **Pornographic content with no literary purpose** — this is a brand/product decision, not purely legal. Block written porn that is not serving a literary work.

### CRITICAL — tune for literature, not bluntly
D&L is a tradition-aware *literary* tool. Serious fiction legitimately depicts sex, violence, abuse, and crime — that is literature, NOT pornography. A blunt filter rejects exactly the serious writers D&L wants.
- The line is **NOT "contains sex/violence"** — it is the narrow prohibited set above.
- Distinguish *depiction within a literary work* (allow) from *prohibited category* (block).
- **Err toward allowing serious work.** Hard-block only the narrow illegal set + the CSAM absolute + the porn brand line.
- Expect to refine the threshold over time — this is a human-in-the-loop problem, like the LearnedCorpus. Make the moderation step isolated and tunable.

### Implementation
- Run submissions through a moderation classifier (a dedicated moderation check) as a gate in the analyse flow, **before** persistence and before the main pipeline.
- On block: refuse with a message citing the Acceptable Use Policy, do not store the content, log minimally.
- On pass: proceed to the normal flow.

---

## CHANGE 3 — Revision awareness (store-last-version + diff → two behaviours)

### The principle (do not violate)
D&L recognises when a resubmitted piece is the same work vs a genuine revision, and behaves differently:
- **Unchanged** (or trivially changed — punctuation, whitespace, a typo): **return the previously stored reading verbatim.** Do NOT regenerate. Protects the writer from losing a note whose exact wording mattered. Regeneration drift is a real cost; avoid it when nothing changed.
- **Changed** (a real revision): run a **full fresh reading of the entire piece** — not a diff-only patch. The whole work is re-read and re-judged as a new overall assessment, with the revision taken into account. The reading should *name* it is responding to a revision (e.g. "you've reworked the ending — here is how the whole piece now reads"). This is the Mentor promise made visible.

### What this requires (be clear-eyed)
NOT user-facing version history. It is **silent server-side storage of the last submitted version + its reading**, used only to (a) diff against the next submission and (b) return verbatim when unchanged. One mechanism, two behaviours.

### Identity & storage
- Pull **Supabase** and **identity** forward (the Mentor substrate; the handover gates Mentor on persistent per-writer memory).
- Use **Clerk** for auth if not already wired; otherwise the simplest stable user identifier. Collect the minimum — an email for auth is enough; do NOT collect real names or anything not needed.
- **Hosting region:** set the Supabase project region to **EU/UK** to avoid cross-border data-transfer complications. Confirm the region before creating tables.
- Supabase schema — a `readings` table, minimum fields:
  - `id` (pk)
  - `user_id` (fk to identity)
  - `work_id` (stable key for "this piece" — see matching below)
  - `work_title` (user-editable label, for library/organise)
  - `work_format` (script / short story / play — helps matching, see below)
  - `source_text` (the submitted text, for diffing)
  - `reading_json` (the full stored reading payload returned to the client)
  - `created_at`
- Store source text + reading on every completed reading (after moderation pass).

### Version cap (do not let storage grow unbounded)
- Keep at most **N versions per (user, work)** — start with N = 5, a single named constant. Prune the oldest beyond N.
- Bounds storage cost and limits how much creative IP is held (less stored = less to breach).

### The diff (this is code, NOT a brain)
- Do NOT call the model to decide if text changed. It's a deterministic comparison, not a reading.
- On a new submission, find the most recent stored reading for this user where the work matches.
- Compute **change magnitude** and **location** via a cheap local text diff (token or line based).
- Apply a **threshold** (single named constant, start conservative — near-identical = unchanged):
  - Below → **unchanged path:** return stored `reading_json` verbatim. No `/api/analyse` call.
  - Above → **changed path:** call `/api/analyse` for a full fresh reading; store the new version + reading; pass a *what-changed* summary (magnitude + rough location, e.g. "≈30% changed, concentrated in the final third") into the request so the analyst acknowledges the revision in its framing.

### Work matching ("is this the same piece?")
- A stable `work_id` so a revision maps to its predecessor.
- These are DIFFERENT works, not revisions of each other: a script, then a short story, then a play are three separate works — each gets its own `work_id` and its own reading. Revision-awareness fires ONLY when a resubmission matches an existing work.
- Match conservatively on normalised similarity of opening text / title; **a format change (script vs prose vs play) is strong evidence of a NEW work, not a revision** — use `work_format` as a signal.
- Wrongly linking a story to a script produces nonsense ("95% changed"). When confidence is low, fall back to asking the user "is this a revision of [previous work], or a new piece?" Prefer auto-match; ask only on low confidence.
- Keep this logic isolated and named for later improvement.

### Lens voices and revision (deliberate, optional, default OFF)
- By default the revision logic feeds the **editor (Brain 2) only**. The 27 voices run from their own character sheets and re-read cold.
- To let a voice acknowledge a revision, pass the same change-summary into the lens prompts.
- **CRITICAL — never feed the editorial corpus into the lens prompts.** The change-note is fine; the corpus is not. Feeding the corpus to voices sands them toward tradition-neutral and destroys the feature (LearnedCorpus Scope clause — the corpus binds Brain 2 only).
- Make this a clearly separable toggle, defaulted off.

---

## CHANGE 4 — User data functions (GDPR rights + good library UX)

Build these as real, working functions:

**Legally required (GDPR / UK / widely expected):**
- **Export my data** — download all the user's works + readings in a portable file (data-portability right).
- **Delete my account** — full wipe; must cascade to ALL the user's rows, real deletion not a soft flag.
- **Delete a single work** — per-work deletion, real.
- **View what's stored** — a list of the user's saved works/readings (transparency).

**Good-practice UX:**
- **Rename / organise works** — edit `work_title`; basic library hygiene.
- **Restore / undo delete** — a short grace window (e.g. soft-delete for X days, then hard-delete) so an accidental delete is recoverable. Balance against the retention policy; document the window.

---

## DATA PROTECTION (the real risk surface — stored unpublished creative work is sensitive IP)
- **Supabase Row-Level Security (RLS):** enable on `readings`; a user can read/write ONLY their own rows. Non-negotiable. Note: RLS is access-control only — necessary, not sufficient (the rest is policy/process, in the legal doc). A misconfigured policy is the common failure — TEST it.
- **Encryption at rest:** confirm Supabase encryption at rest is on (default; verify).
- **Encryption in transit:** HTTPS via Vercel — confirm enforced.
- **Region:** EU/UK Supabase region (see above).
- **No model training on user work:** ensure nothing in the pipeline opts user text into training; this must be true so the Privacy Policy can state it.
- **Minimise:** store only what diff + verbatim-return need. No surplus fields.
- **Breach-logging hook:** a minimal mechanism to detect/record access anomalies, supporting the 72-hour breach-notification obligation (the *process* is in the legal doc; the *hook* is code).

---

## IP BOUNDARY (unchanged law)
- Diff, storage, matching, moderation, user-data functions are all server-side or client-state plumbing — none touches prompt/lens IP.
- The "what changed" summary passed into a reading is magnitude + location text only, never the prompts.
- **Re-run the bundle security grep** (`.next/static` for the 5 IP markers — must return exit:1) after this work; storage/identity/moderation all add new client surface.

---

## VERIFY AT THE END
- `tsc` clean; `next build` green.
- Bundle IP grep PASS (exit:1); client-IP guard test passing.
- **Moderation:** a CSAM-category test input is blocked AND never written to the DB; a dark-but-literary input (serious fiction with violence/sex in service of the work) is ALLOWED.
- **Revision:** upload → reading; re-upload identical → SAME reading verbatim, no model call; change the ending → fresh full reading naming the revision.
- **Work matching:** a script then a short story then a play are treated as three separate works, not revisions.
- **RLS:** a user cannot read another user's rows.
- **Deletion:** single-work delete and full-account delete both actually remove rows (after any grace window).
- **Export:** produces a complete, openable file of the user's data.
- Confirm no prompt/lens IP entered any client-bound stored field (only `reading_json`, already client-bound output, should).
