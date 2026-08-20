-- ═══════════════════════════════════════════════════════════════════════════
-- User milestones — things a writer is shown ONCE, ever.
--
-- Built for the differentiator method line (2026-08-02 handover §6, line 36),
-- whose defining constraint is that it fires "once, not repeated". Nenad's
-- ruling, 2026-08-20: once per WRITER — one showing per user account, ever,
-- regardless of which work or how many revisions.
--
-- WHY THE GUARANTEE LIVES IN THE PRIMARY KEY, not in application code.
-- "Once, ever" is the entire feature. A check-then-insert in the application
-- has a race in it — two submissions finishing together both read "not shown"
-- and both show it — and the failure is not a duplicate row, it is a writer
-- being told the same thing twice by a product whose whole claim in that
-- sentence is that it remembers. The composite primary key makes the second
-- insert fail, so the caller learns it lost by being told the row already
-- existed. There is no window.
--
-- WHY A TABLE RATHER THAN A COLUMN ON A USER ROW. There is no users table —
-- identity is Clerk's, and every other table here keys off a `user_id` text
-- column rather than a local row. A one-off boolean column would need one
-- somewhere to live, and the next once-only message would need another. This
-- costs one table for all of them.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.user_milestones (
  -- Clerk user id, same shape and same lack of FK as every other table here.
  user_id     text not null,

  -- Which one-time thing. Free text rather than an enum: adding a milestone
  -- should not need a migration, and the application already owns the list.
  milestone   text not null,

  shown_at    timestamptz not null default now(),

  -- The guarantee. Not a unique index added alongside a surrogate key — the
  -- pair IS the identity of the row, and there is nothing else to say about it.
  primary key (user_id, milestone)
);

-- GDPR sweeps (§8) and per-user export, matching continuity_flags_user_idx.
-- The primary key already covers user_id as its leading column, so no separate
-- index is added — a second one would be dead weight.

-- RLS with no policies — the browser never talks to Supabase directly; access
-- control is enforced in the Next.js server against the Clerk-authenticated
-- user. Identical posture to continuity_facts, continuity_flags and
-- submission_telemetry.
alter table public.user_milestones enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- UNTIL THIS IS APPLIED, nothing shows. claimMilestone() fails closed: a
-- missing table is indistinguishable from "someone already claimed it", and
-- the safe reading of both is to stay quiet. That is deliberate — the copy is
-- still placeholder and must not reach a writer before Nenad approves it.
--
-- AFTER APPLYING, verify it took. One row expected:
--
--   select table_name
--     from information_schema.tables
--    where table_schema = 'public' and table_name = 'user_milestones';
--
-- And to see who has been shown what:
--
--   select milestone, count(*), max(shown_at)
--     from public.user_milestones group by milestone;
--
-- To re-arm the line for a single account during testing:
--
--   delete from public.user_milestones
--    where user_id = '<clerk id>' and milestone = 'differentiator_method_line';
