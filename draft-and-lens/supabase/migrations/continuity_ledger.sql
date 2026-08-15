-- Continuity ledger — phases 1 and 2 (Design v1.3: §2 grouping, §3 facts, §5.7 locks).
--
-- Additive by design: two new tables plus two NULLABLE columns on `readings`.
-- Existing readings keep working, ungrouped, with no backfill and no data
-- migration (§2). Idempotent — safe to run twice.
--
-- Apply by hand in the Supabase SQL editor, as with submission_telemetry.sql.
--
-- ───────────────────────────────────────────────────────────────────────────
-- RUN THIS FIRST (read-only). Everything below assumes readings.id is `uuid`
-- and readings.user_id is `text`:
--
--   select column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name = 'readings'
--     and column_name in ('id', 'user_id');
--
-- If `id` is not uuid, change continuity_facts.reading_id to match before
-- applying — it stores readings.id values. If `user_id` is not text, change
-- it in both new tables. Neither is guessed lightly: readings.ts reads both as
-- JS strings and submission_telemetry.sql uses uuid, but that is inference,
-- not proof, and the local env could not be used to confirm it (see the note
-- at the foot of this file).
-- ───────────────────────────────────────────────────────────────────────────


-- ── Manuscripts — the grouping prerequisite (§0.1, §2) ──────────────────────
-- There is no concept of "manuscript" in the schema today: resolveRevision
-- groups by text similarity, so chapter 2 of a novel is filed as a separate
-- work. Every ledger row hangs off this table.

create table if not exists public.manuscripts (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null,
  title            text,
  format           text,

  -- Frame properties (§5.1): unreliable narrator, non-linear timeline,
  -- multiple POV. Inferred from behaviour, never asked (ruling 1).
  --
  -- NULL means UNKNOWN — it does NOT mean "linear". Sub-question 1a was
  -- resolved unknown-and-demote, so while this is NULL, stated ages/dates and
  -- state locks may not reach hard or locked tier. Anything reading this
  -- column must treat NULL as "not yet learned", never as a permissive default.
  narrative_frame  jsonb,

  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index if not exists manuscripts_user_idx
  on public.manuscripts (user_id)
  where deleted_at is null;


-- ── Continuity facts — one row per checkable claim (§3), plus locks (§5.7) ──

create table if not exists public.continuity_facts (
  id                  uuid primary key default gen_random_uuid(),
  manuscript_id       uuid not null references public.manuscripts (id) on delete cascade,
  user_id             text not null,

  -- Normalised subject, e.g. 'character:sarah'
  entity              text not null,
  category            text not null,
  attribute           text not null,
  value               text not null,

  mutability          text not null default 'immutable',

  -- Who asserts it and with what authority (§5.2) — the column doing most of
  -- the precision work. NULL where the extractor could not determine it, which
  -- caps the fact below hard tier rather than defaulting it to narration.
  register            text,
  pov_character       text,

  -- Verbatim span (§3). Mandatory for extracted facts — no locatable quote
  -- means the fact is dropped, enforced by the check constraint below rather
  -- than left to caller discipline. Writer-authored locks have no quote.
  evidence_quote      text,

  -- Provenance only — deliberately NOT a foreign key. `readings` rows are
  -- hard-pruned beyond MAX_VERSIONS = 5 (§0.2), and facts must outlive the
  -- reading they were extracted from; that is the whole reason the ledger is
  -- its own table. A real FK would either block pruning (restrict) or blank
  -- this out (set null), and both destroy the provenance trail.
  reading_id          uuid,
  sequence_index      integer,

  confidence          real,

  -- §5.5 — writer marked this pair intentional; never raised again.
  reconciled_at       timestamptz,
  reconciled_reason   text,

  -- A later fact legitimately replaces this one.
  superseded_by       uuid references public.continuity_facts (id) on delete set null,

  -- §5.7 locks. Writer-authored, so no extraction risk on the lock side.
  source              text not null default 'extracted',
  lock_kind           text,
  lock_from_sequence  integer,

  created_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  constraint continuity_facts_category_chk
    check (category in ('name', 'physical', 'age_date', 'relationship')),

  constraint continuity_facts_mutability_chk
    check (mutability in ('immutable', 'slow', 'volatile')),

  constraint continuity_facts_register_chk
    check (register is null or register in (
      'narration_omniscient', 'narration_pov', 'interiority', 'dialogue', 'document'
    )),

  constraint continuity_facts_source_chk
    check (source in ('extracted', 'writer')),

  constraint continuity_facts_lock_kind_chk
    check (lock_kind is null or lock_kind in ('rule', 'state')),

  -- A state lock is "true from a point onward" (§5.7) and is meaningless
  -- without knowing from where.
  constraint continuity_facts_state_lock_needs_origin_chk
    check (lock_kind is distinct from 'state' or lock_from_sequence is not null),

  -- The §3 invariant, enforced in the schema: an extracted fact without a
  -- verbatim quote is not defensible and must never be stored.
  constraint continuity_facts_extracted_needs_quote_chk
    check (source <> 'extracted' or evidence_quote is not null),

  constraint continuity_facts_confidence_range_chk
    check (confidence is null or (confidence >= 0 and confidence <= 1))
);

-- The §9 stage-2 candidate match: join new facts against stored on
-- (entity, attribute), scoped to the manuscript. Deterministic, no model call,
-- so this index is the whole cost of the common "no collision" path.
create index if not exists continuity_facts_match_idx
  on public.continuity_facts (manuscript_id, entity, attribute)
  where deleted_at is null;

-- GDPR sweeps (§8) and per-user export.
create index if not exists continuity_facts_user_idx
  on public.continuity_facts (user_id);

-- Locks are deliberately few (§5.7) — a partial index keeps the ledger view's
-- "what has this writer locked" query cheap without carrying the extracted rows.
create index if not exists continuity_facts_locks_idx
  on public.continuity_facts (manuscript_id)
  where lock_kind is not null and deleted_at is null;


-- ── readings gains grouping columns (§2) ────────────────────────────────────
-- Both NULLABLE on purpose: existing rows stay valid and ungrouped.
-- manuscript_id uses `on delete set null` so removing a manuscript ungroups
-- its readings rather than deleting the writer's work.

alter table public.readings
  add column if not exists manuscript_id uuid
  references public.manuscripts (id) on delete set null;

alter table public.readings
  add column if not exists sequence_index integer;

create index if not exists readings_manuscript_idx
  on public.readings (manuscript_id, sequence_index)
  where manuscript_id is not null;


-- ── RLS — service-role writes only, no client access ────────────────────────
-- Matches submission_telemetry.sql and the supabase-server.ts contract: the
-- browser never talks to Supabase directly; access control is enforced in the
-- Next.js server against the Clerk-authenticated user. RLS with no policies is
-- defence-in-depth — the anon role can read nothing.

alter table public.manuscripts       enable row level security;
alter table public.continuity_facts  enable row level security;


-- ───────────────────────────────────────────────────────────────────────────
-- NOT DONE HERE, deliberately:
--
-- * No backfill. Existing readings are not retro-grouped into manuscripts;
--   grouping starts from the next upload (§2).
-- * No GDPR cascade. Two new tables mean deleteAllUserData, softDeleteWork,
--   restoreWork, exportUserData and purgeExpiredDeletions must each be
--   extended (§8) — application code, shipping with phase 1, not SQL.
-- * No flagging structures. Phase 2 stores and displays; detection is phase 4
--   and adds nothing to this schema.
--
-- Local verification was not possible: .env.local cannot load
-- NEXT_PUBLIC_SUPABASE_URL because the NEXT_PUBLIC_SUPABASE_ANON_KEY line
-- above it has an unterminated quote, which swallows the following line. That
-- is a local-only fault (production reads its env from Vercel) but it means
-- isSupabaseConfigured() is false in local dev, and readings.ts degrades
-- silently by design — so local runs have not been saving to Supabase at all.
-- ───────────────────────────────────────────────────────────────────────────
