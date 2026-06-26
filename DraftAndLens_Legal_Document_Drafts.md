# Draft & Lens — Legal Document Drafts (FOR SOLICITOR REVIEW)

> **⚠️ THESE ARE FIRST DRAFTS, NOT LEGAL ADVICE.** They exist to give a solicitor something to *review and finalise* rather than write from scratch — saving you time and cost. Do NOT publish or rely on them until reviewed by a qualified UK solicitor. Placeholders in `[SQUARE BRACKETS]` need your input. Last drafted against the D&L build as specified in the Code prompt (revision-awareness, moderation gate, Supabase EU/UK, no model training).

**Standing assumptions baked into these drafts (change if wrong):**
- Operating from and hosting in the **UK/EU**.
- **18+ only** service.
- Data stored: submitted text, generated readings, an email for login. Nothing more.
- **No AI model training** on user content.
- Providers: Anthropic (reading generation), Supabase (storage, EU/UK region), Clerk (auth), Vercel (hosting), Stripe (billing, when live).

---
---

# 1 · PRIVACY POLICY (draft)

**Draft & Lens — Privacy Policy**
Last updated: [DATE]

## Who we are
Draft & Lens ("D&L", "we", "us") provides an AI-generated literary reading service. For data-protection purposes, the data controller is [YOUR LEGAL NAME / COMPANY NAME], contactable at [CONTACT EMAIL]. [If registered as a company: company number [X], registered at [ADDRESS].]

## What this policy covers
How we collect, use, store, and protect your personal data when you use D&L, and the rights you have over it. This service is for users aged 18 and over.

## What we collect
- **Your account email**, used to create and access your account. We do not require your real name.
- **The writing you submit** (your manuscript, script, or other text) so we can generate a reading.
- **The readings we generate** for you.
- **Minimal technical/usage data** necessary to operate and secure the service.

We deliberately collect as little as possible.

## Why we use it (lawful basis)
- To **provide the service you asked for** — generating and returning your reading (performance of a contract).
- To **support revision-awareness** — we retain your previously submitted version so that, if you resubmit, we can tell whether the work has changed and respond appropriately. This comparison is done to provide the service.
- To **keep the service secure** and meet our legal obligations.

## What we do NOT do with your work
- We do **not** use your submitted work to train AI models. (Your text is sent only to our AI provider to generate your reading; it is never used for training, and our system has no setting that opts it into training.)
- We do **not** sell your work or your personal data.
- We do **not** share your work except with the processors below, strictly to operate the service.
- We claim **no ownership** of your work (see the Terms of Service).

## Where your work actually goes (full transparency)
So the promise above is precise and honest, here is exactly what happens to your text:
- It is sent to **Anthropic** (our AI provider) to generate your reading. Anthropic's commercial terms state they do not use API data to train their models. They retain it only briefly (a limited window for trust-and-safety/abuse monitoring — see Anthropic's current data-usage terms for the exact period) and then delete it.
- It is stored in **your own account** (our database) so the revision feature can tell a genuine rewrite from a resubmission, and so you can return to your readings. This is your data, in your account — you can export or delete it at any time (see Your rights).
- It is sent **nowhere else** — no analytics service, no third party, ever receives your manuscript.

We say "we never train AI on your work, and we only send it to generate your reading." We do **not** claim "we store it nowhere" — because we do store it, in your account, for the features above.

## Who processes your data (our processors)
To run D&L we use trusted third parties, each under a data-processing agreement:
- **Anthropic** — generates the reading from your text.
- **Supabase** — stores your account, works, and readings (hosted in the EU/UK).
- **Clerk** — manages secure login.
- **Vercel** — hosts the application.
- **Stripe** — processes payments [when paid plans are live].

## Where your data is stored
Your data is stored in the **EU/UK region**. We choose this region to keep your data within strong data-protection jurisdictions and avoid unnecessary international transfers.

## How long we keep it
- We keep your works and readings while your account is active, and for [RETENTION PERIOD] after your last activity, after which inactive content may be deleted.
- We retain at most [N = 5] versions of any single work, removing older ones automatically.
- When you delete a work or your account, it enters a [GRACE WINDOW, e.g. 7–30 day] recovery period, after which it is permanently deleted.

## How we protect it
- **Encryption in transit** (HTTPS) and **at rest**.
- **Access controls** ensuring you can only access your own content.
- We store the minimum necessary.

## Your rights
Under UK GDPR you have the right to:
- **Access** your data and **export** a copy (available in-app).
- **Delete** individual works or your entire account (available in-app).
- **Correct** inaccurate data.
- **Object to or restrict** certain processing.
- **Complain** to the Information Commissioner's Office (ico.org.uk) if you believe we've mishandled your data.

To exercise any right not available in-app, contact [CONTACT EMAIL].

## Data breaches
If a breach affecting your personal data occurs, we will act promptly and notify the ICO and affected users where legally required, within the timeframes the law sets.

## Changes to this policy
We may update this policy; we will post the new version with an updated date and, for material changes, notify you.

## Contact
[CONTACT EMAIL]

---
---

# 2 · TERMS OF SERVICE (draft)

**Draft & Lens — Terms of Service**
Last updated: [DATE]

## 1. About these terms
These terms govern your use of Draft & Lens ("D&L"). By creating an account or using the service you agree to them. If you do not agree, do not use D&L. This service is for users aged 18 and over.

## 2. What D&L is — and is not
- D&L provides an **AI-generated literary reading** of writing you submit.
- It is **"a reading, not a rewrite."** It offers interpretation and craft observations.
- It is **not** professional editorial, publishing, legal, or any other professional advice.
- Readings are **AI-generated and may vary** between runs even for similar input. They are one perspective to weigh, not an authoritative verdict.

## 3. Your work stays yours
- You retain **all copyright and ownership** of the work you submit.
- You grant us only the **limited licence necessary to operate the service** — to store, process, and display your work back to you, and to generate your reading. This licence exists solely to provide the service and for no other purpose.
- We do **not** claim ownership, do **not** use your work to train AI models (it is sent only to generate your reading, never for training), and do **not** sell or publish it.
- The licence ends when you delete the work (subject to the recovery window and any short technical retention in backups).

## 4. Your responsibilities
- You confirm you are **18 or over**.
- You confirm you have the **right to submit** the work you upload.
- You agree to use D&L lawfully and in line with our **Acceptable Use Policy**, including its content rules. You are responsible for ensuring your use is lawful in your location.

## 5. Content we don't allow
Use of D&L is subject to our Acceptable Use Policy. We may refuse, remove, or decline to process content that breaches it, and may suspend or terminate accounts for serious or repeated breaches.

## 6. Payment [when live]
- Paid plans, prices, billing cycle, and what each plan includes are described at [PRICING PAGE].
- [Refund and cancellation terms — TO BE CONFIRMED with solicitor.]

## 7. Availability and changes
- We aim to keep D&L available but do not guarantee uninterrupted service.
- We may change, suspend, or discontinue features, and will give reasonable notice of material changes where we can.

## 8. Liability
- D&L is provided **"as is."** To the fullest extent permitted by law, we are not liable for indirect or consequential losses, or for decisions you make based on a reading.
- Nothing in these terms limits liability that cannot lawfully be limited. [Solicitor to finalise liability wording.]

## 9. Termination
- You may stop using D&L and delete your account at any time.
- We may suspend or terminate access for breach of these terms or the Acceptable Use Policy.

## 10. Governing law
These terms are governed by the laws of [England & Wales / your jurisdiction], and disputes are subject to its courts.

## 11. Contact
[CONTACT EMAIL]

---
---

# 3 · ACCEPTABLE USE POLICY (draft)

**Draft & Lens — Acceptable Use Policy**
Last updated: [DATE]

## The spirit of this policy
D&L is a tool for serious writers. **Serious literature engaging with dark, difficult, violent, or sexual themes is welcome here** — that is the substance of much great writing, and our reading is designed for it. This policy is not about subject matter. It targets a narrow set of genuinely prohibited content.

## What is prohibited
You must not submit:
1. **Child sexual abuse material (CSAM)** — any sexual content involving minors. This is absolutely prohibited, with no exception, including for claimed literary purposes. Such content is blocked before storage and may be reported as required by law.
2. **Content that is illegal** to possess or transmit under the laws of the jurisdiction in which we operate.
3. **Pornographic content with no literary purpose** — material whose function is sexual gratification rather than literary work.

## The distinction we draw
We distinguish between **a literary work that depicts** difficult or sexual subject matter (allowed) and **prohibited content** as defined above (not allowed). We err on the side of allowing serious creative work.

## Your responsibility
You are responsible for ensuring the work you submit is lawful where you are, and that you have the right to submit it.

## What happens if content breaches this policy
We may refuse to process it, decline to store it, remove it, and — for serious or repeated breaches — suspend or terminate your account. For prohibited content we are legally required to act on, we will comply with our legal obligations.

## Contact
Questions about this policy: [CONTACT EMAIL]

---
---

# 4 · AI DISCLOSURE NOTICE (draft — short, for display on/near the reading)

**About your reading**

This reading is **generated by AI**. It is a *reading, not a rewrite* — one informed perspective on your work, offered to think with, not an authoritative verdict. Because it is AI-generated, the wording and emphasis **may vary** between runs, even for the same piece. It is not professional editorial, publishing, or legal advice. Weigh it as you would any single reader's response: useful, considered, and yours to accept or reject.

---
---

---
---

# 5 · VISIBLE IN-PRODUCT COPY — the no-training promise (sign-up + upload box)

This is the short, plain wording to show users at sign-up and near the paste/upload box. It is deliberately precise — it claims only what is true and code-proven, and does NOT overclaim ("stored nowhere").

**Short form (near the upload box):**
> Your work is yours. We never train AI on it — it's sent only to generate your reading, and never shared with anyone else. You can delete it anytime.

**One-liner (sign-up):**
> We never train AI on your writing. It's yours — export or delete it whenever you like.

**What NOT to say (would be untrue):**
- ❌ "Your work is stored nowhere" / "We keep nothing" — false; it's stored in your own account for the revision feature, and Anthropic holds it briefly for safety.
- ❌ "No one ever sees it" — it's processed by our AI provider to generate the reading.

**The true, full picture (the precise claim the short forms compress):** never used for training · sent only to generate your reading · stored in your own account (exportable/deletable) · held briefly by the AI provider for safety then deleted · sent to no other third party.

> ⚠️ **TO-DO before this copy or the privacy policy goes public:** verify the "AI provider doesn't train on it / brief retention then deletion" wording against Anthropic's CURRENT Commercial Terms / data-usage page (the ~30-day figure and the no-training commitment are theirs and can change). Your public claim must match their live policy, not a summary. This belongs in the data-protection verification step.

---
---

## Notes for your solicitor session (hand these over too)- Confirm the **lawful basis** framing (contract performance) fits how you actually operate.
- Confirm **liability and "as is"** wording (§8 of Terms) is adequate for UK consumer law — consumer-protection rules may limit some exclusions.
- Confirm **refund/cancellation** terms once pricing is set (UK consumer cancellation rights apply to digital services).
- Confirm whether you need a separate **cookie notice** (depends on what Vercel/Clerk/analytics set).
- Confirm the **18+ gate** is sufficient as worded, or whether you need age-verification beyond self-declaration.
- Confirm **processor list and DPAs** are complete and current.
- Confirm **ICO registration / data-protection fee** obligation applies to you (it almost certainly does).
