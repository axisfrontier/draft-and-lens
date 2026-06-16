import 'server-only';

import type { AnalysisMode } from './types';

/**
 * Brain 3 — Scorer prompts. Ported verbatim from DraftAndLens.html runDashboardScores().
 * Last reviewed: 2026-06-15 (migrated from inline HTML to server-only IP).
 */

export const SCORER_SYSTEM = 'You are a script and story editor. Return only valid JSON.';

/** Treatment-aware note: score dialogue as promise, never penalise the form (§06a). */
const TREATMENT_SCORER_NOTE =
  '\nIMPORTANT — THIS IS A TREATMENT (a prose blueprint for a film, not a screenplay or finished prose). Score it as a blueprint:\n' +
  '- Do NOT penalise it for summarising, telling, or compression — that is correct for the form.\n' +
  '- "dialogue" here means: are the implied character voices and dynamics distinct enough to promise strong dialogue in the eventual script? Score the promise, not the (absent) execution. Never score it low merely because the treatment contains little or no quoted dialogue.\n' +
  '- "structure", "pace", and "theme" are the load-bearing axes for a treatment — weight your reading there.\n' +
  '- In "beats", map the treatment\'s actual structural turns.\n';

export function buildScorerPrompt(
  mode: AnalysisMode,
  tradition: string,
  excerpt: string
): string {
  const treatmentNote = mode === 'treatment' ? TREATMENT_SCORER_NOTE : '';
  return `You are a professional script and story editor. Read the submitted work and score it on two distinct sets of dimensions. Return ONLY a valid JSON object — no other text, no markdown, no backticks.

CONFIRMED TRADITION: ${tradition}
${treatmentNote}

Return exactly this JSON structure:
{"title":"The actual title as it appears in the text. Null if not found.","scores":{"structure":7,"character":5,"dialogue":7,"tone":8,"pace":4,"theme":8},"alignment":{"register":7,"narrator":6,"form":8,"tradition_rules":7,"specificity":6,"earned":7},"beats":[{"pct":10,"intensity":4,"label":"Opening","note":"Brief note"},{"pct":30,"intensity":7,"label":"Inciting Incident","note":"Brief note"},{"pct":50,"intensity":6,"label":"Midpoint","note":"Brief note"},{"pct":75,"intensity":8,"label":"Climax Approach","note":"Brief note"},{"pct":90,"intensity":9,"label":"Resolution","note":"Brief note"}],"summary":"One sentence describing what this work is about."}

SCORES — generic craft quality (1-10): structure, character, dialogue, tone, pace, theme.

ALIGNMENT — how well each element serves the confirmed tradition specifically (1-10):
- register: does the tonal register hold within this tradition?
- narrator: does the narrator/voice earn its role by this tradition's standards?
- form: does the formal approach serve what this tradition requires?
- tradition_rules: are the specific rules of this tradition being followed?
- specificity: do elements retain the human specificity this tradition requires?
- earned: does each formal choice earn its place within the tradition's logic?

These are genuinely different measurements. Alignment scores are tradition-specific.

NARRATIVE STRUCTURE: Before scoring, identify whether this is linear, non-linear, frame narrative, reverse chronology, or multi-timeline. Factor this into your scores — a non-linear work should not be penalised on structure for using flashbacks by design.

SUBMITTED TEXT:
${excerpt}`;
}
