/**
 * Canonical "Analysis" section headings per mode, for the pre-stream skeleton.
 *
 * Mirrors exactly what report.ts:parseReport() produces from a completed
 * response for each mode — i.e. the ## headings in src/prompts/report/*-structure.ts
 * with the ones parseReport lifts into callouts (Action Plan, Craft Directives,
 * Where To Begin) removed. If those structure files or parseReport's lifting
 * rules change, update this list to match or the skeleton will drift from the
 * real report. Play mode reuses the script structure (see analyst.ts:reportStructure).
 *
 * DUPLICATED, NOT IMPORTED: src/prompts/report/*-structure.ts are `server-only`
 * (they hold the analyst prompt IP); this file backs a client component, so the
 * tier lists below must be hand-kept in sync rather than imported. If you change
 * a section's tier in a *-structure.ts file, mirror the change here too.
 *
 * Tiers (2026-07-13, Excerpt/Speed proposal): <800 words → 1 (micro), <3000 → 2
 * (short), else → 3 (full) — matches adaptiveAnalystConfig's thresholds.
 */

import type { Mode } from './types';

interface SkeletonSection {
  label: string;
  tiers: Array<1 | 2 | 3>;
}

const SCRIPT_SECTIONS: SkeletonSection[] = [
  { label: 'Overview', tiers: [1, 2, 3] },
  { label: 'First Impression', tiers: [1, 2, 3] },
  { label: 'Structure', tiers: [2, 3] },
  { label: 'Character', tiers: [1, 2, 3] },
  { label: 'Dialogue', tiers: [1, 2, 3] },
  { label: 'Theme', tiers: [1, 2, 3] },
  { label: 'Visual Writing', tiers: [1, 2, 3] },
  { label: 'Tone', tiers: [1, 2, 3] },
  { label: 'Protagonist', tiers: [2, 3] },
  { label: 'Antagonist', tiers: [2, 3] },
  { label: 'Pace', tiers: [2, 3] },
  { label: 'Commercial', tiers: [2, 3] },
  { label: 'What Is Working', tiers: [1, 2, 3] },
  { label: 'Character Consistency', tiers: [2, 3] },
  { label: 'Genre Alignment', tiers: [3] },
];

const STORY_SECTIONS: SkeletonSection[] = [
  { label: 'Overview', tiers: [1, 2, 3] },
  { label: 'Opening Promise', tiers: [1, 2, 3] },
  { label: 'Structure And Arc', tiers: [2, 3] },
  { label: 'Voice And Narrator', tiers: [1, 2, 3] },
  { label: 'Character', tiers: [2, 3] },
  { label: 'Prose Rhythm And Texture', tiers: [1, 2, 3] },
  { label: 'Imagery', tiers: [1, 2, 3] },
  { label: 'Theme', tiers: [1, 2, 3] },
  { label: 'The Ending', tiers: [1, 2, 3] },
  { label: 'What Is Working', tiers: [1, 2, 3] },
  { label: 'Character Consistency', tiers: [2, 3] },
  { label: 'Tradition Alignment', tiers: [2, 3] },
  { label: 'Revision Notes', tiers: [1, 3] },
];

const TREATMENT_SECTIONS: SkeletonSection[] = [
  { label: 'Overview', tiers: [1, 2, 3] },
  { label: 'The Spine', tiers: [1, 2, 3] },
  { label: 'Structure And Turns', tiers: [2, 3] },
  { label: 'Through-Line And Momentum', tiers: [2, 3] },
  { label: 'Character And Arc', tiers: [1, 2, 3] },
  { label: 'Proportion And Pacing', tiers: [2, 3] },
  { label: 'Premise And Engine', tiers: [1, 2, 3] },
  { label: 'Tone And Register', tiers: [1, 2, 3] },
  { label: 'The Ending', tiers: [1, 2, 3] },
  { label: 'What Is Working', tiers: [1, 2, 3] },
  { label: 'Character Consistency', tiers: [2, 3] },
  { label: 'Tradition Alignment', tiers: [2, 3] },
  { label: 'Development Directives', tiers: [3] },
];

const SECTIONS_BY_MODE: Record<Mode, SkeletonSection[]> = {
  script: SCRIPT_SECTIONS,
  play: SCRIPT_SECTIONS,
  story: STORY_SECTIONS,
  treatment: TREATMENT_SECTIONS,
};

/** <800 words → tier 1 (micro), <3000 → tier 2 (short), else → tier 3 (full). */
function reportTier(wordCount: number): 1 | 2 | 3 {
  if (wordCount < 800) return 1;
  if (wordCount < 3000) return 2;
  return 3;
}

export function getSkeletonSections(mode: Mode, wordCount: number): string[] {
  const tier = reportTier(wordCount);
  return SECTIONS_BY_MODE[mode]
    .filter((s) => s.tiers.includes(tier))
    .map((s) => s.label);
}
