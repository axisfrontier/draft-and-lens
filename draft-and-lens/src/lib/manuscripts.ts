import 'server-only';

import { extractEntities, type ManuscriptCandidate } from './manuscript-match';
import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Manuscript storage — phase 1 of the Continuity Ledger (design §2).
 *
 * A "manuscript" is the grouping `readings` has never had: chapters of one
 * book, ordered by the writer. `resolveRevision` groups by text similarity and
 * therefore files chapter 2 as an unrelated new work (§0.1), so every
 * cross-chapter feature needs this table underneath it.
 *
 * Follows the readings.ts contract exactly: every Supabase call degrades
 * gracefully. A storage failure must never break an analysis — grouping is an
 * enhancement to a reading, and a reading that succeeds while grouping fails is
 * a far better outcome than the reverse.
 */

const MANUSCRIPTS_TABLE = 'manuscripts';
const READINGS_TABLE = 'readings';

/** How many manuscripts to consider when proposing a group for a new upload.
 *  Grouping suggestions run on every upload and read each candidate's source
 *  text, so this bounds the work. A writer with more than this many live
 *  manuscripts is well outside the current beta shape; the cap is here so the
 *  cost cannot grow without someone noticing. */
const MAX_CANDIDATES = 20;

export interface ManuscriptSummary {
  manuscriptId: string;
  title: string | null;
  format: string | null;
  createdAt: string;
  /** Chapters currently attached (live readings only). */
  chapters: number;
}

/** Create a manuscript. Returns its id, or null if storage is unavailable. */
export async function createManuscript(
  userId: string,
  title: string | null,
  format: string | null
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getServiceClient();
    const clean = title?.trim().slice(0, 200) || null;
    const { data, error } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .insert({ user_id: userId, title: clean, format })
      .select('id');
    if (error || !data || data.length === 0) return null;
    return (data as unknown as Array<{ id: string }>)[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** The writer's live manuscripts, newest first, with a chapter count. */
export async function listManuscripts(userId: string): Promise<ManuscriptSummary[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('id, title, format, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    const rows = data as unknown as Array<{
      id: string;
      title: string | null;
      format: string | null;
      created_at: string;
    }>;
    if (rows.length === 0) return [];

    // One extra query rather than N: fetch every attached reading at once and
    // count in memory. Keeps the library view a constant two round trips.
    const counts = new Map<string, Set<string>>();
    const { data: readingRows } = await supabase
      .from(READINGS_TABLE)
      .select('manuscript_id, work_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('manuscript_id', rows.map((r) => r.id));

    for (const r of (readingRows ?? []) as unknown as Array<{
      manuscript_id: string | null;
      work_id: string;
    }>) {
      if (!r.manuscript_id) continue;
      const set = counts.get(r.manuscript_id) ?? new Set<string>();
      // Count distinct works, not rows: a chapter revised five times is still
      // one chapter (MAX_VERSIONS keeps up to 5 rows per work).
      set.add(r.work_id);
      counts.set(r.manuscript_id, set);
    }

    return rows.map((r) => ({
      manuscriptId: r.id,
      title: r.title,
      format: r.format,
      createdAt: r.created_at,
      chapters: counts.get(r.id)?.size ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Build the candidate set for a grouping suggestion (§2 option C).
 *
 * Entities are derived from the attached readings' source text on demand
 * rather than cached on the manuscript row. The cache would be the faster
 * design, but it would also be a second source of truth that silently goes
 * stale whenever a reading is deleted, restored, or pruned — and a stale
 * entity set produces wrong grouping suggestions, which §2 names as the
 * failure that poisons the ledger. Derivation is bounded by MAX_CANDIDATES
 * and the existing word cap, and runs once per upload.
 *
 * Only the most recent version of each work is read: the five retained
 * versions of one chapter are near-identical, so reading all of them would
 * multiply the work for no additional entities.
 */
export async function buildCandidates(userId: string): Promise<ManuscriptCandidate[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data: msRows, error } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('id, title, format')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(MAX_CANDIDATES);
    if (error || !msRows || msRows.length === 0) return [];

    const manuscripts = msRows as unknown as Array<{
      id: string;
      title: string | null;
      format: string | null;
    }>;

    const { data: readingRows } = await supabase
      .from(READINGS_TABLE)
      .select('manuscript_id, work_id, source_text, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('manuscript_id', manuscripts.map((m) => m.id))
      .order('created_at', { ascending: false });

    // Newest row per work wins — the query is already newest-first, so the
    // first sighting of a work_id is its latest version.
    const seenWork = new Set<string>();
    const textsByManuscript = new Map<string, string[]>();
    for (const r of (readingRows ?? []) as unknown as Array<{
      manuscript_id: string | null;
      work_id: string;
      source_text: string;
    }>) {
      if (!r.manuscript_id || seenWork.has(r.work_id)) continue;
      seenWork.add(r.work_id);
      const list = textsByManuscript.get(r.manuscript_id) ?? [];
      list.push(r.source_text);
      textsByManuscript.set(r.manuscript_id, list);
    }

    return manuscripts.map((m) => {
      const entities = new Set<string>();
      for (const text of textsByManuscript.get(m.id) ?? []) {
        for (const e of extractEntities(text)) entities.add(e);
      }
      return { id: m.id, title: m.title, format: m.format, entities };
    });
  } catch {
    return [];
  }
}

/** One chapter of a manuscript — a work, not a row: a chapter revised five
 *  times is still one chapter (MAX_VERSIONS keeps up to 5 rows per work). */
export interface ManuscriptChapter {
  workId: string;
  title: string;
  sequenceIndex: number | null;
  updatedAt: string;
}

/**
 * The chapters currently grouped into a manuscript, for the correction control
 * in the ledger view (§2 — a misgrouping must be visible and reversible after
 * the fact, not only at upload).
 */
export async function listChapters(
  userId: string,
  manuscriptId: string
): Promise<ManuscriptChapter[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(READINGS_TABLE)
      .select('work_id, work_title, sequence_index, created_at')
      .eq('user_id', userId)
      .eq('manuscript_id', manuscriptId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    // Newest row per work wins — the query is newest-first, so the first
    // sighting of a work_id carries its current title and position.
    const seen = new Map<string, ManuscriptChapter>();
    for (const r of data as unknown as Array<{
      work_id: string;
      work_title: string | null;
      sequence_index: number | null;
      created_at: string;
    }>) {
      if (seen.has(r.work_id)) continue;
      seen.set(r.work_id, {
        workId: r.work_id,
        title: r.work_title || 'Untitled',
        sequenceIndex: r.sequence_index,
        updatedAt: r.created_at,
      });
    }

    return [...seen.values()].sort(
      (a, b) => (a.sequenceIndex ?? Number.MAX_SAFE_INTEGER) - (b.sequenceIndex ?? Number.MAX_SAFE_INTEGER)
    );
  } catch {
    return [];
  }
}

/**
 * Remove a whole work from its manuscript — the undo for a wrong grouping,
 * whether it was auto-applied or confirmed.
 *
 * Detaches by work rather than by reading: "this chapter isn't part of that
 * book" is a statement about the chapter, and leaving four of its five stored
 * versions attached would be a half-corrected state the writer cannot see.
 */
export async function detachWork(userId: string, workId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(READINGS_TABLE)
      .update({ manuscript_id: null, sequence_index: null })
      .eq('user_id', userId)
      .eq('work_id', workId)
      .not('manuscript_id', 'is', null)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Attach a reading to a manuscript at a given position.
 *
 * Scoped by user_id as well as reading id: the service-role client bypasses
 * RLS, so ownership has to be enforced here in code, exactly as readings.ts
 * does. Without the user_id predicate a forged reading id would let one writer
 * graft a row onto another's manuscript.
 */
export async function attachReading(
  userId: string,
  readingId: string,
  manuscriptId: string,
  sequenceIndex: number | null
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();

    // Confirm the manuscript is this writer's before pointing anything at it.
    const { data: owned } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('id')
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);
    if (!owned || owned.length === 0) return false;

    // `.select()` matters: a Supabase update that matches NO rows succeeds
    // with no error, so returning `!error` would report success for a reading
    // that belongs to someone else, or does not exist. The caller uses this
    // boolean to tell the writer their chapter was grouped, so it has to mean
    // a row actually changed.
    const { data, error } = await supabase
      .from(READINGS_TABLE)
      .update({ manuscript_id: manuscriptId, sequence_index: sequenceIndex })
      .eq('id', readingId)
      .eq('user_id', userId)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Verify a manuscript is this writer's and work out where a new chapter sits
 * in it — resolved together because a caller should never have one without the
 * other. Returns null when the manuscript is not theirs or does not exist.
 *
 * The sequence index is "one past the highest so far", not "count + 1": works
 * can be detached and re-ordered, so counting rows would reuse an index that
 * is already taken. Writers reorder chapters afterwards (§2 calls the column
 * writer-orderable); this only has to produce a sane default that never
 * collides.
 */
export async function resolveAttachment(
  userId: string,
  manuscriptId: string
): Promise<{ manuscriptId: string; sequenceIndex: number } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getServiceClient();

    const { data: owned } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('id')
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);
    if (!owned || owned.length === 0) return null;

    const { data } = await supabase
      .from(READINGS_TABLE)
      .select('sequence_index')
      .eq('user_id', userId)
      .eq('manuscript_id', manuscriptId)
      .not('sequence_index', 'is', null)
      .order('sequence_index', { ascending: false })
      .limit(1);

    const highest = (data as unknown as Array<{ sequence_index: number }> | null)?.[0]
      ?.sequence_index;
    return { manuscriptId, sequenceIndex: (highest ?? 0) + 1 };
  } catch {
    return null;
  }
}

/** Detach a reading from its manuscript — the undo for a wrong grouping (§2). */
export async function detachReading(userId: string, readingId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    // Same zero-row caveat as attachReading — see the note there.
    const { data, error } = await supabase
      .from(READINGS_TABLE)
      .update({ manuscript_id: null, sequence_index: null })
      .eq('id', readingId)
      .eq('user_id', userId)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}
