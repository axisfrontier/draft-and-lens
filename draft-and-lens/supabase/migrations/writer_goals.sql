-- ═══════════════════════════════════════════════════════════════════════════
-- Writer goals — what the writer is trying to do, in their own words.
--
-- Mentor Completeness spec, Gap B. Everything the product does today reads on
-- its own terms: the tradition comes from the text, not from the writer. A
-- writer who says "I want this to feel more urgent" currently gets no response
-- to that at all. The difference between "this is what your prose does" and
-- "this is whether your prose is doing what you said you wanted" is the
-- difference between feedback and mentorship.
--
-- TWO SCOPES IN ONE TABLE, distinguished by manuscript_id being null.
--   • manuscript_id set  → a goal for one book  ("I want the ending to earn
--     its ambiguity")
--   • manuscript_id null → a standing goal for the writer ("I'm trying to stop
--     over-explaining")
-- One table rather than two because they are the same object with the same
-- lifecycle, the same dismissal, and the same rule that they are never
-- inferred. Splitting them would duplicate every query and every policy for a
-- distinction one nullable column already carries.
--
-- ALWAYS THE WRITER'S OWN WORDS. There is no vocabulary here and no enum, and
-- that is the opposite of the decision made for writer_patterns — deliberately.
-- A tendency is the product's claim about the writer and had to be constrained
-- to the corpus's own language. A goal is the writer's claim about themselves,
-- and constraining it would be the product telling them what they are allowed
-- to want. The spec's rule is absolute: goals are entered, never inferred.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.writer_goals (
  id              uuid primary key default gen_random_uuid(),

  -- Clerk user id. Same shape and same lack of FK as every other table here.
  user_id         text not null,

  -- NULL means a standing goal for the writer rather than one book's goal.
  -- Cascades: a goal about a manuscript that no longer exists is not a goal.
  manuscript_id   uuid references public.manuscripts (id) on delete cascade,

  -- The writer's own sentence. Length-capped rather than shaped: this is the
  -- one field in the system the product must not have opinions about.
  goal            text not null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Set aside by the writer. Kept rather than deleted so the history of what
  -- they were once working toward survives, and so nothing re-suggests it.
  dismissed_at    timestamptz,

  constraint writer_goals_goal_not_blank_chk
    check (length(btrim(goal)) between 1 and 500)
);

-- The read path: "what is this writer working toward right now", asked on
-- every reading. Partial on live rows because a dismissed goal is never
-- surfaced and never passed to a brain.
create index if not exists writer_goals_live_idx
  on public.writer_goals (user_id, manuscript_id)
  where dismissed_at is null;

-- RLS with no policies — the browser never talks to Supabase directly; access
-- control is enforced in the Next.js server against the Clerk-authenticated
-- user. Identical posture to continuity_facts, continuity_flags,
-- user_milestones, writer_patterns and submission_telemetry.
alter table public.writer_goals enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- DELIBERATELY NOT DONE HERE:
--
-- * No unique constraint. A writer may hold several goals for one work, and
--   several standing ones. The spec's limit is on what is SURFACED, not on
--   what may be held, and enforcing "one goal" in the schema would make an
--   editorial decision permanent in the wrong place.
-- * No progress or status column. Goal progress is qualitative, written fresh
--   in each reading, and never reduced to met/not-met — storing a status would
--   invite exactly the scoring the spec forbids.
--
-- BEFORE THIS FEATURE SHIPS — an application change that is not optional:
-- `deleteAllUserData` in src/lib/readings.ts must include writer_goals. Every
-- per-user table belongs in that list; user_milestones was missed on the way
-- in on 2026-08-21 and it made the deletion claim false until it was fixed.
--
-- AFTER APPLYING, verify it took. One row expected:
--
--   select table_name
--     from information_schema.tables
--    where table_schema = 'public' and table_name = 'writer_goals';
--
-- And to see what a writer is currently working toward:
--
--   select manuscript_id, goal, created_at
--     from public.writer_goals
--    where user_id = '<clerk id>' and dismissed_at is null
--    order by created_at desc;
