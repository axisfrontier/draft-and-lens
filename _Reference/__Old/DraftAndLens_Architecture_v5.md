# Draft & Lens — Production Architecture
## Build Standard v5.0 — June 2026

---

> ⚠️ This document is law.
> Every standard here must be followed before a line of production code is written. Deviating from this guide produces an unmaintainable codebase. The editorial quality guarantee Draft & Lens makes to its users depends on this guide being followed completely.

> **v5.0 adds:** partial-read honesty (§13) so the free tier never concludes beyond what it has read; known-work market matching (§14) so produced works are recognised, not mis-pitched; and a latency architecture (§14b) addressing analysis speed at scale. These sections are as binding as the originals.

---

## 01 · The Laws

**Law — Tradition identification precedes every analysis**
No craft principle is applied before the tradition is confirmed. Brain 1 runs first. Brain 2 receives the confirmed tradition as established fact. This is enforced by architecture, not developer discipline.

**Law — One source of truth for every editorial rule**
Every craft principle, tradition definition, lens voice descriptor, and system prompt is defined once. Never copied. If the mythic allegory standard changes, it changes in one file.

**Law — The AI layer cannot modify the rules layer**
The AI receives craft principles from the prompts layer. It applies them. It cannot redefine or bypass them.

**Law — Every prompt has a version and a rationale**
Every system prompt documents: what craft principle it encodes, why it is phrased the way it is, when it was last reviewed.

**Law — Layers never bleed into each other**
UI renders data. Prompts define craft rules. API calls the AI. Data stores and retrieves.

**Law — New features are additive — never modifying**
Adding a new lens voice, tradition, or section must never require modifying existing working code.

**Law — Word limits enforced server-side before any API cost**
The tier word limit check runs before any Anthropic API call.

**Law — The API key never touches the client**
All AI calls through server-side API routes exclusively.

**Law — Design tokens are the only source of visual truth**
No hardcoded colours, spacing, or typography anywhere.

**Law — Production is never auto-deployed**
Staging first. Verification. Deliberate manual action.

**Law — The analysis never concludes beyond what it has read**
When input is truncated to a tier limit, every brain receives the exact read boundary and may not make whole-work judgments about unseen material. Provisional hypotheses are permitted; confident conclusions about what was not read are forbidden. (See §13.)

**Law — Known produced works are acknowledged, never mis-pitched**
If market matching recognises a submission as a produced or published work with high confidence, it identifies the work and its maker before naming comparable companies. It never recommends submitting a work to the company that already made it. Confidence-gated: uncertainty defaults to original-work behaviour. (See §14.)

**Law — Speed is a quality requirement, not a luxury**
Prompt caching is applied to every brain's system prompt. The unavoidable sequential pre-pass window is communicated through genuine staged progress, never a frozen screen or a fake progress bar. Cheaper/faster models may be used for pure-extraction pre-passes only where testing confirms quality holds — never for the analyst or the lenses. (See §14b.)

---

## 02 · Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, file-based routing, Vercel-native |
| Language | TypeScript strict | Type safety catches errors at compile time |
| Styling | Tailwind CSS | Design tokens via CSS variables |
| Components | shadcn/ui | Copied into codebase — full ownership |
| Auth | Clerk | Production-grade without custom auth code |
| Database | Supabase (Postgres) | Row-level security enforced at database |
| Payments | Stripe | Subscriptions, webhooks, billing portal |
| AI | Anthropic Claude Sonnet — 7-brain architecture | Server-side only. See Section 03 |
| Prompt caching | Anthropic Prompt Caching | ~90% cost reduction on repeated system prompts |
| Rate limiting | Upstash Redis | Per-user limiting before API cost |
| Analytics | PostHog | Privacy-respecting |
| Error monitoring | Sentry | Real-time alerts |
| Deployment | Vercel | Zero-config, preview deployments |

---

## 03 · The Brain Architecture

### Separation principle
Each brain does exactly one cognitive task. No brain does what another brain does. Where tasks overlap, quality degrades. This is the lesson of the single-pass failure.

```
SUBMISSION
    │
    ▼
BRAIN 1 — DIAGNOSTICIAN (Sonnet 4.6, ~2s, ~$0.002)
One job: identify tradition, register, ambition, primary concern.
Returns structured JSON. Does not evaluate. Does not map.
    │
    ▼
BRAIN 1b — STRUCTURAL READER (Sonnet 4.6, ~8s)
One job: map and collect evidence from the full text.
Receives: confirmed tradition from Brain 1.
Returns: narrative structure, timeline, register map with exact quotes,
strongest/weakest moments, narrator behaviour classified precisely
(elevating / restating / world-establishment), juxtapositions.
Does NOT evaluate. Does NOT give notes. Evidence only.
    │
    ▼
BRAIN 2 — ANALYST (Opus 4.6, ~60-80s, streaming)
One job: evaluate only.
Receives: Brain 1 diagnostic (locked, do not re-identify) +
Brain 1b structural map (locked evidence, do not rediscover).
Writes the analysis. Never discovers what Brain 1b already found.
Never re-identifies what Brain 1 confirmed.
    │
    ├─────────────────────────────────────┐
    ▼                                     ▼
BRAIN 3 — SCORER                    BRAIN 4 — MARKET
(Sonnet 4.6, parallel)              (Sonnet 4.6, parallel)
Craft balance scores +              Studio/publisher matching.
Tradition alignment scores.         Title + tradition only.
Returns JSON.                       Returns JSON.
    │
    ▼
BRAIN 5 — BIBLE GENERATOR (Sonnet 4.6, on demand)
Character bible from full text.
    │
    ▼
BRAIN 6 — LENS VOICES ×22 (Sonnet 4.6, on demand, cached)
Each lens is a COMPLETE STANDALONE SYSTEM PROMPT.
Not a template with craftPhilosophy injected.
Not a shared frame with rules bolted on.
Each prompt contains: entry point, red flags, what they praise,
forbidden notes, diagnostic question, narrator rule,
juxtaposition rule, mentorship approach.
Receives: full text + Brain 1 diagnostic (tradition locked).
Results cached per lens per submission.
    │
    ▼
BRAIN 7 — CONVERSATION (Sonnet 4.6, on demand)
Holds full analysis + diagnostic + conversation history.
Responds to pushback. Can address individual lens voices.
Results not re-run — uses cached lens outputs.
```

### Why standalone lens prompts, not a shared template

The shared template approach was tried and failed repeatedly. The failure mode: the structural frame (corpus, inviolable rules, DO NOT DO THIS instructions) dominated the voice. Every lens produced the same analysis flow in a different register. This is not voice diversity — it is tonal variation on a shared template.

The fix: each lens is its own complete system prompt. The voice is not injected into a frame — it IS the frame. The narrator rule, the juxtaposition rule, the forbidden notes, the diagnostic question — all written in each lens voice, from each lens perspective. Bukowski's narrator rule sounds like Bukowski. Chekhov's sounds like Chekhov. They arrive at different places because they start from different places.

### What each lens prompt must contain

Based on the research document and extended editorial session:

1. **Entry point** — what this person notices first, the specific cognitive lens they apply
2. **What the generic analysis probably says** — what this lens is NOT going to repeat
3. **What this voice adds** — what only this person can bring
4. **What this voice respectfully disagrees with** — where they push back on conventional editorial wisdom
5. **Red flags** — what they notice first, specific to their craft philosophy
6. **What they praise** — without reservation, specific to their taste
7. **Forbidden notes** — things they would never say
8. **Diagnostic question** — the one question that unlocks this lens's perspective
9. **Narrator rule** — their specific position on narration vs image
10. **Juxtaposition rule** — their specific position on tonal/temporal contrasts
11. **Mentorship approach** — the sequence in which they give feedback
12. **Example notes** — what the generic analysis says vs what this voice says instead

### The narrator distinction (embedded in every lens, in their own language)

Every lens must distinguish these precisely:
- **World-establishment**: atmospheric description creating the world. Never flag.
- **Elevation**: narrator adds what the image cannot carry alone. Correct when earned.
- **Restatement**: narrator explains what the image already showed. Only this is failure.

This is not a rule bolted onto each lens from outside. It is built into each lens's own narrator rule, stated in their voice.

### Brain speed targets

| Brain | Model | Task | Target time |
|---|---|---|---|
| Brain 1 | Sonnet 4.6 | Tradition identification | ~2s |
| Brain 1b | Sonnet 4.6 | Evidence mapping | ~8-12s |
| Brain 2 | Opus 4.6 | Full evaluation (streaming) | ~60-80s |
| Brain 3 | Sonnet 4.6 | Scores (parallel) | ~5s |
| Brain 4 | Sonnet 4.6 | Market matching (parallel) | ~5s |
| Brain 5 | Sonnet 4.6 | Bible generation (on demand) | ~10s |
| Brain 6 | Sonnet 4.6 | Lens analysis (on demand, cached) | ~15s first; 0s cached |
| Brain 7 | Sonnet 4.6 | Conversation (on demand) | ~5s per turn |

**Total blocking time (Brains 1+1b before Brain 2 starts): ~12-14s**
**Total analysis time (Brain 2 streaming): ~75-90s end-to-end**


---

## 04 · Architecture Layers

**Layer 1 — Prompts** `/src/prompts/`
Single source of truth for all craft knowledge. TypeScript constants. No UI, no API calls. Versioned with rationale comments.

**Layer 2 — AI** `/src/ai/brains/`
The 7-brain orchestration layer. Server-side only. Each brain in its own file. Orchestrator sequences them.

**Layer 3 — API** `/src/app/api/`
Next.js API routes. Auth, rate limiting, word limit enforcement, orchestrating brains. No business logic in UI.

**Layer 4 — Data** `/src/data/`
Supabase operations. No editorial logic. Row-level security at the database.

**Layer 5 — UI** `/src/components/` and `/src/app/(app)/`
React components. Renders data. Makes no editorial decisions. Design tokens exclusively.

---

## 05 · Folder Structure

```
draft-and-lens/
│
├── src/
│   ├── prompts/
│   │   ├── modes/
│   │   │   ├── script.ts           ← Tradition-aware script system prompt
│   │   │   ├── story.ts
│   │   │   └── play.ts
│   │   ├── lenses/
│   │   │   ├── index.ts            ← All 22 lens voices — typed, versioned
│   │   │   └── types.ts
│   │   ├── fragments/              ← Conditional prompt fragments (v5.0)
│   │   │   ├── partial-read.ts     ← Appended to analyst when input truncated (§13)
│   │   │   └── known-work.ts       ← Appended to market brain for recognition (§14)
│   │   ├── report/
│   │   │   ├── script-structure.ts
│   │   │   └── story-structure.ts
│   │   ├── diagnostic.ts           ← Brain 1 system prompt
│   │   └── conversation.ts         ← Brain 7 system prompts
│   │
│   ├── ai/
│   │   ├── brains/
│   │   │   ├── diagnostician.ts    ← Brain 1
│   │   │   ├── analyst.ts          ← Brain 2
│   │   │   ├── scorer.ts           ← Brain 3
│   │   │   ├── market.ts           ← Brain 4
│   │   │   ├── bible.ts            ← Brain 5
│   │   │   ├── lens.ts             ← Brain 6
│   │   │   └── conversation.ts     ← Brain 7
│   │   ├── orchestrator.ts
│   │   └── client.ts               ← Anthropic client — server only
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyse/route.ts    ← Runs brains 1+2+3+4+5
│   │   │   ├── lens/route.ts       ← Brain 6 — full text, no compression
│   │   │   ├── converse/route.ts   ← Brain 7
│   │   │   ├── upload/route.ts
│   │   │   └── webhooks/stripe/route.ts
│   │   ├── (app)/
│   │   │   ├── page.tsx            ← Upload screen
│   │   │   └── analysis/[id]/page.tsx
│   │   └── (marketing)/
│   │       ├── page.tsx
│   │       └── pricing/page.tsx
│   │
│   ├── components/
│   │   ├── analysis/
│   │   │   ├── ReportSection.tsx
│   │   │   ├── VerdictBand.tsx
│   │   │   ├── RadarChart.tsx
│   │   │   ├── StoryArc.tsx
│   │   │   └── CraftDirectives.tsx
│   │   ├── conversation/
│   │   │   ├── ConversationPanel.tsx
│   │   │   ├── MessageThread.tsx
│   │   │   ├── RevisionNotes.tsx
│   │   │   └── SuggestedPrompts.tsx
│   │   ├── lens/
│   │   │   ├── LensStrip.tsx
│   │   │   ├── LensPanel.tsx
│   │   │   └── LensDialogue.tsx
│   │   └── upload/
│   │       ├── UploadZone.tsx
│   │       └── WordCountIndicator.tsx
│   │
│   ├── data/
│   │   ├── analyses.ts
│   │   ├── conversations.ts
│   │   ├── revisions.ts
│   │   └── users.ts
│   │
│   ├── stripe/tiers.ts
│   └── design/tokens.css
│
├── tests/
│   ├── brains/
│   ├── prompts/
│   └── api/
│
└── ARCHITECTURE.md
```

---

## 06 · The Tradition Framework

Every analysis begins with tradition identification. These are distinct craft systems with distinct rules.

### Script traditions

**Social Realism** (Loach, Leigh, Arnold, Jenkins)
Rules: Concrete, behavioural, specific. Oblique dialogue. Exposition is failure.

**Mythic/Allegorical** (Malick, Kubrick, Tarkovsky, Coppola, Avarice)
Rules: Narrator is a structural instrument — earns its altitude through genuine insight, not repetition. Expository set-pieces (courts, judgments) are the tradition's primary dramatic instrument. Scene headings and action lines must match the narrator's register — not existence, quality.
**Critical protection:** Do NOT apply social realist rules here. A court scene pronouncing judgment is not exposition failure. A narrator who speaks of centuries is not telling when it should show. The question is whether these choices are executed with discipline.

**Genre** (Chinatown, Get Out, Some Like It Hot)
Rules: Conventions are promises. Engine runs on every page.

**Epic/Historical** (Schindler's List, Lawrence of Arabia)
Rules: Personal and historical in active conversation.

**Chamber** (Locke, 12 Angry Men)
Rules: Power dynamic alive in every exchange.

**Experimental** (Memento, Eternal Sunshine)
Rules: Form is argument.

### Fiction traditions

**Minimalist Realism** (Carver, Hemingway, Munro)
Rules: Iceberg — what is absent does the work. Scene ends before emotional peak. Lish: limiting explanation to reveal mystery.

**Mythic/Fabular** (Melville, García Márquez, Kafka, Borges)
Rules: Narrator at altitude is the form. Allegorical figures retain human specificity — Ahab is a symbol AND a specific man with a specific wound. Fabular register must hold consistently.
**Critical protection:** Do NOT apply minimalist realist rules here.

**Literary Modernism** (Woolf, Joyce, Faulkner)
Rules: Consciousness as primary material. Sentence rhythm is argument.

**Gothic** (O'Connor, McCarthy, Jackson)
Rules: Meaning through rupture. Grotesque serves moral weight.

**Satirical** (Waugh, Spark, Saunders)
Rules: Exaggeration is precision. Tone must be exact.

### Stage play traditions

**Naturalism** (Chekhov, Ibsen): Loaded stage. Subtext primary.
**Epic/Political** (Brecht, Churchill): Audience thinks, not just feels.
**Absurdist** (Beckett, Ionesco): Stasis is drama.
**In-yer-face** (Kane, Ravenhill): Confrontation as form.
**Chamber** (Pinter, Mamet): Power shifts in every exchange.

---

## 07 · Subscription Tiers

**Model policy:** Claude Sonnet across all tiers. No quality reduction as a cost measure.
**Lens policy:** Full text to every lens call. No compression. Ever.
**Conversation policy:** Writer and Professional tiers. Brain 7 calls are 800 max tokens — economically sound at any usage level.

```typescript
export const TIERS = {
  free: {
    priceGBP: 0, analysesPerMonth: 1, wordLimit: 10_000,
    features: { fullReport: true, lensVoices: false,
                conversation: false, studioMatching: false,
                reportDownload: false, history: false }
  },
  writer: {
    priceGBP: 15, analysesPerMonth: 20, wordLimit: 30_000,
    features: { fullReport: true, lensVoices: true,
                conversation: true, studioMatching: true,
                reportDownload: true, history: 30 }
  },
  professional: {
    priceGBP: 35, analysesPerMonth: Infinity, wordLimit: Infinity,
    features: { fullReport: true, lensVoices: true,
                conversation: true, studioMatching: true,
                reportDownload: true, history: 365,
                apiAccess: true, teamSeats: 3 }
  }
}
```

---

## 08 · Database Schema

```sql
CREATE TABLE analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT,
  mode       TEXT NOT NULL,
  tradition  TEXT,
  register   TEXT,
  ambition   TEXT,
  report     TEXT,
  verdict    TEXT,
  scores     JSONB,
  arc_beats  JSONB,
  studios    JSONB,
  diagnostic JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  messages    JSONB,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE revision_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  text        TEXT NOT NULL,
  source      TEXT,
  status      TEXT DEFAULT 'todo',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security on all tables
ALTER TABLE analyses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON analyses       FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own data" ON conversations  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own data" ON revision_notes FOR ALL USING (user_id = auth.uid());
```

---

## 09 · API Route Pattern

```typescript
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return new Response('Unauthorised', { status: 401 })

  const limited = await checkRateLimit(userId)
  if (limited) return new Response('Rate limit exceeded', { status: 429 })

  const { allowed, tier } = await checkTierLimit(userId, 'analyse')
  if (!allowed) return new Response('Upgrade required', { status: 403 })

  const { text, mode, genre, intent, bible } = await req.json()
  const clean = sanitiseInput(text)

  if (!isWithinWordLimit(clean.split(/\s+/).length, tier)) {
    return new Response(wordLimitMessage(wordCount, tier), { status: 403 })
  }

  // Brain 1 — fast diagnostic (sequential, ~2s)
  const diagnostic = await runDiagnostician(clean, mode)

  // Brains 2+3+4+5 — parallel, diagnostic locked in
  const [analysisStream, scores, studios] = await Promise.all([
    runAnalyst(clean, mode, genre, intent, bible, diagnostic),
    runScorer(clean, genre, wordCount),
    runMarket(diagnostic.title, diagnostic.tradition, genre, mode),
  ])

  return new Response(analysisStream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

## 10 · Testing Standards

| Test | What it covers | When |
|---|---|---|
| Brain 1 unit | Valid JSON for all traditions. Never guesses. | Every commit |
| Prompts integrity | All traditions present. Report structures complete. | Every commit |
| Tiers unit | Word limit logic. Feature flags. | Every commit |
| Brain sequence | Diagnostic flows to analyst. Tradition locked. | Every PR |
| Conversation | Brain 7 holds context. Revision notes generated. | Every PR |
| End-to-end | Full journey: upload → 7 brains → conversation → download | Before every release |

**The test that matters most:**
```typescript
it('Brain 2 never re-identifies the tradition', async () => {
  const diagnostic = { tradition: 'Mythic allegory in the Conrad tradition' }
  const prompt = buildAnalystSystemPrompt('script', 'auto', diagnostic)
  expect(prompt).toContain('ESTABLISHED DIAGNOSTIC')
  expect(prompt).toContain('Do not re-identify')
  expect(prompt).toContain(diagnostic.tradition)
})
```

---

## 11 · Build Order

**Stage 1 — Foundation (days 1–2):** Next.js, TypeScript, Tailwind, Supabase, Clerk, design tokens.

**Stage 2 — Prompts layer (days 3–4):** All system prompts as versioned TypeScript constants. All 22 lens voices typed. All traditions defined. Diagnostic prompt built. Tests written before Stage 3.

**Stage 3 — 7-Brain AI layer (days 5–6):** Brain 1 first — tested against multiple traditions. Brain 2 second — verified it receives diagnostic correctly. Brains 3+4+5 parallel. Brain 6 (lenses). Brain 7 (conversation).

**Stage 4 — Port UI (days 7–9):** React components. Design tokens applied. Zero inline styles.

**Stage 5 — API layer (days 10–11):** All routes with auth, rate limiting, word limits, 7-brain orchestration.

**Stage 6 — Conversation feature (days 12–13):** ConversationPanel, RevisionNotes, Brain 7 integration.

**Stage 7 — Billing (days 14–15):** Stripe, subscription flow, tier-aware UI.

**Stage 8 — Hardening (days 16–17):** Security, load testing, GDPR.

**Stage 9 — Launch (day 18):** Marketing homepage, pricing page, private beta.

---

## 12 · The Non-Negotiables

**Never** skip Brain 1. Every analysis begins with the diagnostician. Without it, Brain 2 is guessing the tradition.

**Never** let Brain 2 re-identify the tradition. It is locked. This is the architectural protection against the Avarice failure.

**Never** apply minimalist realist rules to mythic allegory. Prevented by architecture and by explicit prompt instruction.

**Never** compress text sent to a lens. Brain 6 receives the full text.

**Never** let Brain 7 be vague or encouraging for its own sake. The conversation is honest or it is worthless.

**Never** expose the API key client-side.

**Never** duplicate editorial logic.

**Never** auto-deploy to production.

---

*Document version 3.0 — May 2026 · Draft & Lens*
*Updated to reflect: 7-brain AI architecture, conversation feature with Brain 7, revision notes system, competitor analysis findings, thinking discipline application, and full production build standards.*


---

## 13 · Partial-Read Honesty (the free-tier accuracy gap)

**The problem.** The free tier reads only the first 10,000 words. On a feature script (~20,000 words) or a novel, that is the opening — often just Act One. An analysis that draws confident structural conclusions ("the third act is underpowered," "the ending doesn't earn its catharsis") from material it has not seen is not merely incomplete — it is *wrong*, and it damages the writer's trust and possibly their draft. This is a correctness problem, not a UX inconvenience.

**The law.**

> **Law — The analysis never concludes beyond what it has read.**
> When input is truncated, every brain is told the exact boundary of what it received, and no brain may make a whole-work judgment about material outside that boundary. Conclusions about unseen structure are forbidden; hypotheses, clearly marked as provisional, are permitted.

**How it is enforced (architecture, not discipline).**

1. **The truncation flag is a first-class signal.** The orchestrator computes `{ truncated: boolean, wordsRead: number, wordsTotal: number, fractionRead: number, coverage: 'complete' | 'partial' }` and passes it into *every* brain's context — not just the UI. The brains cannot behave honestly about a boundary they don't know exists.

2. **Brain 1 (Diagnostician) scopes its own confidence.** On partial input it identifies the tradition (usually clear from the opening) but flags ambition and arc as *provisional* — these often cannot be confirmed from Act One alone. Its JSON gains a `confidence` block: `{ tradition: 'high', register: 'high', ambition: 'provisional', arc: 'unseen' }`.

3. **Brain 2 (Analyst) operates under a partial-read directive.** A dedicated prompt fragment (`PARTIAL_READ_DIRECTIVE`, versioned, in `/src/prompts/fragments/`) is appended to the analyst system prompt only when `truncated === true`. It instructs:
   - State up front, in the writer's own register, that this reading covers the opening N,000 words.
   - Evaluate fully and confidently *what is present* — opening, voice, register, inciting incident, the establishment of stakes and world. These are real and assessable.
   - For anything that depends on the whole — overall arc, ending, midpoint, resolution, whether setups pay off — do not conclude. Instead, name what the opening *promises* or *sets up*, and frame the unseen as a question: "The opening plants X; whether it pays off is beyond this reading."
   - Never invent a third-act problem. Never say a work "loses momentum" or "fails to resolve" if the resolution was not in the text received.

4. **Brain 3 (Scorer) scores only what partial reading can support.** Register, specificity, and opening-craft scores are valid on an opening. Whole-work dimensions (earned weight, arc completion) are returned as `null` with a `reason: 'requires full text'` rather than a fabricated number. The UI renders these as "—  needs full work" rather than a misleadingly precise score.

5. **The report carries a persistent, honest banner.** Already implemented in the MVP: a non-dismissable notice at the top of a truncated analysis stating the boundary. In production this is generated from the `coverage` signal, not hard-coded.

**The tone of partial-read language (this matters).** It is not apologetic and it is not a paywall nag. It is the voice of an honest reader who has read the opening with full attention and is being precise about the limits of that vantage. Example of correct register:

> *"This reading covers the first 10,000 words — roughly your opening movement. Within it, the voice is assured and the central tension is established early and well. What this reading cannot yet judge is whether that tension is sustained and resolved, because the rest of the work isn't in front of me. The notes below are confident about the opening and deliberately provisional about the whole."*

**Why this is a feature, not an apology.** Generic AI coverage tools confidently score a whole work from partial or shallow reads and produce notes that "could be pasted onto any script." Draft & Lens being *epistemically honest about what it has and hasn't read* is the same differentiator as tradition-awareness, applied to coverage. It earns trust precisely where competitors lose it.

---

## 14 · Known-Work Market Matching (Brain 4 intelligence)

**The observation.** A user uploaded the produced A24 screenplay *The Lighthouse*. The market-matching brain should recognise that this is an existing, produced film — and say so — rather than blandly "recommending" studios as though pitching an original spec.

**The decision: acknowledge, then proceed — never block.**

When Brain 4 (Market) recognises a submission as a known produced work, it must:

1. **State the fact plainly and briefly**, without breaking the reading: *"This is the screenplay for* The Lighthouse, *produced by A24 (2019)."*
2. **Explain who made it and why that fit made sense** — the studio whose sensibility matched the work. This is genuinely instructive: it teaches the writer to read the studio–material fit.
3. **Then do the actual valuable thing:** name the *other* companies whose taste the work also suits — "Beyond A24, this distinctive black-and-white psychological register would also have suited Neon, Focus Features, or A24-adjacent specialty arms." This is the insight a writer studying the market wants.
4. **Never pretend it's an undiscovered spec.** Recommending "you should submit this to A24" for a film A24 already made is the kind of error that destroys credibility instantly.

**How recognition works (and its limits).**

- Brain 4 receives the title from Brain 1's diagnostic plus the opening text. Claude's training data already recognises many produced works from title + a few lines of distinctive text. A dedicated prompt fragment (`KNOWN_WORK_CHECK`) instructs the model: *"If you recognise this as a produced or published work with high confidence, identify it and its maker, then pivot to comparable companies. If you are not confident, do not guess — treat it as an original work."*
- **Confidence gating is mandatory.** A false positive ("this is clearly the script for [wrong film]") is worse than silence. The fragment requires high confidence and an explicit fallback to original-work behaviour otherwise. This mirrors the existing law that Brain 1 never guesses.
- **No external database in v1.** Recognition relies on the model's own knowledge, confidence-gated. A future version could add a verification lookup, but the architecture must not depend on one.

**The user value.** For a writer uploading their *own* original work this path rarely triggers. For a writer studying *produced* work to learn market fit — a legitimate and common use — it turns a wrong answer ("submit to A24") into a teaching moment ("A24 made it; here's the sensibility cluster it sits in"). Either way the reading stays honest.

---

## 14b · Analysis Speed (the latency architecture)

**The problem stated honestly.** At 10,000 words the pre-passes feel slow; at full-script length the current sequence risks being unacceptably slow. Speed is not cosmetic — a reader who waits two minutes staring at a near-static screen assumes the tool has stalled (as observed in testing). Latency is a product-quality problem.

**Where the time actually goes.** The pipeline has two phases:

- **Sequential pre-passes** (Brain 1 → Brain 1b → narrator verification) — these *must* be sequential because each depends on the prior's output. This is the unavoidable blocking cost before the main analysis can begin. On long input, Brain 1b (evidence mapping over the full text) is the single largest pre-pass cost.
- **The main analysis** (Brain 2, streaming) — long in wall-clock time but *feels* fast because it streams token-by-token; the user sees progress.

The perceived "stall" is the sequential pre-pass window, where the screen changes little while three full round-trips complete. So there are two distinct levers: **reduce real pre-pass time**, and **make the unavoidable wait legible**.

**Lever 1 — Prompt caching (largest real win, already mandated).** The system prompts (corpus, tradition framework, lens definitions) are large and identical on every call. Anthropic prompt caching makes the cached prefix dramatically cheaper *and* faster to process after the first call, because the model does not re-read the cached tokens. This is the highest-leverage speed change and it is already a law in §02. **Action: confirm caching is actually applied to every brain's system prompt in the production build, not just declared.**

**Lever 2 — Scale the evidence pass to input length.** Brain 1b maps the full text. On a 20,000-word script that is a large read. Mitigations:
- Send Brain 1b a *structurally sampled* read for very long inputs — opening, act breaks, midpoint, climax region, ending — rather than every word, since its job is structural mapping, not line-level evidence. (This is distinct from the lens policy: lenses always receive full text; Brain 1b's job is different.)
- Cap Brain 1b's output tokens tightly — it returns structured evidence, not prose.

**Lever 3 — Right-size the models per brain.** The fast brains (1, 1b, 3, 4) run on Sonnet — correct. The analyst (Brain 2) is the one heavy call. Faster Anthropic models (e.g. a Haiku-class model for the pure-extraction pre-passes) can be evaluated for Brain 1 and Brain 3/4 specifically, where the task is structured extraction rather than nuanced judgment, *provided* output quality holds in testing. **Never reduce the analyst or the lenses to a cheaper model as a cost measure (existing law).** Speed gains on the pre-passes are acceptable; quality reduction on the judgment is not.

**Lever 4 — Begin the analyst as early as possible.** Brain 2 currently waits for the full pre-pass chain. Evaluate whether the narrator-verification pass can run *in parallel with the early streaming of Brain 2* rather than fully blocking it, with a correction applied post-stream (the MVP already has a post-stream correction pass — `runNarratorCorrection`). This trades a small re-render for a much earlier first token.

**Lever 5 — Make the unavoidable wait legible (perceived speed).** The pre-pass window cannot be eliminated, only shortened — so it must be *communicated*. Already implemented and to be carried into production: distinct staged labels ("Reading your work…" → "Mapping structure…" → "Verifying narrator…" → "Writing analysis…") so the user sees movement through real stages, not a frozen screen. A progress indication that reflects genuine stage completion is mandatory; a fake progress bar is not.

**Do we need "more brains"?** No — more brains would add latency, not remove it. The architecture is already correctly factored (one cognitive task per brain). The wins are: caching (real), input-scaling for the evidence pass (real), model right-sizing on extraction passes (real, quality-gated), earlier analyst start (real), and honest staged feedback (perceived). Adding brains would violate the separation principle's cost discipline.

**Revised speed targets (production, with caching).**

| Phase | Current feel | Target with caching + scaling |
|---|---|---|
| Pre-passes (blocking, 10k words) | noticeable stall | ~6–9s, clearly staged |
| Pre-passes (blocking, full script) | risk of "stalled" perception | ~10–15s, clearly staged |
| First analyst token | after full pre-pass | as early as possible (Lever 4) |
| Full streamed analysis | ~75–90s | unchanged in total, but earlier first token |

---

## 15 · Required UI Sections

### About
Explains what Draft & Lens is, what it is not (not a ghostwriter, not a replacement for human judgment), how it works, and what tradition-aware analysis means. Essential for managing expectations before first submission.

### Glossary
Plain-English definitions of every craft term used in analyses — tradition, register, narrator altitude, elevation, restatement, world-establishment, inciting incident, fabular, accumulation, subtext, juxtaposition. Required from the original research agenda. Accessible to writers at all levels.

### Feedback
Direct channel for writers to flag when a note missed the register, applied the wrong tradition, or got a fact wrong. The correction loop is how the tool improves. Without this, errors accumulate silently.

### Contact
General enquiries, press, partnership.

### Disclaimer / Legal
Specifically required for the lens voices. The lenses use real people's names and craft philosophies. Must state clearly: AI-generated analytical perspectives inspired by documented craft philosophies. Not affiliated with, endorsed by, or representative of those individuals or their estates. Also covers data handling: submitted content processed via Anthropic's Claude API, not stored after session ends.

---

## 16 · Lens Voice Categories

| Category | Lenses |
|---|---|
| Directors | Spielberg, Coppola, Coens, Villeneuve, Scott, Welles, Jeunet, Wenders, Tarantino, Wachowskis |
| Writers | Hemingway, Carver, Chekhov, O'Connor, Bukowski, Nabokov, Puzo |
| Screenwriters | Sorkin, Eric Roth, Shay Hatten |
| Producers | Bruckheimer, Feige |

Note: Puzo is primarily a novelist who also wrote screenplays. He belongs in Writers, not Screenwriters.


---

## 17 · Lens Voice System — Standalone Prompts

### Architecture decision

Each of the 22 lens voices is implemented as a complete standalone system prompt. This replaced the previous approach of a shared template with craftPhilosophy fields injected into it.

**Why the shared template failed:**
The structural frame dominated the voice. Every lens produced the same analysis sequence (tradition identification → narrator note → montage note → verdict) in a slightly different register. This is tonal variation, not voice diversity. The template was too strong relative to the voice content.

**Why standalone prompts work:**
The voice IS the frame. There is no structural template to override it. Bukowski's prompt begins from a completely different place than Villeneuve's. Chekhov leads with genuine appreciation before defects — that structural difference is built into the prompt, not instructed around it.

### Lenses available in v1.0

**Directors:** Spielberg, Coppola, Coens, Villeneuve, Scott, Welles, Jeunet, Wenders, Tarantino, Wachowskis

**Writers:** Hemingway, Carver, Chekhov, O'Connor, Bukowski, Nabokov, Puzo

**Screenwriters:** Sorkin, Eric Roth, Shay Hatten

**Producers:** Bruckheimer, Feige

### Extended lenses for v2.0 (researched, not yet implemented)

Lucas, Stephen King, Tina Fey, Miyazaki, Charlie Kaufman, Judy Blume, David Simon — each covering additional forms (genre fiction, YA, animation, TV, metafiction). These require a scope decision: Draft & Lens v1 is focused on film scripts, short fiction, and stage plays. The extended lenses cover additional forms and audiences.

### The one rule embedded in every lens prompt

Every lens contains its own statement of the narrator elevation/restatement/world-establishment distinction, written in that voice. This is not a shared rule-set. It is each person's own position on narration, derived from their documented craft philosophy.

---

*Document version 5.0 — June 2026 · Draft & Lens*
*Updated: standalone lens prompt architecture, Brain 1b tightened to evidence-only, Brain 2 receives locked evidence map, narrator distinction embedded per-lens in each voice, partial-read honesty (§13), known-work market matching (§14), latency architecture (§14b).*
