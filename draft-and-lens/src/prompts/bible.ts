import 'server-only';

/**
 * Brain 5 — Character bible prompts. Ported verbatim from DraftAndLens.html
 * runBibleGeneration(). Last reviewed: 2026-06-15. No fabrication — text only.
 */

export const BIBLE_SYSTEM =
  'You are a script editor building a character bible. Record only what is explicitly in the text. No fabrication.';

export function buildBiblePrompt(modeLabel: string, excerpt: string): string {
  return `Read the submitted ${modeLabel} and extract a character bible. For every named character, record:
- Name and role
- Physical description (only what is explicitly stated)
- Established personality traits and behaviour patterns
- Speech register and verbal habits
- Stated wants and apparent needs
- Key relationships
- Any backstory explicitly given
- Any contradictions or inconsistencies already present in the text

Be factual. Only record what is explicitly present in the text. Do not infer or invent. If something is ambiguous, mark it as ambiguous.

Format as plain text, one character per section, clearly separated.

SUBMITTED TEXT:
${excerpt}`;
}
