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
 * A work already in this manuscript keeps the chapter number it has — a
 * revision is the same chapter, not a new one. Only a genuinely new work gets
 * a number, and that is "one past the highest so far" rather than "count + 1":
 * works can be detached, so counting rows would reuse an index already taken. Writers reorder chapters afterwards (§2 calls the column
 * writer-orderable); this only has to produce a sane default that never
 * collides.
 */
export async function resolveAttachment(
  userId: string,
  manuscriptId: string,
  mode?: string | null,
  workId?: string | null
): Promise<{ manuscriptId: string; sequenceIndex: number } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getServiceClient();

    const { data: owned } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('id, format')
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);
    if (!owned || owned.length === 0) return null;

    // Backfill a missing format from the first chapter filed into this book.
    //
    // A manuscript created before the writer picked a submission type stores
    // format null, and criterion 5 of the auto-grouping bar fails closed on
    // unknown — so such a manuscript could never auto-group, permanently and
    // invisibly. Healing it here rather than at creation also repairs the rows
    // already created that way, which a UI-side guard alone would not.
    const existingFormat = (owned as unknown as Array<{ format: string | null }>)[0]?.format;
    if (!existingFormat && mode) {
      await supabase
        .from(MANUSCRIPTS_TABLE)
        .update({ format: mode })
        .eq('id', manuscriptId)
        .eq('user_id', userId)
        .is('format', null);
    }

    // A REVISION keeps its chapter's number. Without this check every
    // resubmission was filed as an additional chapter, so revising chapter 1
    // made the book appear to gain a chapter and the same work showed twice in
    // the chapter list under different numbers. Keyed on work_id because that
    // is what resolveRevision already decided identifies "the same piece".
    if (workId) {
      const { data: existing } = await supabase
        .from(READINGS_TABLE)
        .select('sequence_index')
        .eq('user_id', userId)
        .eq('manuscript_id', manuscriptId)
        .eq('work_id', workId)
        .not('sequence_index', 'is', null)
        .order('sequence_index', { ascending: true })
        .limit(1);
      const already = (existing as unknown as Array<{ sequence_index: number }> | null)?.[0]
        ?.sequence_index;
      if (typeof already === 'number') return { manuscriptId, sequenceIndex: already };
    }

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

/**
 * The frame properties learned about a manuscript so far (§5.1), as stored in
 * `manuscripts.narrative_frame`.
 *
 * TWO OF THE THREE ARE PERSISTED, and the third's omission is deliberate:
 * `multiplePov` is derived live from the manuscript's own facts on every
 * detection run (see deriveMultiplePov). Storing a second copy would be
 * denormalisation with nothing to gain and drift to lose — the facts are
 * already loaded, and they are the authority.
 *
 * `unreliableNarrator` joined this store on 2026-08-22, when the structural
 * reader began answering for it. It needed no migration: narrative_frame is
 * jsonb, so a new key costs nothing. Before that it had no evidence source
 * anywhere in the pipeline and was hard-coded null.
 */
export interface StoredFrame {
  /** NULL means UNKNOWN and never "linear" — sub-question 1a, resolved
   *  unknown-and-demote. */
  nonLinear: boolean | null;
  /** NULL means UNKNOWN and never "reliable". Only ever true or null: see
   *  deriveUnreliableNarrator for why false is not writable from evidence. */
  unreliableNarrator: boolean | null;
}

/**
 * Fold one chapter's structural evidence into the manuscript's frame, and
 * return the frame that results.
 *
 * STICKY TRUE, and that is the whole design of the function. One chapter
 * reading as linear does not make a book linear: chapter 1 straightforward and
 * chapter 9 a flashback is the ordinary shape of a novel, and if an early
 * chapter were allowed to write `false`, stated ages and dates would be handed
 * hard tier — exactly the case §5.4 names as where this feature is most likely
 * to embarrass itself. So once any chapter is seen to be non-linear the
 * manuscript stays non-linear, and no later evidence quietly undoes it.
 *
 * `false` is therefore only ever written from a standing start, meaning "some
 * chapter has now been mapped and none was non-linear" — the best available
 * inference under ruling 1, which removed the writer's declaration and
 * accepted a precision cost for a zero-friction start.
 *
 * Evidence of `null` is not evidence. It records nothing and cannot demote a
 * frame already learned.
 */
export async function recordFrameEvidence(
  userId: string,
  manuscriptId: string,
  evidence: { nonLinear: boolean | null; unreliableNarrator: boolean | null }
): Promise<StoredFrame> {
  const unknown: StoredFrame = { nonLinear: null, unreliableNarrator: null };
  if (!isSupabaseConfigured()) return unknown;
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('narrative_frame')
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);
    if (!data || data.length === 0) return unknown;

    const stored = (data as unknown as Array<{ narrative_frame: Partial<StoredFrame> | null }>)[0]
      ?.narrative_frame;
    const current: StoredFrame = {
      nonLinear: typeof stored?.nonLinear === 'boolean' ? stored.nonLinear : null,
      unreliableNarrator:
        typeof stored?.unreliableNarrator === 'boolean' ? stored.unreliableNarrator : null,
    };

    const merged: StoredFrame = {
      nonLinear: mergeFrameEvidence(current.nonLinear, evidence.nonLinear),
      unreliableNarrator: mergeFrameEvidence(
        current.unreliableNarrator,
        evidence.unreliableNarrator
      ),
    };
    if (
      merged.nonLinear === current.nonLinear &&
      merged.unreliableNarrator === current.unreliableNarrator
    ) {
      return current;
    }

    await supabase
      .from(MANUSCRIPTS_TABLE)
      .update({ narrative_frame: { ...(stored ?? {}), ...merged } })
      .eq('id', manuscriptId)
      .eq('user_id', userId);
    return merged;
  } catch {
    // An unknown frame demotes rather than promotes, so a storage failure
    // costs precision and never correctness.
    return unknown;
  }
}

/** The sticky-true merge, extracted so it is testable without a database. */
export function mergeFrameEvidence(
  current: boolean | null,
  evidence: boolean | null
): boolean | null {
  if (current === true) return true; // sticky: never un-learned
  if (evidence === null) return current; // no evidence changes nothing
  return evidence;
}

/**
 * Is this work already filed in this manuscript?
 *
 * Distinct from resolveAttachment, which answers "what sequence index would
 * this take" and cannot tell an existing chapter from a new one — both come
 * back as a number. The caller that needs to know whether a writer's grouping
 * choice is a CHANGE needs exactly this question and no side effects.
 */
export async function isWorkAttached(
  userId: string,
  manuscriptId: string,
  workId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from(READINGS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('manuscript_id', manuscriptId)
      .eq('work_id', workId)
      .limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    // Unknown → treat as not attached. The caller falls through to a full run,
    // which re-groups correctly; the opposite default would silently drop the
    // writer's choice, which is the bug this exists to prevent.
    return false;
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

/** A book's character bible, and whether the writer asked for none. */
export interface ManuscriptBible {
  bible: string | null;
  skip: boolean;
}

/** Matches manuscripts_bible_length_chk. Cut rather than refused. */
export const MAX_BIBLE_LENGTH = 20_000;

/**
 * The bible held for one book.
 *
 * Returns null when the manuscript is not this writer's, which is also how a
 * forged id is refused — the same posture every function in this file takes,
 * and the reason ownership is checked in the data layer rather than the route.
 *
 * Degrades to `{ bible: null, skip: false }` shape only through the caller: a
 * missing column (migration not yet applied) returns null here, and a null
 * bible means the reading behaves exactly as it did before this feature — Brain
 * 5 builds one from the text. Failing closed costs a writer their pasted bible
 * on one reading; failing open would mean sending another book's cast into
 * this one.
 */
export async function getManuscriptBible(
  userId: string,
  manuscriptId: string
): Promise<ManuscriptBible | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('bible, bible_skip')
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .limit(1);
    const row = (data as unknown as Array<{ bible: string | null; bible_skip: boolean }> | null)?.[0];
    if (error || !row) return null;
    return { bible: row.bible?.trim() || null, skip: row.bible_skip === true };
  } catch {
    return null;
  }
}

/**
 * Write the bible for one book. Ownership is part of the update, not a check
 * before it, so there is no window between the two.
 */
export async function setManuscriptBible(
  userId: string,
  manuscriptId: string,
  next: { bible?: string | null; skip?: boolean }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const patch: Record<string, unknown> = {};
    if (next.bible !== undefined) {
      const clean = next.bible?.trim() ?? '';
      patch.bible = clean ? clean.slice(0, MAX_BIBLE_LENGTH) : null;
    }
    if (next.skip !== undefined) patch.bible_skip = next.skip;
    if (Object.keys(patch).length === 0) return false;

    const { data, error } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .update(patch)
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      // An update matching zero rows succeeds with no error, so the row count
      // is the only honest signal that anything changed.
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}
