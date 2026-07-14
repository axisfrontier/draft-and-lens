import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 * 2026-07-13: restructured into tiered sections (report scales to submission
 * length — Excerpt/Speed proposal). Full-length (tier 3) text is byte-for-byte
 * identical to the pre-tiering constant; only which sections are INCLUDED
 * varies by tier, no section body text changed.
 */

interface ReportSection {
  heading: string;
  body: string;
  /** Word-count tiers this section appears in. Omit for always-include callouts
   *  (Action Plan, Craft Directives, Where To Begin) that are never cut. */
  tiers?: Array<1 | 2 | 3>;
}

const CRITICAL = 'CRITICAL: Every section must be completed in full. Never end a section mid-sentence or mid-list. If a numbered list begins, it must end. Do not truncate.';

const SECTIONS: ReportSection[] = [
  { heading: 'OVERVIEW', tiers: [1, 2, 3], body: "Name the tradition this story is working in. Explain what that means for evaluation — what rules apply, what questions it must answer. State what this story is trying to achieve. Then: does the overall craft serve that ambition? Diagnosis of intent — not summary." },
  { heading: 'OPENING PROMISE', tiers: [1, 2, 3], body: 'The first sentence and paragraph. What contract is made with the reader. Whether it is kept.' },
  { heading: 'ACTION PLAN', body: 'Write this NOW, early. 5-7 numbered steps. Concrete. Referenced to specific moments in this work. What to do first, second, third.' },
  { heading: 'STRUCTURE AND ARC', tiers: [2, 3], body: 'How does the story build? Where is the engine? Is the resolution earned — within the logic of the identified tradition? In fabular work: does the moral arc hold? In realist work: is the epiphany accumulated or imposed?' },
  { heading: 'VOICE AND NARRATOR', tiers: [1, 2, 3], body: 'Is the narrative voice appropriate to the tradition? In mythic/fabular work: does the narrator earn its altitude by adding what the image cannot carry — or does it restate what the prose already shows? In realist work: is the voice free of over-explanation? Quote where the voice is strong and where it loses its register.' },
  { heading: 'CHARACTER', tiers: [2, 3], body: "Are the characters serving the story's tradition? In realist work: interiority, withholding, pressure. In mythic work: do characters retain human specificity while embodying larger forces? Quote specific moments." },
  { heading: 'PROSE RHYTHM AND TEXTURE', tiers: [1, 2, 3], body: 'Sentence variety, cadence, compression. Where rhythm serves the emotional weight. Where it breaks — intentionally or not. Are the specific nouns doing the work, or are abstractions and adjectives doing it instead?' },
  { heading: 'IMAGERY', tiers: [1, 2, 3], body: 'The images that will stay. The ones that fade. What the imagery is doing for the emotional and moral world of the story. Where an image carries weight the prose cannot — and where the prose then mistakenly explains it anyway.' },
  { heading: 'THEME', tiers: [1, 2, 3], body: 'What moral position does this story occupy? Embodied in the narrative — or stated by the prose? In fabular work: does explicit statement by the narrator earn its place — or is the image already doing the work?' },
  { heading: 'THE ENDING', tiers: [1, 2, 3], body: 'Earned or imposed? Over-explained or under-earned? What the last image or sentence is doing — or failing to do — within the story\'s established register.' },
  { heading: 'WHAT IS WORKING', tiers: [1, 2, 3], body: 'Genuine strengths — quoted and specific. At least three. Begin here: Chekhov to Gorky.' },
  { heading: 'CHARACTER CONSISTENCY', tiers: [2, 3], body: 'Cross-reference every named character. Flag contradictions of established voice, interiority, behaviour. Name and locate precisely.' },
  { heading: 'TRADITION ALIGNMENT', tiers: [2, 3], body: "Is the story delivering on the promises of its chosen tradition? Which conventions met, broken purposefully, or accidentally bypassed?" },
  { heading: 'REVISION NOTES', tiers: [1, 3], body: ' specific moments in the submitted work.' },
  { heading: 'CRAFT DIRECTIVES', body: '10–15 numbered single-line actionable craft instructions specific to this story. Directive register. Prioritised by impact.' },
  { heading: 'WHERE TO BEGIN', body: 'Three things, ranked. Most important first. Plain language. End with what to protect.' },
];

const VERDICT_FOOTER = "---\nVERDICT: [PUBLISH READY / DEVELOP FURTHER / SIGNIFICANT REWORK NEEDED]\nOne honest paragraph. Reference the story's specific tradition and ambition.\n---";

/** <800 words → tier 1 (micro), <3000 → tier 2 (short), else → tier 3 (full). Mirrors adaptiveAnalystConfig's thresholds (ai/config.ts) for consistency. */
export function reportTier(wordCount: number): 1 | 2 | 3 {
  if (wordCount < 800) return 1;
  if (wordCount < 3000) return 2;
  return 3;
}

/** Report section contract for the analyst (Brain 2) — scaled to submission length. */
export function buildStoryReportStructure(wordCount: number): string {
  const tier = reportTier(wordCount);
  const parts = SECTIONS
    .filter((s) => !s.tiers || s.tiers.includes(tier))
    .map((s) => `## ${s.heading}\n${s.body}`);
  return [CRITICAL, ...parts, VERDICT_FOOTER].join('\n\n');
}
