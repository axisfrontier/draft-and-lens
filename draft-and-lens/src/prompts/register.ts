import 'server-only';

/**
 * Standing register rule (Corpus Principle 27). Previously lived as one
 * clause ("CRAFT TERM LEGIBILITY") buried among ~20 other MANDATORY rules
 * inside the diagnostic block in analyst.ts, and was honoured inconsistently
 * as a result — a salience problem, not a wording problem. Extracted here so
 * it competes for attention against nothing, and wired into
 * buildSystemPrompt() (the cached, mode/genre-constant prefix) rather than
 * the per-work dynamic block, since it never varies by submission.
 */
export const REGISTER = `REGISTER — MANDATORY. Every technical craft term (aphorism, floating abstraction, free indirect discourse, register, modernist-minimalist tradition, and their like) must be glossed in plain language in the same sentence or clause it appears — never assume the term is already understood, never define it once and reuse it bare later. Pattern: precise term, one clause of plain explanation, move on. A writer should never need to look up a word to understand a note.`;
