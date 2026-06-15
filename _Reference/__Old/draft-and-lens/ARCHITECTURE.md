# Architecture

Production build standard: **`DraftAndLens_Architecture_v6.md`** (v6.0, June 2026).

This file is a pointer. Do not duplicate the spec here — edit the v6 document as the single source of truth.

## Quick reference — layers

```
prompts/   → server-only craft IP
ai/        → server-only brain orchestration
app/api/   → auth, limits, orchestration entry
data/      → Supabase (no editorial logic)
components/ + app/ → UI (renders data only)
lib/       → anchor resolver, DLTrace (client/dev)
design/    → tokens.css
```

## Laws (non-negotiable)

- Prompts and lens voices never ship to the client
- Brain 1 runs first; Brain 2 never re-identifies tradition
- Mode is user-declared; server rejects requests without mode
- Word limits enforced server-side before any Anthropic call
- Never fake mentor or interrogate output

See the full document for brain sequence, tiers, schema, tests, and roadmap (§21).
