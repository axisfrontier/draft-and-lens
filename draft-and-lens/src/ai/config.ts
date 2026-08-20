import 'server-only';

/**
 * Model assignments — verbatim from DraftAndLens.html fetch calls (Architecture §03).
 * Last reviewed: 2026-06-07
 */
export const MODELS = {
  moderation: 'claude-sonnet-4-6',
  diagnostician: 'claude-sonnet-4-6',
  structuralReader: 'claude-sonnet-4-6',
  narratorVerifier: 'claude-sonnet-4-6',
  narratorCorrector: 'claude-opus-4-8',
  analyst: 'claude-opus-4-8',
  scorer: 'claude-sonnet-4-6',
  market: 'claude-sonnet-4-6',
  bible: 'claude-sonnet-4-6',
  lens: 'claude-sonnet-4-6',
  conversation: 'claude-sonnet-4-6',
  // Extraction is structured, mechanical work with a hard verbatim-quote
  // check behind it, so the cheap tier is the right fit: a weaker extractor
  // fails by returning fewer facts, not worse ones.
  continuityExtractor: 'claude-sonnet-4-6',
  // Detection runs at the ANALYST's tier, not the extractor's (ruling 2d).
  // Extraction is mechanical with a hard verbatim-quote check behind it, so a
  // weaker model fails by finding fewer facts. Detection is comparative
  // judgement, and its failure mode is far worse: a weak craft note is an
  // opinion the writer can shrug off, but a false contradiction is a factual
  // claim about their own book delivered with confidence.
  detection: 'claude-opus-4-8',
} as const;

/** Analyst adaptive thinking effort — tunable (prototype default: medium). */
export const ANALYST_EFFORT = (process.env.DL_ANALYST_EFFORT ?? 'medium') as 'low' | 'medium' | 'high';

/**
 * Pick the right model + token ceiling based on word count.
 * Short pieces don't need Opus — Sonnet is fast and capable enough.
 * Opus earns its place only on longer, more complex work.
 *
 * Output length is fixed by the report structure (13-15 numbered sections
 * plus a verdict, regardless of submission length) — a 200-word piece and
 * a 10,000-word script both owe the same full analysis. So only the model
 * and thinking effort scale with word count; the token ceiling itself must
 * stay generous at every tier, or short submissions truncate mid-report.
 */
export function adaptiveAnalystConfig(wordCount: number): {
  model: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high';
  useThinking: boolean;
} {
  if (wordCount < 800) {
    // useThinking was false until 23 Jul 2026. Tested (A/B, real analyst prompt,
    // two separate sub-800/short-tier pieces): thinking ON was 31-47% FASTER at
    // this tier, not slower - the ladder's own data showed the <800 rung as the
    // single slowest of all four tested sizes, which this setting fully
    // explains. Quality read side-by-side both times: same tradition/craft
    // catches, same verdict, no degradation - if anything a tighter report
    // (fewer output tokens for the same substance). Do not revert without a
    // fresh A/B showing a regression.
    return { model: 'claude-sonnet-4-6', maxTokens: 16000, effort: 'low', useThinking: true };
  }
  if (wordCount < 3000) {
    return { model: 'claude-sonnet-4-6', maxTokens: 16000, effort: 'low', useThinking: true };
  }
  return { model: 'claude-opus-4-8', maxTokens: 16000, effort: ANALYST_EFFORT, useThinking: true };
}

// NOTE: the analyst's token ceiling is NOT here — it is set per-tier by
// adaptiveAnalystConfig() above (16000 at every tier). Do not add an
// `analyst` entry to this map; a stray ceiling here would silently
// contradict the real one and risk truncating reports.
export const TOKEN_LIMITS = {
  moderation: 200,
  // 800 sat INSIDE this brain's natural output range, not above it. Measured
  // 2026-08-20 on a 4,000-word literary chapter: unconstrained runs land
  // between 677 and 958 tokens, so at 800 three runs in six stopped at
  // max_tokens and returned the FALLBACK diagnostic — tradition 'Unknown',
  // register 'Unknown', empty ambition — with nothing anywhere reporting it.
  // That is the worst failure available here: every downstream brain receives
  // the tradition as locked (LearnedCorpus P1), so a silent fallback reads the
  // whole submission with no confirmed tradition at all.
  //
  // 1600 is well clear of the observed ceiling. A ceiling only costs what it
  // is used for, and this brain's output is a fixed-shape JSON that has no
  // reason to grow.
  diagnostician: 1600,
  // 2500 was not enough for a single one of these calls. Measured 2026-08-20
  // on a 4,000-word literary chapter: every run stopped at `max_tokens` with
  // the JSON cut mid-string, and because this is a JSON brain, truncation is
  // not partial output — parseJsonLoose returns null and the ENTIRE map is
  // discarded silently. That is why narrative_frame had never been seen to
  // learn: the word cap stops most submissions reaching the structural reader
  // at all, and the ones that did reach it threw their map away.
  //
  // The same text needs 3,025 tokens to close its JSON. Input is bounded by
  // sampleForStructure (12,000 chars), so output does not grow with manuscript
  // length; 6,000 is roughly double the measured need and costs nothing unless
  // it is used.
  structuralReader: 6000,
  narratorVerifier: 1000,
  // Must be able to reproduce the WHOLE report, because that is literally what
  // it returns — the corrected analysis, not a diff. The analyst's ceiling is
  // 16000 (adaptiveAnalystConfig), so anything lower here is a cap on a copy
  // of something larger than itself.
  //
  // Measured 2026-08-20 on an 18,609-char report: at 6000 the correction
  // stopped at max_tokens having produced 18,575 chars — and the length guard
  // below (`corrected.length > analysisText.length * 0.7`) PASSED it, because
  // a truncation that loses the last 3% is still 97% of the original. The
  // writer received a report ending mid-sentence. The same call at 16000
  // finishes in 6,175 tokens.
  //
  // NOTE the guard is still length-based and cannot see a stop_reason of
  // max_tokens; this ceiling puts the truncation out of reach rather than
  // making it detectable. See SESSION_LOG 2026-08-20.
  narratorCorrector: 16000,
  scorer: 800,
  market: 1200,
  bible: 1200,
  lens: 1200,
  conversation: 800,
  // A chapter can legitimately yield 20-30 facts, each carrying a verbatim
  // quote — the quotes dominate the budget. Sized above structuralReader
  // (2500) for that reason; truncation here silently loses facts.
  continuityExtractor: 3000,
  // Both detection passes emit a short verdict plus one or two sentences of
  // reasoning — the reasoning is shown to the writer, so it needs room to be
  // a sentence rather than a label, but nothing here is long-form.
  detection: 600,
} as const;
