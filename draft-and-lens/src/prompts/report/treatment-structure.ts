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
 * fixed word-count threshold. Collapsed the three-headed prescriptive tail
 * (Action Plan / Development Directives / Where To Begin) into one
 * prioritised WHAT TO REVISE list.
 */

interface ReportSection {
  heading: string;
  body: string;
}

const TREATMENT_NOTE = 'This is a TREATMENT — a prose blueprint, not a screenplay or a finished story. Read it for story and structure. Never fault it for summarising, for telling, for lacking dialogue, or for compression — those are the form working correctly.';

const SECTIONS: ReportSection[] = [
  { heading: 'OVERVIEW', body: 'Name the tradition of the film this treatment describes. Explain what that means for evaluation — what structural questions this tradition demands. State what film this treatment is trying to set up. Then: does the structure underneath the prose serve that ambition? This is a diagnosis of intent and architecture — not a summary of the plot.' },
  { heading: 'THE SPINE', body: 'State, in one sentence, the central line of the story as the treatment gives it to you: who wants what, against what cost. If you cannot state it cleanly from the treatment, that is the most important finding in this report — say so, and show where the want first becomes visible (or fails to).' },
  { heading: 'STRUCTURE AND TURNS', body: 'Walk the major structural turns by approximate position — the inciting incident (the moment that sets the story in motion), the midpoint shift, the lowest point, the resolution. Are they present? Are they motivated by what precedes them, or asserted? Evaluate each turn as a sequence doing specific dramatic work — what changes, and what it costs the protagonist — rather than a checked-off label. If a subplot is described, evaluate it as another dimension of the same central question the spine is asking, not as an isolated thread — does it deepen or test that question, or does it merely run alongside the main line? Evaluate against the identified tradition — a mythic treatment is not held to three-act thriller mechanics.' },
  { heading: 'THROUGH-LINE AND MOMENTUM', body: 'Does the story accumulate, or is it a sequence of episodes that do not build? Where does the engine run? Where does it stall? Is each movement raising what came before?' },
  { heading: 'CHARACTER AND ARC', body: 'In compressed prose, can you see who the protagonist is at the start, what changes them, and who they are at the end? Is the arc legible without scenes? Do secondary characters carry their weight in the structure, or are they named and then idle? In mythic work: do the figures retain human specificity while embodying larger forces?' },
  { heading: 'PROPORTION AND PACING', body: 'Does the treatment spend its length where the story\'s weight is? Flag any imbalance the film will inherit — a setup that runs long, a climax compressed to a line, a sagging middle. Proportion in the treatment becomes pacing in the film.' },
  { heading: 'PREMISE AND ENGINE', body: 'Is the central idea generative — does it produce escalating story — or is it a single situation described at length? Could the same plot run without the premise, or is the premise load-bearing?' },
  { heading: 'TONE AND REGISTER', body: 'Is the intended tonal register clear and held across the treatment? Where the treatment signals tone, does it stay coherent, or does it drift between registers without motivation?' },
  { heading: 'THE ENDING', body: 'Does the resolution pay off the spine the treatment established? Is it earned by the structure, or imposed? Within the logic of the identified tradition — is this the ending the setup promised?' },
  { heading: 'WHAT IS WORKING', body: 'Genuine structural strengths — pointed to specifically. At least three. The writer must know what to protect before they revise. Begin here in spirit: Chekhov to Gorky.' },
  { heading: 'CHARACTER CONSISTENCY', body: 'Cross-reference every named character across the treatment. Flag any instance where a character\'s stated motivation, role, or behaviour contradicts something set up earlier. Name it and locate it precisely. If a character bible was provided, flag any deviation.' },
  { heading: 'TRADITION ALIGNMENT', body: 'Is the treatment setting up a film that delivers on the promises of its chosen tradition? Which conventions are being met at the structural level? Which deliberately broken — and does the break earn itself? Which are being accidentally bypassed?' },
  { heading: 'WHAT TO REVISE', body: WHAT_TO_REVISE },
];

const VERDICT_FOOTER = "---\nVERDICT: [READY TO DRAFT / DEVELOP FURTHER / SIGNIFICANT REWORK NEEDED]\nOne honest paragraph. Reference the treatment's specific tradition and the film it is trying to become.\n---";

/** Report section contract for the analyst (Brain 2) — section inclusion is
 *  evidence-gated (see EVIDENCE_GATING), not word-count-tiered. */
export function buildTreatmentReportStructure(): string {
  const parts = SECTIONS.map((s) => `## ${s.heading}\n${s.body}`);
  return [EVIDENCE_GATING + '\n\n' + TREATMENT_NOTE, ...parts, VERDICT_FOOTER].join('\n\n');
}
