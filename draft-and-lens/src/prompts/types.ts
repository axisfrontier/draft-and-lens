import 'server-only';

/** User-declared submission type — server never infers (§15). */
export type AnalysisMode = 'script' | 'story' | 'play' | 'treatment';

export interface DiagnosticResult {
  tradition: string;
  register: string;
  ambition: string;
  craftQuestions: string[];
  strengths: string[];
  primaryConcern: string;
  title: string;
  summary: string;
  formNotes: string;
  structuralMap?: StructuralMap;
  narratorVerdicts?: NarratorVerdicts;
}

export interface StructuralMap {
  narrativeStructure?: string;
  timelineNotes?: string;
  structuralBeats?: string[];
  registerMap?: Array<{ position: string; quote: string; register: string; note: string }>;
  strongest?: string[];
  weakest?: string[];
  registerFractures?: string[];
  narratorBehaviour?: {
    elevating?: string[];
    restating?: string[];
    worldEstablishment?: string[];
  };
  juxtapositions?: string[];
  characterMap?: string[];
}

export interface NarratorVerdict {
  quote: string;
  classification: 'ELEVATION' | 'WORLD_ESTABLISHMENT' | 'RESTATEMENT';
  reason: string;
}

export interface NarratorVerdicts {
  verdicts: NarratorVerdict[];
}

export interface CoverageSignal {
  truncated: boolean;
  wordsRead: number;
  wordsTotal: number;
  fractionRead: number;
  coverage: string;
  readText: string;
}

/** Brain 3 — Scorer output (craft + tradition-alignment scores, arc beats). */
export interface ScoreResult {
  title?: string | null;
  scores?: Record<string, number>;
  alignment?: Record<string, number>;
  beats?: Array<{ pct: number; tension: number; pace: number; emotion: number; label: string; note: string }>;
  summary?: string;
}

/** Brain 4 — Market output (known-work recognition + studio matches). */
export interface MarketResult {
  knownWork?: string;
  studios?: Array<{
    name: string;
    type: string;
    match: string;
    rationale: string;
    contact: string;
  }>;
}
