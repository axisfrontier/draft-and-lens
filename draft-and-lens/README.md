# Draft & Lens

Tradition-aware editorial analysis for film scripts, treatments, prose fiction, and stage plays.

This repository is the production Next.js 14 conversion of the `DraftAndLens.html` prototype. The authoritative build standard is **Architecture v6.0** (`DraftAndLens_Architecture_v6.md`).

## Governing documents

| Document | Role |
|---|---|
| `DraftAndLens_Architecture_v6.md` | Structure, layers, laws — **law** |
| `DraftAndLens.html` | Authoritative prompt content (verbatim migration) |
| `DraftAndLens_LearnedCorpus.md` | Editorial reasoning the prompts encode |
| `ThinkingDiscipline.md` | Working method for load-bearing dependencies |

## Security principle

All AI prompts, lens voices, and the anchor-delimiter directive live **server-only**. The browser sends submitted text plus settings and receives results. Run the browser security check (see Cursor prompt) after Stage 1 before any tester touches the app.

## Stack

- **Next.js 14** (App Router), **TypeScript strict**, **Tailwind CSS**
- **Clerk** (auth), **Supabase** (persistence), **Stripe** (billing — Stage 7)
- **Anthropic Claude** multi-brain architecture (server-side only)

## Getting started

```bash
cp .env.local.example .env.local
# Fill in ANTHROPIC_API_KEY and other vars as stages require them.

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Stage 6+) |

## Folder structure

See `ARCHITECTURE.md` (pointer to v6 spec) and §05 of the architecture document. Layers:

1. `src/prompts/` — craft rules (server-only)
2. `src/ai/` — brain orchestration (server-only)
3. `src/app/api/` — API routes
4. `src/data/` — Supabase
5. `src/components/` + `src/app/` — UI (no editorial logic)
6. `src/lib/` — client helpers (anchor resolver, dev tracer)

Design tokens: `src/design/tokens.css` — no hardcoded colours elsewhere.

## Build stages

| Stage | Scope |
|---|---|
| **0** | Scaffold (this commit) |
| **1** | Prompts layer + API-key boundary + browser security check |
| **2** | Brain AI layer + orchestrator |
| **3** | API routes (auth, rate limit, tier, mode required) |
| **4** | UI port from prototype |
| **5** | Auth, tiers, Supabase persistence |
| **6** | Tests + hardening |
| **7** | Stripe billing |
| **8** | Mentor, Interrogate (gated roadmap) |

## Route note (Stage 0)

§05 lists both `(app)/page.tsx` (upload) and `(marketing)/page.tsx` (landing) at `/`. Next.js cannot mount two pages on the same path. Stage 0 mounts the upload placeholder at `/`; marketing landing routing will be resolved in Stage 4 (likely middleware: public landing vs authenticated app).

## Prototype files (reference only)

- `DraftAndLens.html` — single-file prototype; prompt IP migrates verbatim in Stage 1
- Do not serve the HTML prototype in production

## License

Proprietary — Draft & Lens.
