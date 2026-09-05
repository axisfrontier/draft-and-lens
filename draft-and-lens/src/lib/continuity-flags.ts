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
 *
 * PROMOTION. Idempotency is not the same as immutability. Sub-question 1a
 * resolves state locks and age/date clashes as unknown-and-demote — they sit
 * at worth-checking until the frame is established, and then *promote*. A pair
 * therefore has to be able to change tier after it is first written, or the
 * demotion is permanent and the second half of the ruling never happens.
 * Movement is one-way, up: see `promotes`.
 */

const FLAGS_TABLE = 'continuity_flags';
const MANUSCRIPTS_TABLE = 'manuscripts';

/**
 * Outcomes as stored.
 *
 * 'dismissed' is recorded for idempotency and audit and is never rendered —
 * see the migration header. 'locked' is §6's fourth tier, sitting above the
 * ladder rather than on it because one side is writer-authored and carries no
 * extraction risk; it requires continuity_locked_tier.sql to have been applied.
 */
export type FlagOutcome = 'contradiction' | 'worth_checking' | 'dismissed' | 'locked';

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

/**
 * The §6 ladder as an order, with the locked tier above it.
 *
 * Used for one question only — may this row move? — never for display, which
 * reads the outcome directly.
 */
const OUTCOME_RANK: Record<FlagOutcome, number> = {
  dismissed: 0,
  worth_checking: 1,
  contradiction: 2,
  locked: 3,
};

/**
 * May an existing flag be rewritten at the incoming tier?
 *
 * Strictly upward, and never through 'dismissed' in either direction:
 *
 * • Upward only, because the frame is learned incrementally and can go from
 *   known-linear back to unknown — `nonLinear` is sticky-true, so a later
 *   flashback chapter turns a manuscript non-linear for good. If that could
 *   quietly demote a locked flag the writer has already been shown, the tool
 *   would appear to take a finding back. It stands until they resolve it.
 *
 * • Never out of 'dismissed', because a pair already judged innocent is
 *   exactly the one that must not be re-raised — the same reasoning that puts
 *   dismissals in `listAdjudicatedPairs`. A dismissal is a conclusion, not a
 *   lower rung.
 *
 * • Never *into* 'dismissed', because nothing in detection re-dismisses a live
 *   flag; §5.5 gives the writer `continuity_facts.reconciled_at` for that and
 *   it works upstream, by stopping the pair being raised at all.
 */
export function promotes(stored: FlagOutcome, incoming: FlagOutcome): boolean {
  if (stored === 'dismissed' || incoming === 'dismissed') return false;
  return OUTCOME_RANK[incoming] > OUTCOME_RANK[stored];
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

/** One row as it is written, before the store decides insert or promote. */
interface FlagInsert {
  manuscript_id: string;
  user_id: string;
  fact_a_id: string;
  fact_b_id: string;
  entity: string;
  attribute: string;
  outcome: FlagOutcome;
  reasoning: string | null;
  explanation: string | null;
  confidence: number | null;
  ceiling: string | null;
  demotions: string[];
  short_circuited: boolean;
  reading_id: string | null;
}

/**
 * Rewrite pairs that already exist at a strictly lower tier.
 *
 * Runs only on the rows the insert declined, so the ordinary path — every pair
 * new — costs nothing extra.
 *
 * Each update is guarded on the outcome it read (`.eq('outcome', …)`), which
 * makes it a compare-and-set: two submissions promoting the same pair at once
 * leaves one winner and no lost write, the same posture `ignoreDuplicates`
 * takes on the insert.
 *
 * `reading_id` moves to the run that promoted the flag. §6a is "what did this
 * submission turn up", and a promotion is exactly that — leaving it attributed
 * to the older reading would raise the tier somewhere the writer is not
 * looking. The cost is real and accepted: reopening that older reading no
 * longer shows the flag it first raised. A pair is one row and can only be
 * attributed to one run; the current one is the one that matters.
 */
async function promoteExistingFlags(
  supabase: ReturnType<typeof getServiceClient>,
  manuscriptId: string,
  userId: string,
  rows: readonly FlagInsert[]
): Promise<number> {
  const { data, error } = await supabase
    .from(FLAGS_TABLE)
    .select('id, fact_a_id, fact_b_id, outcome')
    .eq('manuscript_id', manuscriptId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in(
      'fact_a_id',
      rows.map((r) => r.fact_a_id)
    )
    .in(
      'fact_b_id',
      rows.map((r) => r.fact_b_id)
    );
  if (error || !data) return 0;

  // .in() × .in() is a cross product, so a pair is only genuinely present if
  // both halves came back on the SAME row. Keyed here rather than trusted.
  const stored = new Map(
    (data as unknown as Array<{ id: string; fact_a_id: string; fact_b_id: string; outcome: string }>)
      .map((r) => [pairKey(r.fact_a_id, r.fact_b_id), r] as const)
  );

  let promoted = 0;
  for (const row of rows) {
    const existing = stored.get(pairKey(row.fact_a_id, row.fact_b_id));
    if (!existing) continue;
    if (!promotes(existing.outcome as FlagOutcome, row.outcome)) continue;

    const { data: updated } = await supabase
      .from(FLAGS_TABLE)
      .update({
        outcome: row.outcome,
        reasoning: row.reasoning,
        explanation: row.explanation,
        confidence: row.confidence,
        ceiling: row.ceiling,
        demotions: row.demotions,
        short_circuited: row.short_circuited,
        // Only when this run has a reading to attribute it to. A null would
        // orphan the flag out of every §6a section, including the old one.
        ...(row.reading_id ? { reading_id: row.reading_id } : {}),
      })
      .eq('id', existing.id)
      .eq('outcome', existing.outcome)
      .select('id');
    if (updated && updated.length > 0) promoted += 1;
  }
  return promoted;
}

/**
 * Persist a detection run's results. Returns how many rows landed — inserts
 * plus promotions, both being findings the writer will now see.
 */
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

    const rows: FlagInsert[] = args.flags.map((f) => {
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
    //
    // It also declines to update, which is why the promotion pass below
    // exists: what comes back here is only the rows that were NEW.
    const { data, error } = await supabase
      .from(FLAGS_TABLE)
      .upsert(rows, { onConflict: 'fact_a_id,fact_b_id', ignoreDuplicates: true })
      .select('fact_a_id, fact_b_id');
    if (error || !data) return 0;

    const insertedPairs = new Set(
      (data as unknown as Array<{ fact_a_id: string; fact_b_id: string }>).map((r) =>
        pairKey(r.fact_a_id, r.fact_b_id)
      )
    );
    const conflicted = rows.filter((r) => !insertedPairs.has(pairKey(r.fact_a_id, r.fact_b_id)));
    if (conflicted.length === 0) return data.length;

    const promoted = await promoteExistingFlags(
      supabase,
      args.manuscriptId,
      args.userId,
      conflicted
    );
    return data.length + promoted;
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

/**
 * The writer says a flagged pair is intentional (§5.5).
 *
 * "The tool does not have to be right about intent — it has to be correctable
 * once." This is that one click, and it does two separate things because the
 * schema keeps two separate kinds of memory.
 *
 * 1. THE FLAG BECOMES 'dismissed'. That is what makes it permanent, and it
 *    works differently for the two kinds of flag, which is why it is done at
 *    this level rather than upstream:
 *      • a contradiction pair is in `listAdjudicatedPairs` from then on, so
 *        detection never re-adjudicates it — no model call, no second flag;
 *      • a lock violation is recomputed from the facts on every run, so it
 *        WILL be found again — but `storeFlags` cannot insert it (the pair is
 *        unique) and cannot promote it either, because `promotes` treats
 *        'dismissed' as terminal in both directions. It is raised, and
 *        silently declined, every time. That was designed in before there was
 *        anything to dismiss.
 *
 * 2. ONE FACT IS RECONCILED, and only one. `continuity_facts.reconciled_at`
 *    is what `gatePair` and `findStateLockViolations` read, so writing it
 *    stops the pair upstream of any model call. But the column is per FACT
 *    while §5.5 speaks per PAIR, and marking both sides would reach further
 *    than the writer agreed to:
 *      • on a state lock, reconciling the lock fact would kill the lock
 *        itself — a writer who says "she's in chapter 3 because it's a
 *        flashback" has not said the death no longer holds, and a real
 *        violation in chapter 12 must still fire. So the lock is never the
 *        side that gets reconciled;
 *      • on a contradiction, the later fact is reconciled and the earlier one
 *        left live, so the establishing claim can still be checked against
 *        chapters that do not exist yet.
 *    The flag row, not this column, is what carries exact per-pair memory.
 *
 * Idempotent: dismissing twice is harmless and returns true both times.
 */
export async function reconcileFlag(
  userId: string,
  flagId: string,
  reason?: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();

    const { data: flagRows, error: flagErr } = await supabase
      .from(FLAGS_TABLE)
      .select('id, fact_a_id, fact_b_id, outcome')
      .eq('id', flagId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);
    if (flagErr || !flagRows || flagRows.length === 0) return false;
    const flag = (flagRows as unknown as Array<{
      id: string; fact_a_id: string; fact_b_id: string; outcome: string;
    }>)[0];
    if (!flag) return false;

    // Which side may be reconciled — never a writer-authored lock, otherwise
    // the later of the two. Both facts are read in one query.
    const { data: factRows } = await supabase
      .from('continuity_facts')
      .select('id, source, sequence_index')
      .in('id', [flag.fact_a_id, flag.fact_b_id])
      .eq('user_id', userId);
    const facts = (factRows ?? []) as unknown as Array<{
      id: string; source: string; sequence_index: number | null;
    }>;
    const eligible = facts.filter((f) => f.source !== 'writer');
    // Later first, then by id — the second key is not decoration. Two facts
    // from the SAME chapter tie on sequence, and `.in()` gives no order
    // guarantee, so without a stable tiebreak the same dismissal could
    // reconcile a different fact on a different run. Observed live on
    // 2026-08-21, where both sides sat at sequence 1.
    const target =
      [...eligible].sort((x, y) => {
        const bySeq = (y.sequence_index ?? -1) - (x.sequence_index ?? -1);
        return bySeq !== 0 ? bySeq : x.id.localeCompare(y.id);
      })[0] ?? null;

    if (target) {
      // ⚠ `reconciled_reason` IS WRITE-ONLY, and deliberately kept that way —
      // 2026-09-01 audit finding, RULED BY NENAD 2026-09-05: keep it, annotate
      // it, do not delete it. Same treatment as `src/stripe/tiers.ts`.
      //
      // Nothing selects this column anywhere in `src/` or `tests/`; only
      // `reconciled_at` is read back, by `gatePair` and
      // `findStateLockViolations`. So it is storage without a reader, which is
      // exactly the shape a future audit will flag as dead — hence this note.
      //
      // Why it stays. It is the WRITER'S OWN WORDS about their own manuscript
      // ("she's in chapter 3 because it's a flashback"), captured at the one
      // moment they are thinking about that contradiction. Surfacing it later —
      // in the ledger, or to the analyst as context on a dismissed pair — is a
      // real product possibility, and the words cannot be recovered after the
      // fact if they were never stored. Dropping the write to satisfy a
      // dead-code sweep would silently close that door.
      //
      // No GDPR exposure: `FACTS_TABLE` is inside the account-delete cascade,
      // so this text goes when the account goes. Capped at 500 chars at the
      // write, not at the read, because there is no read.
      await supabase
        .from('continuity_facts')
        .update({
          reconciled_at: new Date().toISOString(),
          reconciled_reason: reason?.trim()?.slice(0, 500) || null,
        })
        .eq('id', target.id)
        .eq('user_id', userId);
    }

    const { data: updated } = await supabase
      .from(FLAGS_TABLE)
      .update({ outcome: 'dismissed' })
      .eq('id', flagId)
      .eq('user_id', userId)
      .select('id');
    return Boolean(updated && updated.length > 0);
  } catch {
    return false;
  }
}
