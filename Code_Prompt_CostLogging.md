# Code Prompt — Short-Form Cost Logging (Beta)

> Read CLAUDE.md first.
> Model: Sonnet / Medium. Backend logging only — no UI changes, no user-facing changes.
> Audit first. Show plan. Wait for go.
> One commit. tsc. Deploy. Verify.

---

## Purpose

D&L's financial model shell (`DraftAndLens_FinancialModel_Shell.md`) needs real short-form cost-per-read data. This is available now, cheaply, without waiting for the long-form system. This session adds simple, non-intrusive logging of actual token usage per submission during beta.

---

## Audit first

Read the orchestrator and each brain wrapper (Brain 1, 1b, 2, 3, 4, 5, narrator verify/correct). Find:
1. Where each Anthropic API call is made
2. Whether the API response already includes token usage data (input_tokens, output_tokens — standard in the Anthropic API response)
3. Whether any logging or analytics infrastructure already exists that this should plug into, or whether this needs a new lightweight table

Report findings. Wait for go.

---

## What to build

### 1. Capture token usage per brain call
Every Anthropic API call in the pipeline returns `usage: { input_tokens, output_tokens }` in its response. Capture this from every brain call (1, 1b, 2, 3, 4, 5, narrator verify, narrator correct) for a single submission.

### 2. Store per-submission cost record
Create a simple table (e.g. `submission_costs`) in Supabase with:
- `submission_id` (or equivalent identifier linking to the reading)
- `timestamp`
- `word_count`
- `mode` (story/script/treatment/play)
- `submission_type` (complete/excerpt)
- `report_tier` (Micro/Short/Full — from the existing tiering system)
- Per-brain token breakdown: `brain1_input_tokens`, `brain1_output_tokens`, `brain2_input_tokens`, `brain2_output_tokens`, etc. for all brains that ran
- `total_input_tokens`, `total_output_tokens` (summed)

Do not store the submitted text or the reading content in this table — only metadata and token counts. This is a cost log, not a content log, and must not create a new place where user writing is retained.

### 3. Calculate and store cost estimate
Using current published Anthropic API pricing for the models in use (Sonnet/Opus, whichever tiers are active per `adaptiveAnalystConfig`), calculate an estimated USD cost for the submission from the token counts. Store this as `estimated_cost_usd` on the same record.

Note: pricing changes over time — store the token counts as the source of truth (Section 2) and treat the calculated cost as a derived, recalculable value, not the permanent record. Add a code comment noting the pricing rates used and the date, so a future recalculation is possible if rates change.

### 4. No user-facing exposure
This data is never shown to the writer. It exists purely for internal cost analysis. Confirm it is not exposed via any client-side API response or included in anything sent to the browser.

---

## What not to build
- No dashboard or UI for viewing this data yet — that can be a future session if needed. For now, data should be queryable directly in Supabase.
- No changes to the actual brain pipeline logic — this is additive logging only, wrapped around existing calls, not a modification of how they work
- No retention of submitted text or reading content in this new table

---

## Verify

1. `npm run build` — must pass clean
2. Deploy
3. Submit a test piece through the normal flow (Chrome extension)
4. Query the `submission_costs` table directly in Supabase — confirm a record was created with accurate token counts and a calculated cost estimate
5. Confirm no submitted text or reading content appears in the new table — metadata and numbers only
6. Confirm the existing pipeline behaviour, timing, and output are completely unaffected by this addition

One commit: `feat: short-form cost logging for financial model data collection`
