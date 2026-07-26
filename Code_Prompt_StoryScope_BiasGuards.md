# Code Prompt — Add StoryScope Bias Guards to Brain 2 Analyst Prompt

> Governing law: `DraftAndLens_LearnedCorpus_v2.7.md` (Principles 12–16). This is a **Brain 2 (analyst) prompt change only** — no UI, no pipeline, no client surface. Server-side IP stays server-side. Sonnet / Medium.

## Context
Research (Russell et al. StoryScope + LLM-judge bias literature) confirms LLMs systematically penalise genuinely human writing markers when acting as editorial judges: roughness, earned ambiguity, emotional flatness, unfamiliar forms, and non-dominant cultural frames are all downgraded relative to smooth, familiar, emotionally warm AI-typical prose. D&L's tradition-first architecture already neutralises much of this — but five targeted guardrails need adding to the analyst prompt to close the remaining gaps.

## Audit first — no edits yet
Read `src/prompts/analyst.ts` (or wherever Brain 2's system prompt lives). Tell me:
- Where in the prompt craft evaluation instructions currently sit
- Whether any existing instruction already addresses roughness, ambiguity, or familiarity bias
- Exactly where you'll insert the five additions

Wait for my "go" before editing.

## The five additions (add to Brain 2 system prompt — additive only)

Add these as a named block "EDITORIAL BIAS GUARDS" after the existing tradition-identification and craft-evaluation instructions:

```
EDITORIAL BIAS GUARDS — apply these before flagging any element as a weakness:

1. ROUGHNESS: Fragmentation, tonal discontinuity, unresolved syntax, and register shifts are not errors. Ask whether roughness is serving the work before flagging it. In most literary traditions, deliberate roughness is craft, not failure.

2. EARNED AMBIGUITY: Do not resolve productive ambiguity by explaining what the work "really means." If ambiguity is the product of precision (specific images, specific refusals), it is earned. The test: is the reader held by something real, or confused by underwriting? The first is an achievement; name what it is doing.

3. EMOTION-MODE NEUTRALITY: Neither coldness nor warmth is the correct register. Evaluate emotional mode against what the work's tradition licenses (Principle 1), not against a neutral preferred temperature. A cold work is not failing by being cold.

4. FAMILIARITY-BIAS CHECK: Before concluding a structural choice, cultural reference, or formal decision is weak, ask: is this unfamiliar to me, or is it actually failing? Resistance to the unrecognised is a signal to look harder at the tradition being invoked — not to flag it as a flaw.

5. AUTHORSHIP FIREWALL: Never allow inference about who wrote this — human or AI, professional or amateur — to enter the reading. The text is the only input. Identical text must receive the same reading regardless of authorship framing.
```

## Rules
- Additive only — do not remove or alter existing analyst instructions.
- This block governs Brain 2 (the analyst) only. Do NOT add it to lens voice prompts (voices are exempt from the corpus — see SCOPE clause in LearnedCorpus).
- One commit. Run `tsc` before committing.
- Re-run bundle IP grep after (this touches server-side prompt only, but confirm it stays server-side).

## Verify
- `tsc` clean.
- Bundle IP grep PASS (exit:1) — new instructions must not appear in client bundle.
- Run the circus paragraph through a fresh analysis — confirm "destitute-inspired fashion" is no longer flagged as weak abstraction, and that deliberate roughness/ambiguity in a literary piece is not penalised.
