import 'server-only';

import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Continuity ledger reads and locks — phase 2 (design §6b ledger view, §5.7 locks).
 *
 * Phase 2 stores, shows and locks. It does NOT flag: no contradiction detection
 * lives here, and nothing in this module compares one fact against another.
 * That is phase 4, deliberately after we have seen what extraction actually
 * produces on real manuscripts (§10).
 *
 * LOCK MODEL. `source` and `lock_kind` are independent columns and mean
 * different things:
 *   - `source`    — provenance. Where the row came from: 'extracted' from the
 *                   text, or 'writer' typed directly.
 *   - `lock_kind` — the writer's assertion that this must never change.
 * So promoting an extracted fact to a lock sets `lock_kind` on the existing
 * row rather than creating a second one. The row keeps its evidence quote and
 * its provenance, the writer sees the entry they clicked become locked, and
 * unlocking is a clean inverse. Duplicating into a parallel writer-authored
 * row would show the same fact twice in the view and make "which one is real"
 * a question the writer has to answer.
 */

const FACTS_TABLE = 'continuity_facts';
const MANUSCRIPTS_TABLE = 'manuscripts';

/** §5.7 — rule locks hold everywhere; state locks hold from a point onward. */
export type LockKind = 'rule' | 'state';

export interface LedgerFact {
  factId: string;
  entity: string;
  category: string;
  attribute: string;
  value: string;
  mutability: string;
  register: string | null;
  povCharacter: string | null;
  evidenceQuote: string | null;
  sequenceIndex: number | null;
  confidence: number | null;
  source: string;
  lockKind: LockKind | null;
  lockFromSequence: number | null;
  reconciledAt: string | null;
  createdAt: string;
}

/** The ledger view groups by subject — "what do we know about Sarah" (§6b). */
export interface LedgerEntity {
  entity: string;
  facts: LedgerFact[];
}

interface FactRow {
  id: string;
  entity: string;
  category: string;
  attribute: string;
  value: string;
  mutability: string;
  register: string | null;
  pov_character: string | null;
  evidence_quote: string | null;
  sequence_index: number | null;
  confidence: number | null;
  source: string;
  lock_kind: LockKind | null;
  lock_from_sequence: number | null;
  reconciled_at: string | null;
  created_at: string;
}

const SELECT_COLUMNS =
  'id, entity, category, attribute, value, mutability, register, pov_character, ' +
  'evidence_quote, sequence_index, confidence, source, lock_kind, lock_from_sequence, ' +
  'reconciled_at, created_at';

function toFact(r: FactRow): LedgerFact {
  return {
    factId: r.id,
    entity: r.entity,
    category: r.category,
    attribute: r.attribute,
    value: r.value,
    mutability: r.mutability,
    register: r.register,
    povCharacter: r.pov_character,
    evidenceQuote: r.evidence_quote,
    sequenceIndex: r.sequence_index,
    confidence: r.confidence,
    source: r.source,
    lockKind: r.lock_kind,
    lockFromSequence: r.lock_from_sequence,
    reconciledAt: r.reconciled_at,
    createdAt: r.created_at,
  };
}

/** Confirm a manuscript belongs to this writer. The service-role client
 *  bypasses RLS, so ownership is enforced here in code — every entry point
 *  into this module goes through it or an equivalent user_id predicate. */
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
 * Everything tracked for one manuscript, grouped by entity.
 *
 * Ordered so the view reads as a character sheet: entities alphabetically,
 * and within each, locked facts first — they are the writer's own assertions
 * and the reason to open this page — then by attribute for stability.
 */
export async function listLedger(
  userId: string,
  manuscriptId: string
): Promise<LedgerEntity[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    if (!(await ownsManuscript(supabase, userId, manuscriptId))) return [];

    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .select(SELECT_COLUMNS)
      .eq('manuscript_id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('entity', { ascending: true });
    if (error || !data) return [];

    const byEntity = new Map<string, LedgerFact[]>();
    for (const row of data as unknown as FactRow[]) {
      const fact = toFact(row);
      const list = byEntity.get(fact.entity) ?? [];
      list.push(fact);
      byEntity.set(fact.entity, list);
    }

    return [...byEntity.entries()]
      .map(([entity, facts]) => ({
        entity,
        facts: facts.sort((a, b) => {
          const aLocked = a.lockKind ? 0 : 1;
          const bLocked = b.lockKind ? 0 : 1;
          if (aLocked !== bLocked) return aLocked - bLocked;
          return a.attribute.localeCompare(b.attribute);
        }),
      }))
      .sort((a, b) => a.entity.localeCompare(b.entity));
  } catch {
    return [];
  }
}

/** Just the locks — the "what must this book hold to" summary (§6b). */
export async function listLocks(userId: string, manuscriptId: string): Promise<LedgerFact[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    if (!(await ownsManuscript(supabase, userId, manuscriptId))) return [];
    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .select(SELECT_COLUMNS)
      .eq('manuscript_id', manuscriptId)
      .eq('user_id', userId)
      .not('lock_kind', 'is', null)
      .is('deleted_at', null)
      .order('entity', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as FactRow[]).map(toFact);
  } catch {
    return [];
  }
}

/**
 * Promote an existing ledger entry to a lock — the one-click path in §5.7.
 *
 * A state lock is meaningless without knowing the point it holds from, which
 * the schema also enforces; rejecting it here gives the caller a clean false
 * instead of a constraint violation surfacing as a 500.
 */
export async function lockFact(
  userId: string,
  factId: string,
  lockKind: LockKind,
  lockFromSequence: number | null
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  if (lockKind === 'state' && lockFromSequence === null) return false;
  try {
    const supabase = getServiceClient();
    // `.select()` is load-bearing: an update matching zero rows succeeds with
    // no error, so returning `!error` would report a lock the writer does not
    // have. Same reason as manuscripts.attachReading.
    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .update({
        lock_kind: lockKind,
        lock_from_sequence: lockKind === 'state' ? lockFromSequence : null,
      })
      .eq('id', factId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/** Release a lock, leaving the underlying fact and its evidence intact. */
export async function unlockFact(userId: string, factId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .update({ lock_kind: null, lock_from_sequence: null })
      .eq('id', factId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export interface NewWriterLock {
  entity: string;
  category: string;
  attribute: string;
  value: string;
  lockKind: LockKind;
  lockFromSequence?: number | null;
}

/**
 * Add a lock directly, with no extracted fact behind it (§5.7).
 *
 * This is the path that makes locks useful before extraction exists at all —
 * the reason ruling 8 moved them into phase 2. Stored with source='writer'
 * and no evidence quote, which the schema permits precisely because a
 * writer-authored assertion carries no extraction risk to defend.
 */
export async function createWriterLock(
  userId: string,
  manuscriptId: string,
  lock: NewWriterLock
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  if (lock.lockKind === 'state' && (lock.lockFromSequence ?? null) === null) return null;

  const entity = lock.entity.trim().slice(0, 200);
  const attribute = lock.attribute.trim().slice(0, 120);
  const value = lock.value.trim().slice(0, 500);
  if (!entity || !attribute || !value) return null;

  try {
    const supabase = getServiceClient();
    if (!(await ownsManuscript(supabase, userId, manuscriptId))) return null;

    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .insert({
        manuscript_id: manuscriptId,
        user_id: userId,
        entity,
        category: lock.category,
        attribute,
        value,
        // A locked invariant is by definition not expected to change, so it
        // sits at the immutable end of §4 regardless of the attribute.
        mutability: 'immutable',
        source: 'writer',
        evidence_quote: null,
        lock_kind: lock.lockKind,
        lock_from_sequence: lock.lockKind === 'state' ? (lock.lockFromSequence ?? null) : null,
      })
      .select('id');
    if (error || !data || data.length === 0) return null;
    return (data as unknown as Array<{ id: string }>)[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** Soft-delete a ledger row — used for a writer-added lock they no longer want.
 *  Soft rather than hard so it follows the same retention path as everything
 *  else the writer owns (§8), and so an accidental removal is recoverable. */
export async function deleteFact(userId: string, factId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', factId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/** Entity keys already known in this manuscript, for the extractor's spelling
 *  anchor (see buildContinuityPrompt). Capped: the list is a hint, and a very
 *  long one would crowd the prompt for no benefit. */
export async function listKnownEntities(
  userId: string,
  manuscriptId: string,
  limit = 60
): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(FACTS_TABLE)
      .select('entity')
      .eq('manuscript_id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (error || !data) return [];
    const uniq = new Set((data as unknown as Array<{ entity: string }>).map((r) => r.entity));
    return [...uniq].sort().slice(0, limit);
  } catch {
    return [];
  }
}

export interface FactToStore {
  entity: string;
  category: string;
  attribute: string;
  value: string;
  mutability: string;
  register: string | null;
  povCharacter: string | null;
  evidenceQuote: string;
  confidence: number;
}

/**
 * Store a chapter's extracted facts.
 *
 * Inserted as ONE batch on purpose: a partial write would leave a chapter half
 * represented in the ledger, which is worse than not represented at all —
 * later chapters would be checked against an arbitrary subset of what this one
 * established. If the batch fails, the chapter simply contributes nothing and
 * can be re-extracted.
 *
 * Best-effort like everything else here: extraction runs alongside a reading
 * the writer already has, and must never be able to cost them it.
 */
export async function storeFacts(args: {
  userId: string;
  manuscriptId: string;
  readingId: string | null;
  sequenceIndex: number | null;
  facts: readonly FactToStore[];
}): Promise<number> {
  if (!isSupabaseConfigured() || args.facts.length === 0) return 0;
  try {
    const supabase = getServiceClient();
    if (!(await ownsManuscript(supabase, args.userId, args.manuscriptId))) return 0;

    const rows = args.facts.map((f) => ({
      manuscript_id: args.manuscriptId,
      user_id: args.userId,
      entity: f.entity,
      category: f.category,
      attribute: f.attribute,
      value: f.value,
      mutability: f.mutability,
      register: f.register,
      pov_character: f.povCharacter,
      evidence_quote: f.evidenceQuote,
      reading_id: args.readingId,
      sequence_index: args.sequenceIndex,
      confidence: f.confidence,
      source: 'extracted',
    }));

    const { data, error } = await supabase.from(FACTS_TABLE).insert(rows).select('id');
    if (error || !data) return 0;
    return data.length;
  } catch {
    return 0;
  }
}
