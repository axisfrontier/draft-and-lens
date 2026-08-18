-- ═══════════════════════════════════════════════════════════════════════════
-- Continuity flags — §9 Stage 3 detection results (phase 4).
--
-- The ledger migration deliberately added "no flagging structures … detection
-- is phase 4 and adds nothing to this schema". This is that phase, and it is a
-- separate file so the phase-2 migration stays a true record of what phase 2
-- did.
--
-- WHY DETECTION RESULTS ARE STORED AT ALL (Nenad's ruling, 2026-08-18).
-- Detection runs AFTER the reading has been streamed to the writer, so an
-- in-memory result would exist only in a narrow window on the submitting tab.
-- Readings are re-viewable at /analysis/[id]; a flag that did not survive a
-- reload would make a reopened reading show no Continuity section, which a
-- writer cannot distinguish from "nothing was found". Facts already persist,
-- so persistent facts with ephemeral flags would also leave the §6b ledger
-- view unable to show flags at all.
--
-- WHY DISMISSALS ARE STORED TOO, not just surviving flags.
-- Two reasons, and the first is the load-bearing one:
--   • Idempotency. Every pair costs up to two model calls. Without a record of
--     what has already been adjudicated, every later chapter re-adjudicates
--     every older pair and re-pays for them — cost that grows quadratically in
--     chapter count for no new information.
--   • The gates module is explicit that "correctly not flagged" and "quietly
--     discarded because it was hard" must stay distinguishable. A dismissal
--     with its reasoning on the record is the only way that holds.
-- Dismissed rows are never shown to the writer. They are a ledger of work
-- already done, not content.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.continuity_flags (
  id              uuid primary key default gen_random_uuid(),
  manuscript_id   uuid not null references public.manuscripts (id) on delete cascade,
  user_id         text not null,

  -- The two facts in tension. Cascade: a flag about a fact that no longer
  -- exists is not a flag, it is a claim about nothing.
  fact_a_id       uuid not null references public.continuity_facts (id) on delete cascade,
  fact_b_id       uuid not null references public.continuity_facts (id) on delete cascade,

  -- Denormalised from the facts so the §6a section renders without a join
  -- back through two fact rows. Detection is append-only and facts are retired
  -- rather than edited, so these cannot drift out of step with their source.
  entity          text not null,
  attribute       text not null,

  -- 'dismissed' is stored and never displayed — see the header note.
  outcome         text not null,

  -- Shown to the writer verbatim when the flag survives. Pass 1's reading of
  -- what the two passages establish; pass 2's innocent explanation, or why
  -- none applied.
  reasoning       text,
  explanation     text,
  confidence      real,

  -- What the deterministic gates decided before any model call — kept so a
  -- flag's severity can be audited back to the rule that capped it.
  ceiling         text,
  demotions       text[],

  -- True when pass 2 was skipped. Distinguishes a dismissal pass 1 settled
  -- alone from one that survived an adversarial second look.
  short_circuited boolean not null default false,

  -- Which submission's detection run produced this. Provenance only, and NOT
  -- a foreign key, for the same reason continuity_facts.reading_id is not:
  -- readings are hard-pruned beyond MAX_VERSIONS and flags must outlive them.
  -- §6a for a given reading selects on this column.
  reading_id      uuid,

  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint continuity_flags_outcome_chk
    check (outcome in ('contradiction', 'worth_checking', 'dismissed')),

  constraint continuity_flags_ceiling_chk
    check (ceiling is null or ceiling in ('hard', 'worth_checking')),

  constraint continuity_flags_confidence_range_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1)),

  -- A fact is not in tension with itself.
  constraint continuity_flags_distinct_facts_chk
    check (fact_a_id <> fact_b_id)
);

-- The idempotency guarantee the header describes, enforced in the schema
-- rather than by caller discipline. The application stores the pair with the
-- lower UUID first (least(a,b)/greatest(a,b) ordering), so a pair cannot be
-- adjudicated twice under two orderings and appear as two flags.
create unique index if not exists continuity_flags_pair_uniq
  on public.continuity_flags (fact_a_id, fact_b_id);

-- §6a — "what did this submission turn up", the hot path.
create index if not exists continuity_flags_reading_idx
  on public.continuity_flags (reading_id)
  where deleted_at is null;

-- §6b ledger view — surviving flags for a manuscript, dismissals excluded.
create index if not exists continuity_flags_manuscript_live_idx
  on public.continuity_flags (manuscript_id)
  where deleted_at is null and outcome <> 'dismissed';

-- GDPR sweeps (§8) and per-user export, matching continuity_facts_user_idx.
create index if not exists continuity_flags_user_idx
  on public.continuity_flags (user_id);

-- RLS with no policies — the browser never talks to Supabase directly; access
-- control is enforced in the Next.js server against the Clerk-authenticated
-- user. Identical posture to continuity_facts and submission_telemetry.
alter table public.continuity_flags enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- AFTER APPLYING, verify it actually took — the ledger migration records that
-- the run twice reported success without the objects appearing. One row
-- expected:
--
--   select table_name
--     from information_schema.tables
--    where table_schema = 'public' and table_name = 'continuity_flags';
--
-- NOT DONE HERE, deliberately:
--
-- * No writer-facing "this is intentional" column. Marking a pair reconciled
--   already has a home — continuity_facts.reconciled_at — and gatePair reads
--   it, so a reconciled pair stops being a candidate upstream of this table.
--   A second, parallel dismissal flag here would make "which one is real" a
--   question with two answers.
-- * No backfill. Facts already stored were never adjudicated; detection
--   starts from the next submission.
