import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

/**
 * Prototype routes play mode to buildScriptReportStructure (buildUserPrompt).
 * Re-export avoids duplicating identical structure text.
 */
export { buildScriptReportStructure as buildPlayReportStructure } from './script-structure';
