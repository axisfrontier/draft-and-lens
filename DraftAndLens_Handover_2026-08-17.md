# Draft & Lens — Handover, 17 August 2026

For: a fresh Claude chat session (this conversation is having a technical fault — pasted text and screenshots from Code are failing to come through). Read fully before doing anything. This supersedes `DraftAndLens_Handover_2026-08-02.md` — that file's content is folded in below where still relevant, plus everything since.

## Where things stand — the continuity ledger (main thread of work)

**Fully built, tested live end-to-end, and deployed:**
- File upload fixes (.md, .docx, .fdx removed from advertised formats)
- Spell-check (detection engine + inline-highlight UX: hover suggestion, click to accept into a running set, export corrected copy — deliberately does NOT mutate the live reading or `source_text`, to avoid desyncing revision-matching)
- Annotation self-consistency fix (notes must give diagnosis + direction, not just labelling — this applies to notes about strengths, not just problems; was the root cause of the "lyricism" and "storm/lightbulb" bad-note bugs)
- API key rotation (Anthropic, Clerk, Supabase — all three, verified, old keys deleted)
- Continuity ledger — grouping (manual + silent auto-grouping on high-confidence matches, 5 criteria, thresholds tuned as named constants), locks, ledger view (`/ledger` index + `/ledger/[manuscriptId]` detail), extraction (populates the ledger with facts from complete+grouped chapters only — excerpts explicitly excluded per ruling 4). All verified live: auto-grouping triggers correctly, confirm-step fallback works for ambiguous matches, manual detach/correction works, extraction populates real facts.
- Two real bugs found and fixed during ledger verification: (1) a revised chapter was being filed as an *additional* chapter instead of reusing its sequence index — fixed, keyed on `work_id`; (2) re-extraction on a revised chapter was duplicating facts instead of retiring the old draft's facts — fixed via soft-delete (not `superseded_by`, which is reserved for a *later chapter* legitimately updating an established fact — a different case). Writer-authored locks are explicitly excluded from this retirement logic (a lock is the writer's own assertion, not an extraction from a draft — the naive implementation would have silently deleted locks too; this is now covered by an explicit test).
- Various live-testing UX fixes: header/logo alignment, Stop button alignment, accordion sizing consistency, "back" links now return to the actual previous page/reading (not a generic homepage) — audited across the app, not just the one instance found. A font-swap bug (visible letterform change during streaming, caused by font variants loading lazily on first use — `display: swap` showing the metric-matched fallback for ~150ms before swapping) was root-caused and fixed by trimming declared variants and fixing four undeclared `fontWeight: 600` usages.

**In progress right now, per `DraftAndLens_Detection_Buildout_Prompt.md`** (already sent to Code, should be mid-execution — check `SESSION_LOG.md` in the repo for exact status):
- Level 1a: brain model/effort tier audit — **already found something important**: three brains (`structuralReader`, `narratorVerifier`, `narratorCorrector`) have **never executed in production**, confirmed absent from 40 real runs. Root cause: `TESTER_WORD_CAP` is 4,000 words (beta ceiling) but these three brains are gated at 5,000 words — a leftover mismatch from before the beta cap was set, never caught because nothing was measuring which brains actually fire. This makes the earlier "narrator-pair tier inversion" flag moot in practice, since one of the two Opus-tier brains in that pair is unreachable dead code until the cap changes. **Decision needed from Nenad, not yet made:** should the 5,000-word gate come down to 4,000 to match beta, or should the cap go up to 5,000? Told Code to flag and wait, not decide.
- A second finding: extraction is invisible to telemetry (`recordBrainUsage` runs before extraction, so it silently drops from cost tracking). Told Code to fix this now, before detection ships, since detection will be the most cost-sensitive piece.
- Level 1b: Learned Corpus review — status unknown, check SESSION_LOG.md.
- Level 2 (detection design/build): scoped explicitly narrow — mechanical facts only (names, ages, dates, physical descriptions, explicit stated rules), NOT interpretive judgement (pacing, unreliable narration, intentional misdirection) — this matches an explicit, industry-wide acknowledged boundary (see research notes below), not a D&L limitation. Two-pass verification design (candidate contradiction → independent second pass checks for innocent explanations before showing the writer) — reasoning: a false contradiction is a direct, first-person trust hit, worse than a weak craft note. Severity tiers: high-confidence flag / "worth checking" flag with reasoning shown / correctly-not-flagged — **silence must never be the default for genuine ambiguity**, only for genuinely resolved non-contradictions. Detection's model tier should be the analyst's tier (heavier than mechanical extraction brains), not the default. Added requirement: measure real latency (not estimate) for the tier audit and for the two-pass verification's added cost, to properly evaluate whether two-pass is worth roughly doubling detection's token cost.
- **Real measured data already returned** (40 production runs): analyst on sonnet-4-6 is 60.6s median, 2,539 avg output tokens; whole run median 49.1s. Key finding: latency tracks *output tokens*, not model tier, much more strongly than expected — a verification-pass "verdict" would be short (a few hundred tokens), so Code's read is the added cost is likely "seconds, not minutes" even at the analyst's tier. This reframes the 2b decision from "is two-pass too slow" to "is doubling detection's token cost worth it" — real figure to be reported once built, not estimated.
- Level 3 (standing periodic audit practice — dead code, duplicated logic, stale docs): not yet started as of last confirmed status. This whole incident (three dead brains) is the strongest possible justification for actually building and using this, not just designing it.

## Standing beta-completion list (from the original handover, still accurate)

1. ~~Continuity ledger phase 2~~ — done (see above)
2. Continuity ledger — extraction/detection — extraction done, detection in progress (see above)
3. Continuity ledger phase 3 — timeline reasoning — **not started, explicitly waits until detection is solid and tested**, since timeline reasoning depends on detection's fact-comparison logic
4. Mentor mode — not started
5. Differentiator messaging / editor voice — not started, depends on Mentor mode existing first (the "once, when genuinely true" design from the earlier handover — method-showing line, not a comparison claim, never names competitors)

## Ad campaign — finished, not yet actioned

`DraftAndLens_Ad_Concepts_Final.md` has 9 finished concepts (copy + design direction + image-gen prompts), built against real competitor research (ProWritingAid's "overwhelming, no synthesis" weakness; nobody else does tradition-aware craft reading with a no-rewrite stance). Explicitly agreed: **hold outreach/campaign launch until beta is more complete** — not urgent, don't action without Nenad's go-ahead.

Also researched: will.i.am's FYI.AI as a potential beta-tester source / eventual advocate. No official contact route exists on their site (checked — Press page is a dead archive, no team contact info). Two real LinkedIn connections sent: Ben Charlton (Founder, Venchr — tangential, led hiring for a will.i.am/Mercedes-AMG project, not FYI.AI itself) and LM Lee Chan (verified COO, FYI.AI — the more promising contact). **Explicitly waiting until beta is done before messaging either further.**

## Internal research notes (see `DraftAndLens_Internal_Research_Notes.md` for full detail — NOT for Code, reference only)

Key finding worth remembering: the mechanical-vs-interpretive continuity-checking boundary is an industry-wide, explicitly acknowledged limit (every serious competitor draws the same line) — not a D&L gap. Potentially a good honest marketing angle later ("we tell you what we can't check") — fits the existing brand voice. Deferred, not urgent.

## Standing rules, unchanged

- Complete pieces only contribute facts to the ledger — never excerpts.
- Commit small, verified chunks. Never leave anything half-finished.
- Don't guess on genuine judgement calls — flag and wait for Nenad, always.
- Retry Bash/tools before asking for a manual command.
- Do NOT touch: the pre-paid-launch checklist (Clerk to production, security re-check, GDPR controls, solicitor review, Stripe, stable reading URLs), the long-form hybrid chunking architecture (designed, documented, not started — see original handover for the full design if needed), grammar-check (explicitly excluded — spell-check only, to protect the "reading, not a rewrite" position), the legal/solicitor file cluster.
- Spell-check yes, grammar-check no — settled, don't revisit.
- Model/effort for this kind of work: Opus, High effort — used throughout tonight's session for exactly this reason (architecture, judgement-heavy build work).

## A technical note on this handover's origin

This document was created because the previous chat session developed a fault: pasted text and screenshots from Claude Code stopped rendering/transmitting properly partway through a conversation, repeatedly, across multiple attempts and formats. If this happens again in the new session, the same workaround applies — try a genuinely fresh message rather than continuing to retry within a poisoned thread.
