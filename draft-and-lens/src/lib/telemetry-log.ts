import 'server-only';

import type { CostEntry } from '../ai/cost-tracker';
import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Phase 1 latency telemetry (Latency Diagnostic & Remediation Brief, 22 Jul 2026).
 *
 * Records where wall-clock time actually goes on every submission, so the
 * Phase 4 breakdown rests on measurement rather than hypothesis. Deliberately
 * separate from cost-log.ts: that table answers "what did this cost", this one
 * answers "where did the time go". Keeping them apart means neither schema has
 * to distort to serve the other.
 *
 * Stages are stored as JSONB rather than one column per brain, so adding,
 * removing, or renaming a pipeline stage never requires a migration.
 *
 * Metadata and timings only — never the submitted text or reading content.
 * Best-effort throughout: any failure here must never affect the reading the
 * user already has (same graceful-degradation contract as readings.ts).
 */

const TABLE = 'submission_telemetry';

/** How the tradition reaching the analyst was arrived at. */
export type TraditionSource = 'auto' | 'user_selected';

interface StageRow {
  stage: string;
  model: string;
  started_at_ms: number | null;
  ended_at_ms: number | null;
  duration_ms: number | null;
  tokens_in: number;
  tokens_out: number;
}

function toStageRows(entries: CostEntry[]): StageRow[] {
  return entries.map((e) => ({
    stage: e.brain,
    model: e.model,
    started_at_ms: e.startedAtMs ?? null,
    ended_at_ms: e.endedAtMs ?? null,
    duration_ms: e.durationMs ?? null,
    tokens_in: e.inputTokens,
    tokens_out: e.outputTokens,
  }));
}

export async function logSubmissionTelemetry(args: {
  runId: string;
  wordCount: number;
  mode: string;
  submissionType: 'complete' | 'excerpt';
  traditionValue: string | null;
  traditionSource: TraditionSource;
  /** Wall clock from request receipt to the final payload being sent. */
  totalWallClockMs: number;
  /**
   * Request receipt → first genuinely meaningful content emitted to the client.
   * Currently the analyst's first streamed delta: until Phase 5A lands, that is
   * the first thing the user sees that is not a placeholder. Null if the run
   * ended before any content was emitted (unchanged-resubmission short-circuit,
   * moderation block, or error).
   */
  timeToFirstVisibleContentMs: number | null;
  /** Request receipt → first stage event emitted (progress pills move). */
  timeToFirstStageMs: number | null;
  /** Terminal state of the run, so slow runs and failed runs are separable. */
  outcome: 'completed' | 'unchanged' | 'blocked' | 'error';
  entries: CostEntry[];
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const stages = toStageRows(args.entries);
    const measured = stages.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0);

    const supabase = getServiceClient();
    await supabase.from(TABLE).insert({
      run_id: args.runId,
      word_count: args.wordCount,
      mode: args.mode,
      submission_type: args.submissionType,
      tradition_value: args.traditionValue,
      tradition_source: args.traditionSource,
      total_wall_clock_ms: args.totalWallClockMs,
      time_to_first_visible_content_ms: args.timeToFirstVisibleContentMs,
      time_to_first_stage_ms: args.timeToFirstStageMs,
      outcome: args.outcome,
      // Sum of measured stage durations. Compared against total_wall_clock_ms
      // this exposes unaccounted time — serialisation gaps, queueing, and any
      // stage that is still not instrumented. That gap is itself a finding.
      measured_stage_ms: measured,
      stages,
    });
  } catch {
    /* telemetry is best-effort — never block or affect the reading */
  }
}
