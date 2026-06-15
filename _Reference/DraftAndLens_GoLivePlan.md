# Draft & Lens — Go-Live & Production Strategy
## From local MVP to production-ready launch
### Prepared June 2026

---

> This plan assumes the discipline you have already established: attention before understanding before solution; tradition identification as the load-bearing dependency; the editorial corpus as the product's true moat. Everything below is built on the premise that the *analysis quality* is already your differentiator — the job now is to protect it, productionise it, price it fairly, and get it in front of the right people without diluting what makes it different.

---

## PART 1 — WHAT YOU ACTUALLY ARE (the positioning that everything else depends on)

Before architecture, pricing, or promotion, the one decision that governs all of them: **Draft & Lens is not a writing tool. It is a reading tool.**

The market splits cleanly into two categories, and conflating them is the most common way analysis tools fail:

- **Generation tools** (Sudowrite, NovelCrafter, Sudowrite's Muse): they write *for* you. Priced on credits/words generated. $10–$59/mo. Their risk is the "uncanny valley" — text that is technically correct but emotionally hollow.
- **Analysis / coverage tools** (Roast My Script at $9/script, OnDesk, ScreenplayIQ, the human-coverage services at $60–$400, consultants at $1,500+): they *read* what you wrote and tell you what's working and what isn't.

Draft & Lens sits firmly in the second category — but it does something none of the others do. Every existing analysis tool applies **one universal rulebook** (Save the Cat, McKee, Syd Field, the three-act paradigm) to every script regardless of what the script is trying to be. That is precisely the failure your whole architecture was built to fix: applying minimalist-realist rules to a mythic allegory produces *wrong* analysis, not weak analysis.

**Your one-sentence positioning:**
> *Draft & Lens reads your work on its own terms — within its own tradition — and then lets you hear it through the minds of the people who built the form. Not a score. Not a template. A reading.*

The single most credible claim you can make, and the one the market is actively asking for (OnDesk's own marketing concedes it): **specificity.** "If the notes could be copy-pasted onto any screenplay without changing a word, they're worthless." Draft & Lens's notes *cannot* be copy-pasted onto another script, because they're anchored to the tradition, the exact quoted lines, and the lens voice. That is the entire pitch.

---

## PART 2 — THE PRODUCTION ARCHITECTURE (security, API, server-side IP)

Your `Architecture.md v3.0` is already the correct blueprint. This section operationalises it for launch, with the IP-protection requirement front and centre.

### 2.1 The non-negotiable: prompts move server-side

This is the single most important production change and the reason the current single-file MVP cannot be the product you sell. Right now the browser receives the entire IP — every brain prompt, all 27 lens voices, the corpus, the narrator logic. Anyone who opens DevTools has your whole moat.

**The fix (already in your architecture):**

```
Browser  ──sends──▶   submitted text only
                      (+ auth token, + chosen mode/lens)
   ▲
   │  receives ──────  rendered results only
   │
Server (Next.js API routes / Vercel functions)
   │
   ├── holds ALL prompts (brains 1–7, 27 lenses, corpus, traditions)
   ├── holds the Anthropic API key (never shipped)
   ├── enforces tier word limits BEFORE any API spend
   ├── rate-limits per user (Upstash Redis)
   └── calls Anthropic, streams Brain 2 back to the client
```

The client becomes "dumb": it renders what it's given and sends what the user typed. The prompts, the lens voices, the tradition framework — the things that took you the work — never leave the server. This is worth doing even before any other production feature, because it's the thing that makes the product *defensible*.

### 2.2 The stack (confirmed from your v3.0 doc — this is sound)

| Layer | Choice | Why it's right for you |
|---|---|---|
| Framework | Next.js 14 (App Router) on Vercel | Server routes keep prompts server-side; streaming is native; zero-config deploy |
| Language | TypeScript strict | Catches the class of "missing function / undefined constant" bugs that have bitten the MVP repeatedly |
| Auth | Clerk | Production auth without writing your own; gates the word-limit + tier logic |
| Database | Supabase (Postgres) | Saves works + analyses + revisions per user; row-level security at the DB |
| Payments | Stripe | Subscriptions, the free→paid tiers, billing portal, webhooks |
| AI | Anthropic, 7-brain, server-side only | The architecture you've already proven |
| Prompt caching | Anthropic prompt caching | ~90% cost cut on the repeated system prompts — directly protects your margin |
| Rate limiting | Upstash Redis | Stops abuse before it costs you API money |
| Analytics | PostHog | Privacy-respecting; shows you the funnel (upload → analysis → conversion) |
| Errors | Sentry | Catches production breakage the way your manual checks catch MVP breakage |

### 2.3 The cost structure that makes the economics work

Your own measured numbers: ~$0.07–0.16 per full analysis, ~$0.008–0.015 per lens. With **prompt caching** on the large repeated system prompts, the marginal cost of an analysis drops substantially because the cached portion (the tradition framework, the corpus) isn't re-billed at full rate each call. This is what lets you offer a genuinely useful free tier without bleeding money — and what makes the paid tiers high-margin.

The architecture's word-limit-before-API-call law is what protects you: a free user can't submit a 120,000-word novel and cost you $3 in one click. The check runs server-side, before spend.

### 2.4 The saved-work / library feature (answering your earlier question)

This belongs in production, not the MVP. With Supabase + auth, a logged-in user gets:
- A **library** of their works (multiple scripts/stories), each with its analyses
- **Revisions saved alongside the original** — the Revision Notes panel you already have becomes persistent, version-stamped, and tied to the work
- The ability to **re-run analysis on a new draft** and see what changed

This is also a retention engine: a writer with three drafts and their analyses stored is far less likely to churn than one who treated it as a one-off.

### 2.5 Build sequencing (do not reorder)

Following your own thinking discipline — load-bearing first:

1. **Server-side prompts + API routes** (the IP protection). Nothing ships until this is true.
2. **Auth + tier gating + word-limit enforcement.** The commercial spine.
3. **Port the 7-brain orchestration** exactly as proven in the MVP, now server-side.
4. **Database: works, analyses, revisions.** The library + save feature.
5. **Stripe tiers + billing portal.**
6. **Marketing site + pricing page** (the `(marketing)` route group).
7. **Staging → manual verification → production.** Never auto-deploy (your own law).

---

## PART 3 — PRICING STRATEGY

### 3.1 The principle

Price on **value delivered**, not tokens consumed. Sudowrite prices on credits because it *generates* — more words, more cost. You *analyse*. A writer doesn't want "more words"; they want a clear, trustworthy reading of the draft they have. So your unit is the **analysis** (and its depth), not the credit.

This also sidesteps the single biggest complaint about the generation tools: the credit system's "use it or lose it" anxiety and opaque per-feature credit costs. You can win on *clarity of pricing* alone.

### 3.2 The competitive frame (current, June 2026)

- Roast My Script: **$9 per script**, one-off, generic-rulebook AI coverage
- Human coverage: **$60–$400** per script, 3–14 day turnaround
- Consultants: **$1,500+** for developmental notes
- Sudowrite (generation, not comparable but sets the subscription anchor): **$10–$59/mo**

Draft & Lens delivers something between "AI coverage" and "a developmental editor + a roomful of master craftspeople," in minutes. That's a strong value position: far cheaper than human coverage, far deeper than $9 template coverage.

### 3.3 The recommended tiers

Four tiers, free → pro, familiar in shape to the market but specific to what Draft & Lens does. Names are suggestions — the structure is the point.

---

**FREE — "The Reading"**
*Price: £0*
- Up to **10,000 words** per analysis (a short film, a pilot teaser, a short story) — the limit your MVP already uses
- **2–3 full analyses per month**
- The complete core report: tradition diagnosis, full editorial analysis, action plan, what-to-fix-next, verdict
- **1 lens voice** per analysis (let them taste the thing that makes you different)
- No saved library (analyses expire after the session or after 7 days)
- *Purpose: prove the specificity. The free tier must be genuinely useful — this is your top-of-funnel and your word-of-mouth engine. A writer should be able to get one real, surprising, tradition-aware reading for free and immediately understand why this is not Roast My Script.*

**STARTER — "The Workshop"**
*Price: ~£9/mo (or ~£7/mo billed annually)*
- Up to **30,000 words** per analysis
- **Unlimited analyses**
- **All 27 lens voices**
- **Saved library** — keep your works, analyses, and revisions
- The conversation panel ("Speak with your editor") + revision notes, persistent
- *Purpose: the natural home for a serious emerging writer working through drafts. Priced at the psychological floor of the subscription market and deliberately undercutting a single human coverage report — a month of unlimited deep readings for less than one $9 generic AI coverage of a single script elsewhere, with vastly more depth.*

**PRO — "The Development Slate"**
*Price: ~£24/mo (or ~£19/mo annually)*
- **Feature-length / full-manuscript** word limits (no practical cap for one work)
- Everything in Starter
- **Multi-work projects** — manage a slate, compare drafts side by side
- **Draft-over-draft comparison** ("what changed, and did it work?")
- **Full export** (the complete report + all lens analyses + bible, mirroring the on-screen output — already built)
- Priority analysis speed
- *Purpose: the working/professional writer with multiple projects. This is your revenue centre. Still a fraction of one human coverage report, and a tiny fraction of a consultant.*

**STUDIO / TEAM — "The Reading Room"**
*Price: custom / per-seat (start ~£49/seat/mo)*
- Multi-seat for development teams, production companies, writing programs, agencies
- Triage / consistent comparison across many submissions (the use case OnDesk targets at the enterprise end)
- Shared libraries, team revision tracking
- *Purpose: the B2B tier. Lower priority for launch, but the directory of who-to-contact in Part 5 seeds it. This is where the real money eventually is, but don't lead with it.*

### 3.4 Pricing notes specific to Draft & Lens

- **Annual discount** (~20–25%) to pull cash forward and reduce churn — standard, expected.
- **No credit system.** Make this an explicit selling point on the pricing page: *"No credits. No 'use it or lose it.' You're paying to be read, not to spend tokens."* This is a direct, honest contrast with the generation tools' most-complained-about feature.
- **One-off option for the curious:** consider a **single deep analysis for ~£5** for non-subscribers, mirroring Roast My Script's per-script model — a low-friction entry that converts to subscription. Optional; test it.
- **Student pricing:** a discounted Starter for verified students. The screenwriting-education world (film schools, MFA programs) is a concentrated, reachable audience and a strong word-of-mouth vector.
- **Founders' / early-adopter rate:** lock the first cohort in at a permanent discount in exchange for testimonials and feedback. This funds your early case studies (Part 5).

---

## PART 4 — WHAT MAKES YOU DIFFERENT (the messaging spine for all promotion)

Everything in Part 5 should hammer three differentiators, in this order:

1. **It reads on the work's own terms.** Other tools apply one rulebook to everything. Draft & Lens identifies the *tradition* first and applies only the craft standards that belong to it. (Lead with this — it's the deepest and most defensible.)
2. **27 master lenses.** You can have your work read by the cognitive frame of Chekhov, Kaufman, Miyazaki, Simon — not "scored," *read*, each from a genuinely different entry point. No competitor has anything like this.
3. **It never rewrites your work.** It shows you the direction; you write it. This directly answers the "uncanny valley" fear and positions Draft & Lens as a *partner to the writer's voice*, not a replacement for it. (Your no-rewrite guardrail is now a marketing asset.)

A fourth, quieter one for the people who'll care most: **the narrator distinction** (elevation vs restatement vs world-establishment). It's a craft subtlety that no template tool can perform, and demonstrating it on a real example will make serious writers trust you instantly.

---

## PART 5 — GO-LIVE: GETTING IT IN FRONT OF EYEBALLS, FAST

The audience is concentrated and reachable. You do not need paid ads to start — this audience is suspicious of marketing and persuaded by *demonstration*. The strategy is: **show the tool reading a real script, in the places writers already gather.**

### 5.1 The launch sequence (first 90 days)

**Phase 0 — Before launch (weeks -4 to 0)**
- **Build 3–5 public "readings"** as your proof. Take well-known, legally-discussable scripts or your own work (e.g. your *Avarice*), run a full Draft & Lens analysis, and publish the reading as a blog post / thread. Each one demonstrates tradition-awareness and the lens voices on something concrete. *These are your single most persuasive asset.* They show, they don't tell.
- **Stand up the marketing site** with the pricing page, a clear "what makes this different" page, and a sample report a visitor can read without signing up.
- **Recruit a founding cohort** (20–50 writers) at the founders' rate for honest feedback and testimonials.

**Phase 1 — Soft launch (weeks 1–4): the communities**
The screenwriting and fiction worlds live in specific, identifiable places:

- **r/Screenwriting** (~half a million members; the largest and oldest hub) and **r/writing**, **r/Filmmakers**, **r/screenwritingcraft**. *Critical:* these communities despise overt promotion and reward genuine contribution. Do **not** post an ad. Post a *demonstration* — "I ran [a well-known script] through a tradition-aware analysis; here's what it caught that template coverage misses," with the tool as the visible engine. Engage in the AMA culture, answer craft questions substantively, let the tool be discovered through usefulness. The mods are strict; read the rules of each sub first.
- **Stage 32** — social + educational hub for screenwriters; more promotion-tolerant, good for a founder introduction post.
- **The Black List community** — where serious screenwriters congregate and where credibility compounds.
- **Screenwriting Stack Exchange / Done Deal Pro / Twitter-X #screenwriting + #amwriting + #WritingCommunity** — for ongoing presence.
- **Fiction side:** r/writing, Scribophile, Absolute Write, NaNoWriMo communities, literary-fiction Discords.

**Phase 2 — Content & SEO engine (weeks 2–12, ongoing)**
This compounds and is your durable, free acquisition channel.

- **Target the questions writers actually search:** "is my screenplay any good," "AI script coverage," "script coverage cost," "how to know what genre my script is," "best feedback for screenwriters," "alternatives to [Sudowrite / Black List / human coverage]." Write genuinely useful articles answering these, with the tool as the natural answer.
- **The tradition essays.** Your unique SEO moat: nobody else can write "How a mythic allegory should be read differently from a kitchen-sink drama" with authority *and* a tool that does it. Each tradition becomes an article. These rank because they're genuinely rare and genuinely deep.
- **The lens essays.** "What Chekhov would tell you about your short story." "What David Simon notices that a script reader doesn't." These are inherently shareable and SEO-rich, and they showcase the product's soul.
- **Comparison pages** (high commercial intent): "Draft & Lens vs traditional script coverage," "Draft & Lens vs AI coverage tools." Honest, specific, framed around the analysis-not-generation distinction.

**SEO technical basics (do these once, properly):**
- Clean, fast Next.js site (Vercel handles most of this); proper meta titles/descriptions; Open Graph cards for the shareable readings; structured data; a real sitemap.
- A genuinely useful free sample report indexed by Google — let people find the *output* via search.
- Get listed in the directories writers actually consult: the "best AI script coverage tools 2026" roundups (Scriptation, OnDesk's comparisons, etc.). Reach out to the authors of those roundups with a free Pro account and a sample reading — being *in the comparison* is worth more than any ad.

**Phase 3 — Amplification (weeks 6–12+)**
- **Screenwriting & writing YouTubers / podcasters / Substackers** — send them a free Pro account and offer to run their own script (or a famous one) through it live. The 27-lens feature is inherently demonstrable and entertaining on video. This audience trusts creators far more than ads.
- **Film schools & MFA programs** — the student tier plus a few faculty relationships seeds a generation of users. Offer program-wide trials.
- **Screenwriting newsletters** (e.g. the big Substack/Museletter-style ones) — a sponsored or earned mention framed as "the analysis tool that reads on your work's terms."

### 5.2 Who specifically to tell it exists

- **The roundup authors** (Scriptation's "best AI script coverage" list, OnDesk's comparisons, the Medium/blog reviewers) — get reviewed and included.
- **Screenwriting educators and YouTubers** with engaged audiences.
- **Festival and competition organisers** — a tool that helps writers self-assess before paying $75 entry fees is something they can mention as a service to entrants.
- **Writing-group leaders, MFA faculty, screenwriting Discord/Slack admins** — the connectors who tell many writers at once.
- **Industry readers and development executives** — your eventual B2B/Studio tier; introduce the triage use case once the consumer product is proven.

### 5.3 What NOT to do

- Don't lead with paid ads. This audience is ad-resistant; demonstration converts, ads don't (yet).
- Don't market it as a *writing* tool or an "AI that fixes your script." That triggers the uncanny-valley distrust and miscategorises you.
- Don't post promotional spam in craft communities — it will get you banned and poison the brand. Contribute first, be discovered second.
- Don't hide the free tier's quality to push upgrades. The free reading *is* the marketing.

---

## PART 6 — THE LAUNCH CHECKLIST (condensed)

**Product-ready**
- [ ] All prompts + 27 lenses moved server-side; client sends text only
- [ ] API key never in client; verified in production build
- [ ] Word-limit + tier enforcement runs before any API call
- [ ] Auth, Stripe tiers, billing portal live
- [ ] Saved library: works + analyses + revisions persist per user
- [ ] Full export mirrors on-screen output (done in MVP — port it)
- [ ] Prompt caching enabled (protects margin)
- [ ] Rate limiting + Sentry + PostHog live
- [ ] Staging verified manually before production (no auto-deploy)

**Market-ready**
- [ ] 3–5 published "readings" demonstrating tradition-awareness + lenses
- [ ] Marketing site + pricing page + free public sample report
- [ ] Founding cohort recruited; first testimonials captured
- [ ] Tradition essays + lens essays seeded for SEO
- [ ] Comparison pages live ("vs human coverage," "vs AI coverage")
- [ ] Outreach list built: roundup authors, educators, YouTubers, newsletters
- [ ] Community accounts established and *contributing* (not selling) before launch day

---

## PART 7 — THE ONE THING TO PROTECT ABOVE ALL

Through every decision below — pricing, promotion, the rush to launch — the load-bearing dependency does not change: **the analysis must read each work on its own terms.** The moment Draft & Lens starts producing template notes that could be pasted onto any script, it becomes Roast My Script with a nicer interface, and the entire premium position collapses.

Guard the corpus. Guard the tradition-first architecture. Guard the narrator distinction. Those are not features — they are the product. Everything in this plan is in service of getting *that* in front of the people who will recognise it.

---

*Prepared as a living document. Revise as the market, the model costs, and the competitive set move.*
