import 'server-only';

import {
  STRUCTURAL_READER_SYSTEM,
  STRUCTURAL_READER_TREATMENT_BRANCH,
} from '../../prompts/structural-reader';
import type { DiagnosticResult, StructuralMap } from '../../prompts/types';
import { MODELS, TOKEN_LIMITS } from '../config';
import { callJsonBrain } from './_shared';

/**
 * Brain 1b — Structural reader. Maps structure + collects evidence for Brain 2.
 * Does not evaluate. SKIPPED on works < 5,000 words (the orchestrator gates it).
 * On long works it samples structural waypoints — opening, ~quarter turn,
 * midpoint, ~three-quarter turn, ending — not the trimmed head+tail, so the
 * midpoint it exists to map is never dropped. Ported from runStructuralReader().
 */

function sampleForStructure(text: string): string {
  const maxChars = 12000;
  if (text.length <= maxChars) return text;
  const n = text.length;
  const slice = (centreFrac: number, size: number): string => {
    const start = Math.max(0, Math.round(n * centreFrac - size / 2));
    return text.slice(start, start + size);
  };
  return (
    text.slice(0, 3500) +
    '\n\n[...]\n\n' +
    slice(0.25, 1800) +
    '\n\n[...]\n\n' +
    slice(0.5, 2200) + // midpoint — the previously-lost region
    '\n\n[...]\n\n' +
    slice(0.75, 1800) +
    '\n\n[...]\n\n' +
    text.slice(-2700)
  );
}

export async function runStructuralReader(
  text: string,
  modeLabel: string,
  diagnostic: DiagnosticResult
): Promise<StructuralMap | null> {
  const excerpt = sampleForStructure(text);
  const traditionLine = diagnostic
    ? `Tradition is confirmed — do not re-identify it.\nCONFIRMED TRADITION: ${diagnostic.tradition}\nREGISTER: ${diagnostic.register}\nAMBITION: ${diagnostic.ambition}\n\n`
    : '';
  const treatmentLine = /treatment/i.test(modeLabel)
    ? STRUCTURAL_READER_TREATMENT_BRANCH
    : '';

  return callJsonBrain<StructuralMap>({
    model: MODELS.structuralReader,
    maxTokens: TOKEN_LIMITS.structuralReader,
    brain: 'structuralReader',
    system: STRUCTURAL_READER_SYSTEM,
    user: `${traditionLine}${treatmentLine}This is a ${modeLabel}. Map it and return the JSON.\n\n${excerpt}`,
  });
}
