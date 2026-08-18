import 'server-only';

import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Continuity flags — reads and writes for §9 Stage 3 detection results.
 *
 * A separate module from continuity.ts on purpose. That file states in its
 * own header that it stores, shows and locks but never flags; detection is a
 * later phase with a different risk profile, and folding it in would make that
 * header false. The two share a database and nothing else.
 *
 * ORDERING INVARIANT. A pair is stored with the lower fact id first. The
 * unique index in the migration is on (fact_a_id, fact_b_id) and cannot see
 * that (x,y) and (y,x) are the same pair, so the normalisation has to happen
 * here — consistently, on both the write path and the already-adjudicated
 * lookup, or the idempotency guarantee silently stops holding and every
 * chapter re-pays for pairs it has already judged.
 */

const FLAGS_TABLE = 'continuity_flags';
const MANUSCRIPTS_TABLE = 'manuscripts';

/** Outcomes as stored. 'dismissed' is recorded for idempotency and audit and
 *  is never rendered — see the migration header. */
export type FlagOutcome = 'contradiction' | 'worth_checking' | 'dismissed';

export interface ContinuityFlag {
  flagId: string;
  entity: string;
  attribute: string;
  outcome: FlagOutcome;
  reasoning: string | null;
  explanation: string | null;
  confidence: number | null;
  factAId: string;
  factBId: string;
  createdAt: string;
}

/** What the caller has adjudicated and wants written down. */
export interface FlagToStore {
  factAId: string;
  factBId: string;
  entity: string;
  attribute: string;
  outcome: FlagOutcome;
  reasoning: string | null;
  explanation: string | null;
  confidence: number | null;
  ceiling: string | null;
  demotions: readonly string[];
  shortCircuited: boolean;
}

const SELECT_COLUMNS =
  'id, entity, attribute, outcome, reasoning, explanation, confidence, fact_a_id, fact_b_id, created_at';

interface FlagRow {
  id: string;
  entity: string;
  attribute: string;
  outcome: string;
  reasoning: string | null;
  explanation: string | null;
  confidence: number | null;
  fact_a_id: string;
  fact_b_id: string;
  created_at: string;
}

/** The canonical key for a pair, order-independent. */
export function pairKey(factAId: string, factBId: string): string {
  return factAId < factBId ? `${factAId}|${factBId}` : `${factBId}|${factAId}`;
}

function orderedPair(factAId: string, factBId: string): [string, string] {
  return factAId < factBId ? [factAId, factBId] : [factBId, factAId];
}

function toFlag(row: FlagRow): ContinuityFlag {
  return {
    flagId: row.id,
    entity: row.entity,
    attribute: row.attribute,
    outcome: row.outcome as FlagOutcome,
    reasoning: row.reasoning,
    explanation: row.explanation,
    confidence: row.confidence,
    factAId: row.fact_a_id,
    factBId: row.fact_b_id,
    createdAt: row.created_at,
  };
}

async function ownsManuscript(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  manuscriptId: string
): Promise<boolean> {
  const { data } = await supabase
    .from(MANUSCRIPTS_TABLE)
    .select('id')
    .eq('id', manuscriptId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .limit(1);
  return Boolean(data && data.length > 0);
}

/**
 * Every pair this manuscript has already adjudicated, as order-independent keys.
 *
 * This is the cost control, not an optimisation. Detection spends up to two
 * model calls per pair; without this the Nth chapter re-adjudicates every pair
 * from chapters 1..N-1 and re-pays for all of them, so spend grows with the
 * square of the chapter count while producing nothing new.
 *
 * Includes dismissals deliberately — a pair judged innocent is exactly the one
 * that must not be asked about again.
 */
export async function listAdjudicatedPairs(
  userId: string,
  manuscriptId: string
): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(FLAGS_TABLE)
      .select('fact_a_id, fact_b_id')
      .eq('manuscript_id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (error || !data) return new Set();
    return new Set(
      (data as unknown as Array<{ fact_a_id: string; fact_b_id: string }>).map((r) =>
        pairKey(r.fact_a_id, r.fact_b_id)
      )
    );
  } catch {
    return new Set();
  }
}

/** Persist a detection run's results. Returns how many rows landed. */
export async function storeFlags(args: {
  userId: string;
  manuscriptId: string;
  readingId: string | null;
  flags: readonly FlagToStore[];
}): Promise<number> {
  if (!isSupabaseConfigured() || args.flags.length === 0) return 0;
  try {
    const supabase = getServiceClient();
    if (!(await ownsManuscript(supabase, args.userId, args.manuscriptId))) return 0;

    const rows = args.flags.map((f) => {
      const [a, b] = orderedPair(f.factAId, f.factBId);
      return {
        manuscript_id: args.manuscriptId,
        user_id: args.userId,
        fact_a_id: a,
        fact_b_id: b,
        entity: f.entity,
        attribute: f.attribute,
        outcome: f.outcome,
        reasoning: f.reasoning,
        explanation: f.explanation,
        confidence: f.confidence,
        ceiling: f.ceiling,
        demotions: [...f.demotions],
        short_circuited: f.shortCircuited,
        reading_id: args.readingId,
      };
    });

    // ignoreDuplicates so a concurrent submission racing on the same pair
    // loses harmlessly instead of failing the whole batch. The unique index is
    // the authority; this just declines to fight it.
    const { data, error } = await supabase
      .from(FLAGS_TABLE)
      .upsert(rows, { onConflict: 'fact_a_id,fact_b_id', ignoreDuplicates: true })
      .select('id');
    if (error || !data) return 0;
    return data.length;
  } catch {
    return 0;
  }
}

/**
 * Surviving flags from one submission's detection run — the §6a section.
 *
 * Dismissals are excluded here rather than by the caller: they are stored for
 * idempotency and audit and have no reader-facing meaning, so the boundary
 * belongs at the edge of the store.
 */
export async function listFlagsForReading(
  userId: string,
  readingId: string
): Promise<ContinuityFlag[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(FLAGS_TABLE)
      .select(SELECT_COLUMNS)
      .eq('reading_id', readingId)
      .eq('user_id', userId)
      .neq('outcome', 'dismissed')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as FlagRow[]).map(toFlag);
  } catch {
    return [];
  }
}
