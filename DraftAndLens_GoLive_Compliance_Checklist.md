# Draft & Lens — Go-Live Compliance Checklist

> Honest caveat: "100% compliant" isn't a thing anyone can promise. The target is a **defensible posture** — meeting the bar a regulator expects, with paperwork and process that protect both your users and you. Work top to bottom. Nothing here blocks internal testing; it blocks going live to real users and taking payment.

---

## STAGE 1 — Before any real user touches it

> **💷 ZERO-BUDGET PATH (for a free beta with a handful of testers).** You do NOT need a paid solicitor to launch a free beta. Minimum realistic spend ≈ **£40–£80 total**, almost all of it the ICO fee:
> - **Privacy Policy + Terms + AUP:** adapt your existing drafts (`DraftAndLens_Legal_Document_Drafts.md`) using a free/low-cost reputable UK template generator (£0–£30). You're adapting, not commissioning — the drafts do the heavy lifting.
> - **ICO data-protection fee:** £40–£52/yr for a sole trader. The one genuinely required spend. (ico.org.uk)
> - **DPAs:** £0 — free documents you accept from Supabase, Anthropic, Clerk, Vercel.
> - **Solicitor review:** SKIP FOR NOW. It's the "before you take real money or scale" step, not launch-day. Well-adapted templates + the ICO fee = a defensible posture for a free beta. Add the review when there's revenue to pay for it.
>
> So the gate for free testers is: adapt the drafts · pay the ICO fee · accept the DPAs · publish the docs. The expensive step waits.


- [ ] **1. Documents adapted from the drafts + published.** Adapt Privacy Policy, Terms of Service, Acceptable Use Policy from `DraftAndLens_Legal_Document_Drafts.md` (free/low-cost template generator). *Solicitor review is deferred to the paid-launch stage (see zero-budget path above) — not required for a free beta.*
- [ ] **1b. No-training promise placed where users SEE it (not just in the policy).** "We never train AI on your work" must appear at sign-up AND near the upload box — it's the strongest trust signal and a real edge. Policy text alone is not enough; it must be visible at the moment a writer decides to trust D&L with a draft. (Build requirement — see the Code prompt.)
- [ ] **2. Documents published where users see them.** Privacy Policy + Terms linked at signup; AUP referenced in the moderation refusal message; AI-disclosure notice visible on the reading.
- [ ] **3. DPAs accepted + copies kept** with: Supabase, Anthropic, Clerk, Vercel (and Stripe before billing).
- [ ] **4. Policy decisions made concrete + written down:**
  - [ ] 18+ only (stated in Terms)
  - [ ] UK/EU operating jurisdiction
  - [ ] Retention period (how long after last activity)
  - [ ] Soft-delete grace-window length (e.g. 7–30 days)
  - [ ] One-page breach-response process (who acts; the 72-hour clock)
  - [ ] Porn brand line confirmed (matches AUP + moderation gate)
- [ ] **5. ICO registration + data-protection fee paid.** UK: if you process personal data you almost certainly must pay the ICO fee (modest, tiered). Often missed — check it. (ico.org.uk)

## STAGE 2 — Verify the build does what the documents claim

- [ ] **6. Build tested against the promises** (from the Code prompt's verify checklist):
  - [ ] RLS — one user cannot read another's work
  - [ ] Real deletion — account-wipe cascades to all rows; per-work delete works (after grace window)
  - [ ] Export — produces a complete, openable file
  - [ ] Encryption at rest confirmed ON; in transit (HTTPS) enforced
  - [ ] Supabase region confirmed EU/UK
  - [ ] No-training verified true in the pipeline (so the Privacy Policy claim is honest). *Code-confirmed (June 2026): the Messages API has no training/retention flag to send; user text goes only to Anthropic + the user's own Supabase row; no third-party send. The "Anthropic doesn't train on it / brief safety retention then deletion" part rests on Anthropic's policy.* **Before going public: verify that wording against Anthropic's CURRENT Commercial Terms / data-usage page — it can change.**
- [ ] **7. Moderation gate confirmed:** CSAM-category input blocked *before* storage; serious literary darkness *allowed*.

## STAGE 3 — Ongoing (not one-and-done)

- [ ] **8. Record of processing kept** — what you store, why, how long. One page is fine at your scale; GDPR expects it.
- [ ] **9. Breach process actually runnable** — someone is responsible for starting the 72-hour clock.
- [ ] **10. Re-review on change** — new data field, new provider, new country focus, or taking payment each warrant a quick re-check.

---

## What protects YOU personally (the short version)
Documents reviewed · ICO fee paid · DPAs in place · build tested against its own promises. Do those four and you're in a strong, defensible position — the real target, not the mythical 100%.

## Sequencing
- Items 6–7 (build verification) — Code delivers; run when the production build is done.
- Everything else — you + a one-off solicitor session.
- None of this blocks internal testing. All of it blocks: real users with accounts, and any payment.
