import 'server-only';

import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Writer patterns — the store behind Gap 2 (Depth & Scenarios spec).
 *
 * Mentor Part B remembers one work in revision. This remembers the WRITER:
 * "this is the third time you've reached for abstraction at the moment the
 * prose needed to be most concrete" is the thing a mentor says that the
 * product could not.
 *
 * THE VOCABULARY IS CLOSED AND COMES FROM THE CORPUS, not from here. Every key
 * is a failure the LearnedCorpus already names, and the database enforces the
 * list with a CHECK constraint. That is what makes it impossible for this
 * feature to produce generic creative-writing advice: there is no key for
 * "your dialogue could be sharper" because the corpus does not name it.
 */

/** The closed vocabulary. Mirrors writer_patterns_tendency_chk exactly. */
export type Tendency =
  /** P2 — the narrator explains what the work already made clear. */
  | 'restatement'
  /** P5 — conclusions handed over without the experience that produces them. */
  | 'narrated_not_accumulated'
  /** P7 — the narrator replaces the image's register with something smaller. */
  | 'shrinking'
  /** P11 — abstraction that replaces concrete work the scene needed. */
  | 'floating_abstraction'
  /** P13 — the reader confused because the writing failed to commit. */
  | 'unearned_ambiguity'
  /** P4 — generic material set against specific material. */
  | 'borrowed_phrase'
  /** P22 — no emotional specificity where the tradition's contract requires it. */
  | 'withheld_payoff';

export const TENDENCIES: readonly Tendency[] = [
  'restatement',
  'narrated_not_accumulated',
  'shrinking',
  'floating_abstraction',
  'unearned_ambiguity',
  'borrowed_phrase',
  'withheld_payoff',
];

export function isTendency(value: unknown): value is Tendency {
  return typeof value === 'string' && (TENDENCIES as readonly string[]).includes(value);
}

/**
 * TRADITION-BOUND KEYS — Nenad's constraint, 2026-08-21.
 *
 * Two of the seven are failures in some traditions and primary instruments in
 * others. Withholding emotional resolution breaks the contract in contemporary
 * literary realism (P22) and IS the instrument in crime and noir. A borrowed
 * phrase only loses an argument where a juxtaposition is making one (P4).
 *
 * Asserting either outside its tradition would be the exact error P3 exists to
 * prevent — faulting a tradition's own instrument — and doing it as a PATTERN
 * would repeat that error across a writer's whole body of work rather than in
 * one note. The schema cannot enforce this; it is enforced here, and the
 * extractor is told the confirmed tradition so it can apply it too.
 */
export const TRADITION_BOUND: ReadonlySet<Tendency> = new Set([
  'withheld_payoff',
  'borrowed_phrase',
]);

/** The current vocabulary era. See writer_patterns.vocab_version. */
export const VOCAB_VERSION = 1;

const TABLE = 'writer_patterns';

/** One tendency the extractor found in one reading, with its evidence. */
export interface TendencyCandidate {
  tendency: Tendency;
  /** Verbatim sentence from the READING that supports it. Never invented. */
  evidence: string;
}

export interface NamedPattern {
  tendency: Tendency;
  /** Distinct works this has been seen in. */
  confirmedCount: number;
  firstSeen: string;
}

interface PatternRow {
  id: string;
  tendency: string;
  confirmed_count: number;
  first_seen: string;
  dismissed_at: string | null;
  work_ids: string[] | null;
  reading_ids: string[] | null;
}

/**
 * May this pattern be named to the writer?
 *
 * Pure and separate from the query so the whole gate is testable without a
 * database, and so the rule cannot drift from what the route does.
 *
 * Three conditions, and the middle one is the load-bearing one:
 *   • not dismissed — a writer who said this is not true of them is never
 *     told it again;
 *   • seen in at least two DISTINCT WORKS — the spec's "never inferred from
 *     one submission". Counting readings instead would let three revisions of
 *     a single story promote a tendency to a pattern about the writer, which
 *     is precisely the false claim this gate exists to prevent;
 *   • the writer has at least three submissions in total, so a pattern cannot
 *     be named to someone who has barely arrived.
 */
export function isNameable(
  pattern: { confirmedCount: number; dismissedAt: string | null },
  totalSubmissions: number
): boolean {
  if (pattern.dismissedAt) return false;
  if (pattern.confirmedCount < 2) return false;
  return totalSubmissions >= 3;
}

/**
 * Fold one reading's tendencies into the writer's standing rows.
 *
 * Idempotent per WORK, not per reading: re-reading the same work — a revision,
 * a forced refresh — appends the reading to the evidence trail but does not
 * increment the count, because it is not new evidence about the writer.
 *
 * A dismissed pattern is never revived. Its row is kept for exactly this
 * reason: it is what tells this function to stay quiet.
 *
 * KNOWN LIMIT: the read-then-update is not atomic, so two readings finishing
 * in the same instant could both see the old count and one increment could be
 * lost. The cost is a pattern named one submission later than it might have
 * been. Making it atomic needs a Postgres function, which is another
 * migration; not worth one for an off-by-one in a counter that gates a
 * mentorly aside.
 */
export async function recordTendencies(args: {
  userId: string;
  workId: string;
  readingId: string | null;
  candidates: readonly TendencyCandidate[];
}): Promise<number> {
  if (!isSupabaseConfigured() || args.candidates.length === 0) return 0;
  try {
    const supabase = getServiceClient();
    let written = 0;

    for (const candidate of args.candidates) {
      const { data: existingRows } = await supabase
        .from(TABLE)
        .select('id, tendency, confirmed_count, first_seen, dismissed_at, work_ids, reading_ids')
        .eq('user_id', args.userId)
        .eq('tendency', candidate.tendency)
        .eq('vocab_version', VOCAB_VERSION)
        .limit(1);

      const existing = (existingRows as unknown as PatternRow[] | null)?.[0];

      if (!existing) {
        const { error } = await supabase.from(TABLE).insert({
          user_id: args.userId,
          tendency: candidate.tendency,
          vocab_version: VOCAB_VERSION,
          work_ids: [args.workId],
          reading_ids: args.readingId ? [args.readingId] : [],
          confirmed_count: 1,
        });
        if (!error) written += 1;
        continue;
      }

      // Dismissed is terminal. Nothing about a later reading revives it.
      if (existing.dismissed_at) continue;

      const workIds = existing.work_ids ?? [];
      const readingIds = existing.reading_ids ?? [];
      const isNewWork = !workIds.includes(args.workId);

      const { error } = await supabase
        .from(TABLE)
        .update({
          work_ids: isNewWork ? [...workIds, args.workId] : workIds,
          reading_ids:
            args.readingId && !readingIds.includes(args.readingId)
              ? [...readingIds, args.readingId]
              : readingIds,
          confirmed_count: isNewWork ? existing.confirmed_count + 1 : existing.confirmed_count,
          last_seen: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', args.userId);
      if (!error) written += 1;
    }

    return written;
  } catch {
    return 0;
  }
}

/**
 * Every live pattern for this writer, newest evidence first.
 *
 * Returns rows, not a decision — `isNameable` decides, and the caller holds
 * the submission count it needs.
 */
export async function listPatterns(userId: string): Promise<
  Array<NamedPattern & { dismissedAt: string | null }>
> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('tendency, confirmed_count, first_seen, dismissed_at')
      .eq('user_id', userId)
      .eq('vocab_version', VOCAB_VERSION)
      .is('dismissed_at', null)
      .order('confirmed_count', { ascending: false });
    if (error || !data) return [];
    return (data as unknown as PatternRow[])
      .filter((r) => isTendency(r.tendency))
      .map((r) => ({
        tendency: r.tendency as Tendency,
        confirmedCount: r.confirmed_count,
        firstSeen: r.first_seen,
        dismissedAt: r.dismissed_at,
      }));
  } catch {
    return [];
  }
}

/**
 * The writer says this is not true of them. Permanent, per §5.5's idiom.
 *
 * The row is updated rather than deleted — a deleted row would simply be
 * recreated by the next reading that found the same tendency.
 */
export async function dismissPattern(userId: string, tendency: Tendency): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from(TABLE)
      .update({ dismissed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('tendency', tendency)
      .eq('vocab_version', VOCAB_VERSION)
      .is('dismissed_at', null)
      .select('id');
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}

/** Exported for the account wipe (§8) — see deleteAllUserData. */
export const WRITER_PATTERNS_TABLE = TABLE;
