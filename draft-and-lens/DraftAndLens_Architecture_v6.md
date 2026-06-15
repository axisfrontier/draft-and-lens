# Draft & Lens — Production Architecture
## Build Standard v6.0 — June 2026

---

> ⚠️ This document is law.
> Every standard here must be followed before a line of production code is written. Deviating from this guide produces an unmaintainable codebase. The editorial quality guarantee Draft & Lens makes to its users depends on this guide being followed completely.

> **What v6.0 changes from v5.0.** The working prototype has moved substantially ahead of the v5 spec. v6 brings the architecture into line with what the build actually does now, and records the agreed roadmap. New since v5:
> - **A fourth mode — Treatment** (§06, §03): a prose blueprint for a film, read for structure not prose, with its own system prompt, report structure, and genre notes, threaded through every brain.
> - **Inline note anchoring** (§18): the analyst marks verbatim quotes with a delimiter so the client can pin notes to the exact passage in the manuscript. The delimiter contract lives in the analyst prompt (server-side); the resolver and rendered view are client-side.
> - **The glossary term system** (§19): a fixed craft-term glossary that powers both a glossary page and inline hover/tap tooltips in reports. Explicitly **not** IP-sensitive — stays client-side.
> - **Honest staged progress + Stop/abort** (§14b, §15): the analysing indicator narrates real pipeline stages; the user can abort a run; navigating away aborts cleanly.
> - **Must-choose submission type** (§15): the user explicitly declares the work type; auto-detect no longer routes.
> - **Brain model + reliability corrections** (§03): narrator verifier moved to Sonnet; the analyst effort level is a tunable; the structural reader's input and timeout were corrected.
> - **DLTrace** (§20): a development-only pipeline tracer. Must be stripped or gated out of production.
> - **The Editor → Mentor → Interrogate roadmap** (§21): three composing reading roles, recorded here as gated future work with their conditions.
>
> The v5 sections on partial-read honesty (now §13), known-work market matching (now §14), and latency (now §14b) are carried forward intact and remain as binding as the originals.

> **Source-of-truth note.** Where this document and the working `DraftAndLens.html` prototype disagree, the prototype is the truth for *what currently exists*, and this document is the truth for *what production must become*. The prototype's prompt text is the authoritative editorial IP and must be moved verbatim (§ migration rule in the Cursor prompt). This document describes structure and standards, never re-words a prompt.

---

## 01 · The Laws

**Law — Tradition identification precedes every analysis**
No craft principle is applied before the tradition is confirmed. Brain 1 runs first. Brain 2 receives the confirmed tradition as established fact. This is enforced by architecture, not developer discipline. (Governing doc: `DraftAndLens_LearnedCorpus.md`, Principle 1 — tradition identification is the load-bearing dependency.)

**Law — One source of truth for every editorial rule**
Every craft principle, tradition definition, lens voice descriptor, and system prompt is defined once. Never copied. If the mythic allegory standard changes, it changes in one file.

**Law — The AI layer cannot modify the rules layer**
The AI receives craft principles from the prompts layer. It applies them. It cannot redefine or bypass them.

**Law — Every prompt has a version and a rationale**
Every system prompt documents: what craft principle it encodes, why it is phrased the way it is, when it was last reviewed.

**Law — Layers never bleed into each other**
UI renders data. Prompts define craft rules. API calls the AI. Data stores and retrieves.

**Law — New features are additive — never modifying**
Adding a new lens voice, tradition, or section must never require modifying existing working code. (This held in practice: Treatment was added as a fourth mode without altering the three existing modes' behaviour.)

**Law — Word limits enforced server-side before any API cost**
The tier word limit check runs before any Anthropic API call.

**Law — The API key never touches the client**
All AI calls through server-side API routes exclusively.

**Law — All prompt and lens IP is server-only**
Every system prompt, every lens voice, the diagnostic, the structural-reader prompt, the narrator logic, the genre notes, the tradition framework, and the anchor-delimiter directive live only on the server. The client sends submitted text plus settings and receives results. This is the single gating requirement for any public release — the prototype currently exposes everything in the browser bundle, and no tester may touch the app until this is corrected and verified (browser security check in the Cursor prompt).

**Law — Non-IP helper data may live client-side, and should**
The glossary definitions (§19) are not IP — they are plain craft definitions. They stay client-side deliberately; moving them server-side would add latency for no security benefit. The test for client-vs-server is "does this reveal how the editorial reading is produced?" — prompts yes, glossary no.

**Law — Design tokens are the only source of visual truth**
No hardcoded colours, spacing, or typography anywhere. Port the prototype's CSS variables into one tokens file.

**Law — Production is never auto-deployed**
Staging first. Verification. Deliberate manual action.

**Law — The analysis never concludes beyond what it has read**
When input is truncated to a tier limit, every brain receives the exact read boundary and may not make whole-work judgments about unseen material. Provisional hypotheses are permitted; confident conclusions about what was not read are forbidden. (See §13.)

**Law — Known produced works are acknowledged, never mis-pitched**
If market matching recognises a submission as a produced or published work with high confidence, it identifies the work and its maker before naming comparable companies. It never recommends submitting a work to the company that already made it. Confidence-gated: uncertainty defaults to original-work behaviour. (See §14.)

**Law — The reading is on the work's own terms, never an imposed rubric**
The default analysis judges execution against the work's own ambition within its tradition. It never scores a work against a fixed external checklist. This is the core principle the entire product is built to protect. The optional Interrogate mode (§21) is the *only* place the work's ambition itself is questioned, and it is opt-in and consented — never the default. (Governing doc: `LearnedCorpus.md`, The Core Principle.)

**Law — Speed is a quality requirement, not a luxury**
Prompt caching is applied to every brain's system prompt. The unavoidable sequential pre-pass window is communicated through genuine staged progress, never a frozen screen or a fake progress bar. Cheaper/faster models may be used for pure-extraction pre-passes only where testing confirms quality holds — never for the analyst or the lenses. (See §14b.)

**Law — A running analysis can always be stopped, and leaving stops it**
The user can abort a streaming analysis at any time. Navigating away from a running analysis aborts the underlying request rather than leaving it running and billing in the background. (See §15.)

**Law — Mentoring and interrogation are never faked**
No feature may simulate or fabricate mentor output (a comparison of drafts) or interrogate output (a best-in-class standard) without the genuine input behind it. Where a capability cannot run (e.g. cross-session memory in a context without persistence), it is *described*, never performed. (See §21.)

---

## 02 · Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, file-based routing, Vercel-native |
| Language | TypeScript strict | Type safety catches errors at compile time |
| Styling | Tailwind CSS | Design tokens via CSS variables |
| Components | shadcn/ui | Copied into codebase — full ownership; dress in the editorial token system, do not adopt a stock dashboard look |
| Auth | Clerk | Production-grade without custom auth code |
| Database | Supabase (Postgres) | Row-level security enforced at database |
| Payments | Stripe | Subscriptions, webhooks, billing portal |
| AI | Anthropic Claude — multi-brain architecture | Server-side only. See §03 |
| Prompt caching | Anthropic Prompt Caching | ~90% cost reduction on repeated system prompts; also a real latency win |
| Rate limiting | Upstash Redis | Per-user limiting before API cost |
| Analytics | PostHog | Privacy-respecting |
| Error monitoring | Sentry | Real-time alerts |
| Deployment | Vercel | Zero-config, preview deployments |

**Model assignments (corrected to current build — see §03 for the why):**

| Brain / task | Model in current build |
|---|---|
| Brain 1 Diagnostician | `claude-sonnet-4-6` |
| Brain 1b Structural reader | `claude-sonnet-4-6` |
| Narrator verifier | `claude-sonnet-4-6` *(moved from Opus — pure JSON classification)* |
| Narrator corrector | `claude-opus-4-7` *(rewrites editorial prose in voice — craft task, kept on Opus)* |
| Brain 2 Analyst | `claude-opus-4-7`, streaming, adaptive thinking, effort tunable (default `medium`) |
| Brain 3 Scorer | `claude-sonnet-4-6` |
| Brain 4 Market | `claude-sonnet-4-6` |
| Brain 5 Bible | `claude-sonnet-4-6` |
| Brain 6 Lens (×27) | `claude-sonnet-4-6` |
| Brain 7 Conversation | `claude-sonnet-4-6` |

> The model strings above are what the prototype currently calls. During migration, port the exact strings and settings from the prototype's `fetch` calls — do not substitute models. If a string needs updating to a current model, that is a deliberate, separate decision, not a migration step.

---

## 03 · The Brain Architecture

### Separation principle
Each brain does exactly one cognitive task. No brain does what another brain does. Where tasks overlap, quality degrades. This is the lesson of the single-pass failure. (Governing doc: `ThinkingDiscipline.md` — identify the load-bearing dependency before building; tradition ID is it.)

```
SUBMISSION  (mode is user-declared — must-choose, §15 — never auto-routed)
    │
    ▼
BRAIN 1 — DIAGNOSTICIAN (Sonnet 4.6)
One job: identify tradition, register, ambition, primary concern.
Returns structured JSON. Does not evaluate. Does not map.
Receives mode label including "Treatment".
    │
    ▼
BRAIN 1b — STRUCTURAL READER (Sonnet 4.6)
One job: map and collect evidence from the text.
Receives: confirmed tradition from Brain 1.
Returns: narrative structure, register map with exact quotes,
strongest/weakest moments, narrator behaviour classified
(elevating / restating / world-establishment), juxtapositions.
Does NOT evaluate. Does NOT give notes. Evidence only.
TREATMENT BRANCH: when the mode is Treatment, this brain is told the
submission is a prose blueprint — summary/telling/compression are correct
for the form — so it collects STRUCTURAL evidence (spine, turns, proportion)
and leaves the narrator-behaviour arrays empty. (Narrator categories do not
apply to a blueprint; the verifier then stands down automatically.)
    │
    ▼
NARRATOR VERIFIER (Sonnet 4.6 — moved from Opus)
One job: classify the narrator lines the structural reader collected.
Pure JSON classification — Sonnet is correct; Opus bought only latency.
No-ops cleanly when the narrator arrays are empty (e.g. Treatment mode).
    │
    ▼
BRAIN 2 — ANALYST (Opus 4.7, streaming, adaptive thinking, effort tunable)
One job: evaluate only.
Receives: Brain 1 diagnostic (locked, do not re-identify) +
Brain 1b structural map (locked evidence, do not rediscover) +
narrator verdicts.
Writes the analysis. Never re-identifies the tradition. Never rediscovers.
Emits ⟦…⟧ around verbatim quotes for inline anchoring (§18).
Operates under PARTIAL_READ_DIRECTIVE when truncated (§13).
    │
    ├───────────────────────┬───────────────────────┐
    ▼                       ▼                       ▼
BRAIN 3 — SCORER        BRAIN 4 — MARKET        BRAIN 5 — BIBLE
(Sonnet, parallel)      (Sonnet, parallel)      (Sonnet, parallel)
Craft + tradition       Studio/publisher        Character bible
alignment scores.       matching. Known-work    from full text.
Treatment-aware:        recognition (§14).      Built unless the
scores dialogue as      Treatment is the most   writer supplies one
*promise*, not          natural fit (a          or opts to skip.
penalising absence.     treatment is what is
Returns JSON.           pitched). Returns JSON.
    │
    ▼  (post-stream)
NARRATOR CORRECTION (Opus 4.7)
Rewrites — never deletes — any note that wrongly flags a verified-elevation
line. Rare; stands down entirely when there are no narrator verdicts.
Preserves the ⟦…⟧ anchor brackets exactly.
    │
    ▼  (post-render, client-side)
GLOSSARY ANNOTATION (§19) + ANCHOR RESOLUTION (§18)
Underline craft terms; pin notes to the manuscript. No API call.

ON DEMAND:
BRAIN 6 — LENS VOICES ×27 (Sonnet, cached)
Each lens is a COMPLETE STANDALONE SYSTEM PROMPT (§17).
Receives: full text + Brain 1 diagnostic (tradition locked).
BRAIN 7 — CONVERSATION (Sonnet)
Holds full analysis + diagnostic + history. Honest, never vague-encouraging.
```

### Why standalone lens prompts, not a shared template
The shared template approach was tried and failed repeatedly. The failure mode: the structural frame dominated the voice. Every lens produced the same analysis flow in a different register — tonal variation, not voice diversity. The fix: each lens is its own complete system prompt. The voice IS the frame. Bukowski's narrator rule sounds like Bukowski; Chekhov's sounds like Chekhov; they arrive at different places because they start from different places. (Full spec in §17.)

### What each lens prompt must contain
1. Entry point — what this person notices first
2. What the generic analysis probably says — what this lens will NOT repeat
3. What this voice adds
4. What this voice respectfully disagrees with
5. Red flags — specific to their craft philosophy
6. What they praise — specific to their taste
7. Forbidden notes
8. Diagnostic question
9. Narrator rule — their position on narration vs image
10. Juxtaposition rule
11. Mentorship approach — the sequence in which they give feedback
12. Example notes — generic vs this voice

### The narrator distinction (embedded in every lens, in their own language)
- **World-establishment**: atmospheric description creating the world. Never flag.
- **Elevation**: narrator adds what the image cannot carry alone. Correct when earned.
- **Restatement**: narrator explains what the image already showed. Only this is failure.

Built into each lens's own narrator rule, stated in their voice — not bolted on. (Governing doc: `LearnedCorpus.md`, Principle 2.)

### Brain model + reliability corrections made since v5 (record)
- **Narrator verifier → Sonnet.** It is mechanical JSON classification; Opus added latency for no quality gain. Verified by unit-testing the parse path (clean JSON, fenced JSON, empty content) — model swap does not change the response contract.
- **Analyst effort is a tunable.** `effort: high` on a 10k-word script produced minutes of pre-text thinking that read as a stall. Default is now `medium`, exposed as a constant so it can be A/B'd against `high` via the tracer (§20). The analyst stays on Opus — this is a speed tuning, never a quality reduction (still a law).
- **Structural reader input + timeout corrected.** Brain 1b was timing out (failing), which left Brain 2 reasoning on incomplete evidence. Its excerpt was trimmed and its timeout raised so it reliably *finishes*. Reliability before speed: a completing 1b improves the analysis more than a faster, failing one.
- **A `const`-reassignment crash in the analyst** (the analyst prompt is rebuilt when truncated/when narrator verdicts exist) was fixed. This is why it only manifested on truncated input — which the free tier always produces.

---

## 04 · Architecture Layers

**Layer 1 — Prompts** `/src/prompts/`
Single source of truth for all craft knowledge. TypeScript constants. Server-only (`import 'server-only'`). Versioned with rationale comments. Includes the four mode prompts, the diagnostic, the structural-reader prompt, the narrator logic, the genre notes, the report structures, the fragments, and all 27 lens voices.

**Layer 2 — AI** `/src/ai/brains/`
The brain orchestration layer. Server-side only. Each brain in its own file. Orchestrator sequences them.

**Layer 3 — API** `/src/app/api/`
Next.js API routes. Auth, rate limiting, word limit enforcement, orchestrating brains.

**Layer 4 — Data** `/src/data/`
Supabase operations. No editorial logic. Row-level security at the database.

**Layer 5 — UI** `/src/components/` and `/src/app/(app)/`
React components. Renders data. Makes no editorial decisions. Design tokens exclusively. **Client-side, non-IP helpers live here too:** the glossary data + tooltip engine (§19) and the anchor resolver + anchored view (§18) — both operate only on already-produced results, never on prompt text.

---

## 05 · Folder Structure

```
draft-and-lens/
│
├── src/
│   ├── prompts/                      ← server-only (import 'server-only')
│   │   ├── modes/
│   │   │   ├── script.ts             ← SCRIPT_SYSTEM
│   │   │   ├── story.ts              ← STORY_SYSTEM
│   │   │   ├── play.ts               ← PLAY_SYSTEM
│   │   │   └── treatment.ts          ← TREATMENT_SYSTEM (new in v6)
│   │   ├── lenses/
│   │   │   ├── index.ts              ← All 27 lens voices — typed, versioned
│   │   │   └── types.ts
│   │   ├── fragments/
│   │   │   ├── partial-read.ts       ← Appended to analyst when truncated (§13)
│   │   │   ├── known-work.ts         ← Appended to market brain (§14)
│   │   │   └── anchor-directive.ts   ← The ⟦…⟧ quote-wrapping instruction (§18)
│   │   ├── report/
│   │   │   ├── script-structure.ts
│   │   │   ├── story-structure.ts
│   │   │   ├── play-structure.ts
│   │   │   └── treatment-structure.ts   ← new in v6
│   │   ├── genres/                   ← SCRIPT/STORY/PLAY/TREATMENT genre notes
│   │   ├── diagnostic.ts             ← Brain 1 (PASS1_SYSTEM)
│   │   ├── structural-reader.ts      ← Brain 1b (STRUCTURAL_READER_SYSTEM + treatment branch)
│   │   ├── narrator.ts               ← verifier + corrector logic
│   │   └── conversation.ts           ← Brain 7
│   │
│   ├── ai/
│   │   ├── brains/
│   │   │   ├── diagnostician.ts      ← Brain 1
│   │   │   ├── structural-reader.ts  ← Brain 1b
│   │   │   ├── narrator.ts           ← verifier + corrector
│   │   │   ├── analyst.ts            ← Brain 2 (streaming, anchor directive)
│   │   │   ├── scorer.ts             ← Brain 3 (treatment-aware)
│   │   │   ├── market.ts             ← Brain 4 (known-work)
│   │   │   ├── bible.ts              ← Brain 5
│   │   │   ├── lens.ts               ← Brain 6
│   │   │   └── conversation.ts       ← Brain 7
│   │   ├── orchestrator.ts
│   │   └── client.ts                 ← Anthropic client — server only
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyse/route.ts
│   │   │   ├── lens/route.ts         ← full text, no compression
│   │   │   ├── converse/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── webhooks/stripe/route.ts
│   │   ├── (app)/
│   │   │   ├── page.tsx              ← Upload screen (must-choose type selector)
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
│   │   │   ├── CraftDirectives.tsx
│   │   │   ├── AnchoredView.tsx      ← inline note anchoring view (§18)
│   │   │   └── StageIndicator.tsx    ← honest staged progress (§14b/§15)
│   │   ├── glossary/
│   │   │   ├── glossary-data.ts      ← the GLOSSARY object — client-safe, not IP (§19)
│   │   │   ├── GlossaryPage.tsx
│   │   │   └── TermTooltip.tsx
│   │   ├── conversation/  ├── lens/  └── upload/
│   │
│   ├── lib/
│   │   ├── anchor.ts                 ← extract + resolve ⟦…⟧ anchors (client, §18)
│   │   └── trace.ts                  ← DLTrace, dev-only, gated out of prod (§20)
│   │
│   ├── data/
│   │   ├── analyses.ts  ├── conversations.ts  ├── revisions.ts  └── users.ts
│   │
│   ├── stripe/tiers.ts
│   └── design/tokens.css
│
├── tests/  ├── brains/  ├── prompts/  ├── lib/  └── api/
└── ARCHITECTURE.md
```

---

## 06 · The Tradition Framework

Every analysis begins with tradition identification. These are distinct craft systems with distinct rules. (Governing doc: `LearnedCorpus.md`, Principle 1.)

### Script traditions
**Social Realism** (Loach, Leigh, Arnold, Jenkins) — Concrete, behavioural, specific. Oblique dialogue. Exposition is failure.
**Mythic/Allegorical** (Malick, Kubrick, Tarkovsky, Coppola) — Narrator earns altitude through genuine insight, not repetition. Expository set-pieces (courts, judgments) are the tradition's primary instrument. **Do NOT apply social-realist rules here.**
**Genre** (Chinatown, Get Out, Some Like It Hot) — Conventions are promises. Engine runs on every page.
**Epic/Historical** (Schindler's List, Lawrence of Arabia) — Personal and historical in active conversation.
**Chamber** (Locke, 12 Angry Men) — Power dynamic alive in every exchange.
**Experimental** (Memento, Eternal Sunshine) — Form is argument.

### Treatment traditions (new in v6)
A treatment is read in the tradition the eventual *film* would occupy — so the script traditions above apply. The difference is what is evaluated (§03 treatment branch, §06a below), not which traditions exist.

### Fiction traditions
**Minimalist Realism** (Carver, Hemingway, Munro) — Iceberg; scene ends before emotional peak.
**Mythic/Fabular** (Melville, García Márquez, Kafka, Borges) — Narrator at altitude is the form. Allegorical figures retain human specificity. **Do NOT apply minimalist-realist rules here.**
**Literary Modernism** (Woolf, Joyce, Faulkner) — Consciousness as primary material.
**Gothic** (O'Connor, McCarthy, Jackson) — Meaning through rupture.
**Satirical** (Waugh, Spark, Saunders) — Exaggeration is precision.

### Stage play traditions
**Naturalism** (Chekhov, Ibsen): loaded stage, subtext primary. **Epic/Political** (Brecht, Churchill): audience thinks. **Absurdist** (Beckett, Ionesco): stasis is drama. **In-yer-face** (Kane, Ravenhill): confrontation as form. **Chamber** (Pinter, Mamet): power shifts in every exchange.

### 06a · What a Treatment read evaluates (and does not)
A treatment is a prose blueprint, not execution. **Evaluate:** the spine (one clear line of want vs cost), the through-line, the major structural turns and whether they are motivated, arc legibility in compressed form, proportion/pacing, premise as generative engine, tonal consistency, the ending paying off the spine. **Never fault:** absence of dialogue, "telling" / naming interiors and theme directly, compression and summary, functional rather than literary prose, absence of script formatting. These are the form working as intended. (This mirrors `LearnedCorpus.md` Principle 3 — a tradition's primary instruments are not failures — applied to the treatment form.)

---

## 07 · Subscription Tiers

**Model policy:** no quality reduction as a cost measure (the analyst and lenses stay on their assigned models).
**Lens policy:** full text to every lens call. No compression. Ever.
**Reading policy:** the free tier's reading is the FULL honest reading — never deliberately hobbled to force an upgrade. Limitation must be *natural* (what the tier genuinely can't provide), never *imposed* throttling of a real feature.

### Tier shape (reconciled with the pricing decisions)

```typescript
export const TIERS = {
  free: {                       // "The Reading"
    priceGBP: 0,
    analysesPerMonth: 2,        // pricing doc: 2–3; confirm at launch
    wordLimit: 10_000,
    features: {
      fullReport: true,         // the complete, honest reading — never hobbled
      lensVoices: 'selection',  // curated 12 of 27, named upgrades for the rest (§16)
      interrogate: true,        // §21 — opt-in; available even on a first read
      mentorTaster: 'single-session',  // §21 — real revise/resubmit within one session
      mentorPersistent: false,
      conversation: false,
      studioMatching: false,
      reportDownload: false,
      history: false
    }
  },
  starter: {                    // "The Workshop"
    priceGBP: 9,
    analysesPerMonth: Infinity,
    wordLimit: 30_000,
    features: {
      fullReport: true,
      lensVoices: 'all',        // all 27
      interrogate: true,
      mentorTaster: 'single-session',
      mentorPersistent: true,   // §21 — remembers across sessions, tracks revisions
      conversation: true,
      studioMatching: true,
      reportDownload: false,
      history: 'library'
    }
  },
  pro: {                        // "The Development Slate"
    priceGBP: 24,
    analysesPerMonth: Infinity,
    wordLimit: Infinity,        // feature-length / full manuscript
    features: {
      fullReport: true, lensVoices: 'all', interrogate: true,
      mentorTaster: 'single-session', mentorPersistent: true,
      conversation: true, studioMatching: true,
      reportDownload: true,     // full export, already built in prototype
      history: 'multi-project', draftComparison: true, prioritySpeed: true
    }
  },
  // studio/team: per-seat B2B — later. Not a launch priority.
}
```

> Prices and the exact free-tier lens count are product decisions from the pricing strategy doc, recorded here for the build to gate against — confirm final numbers at launch. The structural point is the **feature gating**, which the build must enforce server-side (a law).

### Mentor tiering (the agreed decision — see §21 for the mechanism)
- **Free:** full honest reading always, PLUS a *real* single-session mentor taster (revise and resubmit within one browser session; the prior draft + its analysis are still in memory, so the comparison is genuine — no fabrication).
- **Paid:** PERSISTENT mentor — remembers across sessions, tracks revisions over time, names long-term tendencies. Justified because it genuinely costs more to provide (storage + compute), exactly as a developmental editor charges more for ongoing mentorship than a one-off read.
- In the free tier, surface — where contextually appropriate, ideally *after* the single-session taster has delivered value — what persistent Mentor adds. Describe the capability honestly; never fake its output.

---

## 08 · Database Schema

```sql
CREATE TABLE analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT,
  mode       TEXT NOT NULL,          -- 'script' | 'treatment' | 'story' | 'play'
  tradition  TEXT,
  register   TEXT,
  ambition   TEXT,
  report     TEXT,                   -- stored WITH ⟦…⟧ anchor brackets intact (§18)
  verdict    TEXT,
  scores     JSONB,
  arc_beats  JSONB,
  studios    JSONB,
  diagnostic JSONB,
  coverage   JSONB,                  -- { truncated, wordsRead, wordsTotal, ... } (§13)
  work_key   TEXT,                   -- stable id for revision-relationship gating (§21)
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

-- Mentor mode (persistent tier) — links a revision to the prior reading it answers.
CREATE TABLE revisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  work_key      TEXT NOT NULL,                 -- groups drafts of the SAME work
  prior_analysis UUID REFERENCES analyses(id), -- the reading this draft responds to
  new_analysis  UUID REFERENCES analyses(id),
  relationship  TEXT,                          -- 'revision' confirmed by the user (§21)
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analyses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON analyses       FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own data" ON conversations  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own data" ON revision_notes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own data" ON revisions      FOR ALL USING (user_id = auth.uid());
```

> `work_key` and the `revisions` table are the persistence substrate for §21's mentor mode. They are not needed for the MVP (single-session taster needs no storage) but the schema is written now so production doesn't need a migration later.

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

  // mode is REQUIRED and user-declared (must-choose). Reject if absent — the
  // server never infers the mode.
  const { text, mode, genre, intent, bible, isRevision, priorAnalysisId } = await req.json()
  if (!mode) return new Response('Submission type required', { status: 400 })
  const clean = sanitiseInput(text)

  // Word-limit check BEFORE any Anthropic call. Over-limit truncates (free tier),
  // never blocks, and sets the coverage signal (§13).
  const coverage = computeCoverage(clean, tier)   // { truncated, wordsRead, ... }

  const diagnostic = await runDiagnostician(coverage.readText, mode)
  const structural = await runStructuralReader(coverage.readText, mode, diagnostic)
  const verdicts   = await runNarratorVerifier(structural)   // no-ops if empty

  const ctx = { diagnostic, structural, verdicts, coverage,
                interrogate: tier.features.interrogate && req_optedIntoInterrogate,
                mentor: resolveMentor(userId, tier, isRevision, priorAnalysisId) } // §21

  const [analysisStream, scores, studios] = await Promise.all([
    runAnalyst(coverage.readText, mode, genre, intent, bible, ctx),
    runScorer(coverage.readText, genre, mode, coverage),
    runMarket(diagnostic.title, diagnostic.tradition, genre, mode),
  ])

  return new Response(analysisStream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

Routes: `api/analyse`, `api/lens` (full text, no compression), `api/converse`, `api/upload`, `api/webhooks/stripe`.

---

## 10 · Testing Standards

| Test | What it covers | When |
|---|---|---|
| Brain 1 unit | Valid JSON for all traditions, all four modes. Never guesses. | Every commit |
| Prompts integrity | All traditions + all four modes present. Report structures complete. | Every commit |
| Client-IP guard | **No prompt constant or lens voice is importable from a client component.** | Every commit |
| Tiers unit | Word-limit logic. Feature flags incl. lens selection, interrogate, mentor. | Every commit |
| Brain sequence | Diagnostic flows to analyst. Tradition locked. | Every PR |
| Anchor resolver | Exact / repeat-occurrence / case-insensitive / whitespace / orphan / cap. | Every commit |
| Glossary matcher | Canonical mapping, alias→key, longest-match, word-boundary, 2-cap, case. | Every commit |
| Partial-read | The analyst makes no whole-work claim when truncated. | Every PR |
| Treatment | Treatment routes to TREATMENT_SYSTEM; never faulted for absent dialogue. | Every PR |
| Mentor gating | Mentor only triggers on a real revision relationship, never an unchanged resubmit or a different work (§21). | Every PR |
| End-to-end | upload → brains → conversation → (download) | Before every release |

**The tests that matter most:**
```typescript
it('Brain 2 never re-identifies the tradition', () => {
  const diagnostic = { tradition: 'Mythic allegory in the Conrad tradition' }
  const prompt = buildAnalystSystemPrompt('script', 'auto', diagnostic)
  expect(prompt).toContain('ESTABLISHED DIAGNOSTIC')
  expect(prompt).toContain('Do not re-identify')
  expect(prompt).toContain(diagnostic.tradition)
})

it('no prompt text ships to the client', async () => {
  // search the built client bundle for a distinctive phrase from SCRIPT_SYSTEM
  // and from a lens voice — both must be absent.
})
```

---

## 11 · Build Order

**Stage 0 — Scaffold.** Next.js 14, TS strict, Tailwind, folder structure (§05), `.env.local.example`, `.gitignore` excluding `.env.local`, README.

**Stage 1 — Prompts layer + API-key boundary (security-critical).** Move every prompt server-side as typed versioned constants — including the four modes, diagnostic, structural reader (+ treatment branch), narrator logic, genre notes, report structures, the three fragments (partial-read, known-work, anchor-directive), and all 27 lens voices. `import 'server-only'` on every module. Anthropic client reads `process.env.ANTHROPIC_API_KEY`. **Run the browser security check before continuing.**

**Stage 2 — Brain layer.** Each brain per §03, the orchestrator with the corrected sequence (1 → 1b → narrator verify, then 2 streaming alongside 3/4/5, post-stream narrator correction). Apply prompt caching to every system prompt. Port the partial-read and known-work fragments and the anchor directive. Preserve exact model strings/settings.

**Stage 3 — API routes with the security spine.** Per §09: auth → rate limit → tier check → sanitise → coverage signal → orchestrate. Word-limit check before any Anthropic call. Mode required.

**Stage 4 — Port the UI.** Recreate the prototype's screens exactly, on the design tokens. Must-choose type selector (four types), staged progress indicator, Stop control, partial-read banner from `coverage`. Client-side: the anchor resolver + anchored view (§18) and the glossary tooltip engine + page (§19). DLTrace behind a dev-only gate (§20).

**Stage 5 — Auth, tiers, persistence.** Clerk. Tier logic (§07) incl. lens selection, interrogate flag, mentor flags. Supabase schema (§08) with RLS, including `work_key` and `revisions`. Saved analyses/conversations/revision notes. Tier logic only — Stripe billing later — so a beta can run with manually-assigned tiers.

**Stage 6 — Tests + hardening.** §10, especially the client-IP guard, the partial-read test, the anchor/glossary unit tests, and mentor gating. Full type-check + suite.

**Stage 7 — Billing.** Stripe, subscription flow, tier-aware UI.

**Stage 8 — Roadmap features (§21), in order of dependency.** Single-session mentor taster (no persistence) → persistent mentor (needs §08 `revisions`) → interrogate mode (needs the best-in-class research). Each gated, each opt-in/consented where specified.

---

## 12 · The Non-Negotiables

**Never** ship prompt text or a lens voice to the client. (The gating launch requirement.)
**Never** skip Brain 1. Every analysis begins with the diagnostician.
**Never** let Brain 2 re-identify the tradition. It is locked.
**Never** apply minimalist-realist rules to mythic allegory (or fault a treatment for being a treatment).
**Never** compress text sent to a lens.
**Never** let Brain 7 be vague or encouraging for its own sake.
**Never** expose the API key client-side.
**Never** duplicate editorial logic.
**Never** auto-deploy to production.
**Never** fake mentor or interrogate output (§21). Describe what can't run; never perform it.
**Never** hobble the free tier's core reading to force an upgrade. Limit naturally, not artificially.

---

## 13 · Partial-Read Honesty (the free-tier accuracy gap)

*(Carried forward from v5 intact.)*

**The problem.** The free tier reads only the first 10,000 words — on a feature script that is the opening. An analysis that draws confident structural conclusions from material it has not seen is *wrong* and damages trust. A correctness problem, not a UX one.

**The law.** The analysis never concludes beyond what it has read. Every brain is told the exact boundary; no brain makes whole-work judgments about material outside it. Provisional hypotheses, clearly marked, are permitted.

**Enforcement (architecture, not discipline).**
1. The orchestrator computes `{ truncated, wordsRead, wordsTotal, fractionRead, coverage }` and passes it into *every* brain, not just the UI.
2. Brain 1 scopes its own confidence (`{ tradition: 'high', ambition: 'provisional', arc: 'unseen' }`).
3. Brain 2 runs under `PARTIAL_READ_DIRECTIVE` (a versioned fragment) when truncated: assess what is present confidently; for anything depending on the whole, name what the opening *promises* and frame the unseen as a question; never invent a third-act problem.
4. Brain 3 returns whole-work dimensions as `null` with `reason: 'requires full text'`, never a fabricated number; the UI renders "— needs full work".
5. The report carries a persistent, honest banner generated from `coverage`.

**Tone.** Not apologetic, not a paywall nag — the voice of an honest reader being precise about the limits of their vantage. This epistemic honesty is the same differentiator as tradition-awareness, applied to coverage.

---

## 14 · Known-Work Market Matching (Brain 4 intelligence)

*(Carried forward from v5 intact.)*

When Brain 4 recognises a submission as a known produced work, it must: state the fact plainly and briefly; explain who made it and why that fit made sense; then name the *other* companies whose taste the work also suits; and never pretend it's an undiscovered spec. Recognition relies on the model's own knowledge, **confidence-gated** via the `KNOWN_WORK_CHECK` fragment — a false positive is worse than silence, so uncertainty defaults to original-work behaviour. No external database in v1. For a writer studying produced work to learn market fit, this turns a wrong answer into a teaching moment.

---

## 14b · Analysis Speed (the latency architecture)

*(Carried forward from v5, updated with what the prototype since proved.)*

**The problem honestly stated.** A reader who waits staring at a near-static screen assumes the tool has stalled. Latency is a product-quality problem. **Note from testing:** the worst "stall" observed was not actually latency — it was (a) a `const`-reassignment crash that killed Brain 2 silently on truncated input, and (b) `effort: high` producing minutes of pre-text thinking. Both are fixed (§03). The lesson: *instrument before optimising* — the tracer (§20) is what found the real causes; the original "it's slow" theory was wrong.

**Where the time goes.** Sequential pre-passes (Brain 1 → 1b → narrator verify) must be sequential — each depends on the prior. The main analysis streams, so it *feels* fast. The perceived stall is the pre-pass window.

**The levers (in order of real impact):**
1. **Prompt caching** — largest real win, already a law. Confirm it is actually applied to every brain's system prompt in the build, not merely declared.
2. **Scale the evidence pass to input length** — structurally sample very long inputs for Brain 1b (opening, act breaks, midpoint, climax, ending); cap its output tokens. (Lenses always get full text — different job.)
3. **Right-size models on pure-extraction passes** — quality-gated. The narrator verifier→Sonnet move is exactly this. Never the analyst or lenses.
4. **Begin the analyst as early as possible** — the post-stream narrator correction already lets verification not fully block the first token.
5. **Make the unavoidable wait legible** — the honest staged indicator (§15) showing real pipeline stages, never a fake bar.
6. **Tune analyst effort** — `medium` default; `high` available; measured via the tracer.

**"More brains" is the wrong answer** — it adds latency. The architecture is already correctly factored.

---

## 15 · Required UI Sections + Interaction Standards

### Upload screen — must-choose
The user explicitly declares the work type (Film Script / Treatment / Story / Stage Play) before the analyse CTA enables. Auto-detect does **not** route — a prose treatment and a short story are indistinguishable by shape, so the declaration is the user's, not inferred. The flow is numbered (1 add your work → 2 choose the type → 3 analyse), the type step signals when it's the outstanding requirement, and the CTA is gated on a chosen type. Only the character bible is optional.

### Honest staged progress + Stop
The analysing indicator narrates the real pipeline ("Reading your work" → "Mapping the structure" → "Writing the reading" → final check) with progress tied to genuine stage transitions, plus an elapsed timer. A **Stop** control aborts the run; navigating away mid-run prompts and then aborts the underlying request (a law). Nav and mode controls are disabled during a run.

### About / Glossary / Feedback / Contact / Disclaimer
- **About** — what Draft & Lens is and is not (not a ghostwriter), how it works, what tradition-aware analysis means.
- **Glossary** — the craft-term glossary (§19), rendered from the single GLOSSARY source; terms also appear as inline tooltips in reports.
- **Feedback** — the correction loop: writers flag a missed register, wrong tradition, or factual error.
- **Contact** — enquiries, press, partnership.
- **Disclaimer / Legal** — required for the lens voices: AI-generated analytical perspectives inspired by documented craft philosophies; not affiliated with, endorsed by, or representative of those individuals or their estates. Also: submitted content processed via Anthropic's API, not stored after session ends (until the user is on a tier that saves work, which must be disclosed).

---

## 16 · Lens Voice Categories (27 voices)

| Category | Lenses |
|---|---|
| Directors | Spielberg, Coppola, Coens, Villeneuve, Scott, Welles, Jeunet, Wenders, Tarantino, Wachowskis, Lucas, Miyazaki |
| Writers (fiction) | Hemingway, Carver, Chekhov, O'Connor, Bukowski, Nabokov, King |
| Screenwriters | Sorkin, Eric Roth, Kaufman, Puzo |
| Showrunners | David Simon, Tina Fey |
| Producers | Bruckheimer, Feige |

> The roster grew from v5's 22 to the prototype's current 27 (added: Lucas, Miyazaki, King, Kaufman, Simon, Fey; Puzo grouped with screenwriters in the current build's UI grouping). Confirm the final canonical grouping against the prototype's `LENS_DATA` during migration — the prototype is the source of truth for membership.

### Free-tier lens selection (the curated 12)
Free shows a curated selection — **recognisability + contrast within each group**, so the demo proves the *range* that is the differentiator, not just that lenses exist. Locked lenses appear greyed with their names visible (each a specific, persuasive upgrade prompt), and at least one free lens per group keeps the contrast-demo working in every category.

- **Directors (free):** Spielberg, Tarantino, Villeneuve
- **Writers (free):** Hemingway, Chekhov, King
- **Screenwriters (free):** Sorkin, Puzo
- **Showrunners (free):** Fey
- **Producers (free):** Bruckheimer
- **Locked (Starter+):** Coppola, Coens, Scott, Welles, Jeunet, Wenders, Lucas, Miyazaki, Wachowskis, Carver, Nabokov, Bukowski, O'Connor, Roth, Kaufman, Simon, Feige.

> Rationale: free names sell *what the feature is* ("read my script as Spielberg would"); locked names sell *depth to the initiated* (a serious writer seeing Carver, Nabokov, Kaufman, the Coens greyed thinks "they have the real ones"). Gating must be enforced server-side.

---

## 17 · Lens Voice System — Standalone Prompts

### Architecture decision
Each of the 27 lens voices is a complete standalone system prompt. This replaced a shared template with `craftPhilosophy` injected.

**Why the shared template failed.** The structural frame dominated the voice — every lens produced the same analysis sequence in a different register. Tonal variation, not voice diversity.

**Why standalone prompts work.** The voice IS the frame. Bukowski's prompt begins from a different place than Villeneuve's. Chekhov leads with genuine appreciation before defects — that structural difference is built into the prompt, not instructed around it.

Each prompt contains the twelve elements listed in §03, and its own statement of the narrator elevation/restatement/world-establishment distinction, written in that voice (`LearnedCorpus.md` Principle 2 — each person's own position on narration, not a shared rule-set).

---

## 18 · Inline Note Anchoring (new in v6)

**What it is.** A reading, not a rewrite. The analyst already quotes the manuscript verbatim; in the build it wraps each verbatim quote in `⟦…⟧`. After the report renders, the client extracts those quotes, locates each in the submitted text, and pins the surrounding note beside the exact passage — margin notes on a wide screen, inline boxes beneath the line on a narrow one. Quiet underline by default; the active note highlights its span.

**Client/server split.**
- **Server (IP):** the `⟦…⟧` directive is part of the analyst system prompt (`fragments/anchor-directive.ts`). It migrates *with* the prompt. The report is stored and transmitted *with* brackets intact (§08).
- **Client (not IP):** the extractor, the resolver (`lib/anchor.ts`), and the anchored view (`AnchoredView.tsx`). No API call; cannot affect analysis speed.

**Resolution rules (unit-tested in the prototype):** exact match → repeat-occurrence indexing when a quote appears more than once → whitespace-tolerant match → case-insensitive (the analyst may quote a lowercased mid-sentence form of a capitalised manuscript phrase; matching is case-insensitive but the *display* preserves the manuscript's original casing) → graceful orphan (quotes that can't be located verbatim are listed as "general notes," never dropped). Each term capped to avoid peppering. Brackets are stripped everywhere the reader or an export sees text, and preserved through the narrator-correction pass.

**Why W3C-style prefix/suffix selectors are not needed here.** The source text is fixed for the session, so anchoring needs exact location, not fuzzy matching against an edited document. Case-insensitive exact-match plus occurrence indexing is the right amount of machinery.

---

## 19 · The Glossary Term System (new in v6)

**What it is.** A fixed glossary of ~45 craft terms (tradition, register, Campbellian, inciting incident, midpoint, subtext, iceberg, juxtaposition, minimalism, deus ex machina, etc.), each with a short gloss (tooltip) and a fuller definition (page). A single `GLOSSARY` object is the one source of truth: the glossary page renders from it, and report terms are annotated from it.

**Explicitly client-side and not IP.** The glossary is plain craft definitions — it does not reveal how the editorial reading is produced. It stays in the client (`components/glossary/glossary-data.ts`). Moving it server-side would add latency for no security benefit (a law in §01).

**How annotation works (post-render, no API call):** after a report renders, a DOM text-walker underlines known terms (and aliases — "hero's journey" → Campbellian), skipping headings and links, capping each term at twice per report. Hover/focus (desktop) or tap (mobile) shows the gloss; a "full entry" lives on the glossary page. Matching is the glossary *as* the detection list — reliable, not a model guess.

**Unit-tested in the prototype:** canonical mapping, alias→key, longest-match priority, word-boundary (no match inside a larger word), the 2-cap, case-insensitivity.

---

## 20 · DLTrace — development instrumentation (new in v6)

A pipeline tracer: timestamped marks for every brain (including Brain 2's thinking-vs-writing split), a console log, and an on-screen panel toggled by a key or `?debug=1`. It exists to find bottlenecks — and it earned its place by proving the real causes of the "stall" (a crash + effort level), not the assumed one.

**Production rule:** DLTrace is a **development-only** tool. It must be stripped from the production bundle or gated behind a dev/staff flag — never shipped active to users. (`lib/trace.ts`, gated.)

---

## 21 · The Editor → Mentor → Interrogate Roadmap (gated future work)

Three composing reading roles. The default read is editor-only. The other two are recorded production requirements, each with its conditions. **All three are post the server-side migration.** None may be faked (a law).

### 21a · Mentor mode — MUST build into production
- **MVP is editor-only** (no cross-session memory; the browser can't safely persist it).
- **Mentor mode activates when a user resubmits the SAME work, REVISED**, after a prior reading. D&L then stays an editor AND mentors: it judges whether the revision fixed what the earlier reading flagged, and — over multiple revisions — names recurring writer tendencies.
- **Critical gate:** mentor mode triggers only on a *genuine revision relationship* (same work, actually changed) — never on an unchanged resubmission or a different work, which would invent continuity that isn't there.
- **Detecting the relationship:** *ask the user* ("Is this a revision of something you've had read?") as the gate — it's faster, cheaper, and captures intent better than diffing. Then use the stored prior draft as the comparison payload. Keep a light similarity sanity-check only as a backstop against a mismatched claim. (`work_key` + `revisions` in §08.)
- **Tiering (§07):** free gets the *real* single-session taster (revise/resubmit within one browser session, comparing both drafts from in-memory data — genuine, no fabrication); paid gets *persistent* mentor (across sessions, long-term tendencies). Surface the paid capability honestly in free, after the taster delivers value.

### 21b · Interrogate / "push harder" mode — file for live production (opt-in)
- The **default** reading stays strictly on the work's own terms (judge execution vs the work's own ambition, never impose a rubric — the core principle).
- **Opted in**, Interrogate adds the two things the default deliberately withholds: (1) it questions whether the *ambition itself* was worth attempting, not just whether it was achieved; (2) it shows **best-in-class for that tradition** — the standard the strongest work in that tradition reaches — turning diagnosis into instruction.
- **Opt-in only, never the unprompted default.** This is the only place the work's ambition is questioned; consent keeps the on-its-own-terms read the trustworthy baseline.
- **Independent of Mentor, deepened by it.** Available even on a first submission (a writer may want the ambition questioned before investing months). Once Mentor knows the writer's tendencies, the push can be personal. The two compose; Interrogate is not gated by Mentor.

### 21c · Best-in-class research — required before Interrogate is built
Define what "best-in-class" means *per tradition* from a **craft and success** angle — the actual standard the strongest work in that tradition reaches (e.g. Carver's ceiling for minimalism, Pinter's for the loaded pause), **not** a generic good-writing rubric like the ghostwriting tools use. Then design clean, efficient implementation across the architecture and the brains.
**Critical risk:** Interrogate must NOT curdle into external-rubric imposition — the very thing Draft & Lens exists to avoid. Done well it elevates the tool; done badly it becomes a competitor. The care goes here.

---

*Document version 6.0 — June 2026 · Draft & Lens*
*Supersedes v5.0. Changes: Treatment as a fourth mode threaded through every brain (§03, §06, §06a); inline note anchoring (§18); the glossary term system, client-side and non-IP (§19); honest staged progress, Stop/abort, and must-choose (§14b, §15); corrected brain model assignments and reliability fixes — narrator verifier→Sonnet, analyst effort tunable, structural-reader timeout, the analyst const-crash (§03); DLTrace as dev-only instrumentation (§20); the Editor→Mentor→Interrogate roadmap with the mentor tiering and best-in-class research requirements (§21); tiers reconciled with the pricing strategy and lens selection (§07, §16). Governing docs unchanged and referenced throughout: LearnedCorpus v2.0, ThinkingDiscipline.*
