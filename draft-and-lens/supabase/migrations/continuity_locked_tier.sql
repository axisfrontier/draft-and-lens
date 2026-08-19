-- ═══════════════════════════════════════════════════════════════════════════
-- Locked tier — §5.7 / §6 severity ladder.
--
-- The ladder shipped with three outcomes: contradiction, worth_checking,
-- dismissed. §6 defines a fourth that "sits above the ladder rather than on
-- it", because one side of a lock violation is writer-authored and carries no
-- extraction risk: the writer declared an invariant and the text departs from
-- it.
--
-- Only state-lock violations in a manuscript established as chronological can
-- reach it (§5.7). Everywhere else a lock violation is 'worth_checking', which
-- in practice is almost everywhere — the narrative frame is learned from
-- structural maps the beta rarely produces, and an unknown frame demotes
-- (sub-question 1a).
--
-- UNTIL THIS IS APPLIED, locked-tier rows are simply rejected by the existing
-- constraint. The application stores lock violations in their own batch for
-- exactly that reason, so a rejection costs the lock flags and never the
-- contradiction flags alongside them.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.continuity_flags
  drop constraint if exists continuity_flags_outcome_chk;

alter table public.continuity_flags
  add constraint continuity_flags_outcome_chk
  check (outcome in ('contradiction', 'worth_checking', 'dismissed', 'locked'));

-- §6b ledger view — surviving flags for a manuscript, dismissals excluded.
-- Recreated so the partial index still covers the locked tier explicitly
-- rather than by accident of the <> comparison.
drop index if exists continuity_flags_manuscript_live_idx;
create index if not exists continuity_flags_manuscript_live_idx
  on public.continuity_flags (manuscript_id)
  where deleted_at is null and outcome <> 'dismissed';

-- ───────────────────────────────────────────────────────────────────────────
-- AFTER APPLYING, verify it took — one row expected, listing all four values:
--
--   select pg_get_constraintdef(oid)
--     from pg_constraint
--    where conname = 'continuity_flags_outcome_chk';
