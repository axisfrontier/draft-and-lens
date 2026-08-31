import 'server-only';

import { buildPass1System } from '../../prompts/diagnostic';
import { LENS_IDS, type LensId } from '../../prompts/lenses/types';
import type { DiagnosticResult } from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { excerptForReading } from '../read-window';
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

/**
 * How much of a submission Brain 1 reads, in characters.
 *
 * WHY THIS MOVED (2026-08-31). It was 3,000, and the two-slice branch fired
 * only above 6,000 — so every submission between 3,000 and 6,000 characters
 * was cut at character 3,000 and handed over with no label at all. Brain 1
 * could not tell a truncated piece from one that simply ended there, and on a
 * 5,495-character story it did the predictable thing: it reported the cut as a
 * defect and gave the writer a numbered instruction to repair a sentence that
 * is whole in their own draft. 3,000–6,000 characters is roughly 500–1,000
 * words, which is where most short fiction sits, so this was live on ordinary
 * readings, not an edge case.
 *
 * 12,000 covers that band whole with room to spare (~2,100 words) and still
 * leaves the two-slice path reachable — the submission cap is 4,000 words,
 * around 23,000 characters — so nothing here becomes unreachable code. It is
 * the same budget the structural reader gets, and deliberately NOT a shared
 * constant: that brain samples five waypoints for its own reasons, and the two
 * numbers should stay free to move apart.
 */
const READ_WINDOW_CHARS = 12000;

/**
 * The submission as Brain 1 should see it — whole when it fits, two labelled
 * extracts when it does not. The shape, and why it is shaped that way, lives in
 * `excerptForReading`; this is Brain 1's window applied to it.
 *
 * Exported for the tests, which are the only thing that can see this: the
 * truncation is deterministic but whether a model remarks on it is not, so the
 * symptom comes and goes while the blindness stays constant.
 */
export function buildDiagnosticExcerpt(text: string): string {
  return excerptForReading(text, READ_WINDOW_CHARS);
}

export async function runDiagnostician(
  text: string,
  modeLabel: string,
  submissionType?: 'complete' | 'excerpt',
  /** Push harder — ask for the §21c lens match too. Off for ordinary reads. */
  matchLens = false
): Promise<DiagnosticResult> {
  const excerpt = buildDiagnosticExcerpt(text);

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
