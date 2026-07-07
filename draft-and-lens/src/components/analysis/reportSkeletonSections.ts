/**
 * Canonical "Analysis" section headings per mode, for the pre-stream skeleton.
 *
 * Mirrors exactly what report.ts:parseReport() produces from a completed
 * response for each mode — i.e. the ## headings in src/prompts/report/*-structure.ts
 * with the ones parseReport lifts into callouts (Action Plan, Craft Directives,
 * Where To Begin) removed. If those structure files or parseReport's lifting
 * rules change, update this list to match or the skeleton will drift from the
 * real report. Play mode reuses the script structure (see analyst.ts:reportStructure).
 */

import type { Mode } from './types';

const SCRIPT_SECTIONS = [
  'Overview', 'First Impression', 'Structure', 'Character', 'Dialogue',
  'Theme', 'Visual Writing', 'Tone', 'Protagonist', 'Antagonist', 'Pace',
  'Commercial', 'What Is Working', 'Character Consistency', 'Genre Alignment',
];

const STORY_SECTIONS = [
  'Overview', 'Opening Promise', 'Structure And Arc', 'Voice And Narrator',
  'Character', 'Prose Rhythm And Texture', 'Imagery', 'Theme', 'The Ending',
  'What Is Working', 'Character Consistency', 'Tradition Alignment', 'Revision Notes',
];

const TREATMENT_SECTIONS = [
  'Overview', 'The Spine', 'Structure And Turns', 'Through-Line And Momentum',
  'Character And Arc', 'Proportion And Pacing', 'Premise And Engine',
  'Tone And Register', 'The Ending', 'What Is Working', 'Character Consistency',
  'Tradition Alignment', 'Development Directives',
];

export const SKELETON_SECTIONS: Record<Mode, string[]> = {
  script: SCRIPT_SECTIONS,
  play: SCRIPT_SECTIONS,
  story: STORY_SECTIONS,
  treatment: TREATMENT_SECTIONS,
};
