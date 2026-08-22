import 'server-only';

import { getServiceClient, isSupabaseConfigured } from './supabase-server';

/**
 * Things a writer is shown once, ever.
 *
 * One function, and the whole design is in how it fails. `claimMilestone` does
 * not ask whether a milestone has been shown and then show it — that pair has
 * a race in it, and the race's outcome is a writer being told the same thing
 * twice by a sentence whose entire claim is that the product remembers. It
 * CLAIMS: it attempts the insert, and the composite primary key decides. A
 * caller that gets `true` is the one and only caller that ever will.
 *
 * IT FAILS CLOSED, deliberately and in every direction — Supabase not
 * configured, table missing because the migration has not been applied,
 * network error, conflict. All of them return false, and false means stay
 * quiet. The alternative default would show placeholder copy to a real writer
 * before it has been approved, which is the one outcome worth engineering
 * against here.
 */

/** Exported so the account wipe (§8) references the same name this file writes
 *  to. A per-user table that the wipe does not know about makes the deletion
 *  claim false, which is a legal statement and not only a bug. */
export const USER_MILESTONES_TABLE = 'user_milestones';
const TABLE = USER_MILESTONES_TABLE;

/**
 * Every once-only message. A union rather than free strings so a typo cannot
 * silently mint a second milestone that has never been shown to anyone.
 */
export type Milestone =
  | 'differentiator_method_line'
  /** Contextual nudges — one row each, so a nudge cannot reappear. See nudges.ts. */
  | 'nudge_ledger_tracking'
  | 'nudge_revision_memory'
  | 'nudge_keep_sending'
  | 'nudge_mentor_horizon';

/**
 * Claim a milestone for this writer.
 *
 * Returns true exactly once per (user, milestone) across all time and all
 * concurrent requests — that caller may show it. Every other call, and every
 * failure of any kind, returns false.
 */
export async function claimMilestone(userId: string, milestone: Milestone): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return false;
  try {
    const supabase = getServiceClient();
    // No upsert, no ignoreDuplicates: a conflict must be an ERROR here, because
    // "the row already existed" is precisely the answer being asked for.
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ user_id: userId, milestone })
      .select('milestone');
    if (error || !data || data.length === 0) return false;
    return true;
  } catch {
    return false;
  }
}
