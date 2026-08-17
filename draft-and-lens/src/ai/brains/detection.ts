import 'server-only';

import {
  DETECTION_ADJUDICATE_SYSTEM,
  DETECTION_VERIFY_SYSTEM,
  buildAdjudicatePrompt,
  buildVerifyPrompt,
} from '../../prompts/detection';
import type { Ceiling, GateFact } from '../../lib/detection-gates';
import { MODELS, TOKEN_LIMITS } from '../config';

import { callJsonBrain } from './_shared';

/**
 * Detection — §9 Stage 3, two-pass adjudication (ruling 2b).
 *
 * SCOPE: mechanical facts only. The boundary lives in
 * src/lib/detection-gates.ts and this file does not widen it.
 *
 * MODEL TIER (ruling 2d): the ANALYST's tier, not the extractor's. Extraction
 * is mechanical — pull a stated fact out of text, with a hard verbatim-quote
 * check behind it, so a weaker model fails by finding fewer facts rather than
 * worse ones. Detection is comparative judgement: deciding whether two claims
 * can both be true is closer to what Brain 2 does than to what the extractor
 * does, and its failure mode is far worse. A weak craft note is a stylistic
 * opinion the writer can shrug off; a false contradiction is a factual claim
 * about their own book, delivered with confidence, and being wrong about a
 * fact is the one thing that makes a writer stop trusting the tool entirely.
 *
 * THE THREE OUTCOMES (ruling 2c). Nothing is dropped for being difficult:
 *   contradiction  — survived both passes; shown with both quotes
 *   worth_checking — genuine ambiguity; shown WITH the reasoning both ways
 *   dismissed      — an innocent explanation was found; a true negative,
 *                    recorded with its reason so it is auditable
 */

export type DetectionOutcome = 'contradiction' | 'worth_checking' | 'dismissed';

export interface DetectionResult {
  outcome: DetectionOutcome;
  /** Shown to the writer. On worth_checking this states both sides. */
  reasoning: string;
  /** Which innocent explanation applied, when one did. */
  explanation: string | null;
  confidence: number;
  /** Per-pass wall clock, so the cost of the second pass is measured rather
   *  than estimated — the question is whether it earns its tokens. */
  timings: { adjudicateMs: number; verifyMs: number | null };
  /** True when the second pass never ran because the first already said no. */
  shortCircuited: boolean;
}

interface AdjudicateVerdict {
  verdict?: string;
  reasoning?: string;
  confidence?: number;
}
interface VerifyVerdict {
  verdict?: string;
  explanation?: string;
  confidence?: number;
}

/** Gate demotion codes rendered as plain statements of what is unknown, for
 *  the prompt. Only uncertainty-shaped demotions appear here: `cross-pov` and
 *  `mutable-attribute` are facts about the pair rather than gaps in knowledge,
 *  and are already handled by the ceiling. */
const GATE_UNKNOWNS: Record<string, string> = {
  'timeline-unknown':
    'whether the chapters run in chronological order, or how much story time passes between them',
  'timeline-non-linear':
    'where these chapters sit in time — the manuscript is known to move around chronologically',
  'unreliable-narrator': 'whether this narrator can be taken at their word',
  'low-extraction-confidence': 'whether both statements were read out of the text accurately',
};

const clamp = (n: unknown): number =>
  typeof n === 'number' && n >= 0 && n <= 1 ? n : 0.5;

function sideOf(f: GateFact, quote: string) {
  return { value: f.value, quote, chapter: f.sequenceIndex, register: f.register };
}

/**
 * Adjudicate one candidate pair.
 *
 * Pass 1 asks whether the claims are incompatible. Pass 2 runs ONLY if pass 1
 * said yes, and is given the opposite job — find the innocent explanation. A
 * candidate survives only if something actively looking for a reason it is
 * fine cannot find one.
 *
 * Pass 2 is skipped when pass 1 says "not a contradiction" because there is
 * nothing left to excuse; spending a second call to confirm a negative would
 * double the cost of the common case for no information.
 */
export async function runDetection(args: {
  a: GateFact;
  b: GateFact;
  aQuote: string;
  bQuote: string;
  /** The highest tier the deterministic gates allow this pair to reach. */
  ceiling: Ceiling;
  /** Why the gates demoted it, if they did — passed to pass 1 so it does not
   *  silently assume away the very uncertainty that caused the demotion. */
  demotions?: readonly string[];
  /** What the manuscript is KNOWN to be doing. Passed to pass 2 so it does not
   *  offer an explanation the data has already eliminated. */
  frame?: { nonLinear: boolean | null; unreliableNarrator: boolean | null };
  /** Passage around each quote, from extractContext. Pass 2 needs these to
   *  judge identity when names differ — the ruling is to read and judge, not
   *  to trust or doubt the upstream match. */
  aContext?: string | null;
  bContext?: string | null;
}): Promise<DetectionResult> {
  const { a, b, ceiling } = args;
  const unknowns = (args.demotions ?? []).map((d) => GATE_UNKNOWNS[d]).filter((x): x is string => !!x);
  // Information symmetry: pass 1 is told what is unknown, pass 2 is told what
  // is settled. Pass 2's job is to find innocent explanations, so handing it a
  // list of explanations the data has already eliminated is the difference
  // between an honest "no explanation applies" and a reflexive hedge.
  const ruledOut: string[] = [];
  if (args.frame?.nonLinear === false) {
    ruledOut.push(
      'a flashback, memory, dream or time-skip — this manuscript is known to run in chronological order'
    );
  }
  if (args.frame?.unreliableNarrator === false) {
    ruledOut.push('an unreliable narrator — this manuscript\'s narration is known to be reliable');
  }
  const shared = {
    entity: a.entity,
    attribute: a.attribute,
    a: sideOf(a, args.aQuote),
    b: sideOf(b, args.bQuote),
  };

  // ── Pass 1 — is this incompatible at all? ────────────────────────────────
  const t0 = Date.now();
  const first = await callJsonBrain<AdjudicateVerdict>({
    model: MODELS.detection,
    maxTokens: TOKEN_LIMITS.detection,
    brain: 'detectionAdjudicate',
    system: DETECTION_ADJUDICATE_SYSTEM,
    user: buildAdjudicatePrompt({ ...shared, unknowns }),
  });
  const adjudicateMs = Date.now() - t0;

  // A gate-flagged uncertainty may NOT be resolved by pass 1 alone.
  //
  // When the gates demoted a pair because something is unknown (an unknown
  // timeline, most often), a confident dismissal from pass 1 is not an answer
  // — it is the model resolving the uncertainty by assumption, which is
  // exactly what the demotion recorded as unresolvable. Ruling 2c is explicit
  // that genuine ambiguity surfaces as worth_checking and never as silence,
  // so these land there with both readings stated.
  if (first && first.verdict !== 'contradiction' && unknowns.length > 0) {
    return {
      outcome: 'worth_checking',
      reasoning:
        `${first.reasoning ?? 'These two statements differ.'} That reading depends on something the manuscript has not established (${unknowns.join('; ')}), so it is raised as a question rather than settled either way.`,
      explanation: null,
      confidence: 0.4,
      timings: { adjudicateMs, verifyMs: null },
      shortCircuited: true,
    };
  }

  // A failed call is not a contradiction. Silence on error is correct here:
  // inventing a flag because a request failed is the worst available outcome.
  if (!first || first.verdict !== 'contradiction') {
    return {
      outcome: 'dismissed',
      reasoning: first?.reasoning ?? 'No incompatibility found between these two statements.',
      explanation: first ? null : 'adjudication-unavailable',
      confidence: clamp(first?.confidence),
      timings: { adjudicateMs, verifyMs: null },
      shortCircuited: true,
    };
  }

  // ── Pass 2 — is there an innocent explanation? ───────────────────────────
  const t1 = Date.now();
  const second = await callJsonBrain<VerifyVerdict>({
    model: MODELS.detection,
    maxTokens: TOKEN_LIMITS.detection,
    brain: 'detectionVerify',
    system: DETECTION_VERIFY_SYSTEM,
    user: buildVerifyPrompt({
      ...shared,
      adjudication: first.reasoning ?? '',
      ruledOut,
      aContext: args.aContext ?? null,
      bContext: args.bContext ?? null,
    }),
  });
  const verifyMs = Date.now() - t1;
  const timings = { adjudicateMs, verifyMs };

  // If verification could not run, the candidate does NOT get promoted on the
  // strength of one pass — it degrades to worth_checking. A pair that has been
  // through one confident call and no scrutiny is exactly what two-pass exists
  // to stop being shown as certain.
  if (!second) {
    return {
      outcome: 'worth_checking',
      reasoning:
        `${first.reasoning ?? 'These two statements appear to disagree.'} This has not been double-checked, so treat it as a question rather than a finding.`,
      explanation: 'verification-unavailable',
      confidence: Math.min(clamp(first.confidence), 0.5),
      timings,
      shortCircuited: false,
    };
  }

  if (second.verdict === 'dismissed') {
    return {
      outcome: 'dismissed',
      reasoning: first.reasoning ?? '',
      explanation: second.explanation ?? 'An ordinary explanation accounts for the difference.',
      confidence: clamp(second.confidence),
      timings,
      shortCircuited: false,
    };
  }

  if (second.verdict === 'uncertain') {
    return {
      outcome: 'worth_checking',
      reasoning: second.explanation ?? first.reasoning ?? '',
      explanation: null,
      confidence: clamp(second.confidence),
      timings,
      shortCircuited: false,
    };
  }

  // Confirmed by both passes — but the deterministic gates still cap it. A
  // pair the gates demoted (unknown timeline, cross-POV, mutable attribute)
  // cannot be promoted to a hard finding by model agreement, because the
  // reason for the demotion is something neither pass can see.
  return {
    outcome: ceiling === 'hard' ? 'contradiction' : 'worth_checking',
    reasoning: first.reasoning ?? '',
    explanation: second.explanation ?? null,
    confidence: clamp(second.confidence),
    timings,
    shortCircuited: false,
  };
}
