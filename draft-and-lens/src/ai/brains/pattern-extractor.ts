import 'server-only';

import { buildPatternExtractorSystem, buildPatternExtractorUser } from '../../prompts/patterns';
import {
  TRADITION_BOUND,
  isTendency,
  type Tendency,
  type TendencyCandidate,
} from '../../lib/writer-patterns';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain } from './_shared';

/**
 * Pattern extractor — Gap 2's structured half.
 *
 * Runs over the finished report, post-delivery, so its latency and any failure
 * are invisible to the writer. Returns at most three corpus-named tendencies
 * the READING claimed, each with the sentence it claimed them in.
 *
 * EVERY RULE THE PROMPT STATES IS ALSO CHECKED HERE. The prompt is an
 * instruction; this is the guarantee. A candidate survives only if its key is
 * in the closed vocabulary, its evidence is a real substring of the report,
 * and — for the two tradition-bound keys — the caller has confirmed the
 * tradition treats it as a failure. Anything else is dropped silently, which
 * is the right outcome: a tendency not recorded costs a pattern named later,
 * while a bad one recorded costs a false claim about a person.
 */

interface ExtractorOutput {
  tendencies?: Array<{ tendency?: unknown; evidence?: unknown }>;
}

/** Never more than this, whatever comes back. */
const MAX_CANDIDATES = 3;

/**
 * Normalised containment check for the verbatim rule.
 *
 * Whitespace is normalised on both sides — a model that re-wraps a quoted
 * sentence across lines has still quoted it — but nothing else is. Any
 * loosening beyond that (case, punctuation, partial matches) would let a
 * paraphrase through, and the paraphrase is the failure mode this exists to
 * catch.
 */
function isVerbatim(evidence: string, report: string): boolean {
  const flat = (s: string): string => s.replace(/\s+/g, ' ').trim();
  const needle = flat(evidence);
  if (needle.length < 20) return false; // too short to be a claim
  return flat(report).includes(needle);
}

export async function extractPatterns(args: {
  report: string;
  tradition: string;
  /** Tendencies the tradition treats as failures. The caller decides this. */
  traditionAllows: (tendency: Tendency) => boolean;
}): Promise<TendencyCandidate[]> {
  if (!args.report.trim()) return [];
  try {
    const raw = await callJsonBrain<ExtractorOutput>({
      model: MODELS.patternExtractor,
      maxTokens: TOKEN_LIMITS.patternExtractor,
      brain: 'patternExtractor',
      system: buildPatternExtractorSystem({ tradition: args.tradition }),
      user: buildPatternExtractorUser(args.report),
    });
    if (!raw || !Array.isArray(raw.tendencies)) return [];

    const seen = new Set<Tendency>();
    const out: TendencyCandidate[] = [];

    for (const item of raw.tendencies) {
      if (out.length >= MAX_CANDIDATES) break;
      const tendency = item?.tendency;
      const evidence = item?.evidence;
      if (!isTendency(tendency)) continue;
      if (seen.has(tendency)) continue;
      if (typeof evidence !== 'string' || !isVerbatim(evidence, args.report)) continue;
      // The tradition guard, enforced rather than instructed.
      if (TRADITION_BOUND.has(tendency) && !args.traditionAllows(tendency)) continue;
      seen.add(tendency);
      out.push({ tendency, evidence: evidence.trim() });
    }

    return out;
  } catch {
    return [];
  }
}
