import 'server-only';

/**
 * Detection — deterministic gates (§9 Stage 2, §5 gates).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SCOPE BOUNDARY — READ BEFORE EXTENDING (Nenad's ruling, 2026-08-17)
 * ═══════════════════════════════════════════════════════════════════════════
 * Detection covers MECHANICAL facts ONLY: stated names, ages, dates, physical
 * descriptions, explicit stated world/plot rules, and direct factual claims.
 *
 * Detection MUST NOT attempt to judge:
 *   • pacing consistency
 *   • deliberate unreliable narration
 *   • intentional misdirection or red herrings
 *   • any interpretive craft judgement
 *
 * This is not a shortcut or a v1 compromise. It matches the acknowledged
 * industry-wide limit for this category of tool: mechanical fact-checking is
 * what automated reading can do honestly; higher-level narrative judgement is
 * not, and no serious competitor claims otherwise. Widening this scope is a
 * product decision, never an implementation detail — if a future change makes
 * detection reason about intent, craft or meaning, that is a different feature
 * and needs its own ruling.
 *
 * The boundary is partly enforced upstream: only the four v1 categories are
 * ever extracted (§1), so nothing interpretive reaches this file. Do not
 * relax that gate here on the assumption the extractor will hold.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY A DETERMINISTIC LAYER EXISTS AT ALL. Every §5 demotion that can be
 * decided from stored columns is decided here, before any model call. Three
 * reasons, in order of importance: a rule in code is testable and a rule in a
 * prompt is not; the same pair always gets the same treatment; and pairs that
 * cannot reach a flag never cost a token. The model is asked only the question
 * code cannot answer — *are these two claims actually incompatible?*
 */

export type Ceiling = 'hard' | 'worth_checking';

/** A stored fact, reduced to what gating needs. Deliberately structural rather
 *  than importing the ledger row type, so this module stays pure. */
export interface GateFact {
  factId: string;
  entity: string;
  attribute: string;
  value: string;
  category: string;
  mutability: string;
  register: string | null;
  povCharacter: string | null;
  confidence: number | null;
  sequenceIndex: number | null;
  reconciledAt: string | null;
}

/** What the manuscript is known to be doing. NULL throughout means UNKNOWN,
 *  never "linear" — sub-question 1a was resolved unknown-and-demote. */
export interface NarrativeFrame {
  nonLinear: boolean | null;
  unreliableNarrator: boolean | null;
  multiplePov: boolean | null;
}

export type GateOutcome =
  | { kind: 'not_a_candidate'; reason: string }
  | { kind: 'candidate'; ceiling: Ceiling; demotions: string[] };

/** Registers that speak for the book itself. Only these can contradict each
 *  other, because only these are the book asserting something (§5.2). */
const BOOK_VOICE: ReadonlySet<string> = new Set(['narration_omniscient', 'narration_pov']);

/** Below this, the extractor was unsure enough that a hard claim is not
 *  defensible. Chosen to match the extractor's own confidence semantics: it is
 *  told to use the low end freely, so mid-range means "plausible, unverified". */
const HARD_TIER_MIN_CONFIDENCE = 0.7;

/** Loose equality — the deterministic layer only rules out *identical* values.
 *  Anything subtler ("35" vs "mid-thirties") is a compatibility judgement and
 *  belongs to the model, not to a regex. */
function sameValue(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');
  return norm(a) === norm(b);
}

/**
 * Decide whether a pair of facts is worth asking a model about, and the
 * highest severity it could possibly reach.
 *
 * Returning `not_a_candidate` is a real answer, not a silent drop: every path
 * carries a reason, and the caller records them. "Correctly not flagged"
 * and "quietly discarded because it was hard" must stay distinguishable —
 * that distinction is the whole difference between a tool that is trusted and
 * one that is merely quiet.
 */
export function gatePair(a: GateFact, b: GateFact, frame: NarrativeFrame): GateOutcome {
  // Not the same claim about the same thing — nothing to compare.
  if (a.entity !== b.entity || a.attribute !== b.attribute) {
    return { kind: 'not_a_candidate', reason: 'different-claim' };
  }

  // Agreement is not a contradiction.
  if (sameValue(a.value, b.value)) {
    return { kind: 'not_a_candidate', reason: 'same-value' };
  }

  // §5.5 — the writer has already said this pair is intentional. Never again.
  if (a.reconciledAt || b.reconciledAt) {
    return { kind: 'not_a_candidate', reason: 'reconciled-by-writer' };
  }

  // §5.2 — a contradiction requires both sides to speak for the book. A
  // character saying something the narration contradicts is not the book
  // disagreeing with itself; it is a person being wrong, which is the ordinary
  // condition of fiction. This is a TRUE NEGATIVE, and the single most
  // important one: without it, every lie, mistake and unreliable line in the
  // manuscript becomes a reported contradiction.
  const aBook = a.register !== null && BOOK_VOICE.has(a.register);
  const bBook = b.register !== null && BOOK_VOICE.has(b.register);
  if (!aBook || !bBook) {
    return {
      kind: 'not_a_candidate',
      reason: `register-incomparable:${a.register ?? 'unknown'}/${b.register ?? 'unknown'}`,
    };
  }

  // From here it is a genuine candidate. What remains is how high it may go.
  const demotions: string[] = [];
  let ceiling: Ceiling = 'hard';
  const demote = (why: string) => {
    ceiling = 'worth_checking';
    demotions.push(why);
  };

  // §4 — only immutable properties can reach hard. Something that legitimately
  // changes (job, city, marital status) disagreeing across chapters is usually
  // the plot, not an error.
  if (a.mutability !== 'immutable' || b.mutability !== 'immutable') {
    demote('mutable-attribute');
  }

  // §5.3 — two POV characters may perceive the same thing differently; that is
  // often the point of the form.
  if (a.povCharacter && b.povCharacter && a.povCharacter !== b.povCharacter) {
    demote('cross-pov');
  }
  if (frame.multiplePov === true && (a.register === 'narration_pov' || b.register === 'narration_pov')) {
    demote('multi-pov-manuscript');
  }

  // §5.4 + ruling 1a — a stated age differing across chapters is the most
  // ordinary thing in fiction if one of them is a flashback, and the ledger
  // cannot tell. It may only reach hard when the manuscript is KNOWN linear;
  // unknown demotes, because unknown-and-demote was the ruling and a null
  // frame is not permission.
  if (a.category === 'age_date' && frame.nonLinear !== false) {
    demote(frame.nonLinear === null ? 'timeline-unknown' : 'timeline-non-linear');
  }

  // §5.1 — if the narrator is unreliable, narration is a character's claim
  // rather than the book's.
  if (frame.unreliableNarrator === true) {
    demote('unreliable-narrator');
  }

  // An extraction the extractor itself doubted cannot support a hard claim.
  if ((a.confidence ?? 0) < HARD_TIER_MIN_CONFIDENCE || (b.confidence ?? 0) < HARD_TIER_MIN_CONFIDENCE) {
    demote('low-extraction-confidence');
  }

  return { kind: 'candidate', ceiling, demotions };
}

/** Pair up every fact that makes a competing claim about the same
 *  (entity, attribute). Deterministic, no model call — §9 Stage 2. */
export function findCandidatePairs(
  facts: readonly GateFact[],
  frame: NarrativeFrame
): Array<{ a: GateFact; b: GateFact; ceiling: Ceiling; demotions: string[] }> {
  const byClaim = new Map<string, GateFact[]>();
  for (const f of facts) {
    const k = `${f.entity}|${f.attribute}`;
    byClaim.set(k, [...(byClaim.get(k) ?? []), f]);
  }

  const out: Array<{ a: GateFact; b: GateFact; ceiling: Ceiling; demotions: string[] }> = [];
  for (const group of byClaim.values()) {
    if (group.length < 2) continue; // the common case: nothing to compare
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (!a || !b) continue;
        const g = gatePair(a, b, frame);
        if (g.kind === 'candidate') {
          out.push({ a, b, ceiling: g.ceiling, demotions: g.demotions });
        }
      }
    }
  }
  return out;
}

/**
 * The passage around an evidence quote, for judging identity and context.
 *
 * Detection's second pass is asked to decide things a bare quote cannot
 * settle — most importantly whether two differently-spelled names denote the
 * same person. A careful reader answers that by reading around the line, not
 * by trusting a key. This supplies what they would read.
 *
 * Returns null when the quote cannot be located: better to give the model no
 * context than context from the wrong place, since a window anchored to the
 * wrong offset would be actively misleading rather than merely absent.
 */
export function extractContext(
  sourceText: string,
  quote: string,
  radius = 400
): string | null {
  if (!sourceText || !quote) return null;

  // Match the extractor's own normalisation so a quote that differs only in
  // whitespace or smart punctuation still anchors.
  const norm = (s: string) =>
    s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ');
  const haystack = norm(sourceText);
  const needle = norm(quote).trim();
  const at = haystack.indexOf(needle);
  if (at === -1) return null;

  const from = Math.max(0, at - radius);
  const to = Math.min(haystack.length, at + needle.length + radius);
  const prefix = from > 0 ? '…' : '';
  const suffix = to < haystack.length ? '…' : '';
  return `${prefix}${haystack.slice(from, to).trim()}${suffix}`;
}
