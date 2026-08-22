-- ═══════════════════════════════════════════════════════════════════════════
-- Character bible, moved from the submission panel to the book.
--
-- It was a box on the homescreen: paste a character bible to use for THIS
-- reading, or tick Skip to stop one being built. Both were per-submission,
-- stored nowhere, and re-typed on every chapter — which is the wrong shape for
-- what a bible actually is. A character bible is a fact about a BOOK: the same
-- cast, the same relationships, the same history, across every chapter filed
-- under it. Nenad's ruling, 2026-08-22: it belongs in the book view.
--
-- TWO COLUMNS, NOT A TABLE. A bible is one text per manuscript with no history
-- worth keeping and nothing to join to — a table would be a row-per-manuscript
-- table with a foreign key back to the row it belongs to. If bible versions
-- ever matter, that is a different feature and a different migration.
--
-- WHAT A STANDALONE PIECE LOSES, stated plainly rather than discovered later:
-- a submission not filed under a book has nowhere to paste a bible, because
-- there is no book to hold it. Brain 5 still builds one from the text, as it
-- always did — the writer simply cannot hand one over. That is the cost of the
-- move and it was accepted with it.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.manuscripts
  -- The writer's own character bible for this book, in their own words. Used
  -- in place of the one Brain 5 would build, on every chapter filed here.
  add column if not exists bible text,

  -- "Don't keep a character sheet for this book." Replaces the per-submission
  -- Skip tick. False for every existing manuscript, which matches the previous
  -- default: nobody who never saw this control has opted out of anything.
  add column if not exists bible_skip boolean not null default false;

-- Length cap matched to the submission panel's old field: generous enough for
-- a real cast list, bounded so a paste of the whole manuscript cannot land in
-- a column that is read into every prompt for this book.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'manuscripts_bible_length_chk'
  ) then
    alter table public.manuscripts
      add constraint manuscripts_bible_length_chk
      check (bible is null or length(bible) <= 20000);
  end if;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- NOTHING ELSE CHANGES. No index: the bible is read by manuscript id, which is
-- the primary key. No RLS change: manuscripts already has RLS enabled with
-- access enforced in the Next.js server against the Clerk-authenticated user,
-- exactly as before.
--
-- AFTER APPLYING, verify it took. Two rows expected:
--
--   select column_name, data_type, column_default
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'manuscripts'
--      and column_name in ('bible', 'bible_skip');
-- ───────────────────────────────────────────────────────────────────────────
