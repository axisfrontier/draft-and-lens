import 'server-only';

import { CONTINUITY_EXTRACTOR_SYSTEM, buildContinuityPrompt } from '../../prompts/continuity';
import { MODELS, TOKEN_LIMITS } from '../config';

import { callJsonBrain } from './_shared';

/**
 * Continuity extractor — §9 Stage 1.
 *
 * Runs concurrently with the main pipeline and its result is stored, never
 * streamed, so it costs its own latency only and can never delay a reading.
 *
 * The validation below is not defensive tidying — it is where §1.1's
 * precision-over-recall stops being a prompt instruction and becomes something
 * the code guarantees. A model asked for verbatim quotes will occasionally
 * paraphrase one; if that reached the database it would become a fact the
 * writer is later told their book contradicts, sourced to words they never
 * wrote. So every fact is checked against the submitted text and dropped if it
 * does not survive. Dropping is always the right failure: the ledger knowing
 * less is harmless, the ledger being wrong is not.
 */

export type Mutability = 'immutable' | 'slow';
export type Register =
  | 'narration_omniscient'
  | 'narration_pov'
  | 'interiority'
  | 'dialogue'
  | 'document';

export interface ExtractedFact {
  entity: string;
  category: string;
  attribute: string;
  value: string;
  mutability: Mutability;
  register: Register | null;
  povCharacter: string | null;
  evidenceQuote: string;
  confidence: number;
}

/** Must match the CHECK constraints in supabase/migrations/continuity_ledger.sql.
 *  A value the database would reject has to be caught here, or a whole batch
 *  insert fails and the chapter silently contributes nothing. */
const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'name',
  'physical',
  'age_date',
  'relationship',
]);
const VALID_MUTABILITY: ReadonlySet<string> = new Set(['immutable', 'slow']);
const VALID_REGISTERS: ReadonlySet<string> = new Set([
  'narration_omniscient',
  'narration_pov',
  'interiority',
  'dialogue',
  'document',
]);

/** Below this the fact is not worth storing at all. Deliberately low: the point
 *  is to drop noise, not to demand certainty — a genuinely uncertain fact is
 *  still useful when it is only ever surfaced as "worth checking". */
const MIN_CONFIDENCE = 0.3;

/** Normalise whitespace so a quote that differs only in line wrapping still
 *  matches. Anything beyond this — punctuation, wording — must match exactly,
 *  because "close enough" is how a paraphrase gets in. */
function normaliseForMatch(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
}

export interface ValidationResult {
  facts: ExtractedFact[];
  /** Why each rejected fact was rejected — surfaced in logs so a bad extractor
   *  shows up as a pattern rather than as an unexplained empty ledger. */
  rejected: Array<{ reason: string; entity?: string }>;
}

export function validateFacts(raw: unknown, sourceText: string): ValidationResult {
  const out: ExtractedFact[] = [];
  const rejected: Array<{ reason: string; entity?: string }> = [];

  const list = (raw as { facts?: unknown })?.facts;
  if (!Array.isArray(list)) return { facts: [], rejected: [{ reason: 'no-facts-array' }] };

  const haystack = normaliseForMatch(sourceText);

  for (const item of list) {
    // A malformed array can contain nulls and primitives; reading a property
    // off those throws and would lose the whole batch, including its good
    // facts. Caught by test rather than by review.
    if (typeof item !== 'object' || item === null) {
      rejected.push({ reason: 'not-an-object' });
      continue;
    }
    const f = item as Partial<ExtractedFact>;
    const entity = typeof f.entity === 'string' ? f.entity.trim().toLowerCase() : '';
    const attribute = typeof f.attribute === 'string' ? f.attribute.trim().toLowerCase() : '';
    const value = typeof f.value === 'string' ? f.value.trim() : '';
    const quote = typeof f.evidenceQuote === 'string' ? f.evidenceQuote.trim() : '';

    if (!entity || !attribute || !value) {
      rejected.push({ reason: 'missing-required-field', entity: entity || undefined });
      continue;
    }
    if (!f.category || !VALID_CATEGORIES.has(f.category)) {
      rejected.push({ reason: `bad-category:${String(f.category)}`, entity });
      continue;
    }
    // Volatile is excluded by the prompt; if one arrives anyway it is dropped
    // rather than coerced, because a mood recorded as a fact is exactly the
    // noise §4 exists to keep out.
    if (!f.mutability || !VALID_MUTABILITY.has(f.mutability)) {
      rejected.push({ reason: `bad-mutability:${String(f.mutability)}`, entity });
      continue;
    }
    if (f.register != null && !VALID_REGISTERS.has(f.register)) {
      rejected.push({ reason: `bad-register:${String(f.register)}`, entity });
      continue;
    }
    if (!quote) {
      rejected.push({ reason: 'no-quote', entity });
      continue;
    }
    // THE load-bearing check (§3): the quote must actually be in the text.
    if (!haystack.includes(normaliseForMatch(quote))) {
      rejected.push({ reason: 'quote-not-found-in-text', entity });
      continue;
    }

    const confidence =
      typeof f.confidence === 'number' && f.confidence >= 0 && f.confidence <= 1
        ? f.confidence
        : 0.5;
    if (confidence < MIN_CONFIDENCE) {
      rejected.push({ reason: 'below-confidence-floor', entity });
      continue;
    }

    out.push({
      entity,
      category: f.category,
      attribute,
      value,
      mutability: f.mutability,
      register: (f.register as Register) ?? null,
      povCharacter: typeof f.povCharacter === 'string' ? f.povCharacter.trim().toLowerCase() : null,
      evidenceQuote: quote,
      confidence,
    });
  }

  return { facts: out, rejected };
}

export async function runContinuityExtractor(args: {
  text: string;
  chapterLabel: string;
  knownEntities: readonly string[];
}): Promise<ValidationResult> {
  const raw = await callJsonBrain<unknown>({
    model: MODELS.continuityExtractor,
    maxTokens: TOKEN_LIMITS.continuityExtractor,
    brain: 'continuityExtractor',
    system: CONTINUITY_EXTRACTOR_SYSTEM,
    user: buildContinuityPrompt(args),
  });
  if (raw === null) return { facts: [], rejected: [{ reason: 'brain-returned-nothing' }] };
  return validateFacts(raw, args.text);
}
