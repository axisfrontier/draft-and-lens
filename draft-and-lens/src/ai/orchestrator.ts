import 'server-only';

import type {
  AnalysisMode,
  CoverageSignal,
  DiagnosticResult,
  MarketResult,
  ScoreResult,
} from '../prompts/types';
import { runAnalyst } from './brains/analyst';
import { runBible } from './brains/bible';
import { runDiagnostician } from './brains/diagnostician';
import { runMarket } from './brains/market';
import { runNarratorCorrection, runNarratorVerifier } from './brains/narrator';
import { runScorer } from './brains/scorer';
import { runStructuralReader } from './brains/structural-reader';

/**
 * Brain orchestration (Architecture §03). Sequence:
 *   Brain 1 (diagnostician) → Brain 1b (structural, ≥5k) → narrator verify (≥5k)
 *   → Brain 2 (analyst, streaming) ‖ Brains 3/4/5 in parallel
 *   → post-stream narrator correction.
 *
 * Load-bearing law: Brain 1 runs first and Brain 2 receives the tradition as
 * locked. The pipeline is never collapsed into one mega-prompt.
 */

/** Free-tier word cap — the opening this many words are read (Architecture §13). */
export const FREE_WORD_LIMIT = 10_000;

/** Below this, Brain 1b + the narrator verifier are skipped (Brain 2 holds the full text). */
const STRUCTURAL_READER_MIN_WORDS = 5_000;

const MODE_LABELS: Record<AnalysisMode, string> = {
  script: 'Script',
  story: 'Story',
  treatment: 'Treatment',
  play: 'Stage play',
};

export interface PipelineInput {
  mode: AnalysisMode;
  text: string;
  genre?: string;
  intent?: string;
  bible?: string;
  /** Skip Brain 5 (writer supplied a bible or opted out). */
  skipBible?: boolean;
  /** Tier word limit; defaults to the free-tier cap. */
  wordLimit?: number;
}

export interface PipelineCallbacks {
  onStage?: (stage: string, title: string) => void;
  onAnalystText?: (delta: string) => void;
  signal?: AbortSignal;
}

export interface PipelineResult {
  diagnostic: DiagnosticResult;
  coverage: CoverageSignal;
  report: string;
  scores: ScoreResult | null;
  market: MarketResult | null;
  bible: string;
}

/** Compute the read boundary — truncates to the tier limit on a word boundary (§13). */
export function computeCoverage(text: string, wordLimit: number): CoverageSignal {
  const allWords = text.split(/\s+/).filter(Boolean);
  const wordsTotal = allWords.length;
  const truncated = wordsTotal > wordLimit;
  const readWords = truncated ? allWords.slice(0, wordLimit) : allWords;
  const readText = truncated ? readWords.join(' ') : text;
  const wordsRead = readWords.length;
  return {
    truncated,
    wordsRead,
    wordsTotal,
    fractionRead: wordsTotal ? wordsRead / wordsTotal : 1,
    coverage: truncated
      ? `first ${wordsRead.toLocaleString()} of ${wordsTotal.toLocaleString()} words`
      : 'full text',
    readText,
  };
}

export async function runAnalysisPipeline(
  input: PipelineInput,
  cb: PipelineCallbacks = {}
): Promise<PipelineResult> {
  const genre = input.genre || 'Auto-detect';
  const wordLimit = input.wordLimit ?? FREE_WORD_LIMIT;
  const coverage = computeCoverage(input.text, wordLimit);
  const text = coverage.readText;
  const wordCount = coverage.wordsRead;
  const modeLabel = MODE_LABELS[input.mode];
  const pageEst =
    input.mode === 'script'
      ? Math.round(wordCount / 55)
      : Math.round(wordCount / 250);

  // ── Brain 1 — Diagnostician (always first) ─────────────────────────────
  cb.onStage?.('read', 'Reading your work');
  let diagnostic = await runDiagnostician(text, modeLabel);

  // ── Brain 1b + narrator verify — only on works ≥ 5,000 words ────────────
  if (wordCount >= STRUCTURAL_READER_MIN_WORDS) {
    cb.onStage?.('structure', 'Mapping the structure');
    const structuralMap = await runStructuralReader(text, modeLabel, diagnostic).catch(
      () => null
    );
    diagnostic = { ...diagnostic, structuralMap: structuralMap ?? undefined };

    if (structuralMap?.narratorBehaviour) {
      cb.onStage?.('structure', 'Verifying the narrator');
      const verdicts = await runNarratorVerifier(structuralMap).catch(() => null);
      if (verdicts) diagnostic = { ...diagnostic, narratorVerdicts: verdicts };
    }
  }

  // ── Brain 2 (streaming) ‖ Brains 3/4/5 ─────────────────────────────────
  cb.onStage?.('writing', 'Writing the reading');
  const title =
    diagnostic.title && diagnostic.title !== 'Untitled'
      ? diagnostic.title
      : undefined;

  const analystThenCorrect = (async (): Promise<string> => {
    const raw = await runAnalyst(
      {
        mode: input.mode,
        text,
        genre,
        intent: input.intent,
        bible: input.bible,
        wordCount,
        pageEst,
        diagnostic,
        coverage,
      },
      cb.onAnalystText,
      cb.signal
    );
    // Post-stream narrator correction (no-ops when there are no verdicts).
    if (diagnostic.narratorVerdicts) {
      cb.onStage?.('support', 'Final check');
      return runNarratorCorrection(raw, diagnostic).catch(() => raw);
    }
    return raw;
  })();

  const [report, scores, market, bible] = await Promise.all([
    analystThenCorrect,
    runScorer(text, input.mode, diagnostic.tradition || 'unknown').catch(() => null),
    runMarket(text, modeLabel).catch(() => null),
    input.skipBible ? Promise.resolve('') : runBible(text, modeLabel).catch(() => ''),
  ]);

  void title; // title is surfaced via diagnostic; market uses its own recognition.

  return { diagnostic, coverage, report, scores, market, bible };
}
