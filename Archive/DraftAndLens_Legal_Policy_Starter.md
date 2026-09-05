# Draft & Lens — Legal & Policy Starter

> **Read this first.** Nothing here is a substitute for legal advice. These are starting points and decisions to make. Before you take any payment or let testers in with real accounts, get a cheap legal review (a generated template + a one-off solicitor check is enough at this stage). The two items marked **REQUIRED** are effectively legal obligations once you store data and charge money.

---

## A · Documents you need (Code cannot write these)

### 1. Privacy Policy — REQUIRED
Must tell users, in plain language:
- **What you store:** their submitted text, the readings generated, an email for login. Nothing else.
- **Why (lawful basis):** to provide the reading service they asked for, and (for revision-awareness) to compare against their previous version.
- **Where:** hosted in the EU/UK region (state the provider — Supabase).
- **How long:** your retention policy (see §C).
- **Their rights:** access, export, correction, deletion (the functions Code is building).
- **No model training:** state plainly that their work is NOT used to train AI models. (This must also be true in the build.)
- **Third parties:** Anthropic (the API that generates the reading), Supabase (storage), Clerk (auth), Vercel (hosting), Stripe (billing, later). Name them; users have a right to know who touches their data.
- **Breach commitment:** that you will notify as legally required.

### 2. Terms of Service — REQUIRED (before charging)
- **What the service is:** an AI-generated literary *reading*, not a rewrite, not professional editorial/legal advice; output may vary between runs.
- **Copyright stays with the writer:** you claim NO ownership of submitted work. You take only the minimal licence needed to process and store it to provide the service, and nothing more. State explicitly you do not train on it, sell it, or share it.
- **Payment terms, refunds, cancellation** (when billing is live).
- **Liability limits** and **"as is" service** language (template-standard).
- **Account termination** rights (yours and theirs).

### 3. Acceptable Use Policy (AUP)
The content rules the moderation gate enforces. State clearly:
- Prohibited: CSAM (absolute), content illegal in the operating/hosting jurisdiction, pornographic content with no literary purpose.
- That **serious literature depicting dark or sexual themes is welcome** — the line is the narrow prohibited set, not subject matter. (This protects you from looking censorious to the serious writers you want.)
- That you may refuse, remove, or report content, and may suspend accounts for violations.
- Reference it in the refusal message the moderation gate shows.

### 4. AI disclosure notice
- A short, visible statement that readings are AI-generated, that output can vary between runs, and that it's a reading to weigh — not a verdict or professional editing. (You already believe this; it just needs to be written where users see it.)

### 5. Age policy — DECISION NEEDED
- If under-18s might use D&L, you trigger extra obligations (UK Children's Code, US COPPA, etc.).
- **Simplest path: make D&L 18+ only**, state it in the Terms, and you avoid the children's-data regime entirely. Recommended unless you have a reason to serve minors.

---

## B · The "illegal in any country" problem (important)
You can't satisfy every jurisdiction's content laws at once — something legal in the UK is illegal somewhere. The workable standard:
- Block what's **illegal where D&L operates and is hosted** (UK/EU), PLUS
- The **universal absolute: CSAM** (illegal everywhere, zero exception), PLUS
- Your **brand line on pornography** (a product choice).
Not "legal everywhere on Earth" — that's impossible and would reject legitimate literature.

**Build to GDPR (the strictest regime) and you're largely covered elsewhere** — including the patchwork of US state laws (California etc.). Don't try to satisfy each country separately.

---

## B2 · Data Processing Agreements (DPAs) — REQUIRED admin
Under GDPR, every third party that processes user data on your behalf needs a Data Processing Agreement in place. These are usually standard documents the provider offers — you accept/sign, you don't draft them. Get one with each:
- **Supabase** (storage)
- **Anthropic** (the API generating the reading)
- **Clerk** (auth)
- **Vercel** (hosting)
- **Stripe** (billing, when live)
Action: locate and accept each provider's DPA before going live with real user data. Keep copies for your records.

---

## B3 · Privacy as a trust feature (positioning — not law, but use it)
You are a data processor of **unpublished creative IP** — higher sensitivity than typical app data. A leak isn't just a privacy breach, it's a writer's unprotected work exposed. That raises the stakes, but it's also a selling point:
- **Lead with it.** "Your work is private, encrypted, and yours to delete. We never train AI on it." Put this where writers decide whether to trust you with a draft.
- This turns a legal obligation into a reason to choose D&L over tools that are vague about what they do with submitted work.

---

## C · Policy / process decisions (yours to make — not code, not law)
- **Operating jurisdiction:** confirm UK/EU as your base (sets which content laws and which data region apply).
- **Retention period:** how long do you keep a user's work after last activity? (e.g. delete inactive works after X months.) Pair with the version cap (last 5) Code is building.
- **Soft-delete grace window:** how many days before a deleted item is hard-deleted (the undo-delete window)? Pick a number (e.g. 7–30 days) and put it in the Privacy Policy.
- **Breach-response process:** who does what if there's a breach, and the 72-hour regulator-notification clock (UK GDPR). Even a one-page written process is enough at this stage.
- **Brand line on porn:** confirm D&L does not serve written pornography even where legal — a positioning choice, but decide it deliberately so the AUP and moderation gate match.

---

## D · How this maps to the build
- **Code builds:** the moderation gate, RLS, encryption config, EU region, export/delete/account-wipe functions, no-training guarantee, breach-logging hook, version cap, retention pruning. (All in the production Code prompt.)
- **You + a lawyer write/review:** the four documents above (Privacy, Terms, AUP, AI disclosure) and the age policy.
- **You decide:** the §C policy items.
- **Sequence:** documents + policy decisions must be done **before** real testers with accounts and **before** any payment — not before internal testing.
EOF
