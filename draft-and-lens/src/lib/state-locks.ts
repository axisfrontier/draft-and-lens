import 'server-only';

/**
 * State-lock checking — §5.7.
 *
 * A state lock is a fact true from a point onward: *Sarah dies in chapter 12*,
 * *the bridge is destroyed in chapter 8*. Checking one is chronology-dependent,
 * and chronology is exactly what §3 forbids computing — "compare assertions,
 * never compute chronology". So this module does NOT decide whether chapter 18
 * happens after chapter 12. It reports that a locked character appears in
 * narration later in the sequence and leaves the reading to the writer.
 *
 * WHY THERE IS NO MODEL CALL HERE, unlike fact-pair detection.
 * Pass 2 exists to find the innocent explanation for two claims that cannot
 * both be true. Here the innocent explanations — flashback, memory, dream,
 * hallucination, a ghost, someone imagining her — are not merely possible, they
 * are unresolvable from the ledger by construction. A model asked to choose
 * between them would be guessing at chronology with better prose. The honest
 * output is the observation plus the explanation named first, which is what
 * §5.7 specifies verbatim.
 *
 * THE CONSEQUENCE, STATED PLAINLY (§5.7): the most emotionally obvious lock a
 * writer will reach for — a character's death — is the one this handles least
 * confidently. Nothing in the copy below may imply otherwise.
 */

import type { LedgerFact } from './continuity';
import type { NarrativeFrame } from './detection-gates';

/** Registers that speak for the book itself (§5.2). Mirrors detection-gates:
 *  an appearance in dialogue or a document is a person's claim, not the book
 *  putting the character on the page. */
const BOOK_VOICE: ReadonlySet<string> = new Set(['narration_omniscient', 'narration_pov']);

export interface LockViolation {
  /** The writer's locked fact. */
  lockFactId: string;
  /** The later appearance that raised it. */
  appearanceFactId: string;
  entity: string;
  attribute: string;
  /**
   * 'locked' only where chronology can actually be established — §5.7 gates it
   * on the manuscript being known linear. Everywhere else this is
   * 'worth_checking', which in practice is almost everywhere, because the
   * frame is learned from structural maps the beta rarely produces.
   */
  tier: 'locked' | 'worth_checking';
  reasoning: string;
  explanation: string | null;
}

/** 'character:sarah mallory' → 'Sarah Mallory'. */
function readableEntity(entity: string): string {
  const bare = entity.includes(':') ? entity.slice(entity.indexOf(':') + 1) : entity;
  return bare
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Every state lock a later appearance sits oddly against.
 *
 * One violation per lock, citing the EARLIEST qualifying appearance. A
 * character locked as dead who is named in narration in six later chapters is
 * one thing worth looking at, not six — repeating it per chapter would bury the
 * point and read as the tool malfunctioning.
 */
export function findStateLockViolations(
  facts: readonly LedgerFact[],
  frame: NarrativeFrame
): LockViolation[] {
  const locks = facts.filter(
    (f) => f.lockKind === 'state' && typeof f.lockFromSequence === 'number' && !f.reconciledAt
  );
  if (locks.length === 0) return [];

  const out: LockViolation[] = [];
  for (const lock of locks) {
    const from = lock.lockFromSequence as number;
    const appearances = facts
      .filter(
        (f) =>
          f.factId !== lock.factId &&
          f.entity === lock.entity &&
          // Extracted only: the other lock the writer wrote is not the book
          // putting the character on the page.
          f.source === 'extracted' &&
          // §5.2 — the book's own voice, not a character's claim about her.
          f.register !== null &&
          BOOK_VOICE.has(f.register) &&
          typeof f.sequenceIndex === 'number' &&
          (f.sequenceIndex as number) > from &&
          // §5.5 — the writer has already said this pair is intentional.
          !f.reconciledAt
      )
      .sort((a, b) => (a.sequenceIndex ?? 0) - (b.sequenceIndex ?? 0));

    const first = appearances[0];
    if (!first) continue;

    const who = readableEntity(lock.entity);
    const at = first.sequenceIndex as number;
    // Known linear is the only case §5.7 lets reach the locked tier. A null
    // frame is not permission — sub-question 1a, unknown-and-demote.
    const tier: LockViolation['tier'] = frame.nonLinear === false ? 'locked' : 'worth_checking';

    const reasoning =
      `You locked ${who} as ${lock.value} from chapter ${from}. ` +
      `The narration has ${who} on the page again in chapter ${at}.`;

    // The innocent explanation is named FIRST and in both tiers, because it
    // stays available in both. Even in a manuscript read as chronological, a
    // memory or a dream is ordinary and the ledger cannot see one.
    const explanation =
      tier === 'locked'
        ? `If that chapter is a flashback, a memory or a dream, this is nothing — the ledger cannot tell, and it is not claiming the book is wrong. Nothing else in the manuscript so far reads as out of chronological order, which is the only reason this is raised firmly rather than as a question.`
        : `If that chapter is a flashback, a memory or a dream, ignore this. The manuscript has not established how its timeline runs, so this is a question rather than a finding.`;

    out.push({
      lockFactId: lock.factId,
      appearanceFactId: first.factId,
      entity: lock.entity,
      attribute: lock.attribute,
      tier,
      reasoning,
      explanation,
    });
  }
  return out;
}
