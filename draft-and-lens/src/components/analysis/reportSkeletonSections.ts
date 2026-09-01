/**
 * Canonical "Analysis" section headings per mode, for the pre-stream skeleton.
 *
 * Mirrors exactly what report.ts:parseReport() produces from a completed
 * response for each mode — i.e. the ## headings in src/prompts/report/*-structure.ts
 * with the ones parseReport lifts into callouts (Craft Directives / Development
 * Directives, Where To Begin — pre-P26) removed. If those structure files or
 * parseReport's lifting rules change, update this list to match or the skeleton
 * will drift from the real report. Play mode reuses the script structure (see
 * analyst.ts:reportStructure).
 *
 * DUPLICATED, NOT IMPORTED: src/prompts/report/*-structure.ts are `server-only`
 * (they hold the analyst prompt IP); this file backs a client component, so the
 * heading lists below must be hand-kept in sync rather than imported. If you
 * change a section's heading in a *-structure.ts file, mirror the change here.
 *
 * 2026-07-25: word-count tiers removed. Corpus P26 (evidence-gating, shipped
 * 2026-07-23) replaced the word-count-tiered section lists with a single set
 * of headings per mode whose inclusion the model decides against the text, not
 * against length — so a skeleton keyed on word count necessarily drifts from
 * what evidence-gating actually renders. This file had not been updated for
 * that change: it still showed a since-removed "Revision Notes" heading (the
 * four-headed prescriptive tail collapsed into one WHAT TO REVISE section) and
 * gated "Character Consistency" behind a tier that no longer governs whether
 * the section appears. Both read as permanently blank placeholders to the
 * writer, alongside sections that populated normally. The skeleton can't know
 * in advance which evidence-gated sections a given piece will earn, so it
 * simply lists every heading the mode can produce; a section the model omits
 * for lack of evidence never appears in the streamed report; its placeholder
 * is what streams past.
 */

import type { Mode } from './types';

const SCRIPT_SECTIONS: string[] = [
  'Overview',
  'First Impression',
  'Structure',
  'Character',
  'Dialogue',
  'Theme',
  'Visual Writing',
  'Tone',
  'Protagonist',
  'Antagonist',
  'Pace',
  'Commercial',
  'What Is Working',
  'Character Consistency',
  'Genre Alignment',
  // 'What To Revise' is deliberately ABSENT from all three lists, and this
  // comment is here so it is not "restored" as an oversight. parseReport lifts
  // WHAT TO REVISE into its own callout (report.ts, the place() function), so
  // it never enters parsed.sections and a placeholder reserved for it here can
  // never fill. It sat in these lists until the 2026-09-01 audit, contradicting
  // this file's own header rule — the same drift the 2026-08-22 audit caught in
  // the other direction with 'Where To Grow Next'. The two lists have to be
  // read together or they drift silently in whichever direction was last
  // forgotten.
];

const STORY_SECTIONS: string[] = [
  'Overview',
  'Opening Promise',
  'Structure And Arc',
  'Voice And Narrator',
  'Character',
  'Prose Rhythm And Texture',
  'Imagery',
  'Theme',
  'The Ending',
  'What Is Working',
  'Character Consistency',
  'Tradition Alignment',
  // Added to the story prompt on 2026-08-19 and missed here until the
  // 2026-08-22 audit, so it streamed in with no placeholder ahead of it. The
  // two lists have to be read together or they drift silently: this one only
  // decides what the skeleton reserves space for, so nothing fails when it is
  // wrong — the section simply arrives unannounced.
  'Where To Grow Next',
];

const TREATMENT_SECTIONS: string[] = [
  'Overview',
  'The Spine',
  'Structure And Turns',
  'Through-Line And Momentum',
  'Character And Arc',
  'Proportion And Pacing',
  'Premise And Engine',
  'Tone And Register',
  'The Ending',
  'What Is Working',
  'Character Consistency',
  'Tradition Alignment',
];

const SECTIONS_BY_MODE: Record<Mode, string[]> = {
  script: SCRIPT_SECTIONS,
  play: SCRIPT_SECTIONS,
  story: STORY_SECTIONS,
  treatment: TREATMENT_SECTIONS,
};

export function getSkeletonSections(mode: Mode): string[] {
  return SECTIONS_BY_MODE[mode];
}
