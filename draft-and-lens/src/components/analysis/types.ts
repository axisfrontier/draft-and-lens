/**
 * Client-side mirror types for the report UI (Stage E).
 *
 * These DELIBERATELY duplicate the server's shapes. The report UI must import
 * NOTHING from src/prompts or src/ai — those modules are `server-only` and carry
 * the prompt IP, and the client-IP guard test fails the build if a UI file
 * reaches into them. So the shapes returned by /api/analyse are re-declared here,
 * client-safe. Keep in sync with src/prompts/types.ts.
 */

export interface Coverage {
  truncated: boolean;
  wordsRead: number;
  wordsTotal: number;
  fractionRead: number;
  coverage: string;
}

export interface Diagnostic {
  tradition: string;
  register: string;
  ambition: string;
  craftQuestions: string[];
  strengths: string[];
  primaryConcern: string;
  title: string;
  summary: string;
  formNotes: string;
}

export interface Scores {
  title?: string | null;
  scores?: Record<string, number>;
  alignment?: Record<string, number>;
  beats?: Array<{ pct: number; intensity: number; label: string; note: string }>;
  summary?: string;
}

export interface Market {
  knownWork?: string;
  studios?: Array<{
    name: string;
    type: string;
    match: string;
    rationale: string;
    contact: string;
  }>;
}

/** The final `done` event from /api/analyse (NDJSON stream). */
export interface DonePayload {
  type: 'done';
  report: string;
  diagnostic: Diagnostic;
  coverage: Coverage;
  scores: Scores | null;
  market: Market | null;
  bible: string;
}
