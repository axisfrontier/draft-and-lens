import 'server-only';

import {
  listAdjudicatedPairs,
  storeFlags,
  pairKey,
  type FlagToStore,
} from '../lib/continuity-flags';
import { listLedger } from '../lib/continuity';
import {
  findCandidatePairs,
  extractContext,
  type GateFact,
  type NarrativeFrame,
} from '../lib/detection-gates';
import { getSourceTexts } from '../lib/readings';
import type { DiagnosticResult } from '../prompts/types';

import { runDetection } from './brains/detection';

/**
 * Detection pass — §9 Stage 3 orchestration.
 *
 * Sits between the deterministic gates (which decide what is worth asking) and
 * the two-pass brain (which answers one question about one pair). Its job is
 * everything neither of those does: assemble the manuscript's facts, skip what
 * has already been judged, supply each pair with the passages it came from,
 * and write the results down.
 *
 * WHERE THIS RUNS. After the reading has been streamed to the writer, inside
 * the same post-delivery block as extraction. Nothing here can delay or fail a
 * reading; a detection pass that dies contributes no flags and that is all.
 */

/**
 * Most pairs a single submission will adjudicate.
 *
 * Each pair costs up to two model calls, and pair count is combinatorial in
 * facts-per-claim — one entity whose eye colour is described in nine chapters
 * produces thirty-six pairs on its own. The cap bounds the worst case per
 * submission; the already-adjudicated set means the remainder are not lost,
 * they are simply picked up by the next submission instead.
 *
 * Anything skipped is reported in the return value rather than dropped
 * quietly, so a truncated pass is visible as truncation and not mistaken for
 * a clean one.
 */
const MAX_PAIRS_PER_RUN = 12;

/** How much text either side of an evidence quote pass 2 is given. */
const CONTEXT_RADIUS = 300;

export interface DetectionPassResult {
  candidates: number;
  adjudicated: number;
  skippedAlreadyJudged: number;
  skippedOverCap: number;
  stored: number;
}

/**
 * What the manuscript is KNOWN to be doing, read off the structural map.
 *
 * NULL means unknown and never "linear" — ruling 1a is unknown-and-demote, and
 * a missing structural map is not permission to assume a chronological book.
 * Only `narrativeStructure` is a real signal here; nothing in the pipeline
 * currently establishes narrator reliability or POV count as a fact, so those
 * stay null rather than being inferred from something that does not mean them.
 */
export function deriveFrame(diagnostic: DiagnosticResult | undefined): NarrativeFrame {
  const structure = diagnostic?.structuralMap?.narrativeStructure?.toLowerCase().trim();
  let nonLinear: boolean | null = null;
  if (structure) {
    // Order matters: "non-linear" contains "linear".
    if (/non-linear|nonlinear|reverse chronology|multi-timeline|frame narrative/.test(structure)) {
      nonLinear = true;
    } else if (/\blinear\b/.test(structure)) {
      nonLinear = false;
    }
  }
  return { nonLinear, unreliableNarrator: null, multiplePov: null };
}

/**
 * Is this a multi-POV manuscript? Read off the ledger's own facts.
 *
 * Two or more distinct POV characters across a manuscript is direct evidence
 * of the §5.3 condition, and it needs no model call and no stored state — the
 * facts are already loaded to be paired. `gatePair` consumes `multiplePov ===
 * true` to demote a cross-POV clash, so this activates a gate that has been
 * inert since it was written rather than adding a new one.
 *
 * Returns null rather than false below the threshold, and the distinction is
 * real even though gatePair only tests for `true`: one POV character, or none
 * recorded, is not evidence of a single-POV book — it is equally the shape of
 * a manuscript one chapter long, or one whose extractor could not attribute
 * POV. Saying "unknown" keeps this honest against a later reader that does
 * treat `false` as meaningful, which is the trap the narrative_frame column
 * header warns about.
 *
 * Names are compared case- and whitespace-insensitively so `Sarah` and `sarah`
 * from two chapters are one POV character, not two — that alone would
 * manufacture a multi-POV verdict for a single-POV book.
 */
export function deriveMultiplePov(
  facts: readonly { povCharacter: string | null }[]
): boolean | null {
  const povs = new Set(
    facts
      .map((f) => f.povCharacter?.trim().toLowerCase())
      .filter((p): p is string => Boolean(p))
  );
  return povs.size >= 2 ? true : null;
}

function toGateFact(f: {
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
}): GateFact {
  return {
    factId: f.factId,
    entity: f.entity,
    attribute: f.attribute,
    value: f.value,
    category: f.category,
    mutability: f.mutability,
    register: f.register,
    povCharacter: f.povCharacter,
    confidence: f.confidence,
    sequenceIndex: f.sequenceIndex,
    reconciledAt: f.reconciledAt,
  };
}

export async function runDetectionPass(args: {
  userId: string;
  manuscriptId: string;
  /** The submission that triggered this pass — flags are attributed to it. */
  readingId: string | null;
  diagnostic?: DiagnosticResult;
  /** Text of the submission just read, so its own facts need no round trip. */
  currentText?: string;
}): Promise<DetectionPassResult> {
  const empty: DetectionPassResult = {
    candidates: 0,
    adjudicated: 0,
    skippedAlreadyJudged: 0,
    skippedOverCap: 0,
    stored: 0,
  };

  const ledger = await listLedger(args.userId, args.manuscriptId);
  const facts = ledger.flatMap((e) => e.facts);
  if (facts.length < 2) return empty;

  const quoteByFact = new Map(facts.map((f) => [f.factId, f.evidenceQuote]));
  const readingByFact = new Map(facts.map((f) => [f.factId, f.readingId]));

  // Structural evidence comes from this submission; POV evidence comes from
  // the whole manuscript's accumulated facts, which is the stronger source —
  // a book is multi-POV because of what it contains overall, not because of
  // the chapter that happens to be in front of us.
  const frame: NarrativeFrame = {
    ...deriveFrame(args.diagnostic),
    multiplePov: deriveMultiplePov(facts),
  };
  const candidates = findCandidatePairs(facts.map(toGateFact), frame);
  if (candidates.length === 0) return empty;

  // Already-judged pairs are dropped before the cap is applied, so a
  // manuscript with a long settled history does not spend its whole per-run
  // budget re-reaching the same conclusions.
  const judged = await listAdjudicatedPairs(args.userId, args.manuscriptId);
  const fresh = candidates.filter((c) => !judged.has(pairKey(c.a.factId, c.b.factId)));
  const skippedAlreadyJudged = candidates.length - fresh.length;

  const toRun = fresh.slice(0, MAX_PAIRS_PER_RUN);
  const skippedOverCap = fresh.length - toRun.length;

  // One batched read for every passage this run needs. Facts from the current
  // submission are served from the text already in hand; the rest come from
  // stored source text, and any reading that has since been pruned simply
  // yields no context.
  const neededReadings = [...new Set(
    toRun
      .flatMap((c) => [readingByFact.get(c.a.factId), readingByFact.get(c.b.factId)])
      .filter((id): id is string => Boolean(id) && id !== args.readingId)
  )];
  const sourceTexts = await getSourceTexts(args.userId, neededReadings);

  const contextFor = (factId: string): string | null => {
    const quote = quoteByFact.get(factId);
    if (!quote) return null;
    const rid = readingByFact.get(factId);
    const text = rid && rid === args.readingId ? args.currentText : rid ? sourceTexts.get(rid) : undefined;
    return text ? extractContext(text, quote, CONTEXT_RADIUS) : null;
  };

  const results: FlagToStore[] = [];
  for (const c of toRun) {
    const aQuote = quoteByFact.get(c.a.factId);
    const bQuote = quoteByFact.get(c.b.factId);
    // Every extracted fact carries a verbatim quote by database constraint, so
    // a missing one means a writer-authored lock. Those are the writer's own
    // assertion rather than a reading of the text, and pass 2 has nothing to
    // read around them.
    if (!aQuote || !bQuote) continue;

    const r = await runDetection({
      a: c.a,
      b: c.b,
      aQuote,
      bQuote,
      ceiling: c.ceiling,
      demotions: c.demotions,
      frame,
      aContext: contextFor(c.a.factId),
      bContext: contextFor(c.b.factId),
    }).catch(() => null);
    if (!r) continue;

    results.push({
      factAId: c.a.factId,
      factBId: c.b.factId,
      entity: c.a.entity,
      attribute: c.a.attribute,
      outcome: r.outcome,
      reasoning: r.reasoning ?? null,
      explanation: r.explanation ?? null,
      confidence: r.confidence ?? null,
      ceiling: c.ceiling,
      demotions: c.demotions,
      shortCircuited: Boolean(r.shortCircuited),
    });
  }

  const stored = await storeFlags({
    userId: args.userId,
    manuscriptId: args.manuscriptId,
    readingId: args.readingId,
    flags: results,
  });

  return {
    candidates: candidates.length,
    adjudicated: results.length,
    skippedAlreadyJudged,
    skippedOverCap,
    stored,
  };
}
