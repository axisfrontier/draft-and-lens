# Draft & Lens — Financial Model (Shell — Awaiting Phase 11 Data)

> ⚠️ **This is a structured placeholder, not a real forecast.** Fields marked **TBD — Phase 11** cannot be filled with confidence until the long-form system is built and Phase 11 (cost measurement) has run real test reads and logged actual token spend. Do not use the illustrative figures in this document for investor conversations, pricing decisions, or planning until they are replaced with real data.

---

## 1. Cost Side

### 1.1 Short-form (current beta product — 4,000 words)
- Cost per read: **TBD** — needs actual token logging from a representative sample of real beta submissions (Sonnet/Opus mix depending on length tier)
- Action: log actual API spend per submission during beta — this is available now, doesn't need to wait for long-form

### 1.2 Long-form (dormant system — up to 120,000 words)
- Cost per read: **TBD — Phase 11.** Requires 3-5 full internal test reads at 80k/100k/120k words with end-to-end token logging (overview pass + all chapter batches + whole-work brains)
- Cost per resubmission (partial, via diff/hash): **TBD — Phase 11.** Should be significantly lower than a full read — needs measuring separately
- Infrastructure cost delta at scale (Vercel, Supabase, Clerk) — TBD, likely small relative to API cost but worth confirming at expected user volume

### 1.3 Fixed costs (known now)
- Domain: ~£10/year (draftandlens.com, already paid)
- Business email (Zoho): ~£12/year
- Vercel hosting: current tier — confirm cost at scale
- Supabase: current tier — confirm cost at scale
- Clerk: current tier — confirm cost once in Production mode
- Legal (solicitor review): one-off, pre-paid-launch — get a quote when ready

---

## 2. Revenue Side

### 2.1 Pricing model (draft — not finalised)
Based on competitive positioning against Inkshift ($25 critique / $35 revision plan / $100 markup, one-off, no subscription):

- **Free tier:** short-form reading (current beta scope) — builds trust, word-of-mouth, top of funnel
- **Paid tier:** long-form + lens Q&A + Mentor (persistent, cross-session) — draft range $15-20/month or $30-40 per full manuscript read
- This is illustrative positioning, not a committed price. Should be tested/validated once long-form exists and real cost-per-read is known — pricing must sit comfortably above cost-per-read with healthy margin, not just above what feels reasonable

### 2.2 Conversion assumptions (all TBD — need real data)
- Free-to-paid conversion rate: **TBD** — no data yet, industry SaaS benchmarks vary wildly (2-5% is a common conservative range for freemium products, but D&L's audience and positioning may differ)
- Monthly churn rate: **TBD**
- Average revenue per paying user (ARPU): **TBD** — depends on final pricing model chosen

---

## 3. Illustrative Shape (NOT a forecast — for structure only)

This shows how the model will calculate once real numbers exist. Every input below is a placeholder.

| Input | Placeholder value | Real value source |
|---|---|---|
| Free users by month 12 | 5,000 (illustrative) | Depends on outreach/marketing reach |
| Free-to-paid conversion | 3% (illustrative) | TBD — real data from launch |
| Paying users by month 12 | 150 (illustrative) | Calculated from above |
| ARPU/month | $20 (illustrative) | TBD — pricing decision |
| Gross revenue/month (month 12) | $3,000 (illustrative) | Calculated |
| Cost per read (long-form) | TBD — Phase 11 | Real measurement required |
| Cost per read (short-form) | TBD | Real measurement required |
| Gross margin | TBD | Cannot calculate without cost data |

**Year 1 gross revenue (illustrative only):** somewhere in the $10k-$40k range depending on conversion and pricing — genuinely too wide a range to be useful until real inputs replace the placeholders above.

---

## 4. What Needs to Happen Before This Model Is Real

In order:
1. **Now, during beta:** log actual API cost per short-form submission — cheap to start, gives real short-form cost data immediately
2. **Post-beta:** incorporate beta feedback, stabilise short-form product
3. **Build long-form** (per `DraftAndLens_LongFormBuildGuide.md`)
4. **Phase 11 runs:** real cost-per-read data for long-form at 80k/100k/120k words
5. **Set real pricing** using actual cost-per-read + desired margin, not guesswork
6. **Launch, track real conversion and churn** for 2-3 months
7. **Replace every TBD in this document with real data**
8. **Only then** is this document suitable for investor conversations or serious planning

---

## 5. Standing Reminder

This shell exists so the structure is ready — not so the numbers are trusted. Every illustrative figure in Section 3 must be replaced before this document is used for anything beyond internal orientation.
