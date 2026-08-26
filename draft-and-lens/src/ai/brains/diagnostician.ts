import 'server-only';

import { buildPass1System } from '../../prompts/diagnostic';
import { LENS_IDS, type LensId } from '../../prompts/lenses/types';
import type { DiagnosticResult } from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain } from './_shared';

/**
 * Brain 1 — Diagnostician. Identifies tradition/register/ambition BEFORE any
 * craft rule (LearnedCorpus P1). Runs first; everything downstream receives the
 * tradition as locked. Ported from DraftAndLens.html runDeepRead().
 */

const FALLBACK: DiagnosticResult = {
  tradition: 'Unknown',
  register: 'Unknown',
  ambition: '',
  craftQuestions: [],
  strengths: [],
  primaryConcern: '',
  title: 'Untitled',
  summary: '',
  formNotes: '',
  bestInClassLens: null,
};

/**
 * Brain 1's lens match, or null — never the model's word for it.
 *
 * A model asked for one of thirty-five ids can return a name ("Carver"), a
 * near-miss ("chandler " with a space), an invented id, or the string "null".
 * Anything that is not exactly a member of LENS_IDS becomes null, because the
 * whole point of the null path is that a wrong standard is worse than none.
 * Nothing about a push read breaks when this is null — it is the ordinary
 * outcome.
 */
function validateLens(value: unknown): LensId | null {
  return typeof value === 'string' && (LENS_IDS as readonly string[]).includes(value)
    ? (value as LensId)
    : null;
}

export async function runDiagnostician(
  text: string,
  modeLabel: string,
  submissionType?: 'complete' | 'excerpt',
  /** Push harder — ask for the §21c lens match too. Off for ordinary reads. */
  matchLens = false
): Promise<DiagnosticResult> {
  // Opening + closing only — fast, cheap, forms the view that guides everything.
  const maxChars = 3000;
  const opening = text.slice(0, maxChars);
  const closing = text.length > maxChars * 2 ? text.slice(-maxChars) : '';
  const excerpt = closing
    ? `[OPENING OF WORK]\n${opening}\n\n[CLOSING OF WORK]\n${closing}`
    : opening;

  const result = await callJsonBrain<DiagnosticResult>({
    model: MODELS.diagnostician,
    maxTokens: TOKEN_LIMITS.diagnostician,
    brain: 'diagnostician',
    system: buildPass1System(submissionType, matchLens),
    user: `This is a ${modeLabel}. Read carefully and return the diagnostic JSON.\n\n${excerpt}`,
  });
  if (!result) return FALLBACK;
  // Validate rather than trust: the field is a closed enum downstream.
  return { ...result, bestInClassLens: matchLens ? validateLens(result.bestInClassLens) : null };
}
