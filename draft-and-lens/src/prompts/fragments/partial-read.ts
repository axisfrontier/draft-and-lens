import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

/** Rules appended when tier truncation applies (§13). */
export const PARTIAL_READ_RULES = [
  "- Open by telling the writer, in your own register, that this reading covers the opening portion only.",
  "- Evaluate fully and confidently ONLY what is present: opening, voice, register, inciting incident, how stakes and world are established.",
  "- For anything that depends on the whole — overall arc, midpoint, third act, ending, whether setups pay off, whether momentum is sustained — DO NOT CONCLUDE. You have not read it. Instead, name what the opening PROMISES or SETS UP, and frame the unseen as an open question.",
  "- NEVER invent a third-act problem. NEVER say the work \"loses momentum\", \"fails to resolve\", or \"the ending doesn't earn it\" if that material was not in the text you received.",
  "- Be confident about the opening; be explicitly provisional about the whole. This honesty is a feature, not a hedge."
] as const;

/** Build the partial-read directive exactly as the prototype concatenates it. */
export function buildPartialReadDirective(wordsRead: number, wordsTotal?: number): string {
  const pct =
    wordsTotal && wordsTotal > 0
      ? ` (approximately ${Math.round((wordsRead / wordsTotal) * 100)}% of the ~${wordsTotal.toLocaleString()}-word submission)`
      : '';
  const header =
    'PARTIAL READ — CRITICAL HONESTY CONSTRAINT:\n' +
    'You have received only the FIRST ' +
    wordsRead.toLocaleString() +
    ' words of a longer work' +
    pct +
    '. This is the OPENING ONLY.\n' +
    'RULES:\n';
  // Entries already begin with "- "; join as-is (do not re-prefix the dash).
  return header + PARTIAL_READ_RULES.join('\n') + '\n\n';
}
