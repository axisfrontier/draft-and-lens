-- ═══════════════════════════════════════════════════════════════════════════
-- Writer patterns — recurring tendencies across a writer's whole body of work.
--
-- Depth & Scenarios spec, Part 1 Gap 2. Mentor Part B remembers one work in
-- revision; this remembers the WRITER. "This is the third time you've reached
-- for abstraction at the moment the prose needs to be most concrete" is the
-- thing a mentor says that the product currently cannot.
--
-- PER WRITER, NOT PER MANUSCRIPT. That is the whole point and it is why this
-- table keys on user_id alone and has no manuscript_id: a tendency that only
-- ever showed up in one book is a fact about that book.
--
-- THE VOCABULARY IS CLOSED, AND THE CHECK CONSTRAINT IS WHY.
-- Every value of `tendency` is a failure the LearnedCorpus already names, in
-- the corpus's own words, with its principle cited below. Free text here would
-- make two readings describing the same habit in different words impossible to
-- match, and — worse — would let the product generate generic creative-writing
-- advice, which the spec forbids. There is no key for "your dialogue could be
-- sharper" because the corpus does not name that, and so the schema cannot
-- store it. Adding a key is a migration, deliberately: a closed vocabulary
-- that anyone can widen at runtime is not closed.
--
-- TWO KEYS ARE TRADITION-BOUND (Nenad's constraint, 2026-08-21).
-- `withheld_payoff` is a broken contract in contemporary literary realism
-- (P22) and a virtue in crime and thriller. `borrowed_phrase` only arises
-- where a juxtaposition is doing work (P4). The extractor inherits the same
-- tradition check Brain 2 applies and must never assert a failure the corpus
-- calls a primary instrument in that tradition (P3). The schema cannot enforce
-- that — it is an application law, recorded here so it is not lost.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.writer_patterns (
  id              uuid primary key default gen_random_uuid(),

  -- Clerk user id. Same shape and same lack of FK as every other table here.
  user_id         text not null,

  -- The closed vocabulary. Each value is a corpus-named failure:
  --   restatement            P2  — the narrator explains what the work has
  --                               already made clear ("always a failure")
  --   narrated_not_accumulated P5 — conclusions handed over without the
  --                               experience that produces them
  --   shrinking              P7  — the narrator replaces the image's register
  --                               with something smaller or wrong
  --   floating_abstraction   P11 — abstraction that replaces concrete work or
  --                               announces significance already earned
  --                               (NOT abstraction as such, which P11 defends)
  --   unearned_ambiguity     P13 — the reader confused because the writing
  --                               failed to commit, not held by precision
  --   borrowed_phrase        P4  — generic material set against specific
  --                               material, losing the argument
  --   withheld_payoff        P22 — no emotional specificity where the
  --                               tradition's contract requires it
  tendency        text not null,

  -- Which era of the vocabulary this row was counted under. Adding a key later
  -- must not silently continue a count gathered when that key did not exist,
  -- so a new version starts a new row rather than inheriting an old one.
  vocab_version   integer not null default 1,

  -- The readings this tendency was extracted from — the evidence trail, so a
  -- named pattern can always be traced back. NOT a foreign key, for the same
  -- reason continuity_facts.reading_id is not: readings are hard-pruned beyond
  -- MAX_VERSIONS and the evidence must outlive them.
  reading_ids     uuid[] not null default '{}',

  -- The WORKS those readings belong to. This is what the gate counts, not
  -- reading_ids: three revisions of one story are one piece of evidence about
  -- the writer, not three, and counting readings would let a single work
  -- promote a tendency to a named pattern on its own.
  work_ids        uuid[] not null default '{}',

  -- Distinct works this has now been seen in. Denormalised from work_ids so
  -- the gate is a column comparison rather than an array length computed in
  -- every query; the application keeps them in step.
  confirmed_count integer not null default 1,

  first_seen      timestamptz not null default now(),
  last_seen       timestamptz not null default now(),

  -- The writer said this is not true of them. Never named again — dismissal is
  -- permanent, per §5.5's idiom for continuity flags. The row is KEPT rather
  -- than deleted: it is what stops the extractor recreating the pattern the
  -- next time the same tendency appears.
  dismissed_at    timestamptz,

  constraint writer_patterns_tendency_chk
    check (tendency in (
      'restatement',
      'narrated_not_accumulated',
      'shrinking',
      'floating_abstraction',
      'unearned_ambiguity',
      'borrowed_phrase',
      'withheld_payoff'
    )),

  constraint writer_patterns_confirmed_count_chk
    check (confirmed_count >= 1),

  -- One row per writer per tendency per vocabulary era. This is what makes
  -- confirmed_count meaningful: without it, two concurrent readings could each
  -- insert a row and the same habit would be counted as two half-patterns.
  constraint writer_patterns_unique
    unique (user_id, tendency, vocab_version)
);

-- The read path: "what has this writer been shown, and what is eligible now".
-- Partial on live rows because a dismissed pattern is never named again, so no
-- query that matters ever wants it back.
create index if not exists writer_patterns_live_idx
  on public.writer_patterns (user_id)
  where dismissed_at is null;

-- RLS with no policies — the browser never talks to Supabase directly; access
-- control is enforced in the Next.js server against the Clerk-authenticated
-- user. Identical posture to continuity_facts, continuity_flags,
-- user_milestones and submission_telemetry.
alter table public.writer_patterns enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- BEFORE THIS FEATURE SHIPS — an application change that is not optional.
--
-- `deleteAllUserData` in src/lib/readings.ts wipes every per-user table on an
-- account deletion. writer_patterns MUST be added to that list. A per-user
-- table the wipe does not know about makes the deletion claim false, which is
-- a legal statement rather than a bug — user_milestones was missed on the way
-- in on 2026-08-21 and fixed the same day. Do not repeat it.
--
-- AFTER APPLYING, verify it took. One row expected:
--
--   select table_name
--     from information_schema.tables
--    where table_schema = 'public' and table_name = 'writer_patterns';
--
-- And to see the vocabulary the constraint will actually accept:
--
--   select pg_get_constraintdef(oid)
--     from pg_constraint
--    where conname = 'writer_patterns_tendency_chk';
--
-- To re-arm a dismissed pattern for one account during testing:
--
--   update public.writer_patterns set dismissed_at = null
--    where user_id = '<clerk id>' and tendency = '<key>';
