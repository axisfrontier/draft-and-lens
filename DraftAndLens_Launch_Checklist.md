# Draft & Lens — Launch Checklist

**Purpose:** the single place to look when moving from closed beta to paid launch. Ordered by when each item bites, not by topic. Owner is marked on every item: **You**, **Solicitor**, or **Code**.

**Last updated:** 26 July 2026

**How to use this:** nothing here blocks the free closed beta, which is live and stable. Everything in Part One must be done before charging any money or widening access materially. Part Two is the first days after going paid. Part Three is the standing backlog that isn't launch-gated but shouldn't be forgotten.

---

## PART ONE — BEFORE TAKING ANY MONEY OR WIDENING ACCESS

### Legal and privacy (the long pole — start the solicitor conversation early)

- [ ] **Fill all placeholders in the legal drafts.** `[DATE]`, legal/company name, retention period, grace window, version counts, pricing page, etc. These are business facts, not legal questions — fill them so the solicitor reviews real wording, not blanks. **(You)**
- [ ] **Solicitor review of Privacy Policy, Terms, and AUP.** The site stays password-protected until this sign-off lands. **(Solicitor)**
- [ ] **Bring the specific flagged questions to the solicitor**, not just the documents: lawful basis for processing; "as is" liability position under UK consumer law; refund/cancellation terms; whether a cookie notice is needed; sufficiency of the 18+ gate; ICO registration; and — called out explicitly — the interaction between Anthropic's up-to-2-year retention on safety-flagged submissions and D&L deliberately permitting transgressive literary content. **(You → Solicitor)**
- [ ] **Google added as a named processor** in the privacy policy. Google OAuth is live and in the data path. *(Actioned 26 July 2026 — verify it made it into the final doc.)* **(You)**
- [ ] **Anthropic no-training / retention wording corrected and date-stamped.** Reflects terms checked 26 July 2026: no training, not retained by default, up to 2 years if safety-flagged. Re-check against Anthropic's live terms immediately before launch, as third-party terms change. **(You / Code)**
- [ ] **Retention numbers verified against code.** Confirm `readings.ts` enforces exactly what the policy states (version cap, grace window). A policy promising what the system doesn't do is worse than none. **(Code)**
- [ ] **Confirm the "never used to train AI" claim in-app matches the policy and Anthropic's terms.** This line appears in outreach emails and the tool itself. **(You / Code)**

### Trademark

- [ ] **File the IPO Class 42 trademark** (and decide 41 with the solicitor, given the Mentor/education direction). Register search came back clean in both classes on 23 July 2026; the only live near-marks were bare "LENS" registrations in unrelated AR/social fields. Bundle the search evidence for the solicitor. Oldest outstanding item — do not let it slide again. **(You / Solicitor)**

### Security (repo was briefly public — most of this is precautionary)

- [ ] **Rotate the three API keys if not already done** (Anthropic, Clerk, Supabase). *Note: keys confirmed never committed to git history — no forced exposure — but rotation was done anyway as hygiene. Verify current keys are the rotated ones.* **(You / Code)**
- [ ] **Full security re-check:** IP-boundary grep, RLS test, deletion-cascade test, encryption-at-rest. **(Code)**
- [ ] **Confirm all brain prompts and lens voices remain server-side.** The browser sends only submitted text and receives results. This is the gating IP requirement. **(Code)**

### Speed — the one item that changes status at paid launch

- [ ] **The long-tier speed rebuild is a paid-launch blocker, not backlog.** Free beta users can tolerate ~130s at 4,000 words with the perception fixes in place. Paying users cannot be expected to tolerate it the same way — the value has to justify the wait every single time once money changes hands. Do not launch paid on the current architecture without either (a) the structural rebuild (cache → evidence charter → coarse parallelism, see Part Three) substantially landed, or (b) an explicit, deliberate decision to launch paid at current speed with eyes open to the churn risk. This item was previously filed only in the backlog; it belongs here too. **(You)**



- [ ] **Clerk switched from Development to Production.** *(Actioned — verify it's the production instance with verified DNS and working Google OAuth.)* **(You)**
- [ ] **Stripe live**, pricing tiers defined, pricing page built. **(You / Code)**
- [ ] **Refund/cancellation terms confirmed with solicitor** before any charge is possible. **(Solicitor)**
- [ ] **Anthropic credit auto-reload ON**, or a comfortable balance. A single 90-page script can burn through a small balance and 503 the site. **(You)**
- [ ] **Stable URL per reading** (e.g. `/reading/abc123`) so readings can be returned to. *(Re-surfaced 15 Aug 2026 — `/analysis/[id]` currently renders only a "Stage 4." placeholder stub; confirmed live, not new, no action taken.)* **(Code)**

### GDPR user controls (required once you hold paying users' data at scale)

- [ ] **Export, per-work delete, full account wipe, rename, undo-delete.** **(Code)**
- [ ] **Retention-pruning trigger wired.** `purgeExpiredDeletions` exists but isn't auto-called. **(Code)**
- [ ] **Cookie notice** if the solicitor says it's needed. **(You / Solicitor)**

---

## PART TWO — FIRST DAYS AFTER GOING PAID

- [ ] **Watch the Anthropic console daily** for the first stretch. The most likely failure is credit running dry mid-session and 503-ing the site — the exact fault that cost hours in the build. Check the console *before* touching code if the site misbehaves. **(You)**
- [ ] **Re-verify the no-training / retention claim** against Anthropic's live terms once more, since it now faces paying users making the claim material. **(You)**
- [ ] **Confirm the "cost row → user" join exists** before relying on any margin figure. Cost rows currently store `submission_id`, not user. Flagged on the pre-paid-launch list; needed before the margin view is trustworthy. **(Code)**
- [ ] **Re-check the hardcoded Anthropic pricing snapshot** (captured 15 July 2026) against live pricing before any real margin calculation. A visible stale-price warning is now in the code at the relevant spot. **(You / Code)**
- [ ] **Verify the saved-reading cache behaviour** reads sensibly to paying users: resubmitting unedited text returns the cached reading with a dated notice and a "get a fresh reading" option. **(You)**

---

## PART THREE — STANDING BACKLOG (not launch-gated, don't forget)

### The structural speed rebuild (post-launch, the real fix for long-tier latency)

The current architecture floors at ~130s for a 4,000-word reading. This is token-generation-bound, not a config problem — confirmed across multiple measurement sessions. Cutting it materially is a structural rebuild, sequenced as:

1. **Prompt caching of the source text** (Anthropic supports it) — kills the input-token cost that sank naive parallelism, cuts per-worker TTFT. Prototype against the current monolithic call first; has value even alone.
2. **Prove Stage 1 can emit a faithful "evidence charter"** sequentially — a structured allocation of every observation to a track — without degrading classification (the load-bearing dependency). Audit the charter against current monolithic output before splitting anything.
3. **Coarse 2-track parallelism** (craft vs structure) governed by that charter, with a deterministic merge. Target ~80s.
4. **Re-test effort levels (3A) inside the new architecture**, not before — testing low effort against an architecture you're about to replace is measuring the wrong thing.

*Parked and captured in memory as `parallel-analyst-parked` / `long-tier-latency-floor`. Do not attempt naive per-section fan-out again — it broke coherence (sections contradicting each other) and exploded token cost 14×.*

### Long-form architecture (dormant, feature-flagged)

- Before raising the 4,000-word cap, the brain architecture must be redesigned for long-form: two-pass for scripts/plays (10k–25k words), chapter pipeline for novels (70k–100k). The current pipeline produces slow, generic readings at scale. `FREE_WORD_LIMIT` currently truncates anything over 10,000 words. **(Code, when the cap rises)**

### Margin / cost analysis (build when setting prices, not before)

- Per-submission, per-brain token cost already logs to `submission_costs` on every run. The "am I making money per client" view is a build task deferred until Stripe is live and there's real usage to analyse. Build it against reality, not imagined revenue. **(Code, at pricing time)**

### Single-provider dependency (structural risk, not a task — plan around it)

The entire product depends on one AI provider (Anthropic) for its models, pricing, and terms. This has been disclosed to users (see the retention record) but not mitigated as a business risk. If commercial terms change, a model is deprecated, or pricing rises, the product's cost base and pipeline tuning move without warning. Not a launch blocker. Two things to actually do with this:

- **Price with margin for it.** When setting subscription pricing, don't price against today's Anthropic rates alone — build in headroom for a rate change. **(You, at pricing time)**
- **Consider provider-portability when the long-tier rebuild happens.** Not a requirement to switch providers, but worth asking whether the rebuilt pipeline is needlessly locked to one vendor's specific API shape. **(Code, at rebuild time)**

### The signal that matters more than anything else on this list

- [ ] **From the two live beta testers, get a specific answer: did they come back and run a second piece unprompted, and if not, why not.** A one-time "that was interesting" is not evidence the product works — the metric that predicts whether paid launch has a foundation is *return use*, not first-impression praise. Get this answer before investing further effort in widening outreach or refining the speed rebuild; it should shape both. **(You)**



- First tester (film writer) is live on the site as of 26 July 2026. Six earlier institutional/individual approaches are out and unanswered — nudge the quiet ones once the first tester experience is positive and there's something concrete to say. **(You)**

---

## PART FOUR — SOLICITORS TO SPEAK TO (BUDGET-CONSCIOUS)

You need SRA-regulated legal review of Privacy/Terms/AUP plus the trademark class question, on a shoestring, done right. The key to keeping it cheap is scope discipline: you've already done the free groundwork (clean IPO search in Class 42/41, dated Anthropic terms, a specific question list), so you're paying for review and sign-off, not discovery. Always ask for a **fixed fee against a defined package**, never open-ended hourly.

Online SRA-regulated firms are as legally valid as a high-street solicitor and optimise for exactly this: fixed fees, fast turnaround, remote. That's your sweet spot. Get a quote from two or three below and compare scope, not just price.

### Fixed-fee online firms (best fit for your scope and budget)

- **Sprintlaw UK** — has a named "Startup Privacy and Terms Starter Pack": a fixed-fee service drafting/reviewing a privacy policy and website terms matched to your real product journey, plus separate fixed-fee trademark help. Process is quote → engagement letter → lawyer by email/phone/video. Closest off-the-shelf match to what you need. sprintlaw.co.uk
- **Nouveau Legal** (Middlesbrough, works UK-wide remotely) — boutique commercial firm, fixed fees, **free initial consultation**, plain-English, explicitly covers GDPR/privacy policies, T&Cs, and IP. Bespoke rather than template. Good for the free consult alone to sanity-check scope before you commit spend. enquiries@nouveaulegal.co.uk / 0333 335 1235
- **PAIL Solicitors** (London) — specialise specifically in digital/media/IP and SaaS terms, privacy and cookies, fixed-fee after consultation, 20+ years in digital contracts. The most domain-matched to an online AI product, possibly slightly pricier than the pure-online services — worth a quote to compare. pailsolicitors.co.uk

### For the trademark specifically

- Any of the above can advise the Class 42-vs-42+41 question. But once the class is confirmed, **file it yourself** through the IPO's own pre-apply service and pay only the government fee — you do not need to pay an agent's markup for a straightforward filing you've already searched.

### For low-stakes documents only

- **LawBite** and **Rocket Lawyer** offer cheap templates. Fine for a simple NDA or basic contract, **not** sufficient for your Privacy/Terms/AUP review — your no-training claim, the Anthropic 2-year flag-retention issue, and the transgressive-content AUP question all need a human solicitor's judgement, not a template. Don't try to save money here; this is the one spend that gates launch.

### How to run the engagement cheaply

1. Take the **free consultation** (Nouveau, and ask others) to confirm scope and get a fixed-fee quote.
2. Hand over your already-prepared bundle — the drafted docs with placeholders filled, the IPO search evidence, the dated Anthropic terms, and your flagged question list — so you're not paying them to discover what you already know.
3. Get the fixed fee in writing against that defined scope. Compare two or three quotes.
4. File the trademark yourself once classes are confirmed.

**Bottom line:** free consult first, fixed fee always, hand them a prepared bundle, and self-file the trademark. That's how you get this right without it running away from you.

## THE ONE-LINE VERSION

**Cannot charge money until:** solicitor sign-off, placeholders filled, Stripe live, trademark filed, security re-check done, retention wording verified against both the code and Anthropic's live terms. Everything else is either already handled or genuinely post-launch.
