-- Phase 1 latency telemetry (Latency Diagnostic & Remediation Brief, 22 Jul 2026).
--
-- Separate from submission_costs by design: that table answers "what did this
-- cost", this one answers "where did the time go". Per-stage data is JSONB so
-- adding, removing, or renaming a pipeline stage never needs another migration.
--
-- Contains metadata and timings only — never submitted text or reading content.

create table if not exists public.submission_telemetry (
  id                                uuid primary key default gen_random_uuid(),
  created_at                        timestamptz not null default now(),

  run_id                            text not null,
  word_count                        integer,
  mode                              text,
  submission_type                   text,

  -- 'auto' (Brain 1 detected it) | 'user_selected' (writer supplied it)
  tradition_value                   text,
  tradition_source                  text,

  total_wall_clock_ms               integer,
  time_to_first_visible_content_ms  integer,
  time_to_first_stage_ms            integer,

  -- Sum of measured stage durations. total_wall_clock_ms minus this is
  -- unaccounted time: serialisation gaps, queueing, and anything still
  -- uninstrumented. That gap is itself a finding.
  measured_stage_ms                 integer,

  -- 'completed' | 'unchanged' | 'blocked' | 'error'
  outcome                           text,

  -- [{stage, model, started_at_ms, ended_at_ms, duration_ms, tokens_in, tokens_out}]
  stages                            jsonb not null default '[]'::jsonb
);

create index if not exists submission_telemetry_created_at_idx
  on public.submission_telemetry (created_at desc);

create index if not exists submission_telemetry_word_count_idx
  on public.submission_telemetry (word_count);

-- Service-role writes only (the server logs these); no client access.
alter table public.submission_telemetry enable row level security;
