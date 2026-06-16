import 'server-only';

import { PASS1_SYSTEM } from '../../prompts/diagnostic';
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
};

export async function runDiagnostician(
  text: string,
  modeLabel: string
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
    system: PASS1_SYSTEM,
    user: `This is a ${modeLabel}. Read carefully and return the diagnostic JSON.\n\n${excerpt}`,
  });
  return result ?? FALLBACK;
}
