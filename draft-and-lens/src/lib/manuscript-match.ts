import 'server-only';

/**
 * Manuscript grouping — the suggestion half of Continuity Ledger design §2,
 * option C ("suggest, then confirm").
 *
 * Why this exists: `resolveRevision` in readings.ts matches submissions to
 * works by text similarity, which correctly tells a *revision* of a chapter
 * from a *different* chapter — and therefore files chapter 2 of a novel as an
 * unrelated new work (§0.1). Cross-chapter features need a concept of
 * "manuscript", and grouping is a prerequisite rather than a sub-task.
 *
 * Deterministic and local: no model call, no network. Grouping runs on every
 * upload, so it must be free. This is the same discipline as `compareTexts`.
 *
 * PRECISION BIAS. §2's risk table names silent wrong grouping as the failure
 * that matters: a misgrouping caught at upload costs one click, but one that
 * slips through "poisons every subsequent flag undiagnosably". So this module
 * would rather return null than guess — a missed suggestion costs the writer
 * one dropdown, a wrong one costs the ledger its credibility.
 */

/** Minimum shared entities before a suggestion is possible at all.
 *  One shared name is the §2 risk-A failure verbatim — two unrelated novels
 *  both containing a "Sarah" must never be merged — so a single match is
 *  never enough, regardless of how favourable the ratio looks. */
export const MIN_SHARED_ENTITIES = 2;

/** Minimum overlap coefficient (0..1) on top of the absolute floor above. */
export const MIN_OVERLAP = 0.25;

/**
 * Capitalised words that are not names. Deliberately short: this list only
 * needs to cover words common enough to appear mid-sentence in ordinary prose,
 * because anything rarer cannot reach MIN_SHARED_ENTITIES across two
 * manuscripts by accident. Weekdays and months are the real offenders — "on
 * Tuesday" and "in March" appear in almost any novel and would otherwise
 * manufacture overlap between unrelated books.
 */
const NOT_A_NAME: ReadonlySet<string> = new Set([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  'i', 'god', 'christmas', 'easter', 'english', 'french', 'american', 'british',
]);

/**
 * Thresholds for SILENT auto-grouping. Deliberately far above the thresholds
 * for merely proposing one, because the two failure modes are not symmetric:
 *
 *   a missed grouping  → the ledger does less than it could (safe)
 *   a wrong grouping   → the ledger confidently reports a contradiction
 *                        between two unrelated books (actively wrong)
 *
 * The second is the trust-destroying failure §1.1 is built to avoid, arrived at
 * structurally rather than through a bad note. So the bar for acting without
 * asking is "this is obviously the same book", not "something matched".
 *
 * First-pass values, to be tuned on real manuscripts — like MIN_OVERLAP, they
 * are named rather than buried so tuning is a one-line change.
 */
export const AUTO_MIN_SHARED = 3;
export const AUTO_MIN_OVERLAP = 0.6;
export const AUTO_MIN_DISTINCTIVE = 2;
export const AUTO_MAX_RIVAL_RATIO = 0.5;

/** A manuscript this submission might belong to. */
export interface ManuscriptCandidate {
  id: string;
  title: string | null;
  /** Entities accumulated from the chapters already in this manuscript. */
  entities: ReadonlySet<string>;
  /** Submission format of the manuscript ('story', 'script', …). Null when
   *  unknown, which blocks auto-grouping — see criterion 5. */
  format?: string | null;
}

export interface ManuscriptSuggestion {
  manuscriptId: string;
  title: string | null;
  /** Overlap coefficient, 0..1 — for display and tuning, never a gate on its own. */
  score: number;
  /** The names that drove the match, so the writer can see *why* it was proposed. */
  sharedEntities: string[];
}

/** Strip a trailing possessive so `Sarah's` and `Sarah` are the same entity. */
function stripPossessive(word: string): string {
  return word.replace(/['’]s$/u, '');
}

/**
 * Conservative proper-noun extraction.
 *
 * A word counts as an entity only when it is capitalised *and not the first
 * word of its sentence* — the same guard `spelling.ts` uses, and for the same
 * reason: sentence-initial capitalisation carries no information, so counting
 * it would turn every ordinary opening word into a fake name.
 *
 * This under-extracts on purpose. A name that only ever opens sentences is
 * missed, which costs at most a suggestion; treating "The" and "He" as
 * characters would produce overlap between every pair of manuscripts in the
 * account.
 */
export function extractEntities(text: string): Set<string> {
  const entities = new Set<string>();
  // Split on sentence terminators, keeping it crude — precision here comes from
  // the not-first-word rule, not from perfect sentence segmentation.
  const sentences = text.split(/[.!?]+[\s"'”’)\]]*/u);

  for (const sentence of sentences) {
    const words = sentence
      .replace(/[^\p{L}\p{N}'’\s-]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);

    // Start at 1: index 0 is sentence-initial and tells us nothing.
    for (let i = 1; i < words.length; i++) {
      const raw = words[i];
      if (raw === undefined) continue;
      const word = stripPossessive(raw);
      if (word.length < 2) continue;

      const first = word[0];
      if (first === undefined || first !== first.toUpperCase() || first === first.toLowerCase()) {
        continue; // not a capitalised letter (covers digits and caseless scripts)
      }

      const normalised = word.toLowerCase();
      if (NOT_A_NAME.has(normalised)) continue;
      entities.add(normalised);
    }
  }

  return entities;
}

/**
 * Overlap coefficient — intersection over the size of the *smaller* set.
 *
 * Deliberately not the Sørensen–Dice used by `compareTexts`. Dice is right
 * there because a revision and its original should resemble each other in
 * full, so asymmetry is itself evidence of difference. Here asymmetry is
 * expected and meaningless: chapter 12 introduces new characters and drops
 * ones chapter 1 was full of, and a long first chapter compared against a
 * short later one would score low under Dice purely because of size. What
 * actually indicates "same book" is whether the smaller cast is largely
 * contained in the larger one.
 */
export function entityOverlap(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let intersection = 0;
  for (const e of small) if (large.has(e)) intersection++;
  return intersection / small.size;
}

/** The shared members of two entity sets, sorted for stable display. */
export function sharedEntities(a: ReadonlySet<string>, b: ReadonlySet<string>): string[] {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  const shared: string[] = [];
  for (const e of small) if (large.has(e)) shared.push(e);
  return shared.sort();
}

/**
 * Propose the manuscript this text most likely belongs to, or null.
 *
 * Null is the common and correct answer for a first upload, a standalone
 * piece, or anything the module cannot vouch for. The caller surfaces a
 * suggestion as a single lightweight confirm/adjust step (ruling 2) — never a
 * silent attachment, so a wrong proposal is always visible and one click from
 * being corrected.
 *
 * Ties break toward the higher score, then toward the candidate with more
 * shared entities; genuinely equal candidates resolve by input order, which
 * the caller should keep stable (most recent first reads best to a writer).
 */
export function suggestManuscript(
  text: string,
  candidates: readonly ManuscriptCandidate[]
): ManuscriptSuggestion | null {
  return rankCandidates(extractEntities(text), candidates)[0] ?? null;
}

/** Every candidate clearing the propose floor, best first. Shared by the
 *  suggestion and the confidence banding so they can never disagree. */
function rankCandidates(
  entities: ReadonlySet<string>,
  candidates: readonly ManuscriptCandidate[]
): ManuscriptSuggestion[] {
  if (candidates.length === 0 || entities.size === 0) return [];

  const ranked: ManuscriptSuggestion[] = [];
  for (const candidate of candidates) {
    const shared = sharedEntities(entities, candidate.entities);
    if (shared.length < MIN_SHARED_ENTITIES) continue;
    const score = entityOverlap(entities, candidate.entities);
    if (score < MIN_OVERLAP) continue;
    ranked.push({
      manuscriptId: candidate.id,
      title: candidate.title,
      score,
      sharedEntities: shared,
    });
  }

  return ranked.sort(
    (a, b) => b.score - a.score || b.sharedEntities.length - a.sharedEntities.length
  );
}

/**
 * `auto`    — group silently, no prompt
 * `confirm` — a match exists but could plausibly be coincidence; ask
 * `none`    — nothing to propose; standalone stays the default
 */
export type MatchBand = 'auto' | 'confirm' | 'none';

export interface MatchClassification {
  band: MatchBand;
  suggestion: ManuscriptSuggestion | null;
  /** Which auto criteria the winner failed. Empty when the band is `auto`.
   *  Recorded rather than discarded so a threshold that turns out to be badly
   *  set can be diagnosed from real behaviour instead of guessed at again. */
  failedCriteria: string[];
}

/**
 * Decide whether a match is strong enough to act on without asking.
 *
 * Five criteria, all required for `auto`. Criteria 3 and 4 are the ones doing
 * the real work: raw overlap alone would happily merge two thrillers that both
 * contain a Sarah, a Tom and a London.
 */
export function classifyMatch(
  text: string,
  candidates: readonly ManuscriptCandidate[],
  mode: string | null
): MatchClassification {
  const entities = extractEntities(text);
  const ranked = rankCandidates(entities, candidates);
  const winner = ranked[0];
  if (!winner) return { band: 'none', suggestion: null, failedCriteria: [] };

  const failed: string[] = [];

  // 1 — enough shared names that coincidence stops being a reasonable
  // explanation. Two common first names across unrelated novels is plausible.
  if (winner.sharedEntities.length < AUTO_MIN_SHARED) failed.push('shared-names');

  // 2 — the bulk of the smaller cast is shared, not two names at the edges.
  if (winner.score < AUTO_MIN_OVERLAP) failed.push('overlap');

  // 3 — distinctiveness. A name appearing in several of this writer's
  // manuscripts is weak evidence for any one of them; a name unique to this
  // manuscript is strong. This is what kills the shared-"Sarah" case.
  const others = candidates.filter((c) => c.id !== winner.manuscriptId);
  const distinctive = winner.sharedEntities.filter(
    (name) => !others.some((c) => c.entities.has(name))
  );
  if (distinctive.length < AUTO_MIN_DISTINCTIVE) failed.push('distinctiveness');

  // 4 — no close rival. If two manuscripts both plausibly match, the situation
  // is ambiguous by definition, however good the winner looks on its own.
  const rival = ranked[1];
  if (rival && rival.score > winner.score * AUTO_MAX_RIVAL_RATIO) failed.push('close-rival');

  // 5 — format agreement. A screenplay must never silently join a prose novel.
  // Unknown format fails closed: absence of evidence is not agreement.
  const winnerCandidate = candidates.find((c) => c.id === winner.manuscriptId);
  const format = winnerCandidate?.format ?? null;
  if (!mode || !format || format !== mode) failed.push('format');

  return {
    band: failed.length === 0 ? 'auto' : 'confirm',
    suggestion: winner,
    failedCriteria: failed,
  };
}
