import 'server-only';

import type { CostEntry } from '../ai/cost-tracker';
import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Short-form cost logging (financial model data collection). Metadata + token
 * counts only — never the submitted text or reading content. Best-effort: any
 * failure here must never affect the reading the user already has, matching
 * readings.ts's graceful-degradation pattern.
 */

const TABLE = 'submission_costs';

/**
 * Anthropic API pricing (USD per million tokens). Captured 2026-07-15 from
 * anthropic.com/pricing. Token counts (below) are the source of truth — if
 * rates change, recalculate estimated_cost_usd from the stored counts rather
 * than trusting old rows' values.
 */
const PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-8': { input: 15, output: 75 },
};

function estimateCostUsd(entries: CostEntry[]): number {
  let total = 0;
  for (const e of entries) {
    const rate = PRICING_PER_MTOK[e.model];
    if (!rate) continue;
    total += (e.inputTokens / 1_000_000) * rate.input;
    total += (e.outputTokens / 1_000_000) * rate.output;
  }
  return Math.round(total * 1_000_000) / 1_000_000;
}

/** Word-count tier boundaries — mirrors adaptiveAnalystConfig's thresholds (config.ts). */
function reportTier(wordCount: number): 'Micro' | 'Short' | 'Full' {
  if (wordCount < 800) return 'Micro';
  if (wordCount < 3000) return 'Short';
  return 'Full';
}

/** Maps a CostEntry's brain label to the submission_costs column-name stem. */
const BRAIN_COLUMN: Record<string, string> = {
  diagnostician: 'brain1',
  structuralReader: 'brain1b',
  analyst: 'brain2',
  scorer: 'brain3',
  market: 'brain4',
  bible: 'brain5',
  narratorVerify: 'narrator_verify',
  narratorCorrect: 'narrator_correct',
};

export async function logSubmissionCost(args: {
  submissionId: string;
  wordCount: number;
  mode: string;
  submissionType: 'complete' | 'excerpt';
  entries: CostEntry[];
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const row: Record<string, number | string | null> = {
      submission_id: args.submissionId,
      word_count: args.wordCount,
      mode: args.mode,
      submission_type: args.submissionType,
      report_tier: reportTier(args.wordCount),
    };

    let totalInput = 0;
    let totalOutput = 0;
    for (const e of args.entries) {
      const col = BRAIN_COLUMN[e.brain] ?? e.brain;
      row[`${col}_input_tokens`] = e.inputTokens;
      row[`${col}_output_tokens`] = e.outputTokens;
      totalInput += e.inputTokens;
      totalOutput += e.outputTokens;
    }
    row.total_input_tokens = totalInput;
    row.total_output_tokens = totalOutput;
    row.estimated_cost_usd = estimateCostUsd(args.entries);

    const supabase = getServiceClient();
    await supabase.from(TABLE).insert(row);
  } catch {
    /* cost logging is best-effort — never block or affect the reading */
  }
}
