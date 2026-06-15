import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

/** Narrator verifier — Sonnet, pure JSON classification. */
export const NARRATOR_VERIFIER_SYSTEM = "You are classifying narrator behaviour in a piece of writing. For each line, classify it as exactly one of:\n- ELEVATION: narrator adds something the image/scene cannot show alone (temporal weight, moral dimension, interiority, a feeling with no visual equivalent). This is CORRECT use of narrator.\n- WORLD_ESTABLISHMENT: atmospheric description creating the world and tonal register. Never a failure.\n- RESTATEMENT: narrator names or explains what the image/scene has already shown completely. This is the only failure.\n\nTHE TEST: Could the reader reach this understanding from the image/scene alone, without the narrator? If yes — RESTATEMENT. If no — ELEVATION or WORLD_ESTABLISHMENT.\n\nReturn ONLY valid JSON: { \"verdicts\": [{ \"quote\": \"...\", \"classification\": \"ELEVATION|WORLD_ESTABLISHMENT|RESTATEMENT\", \"reason\": \"one sentence\" }] }";

/**
 * Narrator corrector — Opus. Template uses ${protectedList} placeholder.
 * Rewrites (never deletes) notes that wrongly flag verified elevation lines.
 */
export const NARRATOR_CORRECTOR_TEMPLATE = "You are a precise editorial corrector. You will receive a finished editorial analysis and a list of narrator lines that have been INDEPENDENTLY VERIFIED as correct narrator usage (ELEVATION = adds what the image cannot carry; WORLD_ESTABLISHMENT = atmosphere/register).\n\nYour ONLY task: find any place in the analysis where these specific verified lines are criticised as failures, restatement, over-writing, \"telling not showing\", \"the image should carry it\", or similar. REWRITE only those sentences so they are consistent with the verdict — either acknowledging the line works, or redirecting the note to genuine specificity concerns. \n\nCRITICAL RULES:\n- Do NOT delete sentences. Rewrite them so the paragraph stays coherent.\n- Do NOT touch any part of the analysis that does not concern these verified lines.\n- Do NOT add new notes. Do NOT change the voice or style.\n- If the analysis does not criticise any verified line, return it COMPLETELY UNCHANGED.\n- Preserve all formatting, headers, and structure exactly.\n- Preserve any ⟦ ⟧ brackets around quoted text exactly as they appear — they anchor notes to the manuscript. Keep them around the same quoted phrases; never remove or relocate them.\n\nReturn ONLY the corrected analysis. No preamble, no explanation, no markdown fences.\n\nVERIFIED CORRECT NARRATOR LINES (must not be criticised as failures):\n${protectedList}";

export function buildNarratorCorrectorSystem(protectedList: string): string {
  return NARRATOR_CORRECTOR_TEMPLATE.replace('${protectedList}', protectedList);
}
