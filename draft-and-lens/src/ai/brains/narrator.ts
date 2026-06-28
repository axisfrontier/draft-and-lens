import 'server-only';

import {
  NARRATOR_VERIFIER_SYSTEM,
  buildNarratorCorrectorSystem,
} from '../../prompts/narrator';
import type {
  DiagnosticResult,
  NarratorVerdicts,
  StructuralMap,
} from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain, callTextBrain } from './_shared';

/**
 * Narrator verifier (Sonnet) + corrector (Opus). The verifier classifies the
 * narrator lines Brain 1b collected; the corrector rewrites — never deletes —
 * any analyst note that wrongly faults a verified-elevation line. Both no-op
 * cleanly when there is no narrator data. Ported from runNarratorVerifier() /
 * runNarratorCorrection().
 */

export async function runNarratorVerifier(
  structuralMap: StructuralMap | null
): Promise<NarratorVerdicts | null> {
  const nb = structuralMap?.narratorBehaviour;
  if (!nb) return null;
  const allLines = [
    ...(nb.elevating ?? []),
    ...(nb.worldEstablishment ?? []),
    ...(nb.restating ?? []),
  ];
  if (!allLines.length) return null;

  const linesText = allLines
    .map((quote, i) => `${i + 1}. "${quote.substring(0, 240)}"`)
    .join('\n');

  return callJsonBrain<NarratorVerdicts>({
    model: MODELS.narratorVerifier,
    maxTokens: TOKEN_LIMITS.narratorVerifier,
    system: NARRATOR_VERIFIER_SYSTEM,
    user: 'Classify these narrator lines:\n\n' + linesText,
  });
}

export async function runNarratorCorrection(
  analysisText: string,
  diagnostic: DiagnosticResult
): Promise<string> {
  const verdicts = diagnostic.narratorVerdicts?.verdicts;
  if (!verdicts || !verdicts.length) return analysisText;
  const protectedLines = verdicts.filter(
    (v) => v.classification !== 'RESTATEMENT'
  );
  if (!protectedLines.length) return analysisText;

  const protectedList = protectedLines
    .map(
      (v) =>
        '- "' +
        v.quote.substring(0, 240) +
        '" [' +
        v.classification +
        ': ' +
        v.reason +
        ']'
    )
    .join('\n');

  try {
    const narratorModel = analysisText.length < 4000 ? MODELS.narratorVerifier : MODELS.narratorCorrector;
    const narratorTokens = analysisText.length < 4000 ? 3000 : TOKEN_LIMITS.narratorCorrector;
    const corrected = await callTextBrain({
      model: narratorModel,
      maxTokens: narratorTokens,
      system: buildNarratorCorrectorSystem(protectedList),
      // Corrector system is per-request (embeds the protected list) — not cached.
      cacheSystem: false,
      user: analysisText,
    });
    // Only accept a substantial correction (guards against truncation/empty).
    if (corrected && corrected.length > analysisText.length * 0.7) {
      return corrected;
    }
    return analysisText;
  } catch {
    return analysisText; // fail safe — original analysis survives
  }
}
