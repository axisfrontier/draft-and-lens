import 'server-only';

import { LENS_SYSTEM_PROMPTS, type LensId } from '../../prompts/lenses';
import type { AnalysisMode, DiagnosticResult } from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callTextBrain } from './_shared';

/**
 * Brain 6 — Lens voices (×27). Each lens draws ONLY on its own character sheet
 * plus the confirmed tradition. The LearnedCorpus is DELIBERATELY NOT injected
 * (Architecture §17a / LearnedCorpus v2.3 SCOPE) — feeding it in would sand the
 * voices toward tradition-neutral correctness and collapse 27 voices into 27
 * identical editors. Ported from runLensAnalysis() (whose `corpus` variable was
 * dead code — built but never sent; we omit it entirely).
 */

const LENS_MODE_LABEL: Record<AnalysisMode, string> = {
  script: 'screenplay',
  story: 'short story or prose work',
  treatment: 'film or series treatment (a prose blueprint, not a finished script)',
  play: 'stage play',
};

export async function runLens(
  id: LensId,
  text: string,
  mode: AnalysisMode,
  diagnostic: DiagnosticResult | null,
  title?: string
): Promise<string> {
  const limit = 8000;
  const excerpt = text.length > limit ? text.slice(0, limit) + '\n[truncated]' : text;
  const modeLabel = LENS_MODE_LABEL[mode];

  // The lens's own character sheet (cacheable, constant) + the confirmed tradition
  // tail (per-work). getLensSystemPrompt concatenates them; we split here so the
  // large constant character sheet is the cached prefix.
  const baseSystem = LENS_SYSTEM_PROMPTS[id];
  const traditionTail = diagnostic?.tradition
    ? `\n\nCONFIRMED TRADITION: ${diagnostic.tradition}\nREGISTER: ${diagnostic.register ?? ''}\nAMBITION: ${diagnostic.ambition ?? ''}\n\nApply your specific craft intelligence to this tradition. Do not re-identify it.`
    : '';

  const user = `Read this ${modeLabel} called "${title || 'this work'}" and respond from your specific craft perspective.\n\nDo not summarise or re-identify the work. Jump straight to what YOUR specific intelligence notices. Quote the text. Be specific. Demonstrate what better looks like from your position.\n\nSUBMITTED TEXT:\n${excerpt}`;

  return callTextBrain({
    model: MODELS.lens,
    maxTokens: TOKEN_LIMITS.lens,
    system: baseSystem,
    systemDynamic: traditionTail,
    user,
  });
}
