import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

/** Confidence-gated known-work check for Brain 4 (§14). */
export const KNOWN_WORK_CHECK = "KNOWN-WORK CHECK (do this FIRST):\nIf you recognise this submission with HIGH CONFIDENCE as an already-produced film, published book, or otherwise existing work, do NOT pretend it is an undiscovered spec. Instead:\n- Set \"knownWork\" to a short factual sentence naming the work and who made/published it (e.g. \"This is the screenplay for The Lighthouse, produced by A24 (2019).\").\n- Then, for the studios list, name the OTHER companies whose sensibility this work also suits — comparable companies, NOT the one that already made it. Phrase rationales as \"would also have suited…\".\n- NEVER recommend submitting a work to the company that already produced or published it.\nIf you are NOT highly confident it is a known work, leave \"knownWork\" as an empty string and treat it as an original work in the normal way. Do not guess.";
