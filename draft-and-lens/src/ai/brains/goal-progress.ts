import 'server-only';

import { buildGoalProgressSystem, buildGoalProgressUser } from '../../prompts/goal-progress';
import type { WriterGoal } from '../../lib/writer-goals';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain } from './_shared';

/**
 * Goal progress — Gap B's surfaced half.
 *
 * Runs over the finished report, post-delivery, so its latency and any failure
 * are invisible to the writer. Returns at most two notes, each one the
 * reading's own finding turned to face a goal the writer stated, and each
 * carrying the sentence it rests on.
 *
 * EVERY RULE THE PROMPT STATES IS ALSO CHECKED HERE, the same discipline the
 * pattern extractor holds: the prompt is an instruction, this is the
 * guarantee. A note survives only if its goal id is one we asked about, its
 * evidence is a real substring of the report, and it carries no score. Anything
 * else is dropped silently — a missed note costs a writer one observation, a
 * fabricated one tells them something about their own ambition that nothing in
 * the reading supports.
 */

export interface ProgressOutput {
  notes?: Array<{ goalId?: unknown; note?: unknown; evidence?: unknown }>;
}

export interface GoalProgressNote {
  goalId: string;
  /** The writer's own words, carried through so the note has something to sit under. */
  goal: string;
  note: string;
}

/**
 * At most this many notes reach the writer.
 *
 * Fewer than MAX_GOALS_IN_CONTEXT on purpose: three goals may reach the
 * reading, but three notes stacked above the lenses stops being a mentor
 * answering what you asked and becomes a report card, which is the register
 * this feature is forbidden to take.
 */
const MAX_NOTES = 2;

/** Shortest quotable claim. Below this a "quote" is a fragment, not a finding. */
const MIN_EVIDENCE_CHARS = 20;

/**
 * Normalised containment check — identical rule to the pattern extractor's.
 * Whitespace is normalised on both sides, nothing else: any further loosening
 * lets a paraphrase through, and the paraphrase is the failure being caught.
 */
function isVerbatim(evidence: string, report: string): boolean {
  const flat = (s: string): string => s.replace(/\s+/g, ' ').trim();
  const needle = flat(evidence);
  if (needle.length < MIN_EVIDENCE_CHARS) return false;
  return flat(report).includes(needle);
}

/**
 * Does this note score the writer?
 *
 * The spec forbids scoring outright, and a model asked for a qualitative
 * observation will reach for a percentage or a mark under pressure. Checked
 * rather than trusted. Plain numbers are left alone — "the third scene" is a
 * location, not a grade.
 */
function scores(note: string): boolean {
  return (
    /\d\s*%/.test(note) ||
    /\b\d+\s*(?:out of|\/)\s*\d+\b/i.test(note) ||
    /\b(?:score|scored|scoring|grade|graded|rating|rated|marks out of)\b/i.test(note)
  );
}

/**
 * The guarantee, separated from the call so every rejection path is testable
 * without a model — the same shape `validateFacts` takes in the continuity
 * extractor, and for the same reason: what survives this function is shown to
 * a writer as what the reading said about their own stated ambition.
 */
export function validateGoalNotes(
  raw: ProgressOutput | null,
  report: string,
  goals: readonly WriterGoal[]
): GoalProgressNote[] {
  if (!raw || !Array.isArray(raw.notes)) return [];
  const byId = new Map(goals.map((g) => [g.id, g]));
  const seen = new Set<string>();
  const out: GoalProgressNote[] = [];

  for (const item of raw.notes) {
    if (out.length >= MAX_NOTES) break;
    const goalId = item?.goalId;
    const note = item?.note;
    const evidence = item?.evidence;
    if (typeof goalId !== 'string' || seen.has(goalId)) continue;
    const goal = byId.get(goalId);
    if (!goal) continue; // a goal we never asked about
    if (typeof note !== 'string' || !note.trim()) continue;
    if (typeof evidence !== 'string' || !isVerbatim(evidence, report)) continue;
    if (scores(note)) continue;
    seen.add(goalId);
    out.push({ goalId, goal: goal.goal, note: note.trim() });
  }

  return out;
}

export async function runGoalProgress(args: {
  report: string;
  goals: readonly WriterGoal[];
}): Promise<GoalProgressNote[]> {
  if (!args.report.trim() || args.goals.length === 0) return [];
  try {
    const raw = await callJsonBrain<ProgressOutput>({
      model: MODELS.goalProgress,
      maxTokens: TOKEN_LIMITS.goalProgress,
      brain: 'goalProgress',
      system: buildGoalProgressSystem(),
      user: buildGoalProgressUser(
        args.report,
        args.goals.map((g) => ({ id: g.id, goal: g.goal }))
      ),
    });
    return validateGoalNotes(raw, args.report, args.goals);
  } catch {
    return [];
  }
}
