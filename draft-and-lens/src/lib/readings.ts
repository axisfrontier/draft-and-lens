import 'server-only';

import { randomUUID } from 'node:crypto';

import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Reading storage + revision awareness (CHANGE 3, server-side).
 *
 * On every completed reading we store the submitted text + the full reading
 * payload per (user, work). On a resubmission we compare against the most recent
 * stored version of a MATCHING work — a deterministic local text diff, never a
 * model call — and branch:
 *   unchanged → return the stored reading verbatim (no pipeline, no drift)
 *   revised   → a fresh full reading that names the revision
 *   new       → an ordinary first reading of a new work
 * All Supabase calls degrade gracefully: any failure falls back to a normal
 * fresh reading, so storage problems never break analysis.
 */

const TABLE = 'readings';

/** Keep at most this many versions per (user, work); prune the oldest beyond it. */
export const MAX_VERSIONS = 5;

/** ≥ this similarity ⇒ unchanged (covers whitespace / punctuation / a typo). */
const UNCHANGED_SIMILARITY = 0.97;
/** ≥ this similarity (same format) ⇒ a revision of the same work, not a new one. */
const SAME_WORK_SIMILARITY = 0.4;
/** How many recent rows to consider when matching a resubmission to a work. */
const MATCH_CANDIDATES = 12;

/** The full `done` payload the client renders — stored verbatim as reading_json. */
export interface ReadingPayload {
  report: string;
  diagnostic: unknown;
  coverage: unknown;
  scores: unknown;
  market: unknown;
  bible: string;
}

interface ReadingRow {
  work_id: string;
  source_text: string;
  reading_json: ReadingPayload;
  submission_type: string | null;
  created_at: string;
}

// ── Text comparison (deterministic, no model call) ───────────────────────────

/** Word-bigram shingles — order-aware enough to tell a revision from a new work. */
function shingles(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i];
    const b = words[i + 1];
    if (a !== undefined && b !== undefined) set.add(`${a} ${b}`);
  }
  if (words.length === 1 && words[0] !== undefined) set.add(words[0]);
  return set;
}

/** Sørensen–Dice coefficient over two shingle sets (0..1). */
function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let intersection = 0;
  for (const s of small) if (large.has(s)) intersection++;
  return (2 * intersection) / (a.size + b.size);
}

export interface Comparison {
  similarity: number;
  changePct: number;
  /** A human phrase for where the change concentrates, or '' if spread out. */
  location: string;
}

export function compareTexts(oldText: string, newText: string): Comparison {
  const oldShingles = shingles(oldText);
  const similarity = dice(oldShingles, shingles(newText));
  const changePct = Math.round((1 - similarity) * 100);

  // Locate the change: which third of the NEW text overlaps the old least.
  let location = '';
  const words = newText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 30) {
    const third = Math.floor(words.length / 3);
    const segments = [
      words.slice(0, third),
      words.slice(third, third * 2),
      words.slice(third * 2),
    ];
    const labels = ['the opening third', 'the middle third', 'the final third'];
    const changes = segments.map((seg) => {
      const set = new Set<string>();
      for (let i = 0; i < seg.length - 1; i++) {
        const a = seg[i];
        const b = seg[i + 1];
        if (a !== undefined && b !== undefined) set.add(`${a} ${b}`);
      }
      return 1 - dice(set, oldShingles);
    });
    let maxIndex = 0;
    for (let i = 1; i < changes.length; i++) {
      if ((changes[i] ?? 0) > (changes[maxIndex] ?? 0)) maxIndex = i;
    }
    const sorted = [...changes].sort((x, y) => y - x);
    // Only call it "concentrated" when one third is clearly the most reworked.
    if ((sorted[0] ?? 0) - (sorted[1] ?? 0) > 0.15) location = labels[maxIndex] ?? '';
  }

  return { similarity, changePct, location };
}

/** A short magnitude+location sentence for the analyst's revision framing. */
export function summarizeChange(c: Comparison): string {
  const where = c.location ? `, concentrated in ${c.location}` : ' spread through the piece';
  return `Roughly ${c.changePct}% of the text has changed${where}.`;
}

// ── Supabase access (all graceful on failure) ────────────────────────────────

/** Most recent stored reading of a work (same format) that matches `text`, or null. */
async function findBestMatch(
  userId: string,
  mode: string,
  text: string
): Promise<{ workId: string; sourceText: string; reading: ReadingPayload; submissionType: string | null; createdAt: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('work_id, source_text, reading_json, submission_type, created_at')
    .eq('user_id', userId)
    .eq('work_format', mode)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(MATCH_CANDIDATES);
  if (error || !data) return null;

  const rows = data as unknown as ReadingRow[];
  const seenWorks = new Set<string>();
  let best: { row: ReadingRow; similarity: number } | null = null;
  for (const row of rows) {
    if (seenWorks.has(row.work_id)) continue; // rows are newest-first → keep latest
    seenWorks.add(row.work_id);
    const similarity = compareTexts(row.source_text, text).similarity;
    if (!best || similarity > best.similarity) best = { row, similarity };
  }
  if (!best || best.similarity < SAME_WORK_SIMILARITY) return null;
  return {
    workId: best.row.work_id,
    sourceText: best.row.source_text,
    reading: best.row.reading_json,
    submissionType: best.row.submission_type,
    createdAt: best.row.created_at,
  };
}

export type RevisionDecision =
  | { kind: 'unchanged'; reading: ReadingPayload; readAt: string }
  | { kind: 'revised'; workId: string; note: string }
  | { kind: 'refreshed'; workId: string }
  | { kind: 'new' };

/** Decide how to handle a submission relative to the writer's stored work. */
export async function resolveRevision(
  userId: string,
  mode: string,
  text: string,
  submissionType: 'complete' | 'excerpt',
  forceRefresh = false
): Promise<RevisionDecision> {
  try {
    const match = await findBestMatch(userId, mode, text);
    if (!match) return { kind: 'new' };
    const comparison = compareTexts(match.sourceText, text);
    if (comparison.similarity >= UNCHANGED_SIMILARITY) {
      // Writer explicitly asked to re-run despite unchanged text (the "Get a
      // fresh reading" button) — skip the cached return and run the full
      // pipeline, versioned under the same work rather than a duplicate.
      if (forceRefresh) {
        return { kind: 'refreshed', workId: match.workId };
      }
      // Same text — but if it's now being read as an excerpt vs complete piece
      // (or vice versa), that is NOT "unchanged": the correct reading differs.
      // Force a fresh pipeline run rather than serving the stale cached reading.
      if (match.submissionType === submissionType) {
        return { kind: 'unchanged', reading: match.reading, readAt: match.createdAt };
      }
      const label = (t: string | null) => (t === 'excerpt' ? 'an excerpt' : 'a complete piece');
      return {
        kind: 'revised',
        workId: match.workId,
        note: `Re-read as ${label(submissionType)} (previously read as ${label(match.submissionType)}); the text itself is unchanged.`,
      };
    }
    return { kind: 'revised', workId: match.workId, note: summarizeChange(comparison) };
  } catch {
    return { kind: 'new' }; // any storage problem → ordinary fresh reading
  }
}

/** Store a completed reading, then prune to MAX_VERSIONS. Non-fatal throughout. */
export async function storeReading(args: {
  userId: string;
  workId: string;
  mode: string;
  title: string;
  sourceText: string;
  reading: ReadingPayload;
  submissionType: 'complete' | 'excerpt';
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServiceClient();
    await supabase.from(TABLE).insert({
      user_id: args.userId,
      work_id: args.workId,
      work_title: args.title || null,
      work_format: args.mode,
      source_text: args.sourceText,
      reading_json: args.reading,
      submission_type: args.submissionType,
    });
    await pruneVersions(supabase, args.userId, args.workId);
  } catch {
    /* storage is best-effort — never block the reading the user already has */
  }
}

async function pruneVersions(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  workId: string
): Promise<void> {
  const { data } = await supabase
    .from(TABLE)
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('work_id', workId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (!data || data.length <= MAX_VERSIONS) return;
  const surplus = (data as unknown as Array<{ id: string }>).slice(MAX_VERSIONS).map((r) => r.id);
  if (surplus.length > 0) await supabase.from(TABLE).delete().in('id', surplus);
}

export function newWorkId(): string {
  return randomUUID();
}

// ── User-data functions (CHANGE 4) ───────────────────────────────────────────

/** One row per saved work for the library view (latest version's metadata). */
export interface WorkSummary {
  workId: string;
  title: string;
  format: string;
  updatedAt: string;
  versions: number;
}

/** Soft-deleted works stay recoverable for this many days, then are hard-purged. */
export const SOFT_DELETE_GRACE_DAYS = 30;

/** Permanently delete EVERY row for a user (account wipe — real, not a flag). */
export async function deleteAllUserData(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true; // nothing stored to remove
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from(TABLE).delete().eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/** Soft-delete a work (recoverable). Returns false on any failure. */
export async function softDeleteWork(userId: string, workId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('work_id', workId)
      .is('deleted_at', null);
    return !error;
  } catch {
    return false;
  }
}

/** Rename a work (library hygiene). Title is trimmed + capped; blank → Untitled. */
export async function renameWork(userId: string, workId: string, title: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const clean = title.trim().slice(0, 200) || 'Untitled';
    const supabase = getServiceClient();
    const { error } = await supabase
      .from(TABLE)
      .update({ work_title: clean })
      .eq('user_id', userId)
      .eq('work_id', workId)
      .is('deleted_at', null);
    return !error;
  } catch {
    return false;
  }
}

/** Undo a soft-delete while still within the grace window. */
export async function restoreWork(userId: string, workId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from(TABLE)
      .update({ deleted_at: null })
      .eq('user_id', userId)
      .eq('work_id', workId)
      .not('deleted_at', 'is', null);
    return !error;
  } catch {
    return false;
  }
}

/** Permanently remove this user's works soft-deleted longer than the grace window. */
export async function purgeExpiredDeletions(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServiceClient();
    const cutoff = new Date(Date.now() - SOFT_DELETE_GRACE_DAYS * 86_400_000).toISOString();
    await supabase
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoff);
  } catch {
    /* best-effort retention pruning */
  }
}

/** Complete, portable export of everything stored for a user (GDPR §20). */
export interface UserDataExport {
  exportedAt: string;
  account: string;
  works: Array<{
    workId: string;
    title: string;
    format: string;
    versions: Array<{
      createdAt: string;
      deletedAt: string | null;
      sourceText: string;
      reading: ReadingPayload;
    }>;
  }>;
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const base: UserDataExport = {
    exportedAt: new Date().toISOString(),
    account: userId,
    works: [],
  };
  if (!isSupabaseConfigured()) return base;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('work_id, work_title, work_format, source_text, reading_json, created_at, deleted_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error || !data) return base;

    const rows = data as unknown as Array<{
      work_id: string;
      work_title: string | null;
      work_format: string;
      source_text: string;
      reading_json: ReadingPayload;
      created_at: string;
      deleted_at: string | null;
    }>;
    const byWork = new Map<string, UserDataExport['works'][number]>();
    for (const r of rows) {
      let work = byWork.get(r.work_id);
      if (!work) {
        work = {
          workId: r.work_id,
          title: r.work_title || 'Untitled',
          format: r.work_format,
          versions: [],
        };
        byWork.set(r.work_id, work);
      }
      work.versions.push({
        createdAt: r.created_at,
        deletedAt: r.deleted_at,
        sourceText: r.source_text,
        reading: r.reading_json,
      });
    }
    return { ...base, works: [...byWork.values()] };
  } catch {
    return base;
  }
}

/** List the signed-in user's saved works (newest first; soft-deleted excluded). */
export async function listWorks(userId: string): Promise<WorkSummary[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('work_id, work_title, work_format, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    const rows = data as unknown as Array<{
      work_id: string;
      work_title: string | null;
      work_format: string;
      created_at: string;
    }>;
    // Rows are newest-first, so the first sighting of a work_id is its latest.
    const byWork = new Map<string, WorkSummary>();
    for (const r of rows) {
      const existing = byWork.get(r.work_id);
      if (existing) {
        existing.versions += 1;
      } else {
        byWork.set(r.work_id, {
          workId: r.work_id,
          title: r.work_title || 'Untitled',
          format: r.work_format,
          updatedAt: r.created_at,
          versions: 1,
        });
      }
    }
    return [...byWork.values()];
  } catch {
    return [];
  }
}
