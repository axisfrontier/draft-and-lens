import 'server-only';

import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Writer goals — Gap B of the Mentor Completeness spec.
 *
 * Everything the product does today reads on its own terms: the tradition
 * comes from the text, never from the writer. A writer who says "I want this
 * to feel more urgent" currently gets no response to that at all. The
 * difference between "this is what your prose does" and "this is whether your
 * prose is doing what you said you wanted" is the difference between feedback
 * and mentorship.
 *
 * THE OPPOSITE DESIGN TO writer-patterns, deliberately. A tendency is the
 * product's claim about the writer, so its vocabulary is closed and comes from
 * the corpus. A goal is the writer's claim about themselves, so there is no
 * vocabulary at all — constraining it would be the product telling a writer
 * what they are allowed to want. The one rule is absolute and it is the
 * spec's: goals are ENTERED, never inferred. Nothing in this module reads a
 * manuscript.
 *
 * TWO SCOPES IN ONE TABLE, distinguished by manuscript_id being null: a goal
 * for one book, or a standing goal for the writer. See the migration header
 * for why they are not two tables.
 */

const TABLE = 'writer_goals';
const MANUSCRIPTS_TABLE = 'manuscripts';

/** Mirrors writer_goals_goal_not_blank_chk. A goal longer than this is cut, not refused. */
export const MAX_GOAL_LENGTH = 500;

/**
 * How many goals reach a reading.
 *
 * The spec's limit is on what is SURFACED, not on what a writer may hold — the
 * schema takes no view and neither does the account page. But a reading held
 * against six ambitions at once is a reading held against none of them, and
 * every goal in the prompt is context competing with the work itself. Three is
 * the ceiling, most specific first.
 */
export const MAX_GOALS_IN_CONTEXT = 3;

export interface WriterGoal {
  id: string;
  /** The writer's own sentence, verbatim. */
  goal: string;
  /** null → a standing goal about their writing; set → a goal for one book. */
  manuscriptId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GoalRow {
  id: string;
  goal: string;
  manuscript_id: string | null;
  created_at: string;
  updated_at: string;
}

function toGoal(row: GoalRow): WriterGoal {
  return {
    id: row.id,
    goal: row.goal,
    manuscriptId: row.manuscript_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Clean a goal as typed, or reject it.
 *
 * Whitespace is normalised and the length capped to what the CHECK constraint
 * accepts — nothing else. This is the one field in the system the product must
 * not have opinions about: no capitalisation, no punctuation, no rewording of
 * a writer's own ambition into a house style.
 *
 * Returns null for anything with no content, which is how an empty optional
 * field stays empty rather than becoming a goal that says nothing.
 */
export function normaliseGoal(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return clean.slice(0, MAX_GOAL_LENGTH);
}

/**
 * Which goals this reading is held against, and in what order.
 *
 * Pure, so the rule is testable without a database and cannot drift from what
 * the route does — the same reason `isNameable` is pure.
 *
 * MOST SPECIFIC FIRST. A goal for the book in front of me outranks a standing
 * ambition about the writer's prose in general: it is the one they set while
 * looking at this work. Within a scope, newest first — a writer who set a new
 * goal last week has moved on from the one they set in March, and neither the
 * schema nor this function makes them say so.
 */
export function selectGoalsForReading(
  goals: readonly WriterGoal[],
  manuscriptId: string | null,
  cap: number = MAX_GOALS_IN_CONTEXT
): WriterGoal[] {
  const applies = (g: WriterGoal): boolean =>
    g.manuscriptId === null || (manuscriptId !== null && g.manuscriptId === manuscriptId);
  const rank = (g: WriterGoal): number => (g.manuscriptId === null ? 1 : 0);
  return [...goals]
    .filter(applies)
    .sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(0, cap));
}

/** Is this manuscript actually this writer's? Never trust an id from a client. */
async function ownsManuscript(userId: string, manuscriptId: string): Promise<boolean> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(MANUSCRIPTS_TABLE)
      .select('id')
      .eq('id', manuscriptId)
      .eq('user_id', userId)
      .limit(1);
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Record a goal the writer typed.
 *
 * A manuscript id that is not theirs is REFUSED rather than quietly rescoped
 * to a standing goal. Silently turning "what I want for this book" into "what
 * I want for my writing" would put words in a writer's mouth, and the next
 * unrelated piece they send would be read against it.
 */
export async function createGoal(args: {
  userId: string;
  manuscriptId: string | null;
  goal: string;
}): Promise<WriterGoal | null> {
  if (!isSupabaseConfigured()) return null;
  const goal = normaliseGoal(args.goal);
  if (!goal) return null;
  if (args.manuscriptId && !(await ownsManuscript(args.userId, args.manuscriptId))) return null;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ user_id: args.userId, manuscript_id: args.manuscriptId, goal })
      .select('id, goal, manuscript_id, created_at, updated_at');
    const row = (data as unknown as GoalRow[])[0];
    if (error || !row) return null;
    return toGoal(row);
  } catch {
    return null;
  }
}

/**
 * Every live goal this writer holds, most specific first.
 *
 * Dismissed goals are excluded here rather than filtered by callers: "never
 * surface a goal the writer dismissed" is the spec's rule, and a query that
 * can return one is a rule waiting to be forgotten at a call site.
 */
export async function listGoals(userId: string): Promise<WriterGoal[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, goal, manuscript_id, created_at, updated_at')
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as unknown as GoalRow[]).map(toGoal);
  } catch {
    return [];
  }
}

/** The goals one reading is held against — standing, plus this book's. */
export async function listGoalsForReading(
  userId: string,
  manuscriptId: string | null
): Promise<WriterGoal[]> {
  return selectGoalsForReading(await listGoals(userId), manuscriptId);
}

/** The writer rewords a goal. Their words replace their words; nothing else moves. */
export async function updateGoal(
  userId: string,
  goalId: string,
  goal: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const clean = normaliseGoal(goal);
  if (!clean) return false;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ goal: clean, updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('user_id', userId)
      .is('dismissed_at', null)
      // An update matching zero rows succeeds with no error, so the row count
      // is the only honest signal that anything changed.
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * The writer sets a goal aside.
 *
 * Kept rather than deleted, like a dismissed pattern and for a related reason:
 * the row is the record that they once worked toward this, and it is what
 * guarantees nothing re-suggests it. Unlike a pattern, a goal can be set aside
 * because it was ACHIEVED — which is why this is "set aside" everywhere the
 * writer can see it, never "dismiss".
 */
export async function dismissGoal(userId: string, goalId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .select('id');
    return !error && Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/** Exported for the account wipe and the data export — see readings.ts. */
export const WRITER_GOALS_TABLE = TABLE;
