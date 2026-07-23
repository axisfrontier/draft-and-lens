import 'server-only';

import { EVIDENCE_GATING, WHAT_TO_REVISE } from './shared';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 * 2026-07-13: restructured into tiered sections (report scales to submission
 * length — Excerpt/Speed proposal). Full-length (tier 3) text is byte-for-byte
 * identical to the pre-tiering constant; only which sections are INCLUDED
 * varies by tier, no section body text changed.
 * 2026-07-23: replaced word-count tiers with evidence-gating (Corpus P26) —
 * section inclusion is now decided by the model against the text, not by a
 * fixed word-count threshold. Collapsed the four-headed prescriptive tail
 * (Action Plan / Revision Notes / Craft Directives / Where To Begin) into one
 * prioritised WHAT TO REVISE list — confirmed structural, not length-driven,
 * on an 8,619-word stored report before this change (see session notes).
 */

interface ReportSection {
  heading: string;
  body: string;
}

const SECTIONS: ReportSection[] = [
  { heading: 'OVERVIEW', body: "Name the tradition this story is working in. Explain what that means for evaluation — what rules apply, what questions it must answer. State what this story is trying to achieve. Then: does the overall craft serve that ambition? Diagnosis of intent — not summary." },
  { heading: 'OPENING PROMISE', body: 'The first sentence and paragraph. What contract is made with the reader. Whether it is kept.' },
  { heading: 'STRUCTURE AND ARC', body: 'How does the story build? Where is the engine? Is the resolution earned — within the logic of the identified tradition? In fabular work: does the moral arc hold? In realist work: is the epiphany accumulated or imposed?' },
  { heading: 'VOICE AND NARRATOR', body: 'Is the narrative voice appropriate to the tradition? In mythic/fabular work: does the narrator earn its altitude by adding what the image cannot carry — or does it restate what the prose already shows? In realist work: is the voice free of over-explanation? Quote where the voice is strong and where it loses its register.' },
  { heading: 'CHARACTER', body: "Are the characters serving the story's tradition? In realist work: interiority, withholding, pressure. In mythic work: do characters retain human specificity while embodying larger forces? Quote specific moments." },
  { heading: 'PROSE RHYTHM AND TEXTURE', body: 'Sentence variety, cadence, compression. Where rhythm serves the emotional weight. Where it breaks — intentionally or not. Are the specific nouns doing the work, or are abstractions and adjectives doing it instead?' },
  { heading: 'IMAGERY', body: 'The images that will stay. The ones that fade. What the imagery is doing for the emotional and moral world of the story. Where an image carries weight the prose cannot — and where the prose then mistakenly explains it anyway.' },
  { heading: 'THEME', body: 'What moral position does this story occupy? Embodied in the narrative — or stated by the prose? In fabular work: does explicit statement by the narrator earn its place — or is the image already doing the work?' },
  { heading: 'THE ENDING', body: 'Earned or imposed? Over-explained or under-earned? What the last image or sentence is doing — or failing to do — within the story\'s established register.' },
  { heading: 'WHAT IS WORKING', body: 'Genuine strengths — quoted and specific. At least three. Begin here: Chekhov to Gorky.' },
  { heading: 'CHARACTER CONSISTENCY', body: 'Cross-reference every named character. Flag contradictions of established voice, interiority, behaviour. Name and locate precisely.' },
  { heading: 'TRADITION ALIGNMENT', body: "Is the story delivering on the promises of its chosen tradition? Which conventions met, broken purposefully, or accidentally bypassed?" },
  { heading: 'WHAT TO REVISE', body: WHAT_TO_REVISE },
];

const VERDICT_FOOTER = "---\nVERDICT: [PUBLISH READY / DEVELOP FURTHER / SIGNIFICANT REWORK NEEDED]\nOne honest paragraph. Reference the story's specific tradition and ambition.\n---";

/** Report section contract for the analyst (Brain 2) — section inclusion is
 *  evidence-gated (see EVIDENCE_GATING), not word-count-tiered. */
export function buildStoryReportStructure(): string {
  const parts = SECTIONS.map((s) => `## ${s.heading}\n${s.body}`);
  return [EVIDENCE_GATING, ...parts, VERDICT_FOOTER].join('\n\n');
}
