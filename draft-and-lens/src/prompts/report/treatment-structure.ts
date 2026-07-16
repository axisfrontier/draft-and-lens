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
   *  (Action Plan, Where To Begin) that are never cut. */
  tiers?: Array<1 | 2 | 3>;
}

const CRITICAL = 'CRITICAL: Every section must be completed in full. Never end a section mid-sentence or mid-list. If a numbered list begins, it must end. If a section begins, it must close. Do not truncate any section regardless of length.\n\nThis is a TREATMENT — a prose blueprint, not a screenplay or a finished story. Read it for story and structure. Never fault it for summarising, for telling, for lacking dialogue, or for compression — those are the form working correctly.';

const SECTIONS: ReportSection[] = [
  { heading: 'OVERVIEW', tiers: [1, 2, 3], body: 'Name the tradition of the film this treatment describes. Explain what that means for evaluation — what structural questions this tradition demands. State what film this treatment is trying to set up. Then: does the structure underneath the prose serve that ambition? This is a diagnosis of intent and architecture — not a summary of the plot.' },
  { heading: 'THE SPINE', tiers: [1, 2, 3], body: 'State, in one sentence, the central line of the story as the treatment gives it to you: who wants what, against what cost. If you cannot state it cleanly from the treatment, that is the most important finding in this report — say so, and show where the want first becomes visible (or fails to).' },
  { heading: 'ACTION PLAN', body: 'Write this NOW, early, before the analysis sections. 5-7 numbered steps. Concrete. Referenced to specific moments in this treatment. What to address first, second, third. Each step is one revision pass on the treatment.' },
  { heading: 'STRUCTURE AND TURNS', tiers: [2, 3], body: 'Walk the major structural turns by approximate position — the inciting incident (the moment that sets the story in motion), the midpoint shift, the lowest point, the resolution. Are they present? Are they motivated by what precedes them, or asserted? Evaluate each turn as a sequence doing specific dramatic work — what changes, and what it costs the protagonist — rather than a checked-off label. If a subplot is described, evaluate it as another dimension of the same central question the spine is asking, not as an isolated thread — does it deepen or test that question, or does it merely run alongside the main line? Evaluate against the identified tradition — a mythic treatment is not held to three-act thriller mechanics.' },
  { heading: 'THROUGH-LINE AND MOMENTUM', tiers: [2, 3], body: 'Does the story accumulate, or is it a sequence of episodes that do not build? Where does the engine run? Where does it stall? Is each movement raising what came before?' },
  { heading: 'CHARACTER AND ARC', tiers: [1, 2, 3], body: 'In compressed prose, can you see who the protagonist is at the start, what changes them, and who they are at the end? Is the arc legible without scenes? Do secondary characters carry their weight in the structure, or are they named and then idle? In mythic work: do the figures retain human specificity while embodying larger forces?' },
  { heading: 'PROPORTION AND PACING', tiers: [2, 3], body: 'Does the treatment spend its length where the story\'s weight is? Flag any imbalance the film will inherit — a setup that runs long, a climax compressed to a line, a sagging middle. Proportion in the treatment becomes pacing in the film.' },
  { heading: 'PREMISE AND ENGINE', tiers: [1, 2, 3], body: 'Is the central idea generative — does it produce escalating story — or is it a single situation described at length? Could the same plot run without the premise, or is the premise load-bearing?' },
  { heading: 'TONE AND REGISTER', tiers: [1, 2, 3], body: 'Is the intended tonal register clear and held across the treatment? Where the treatment signals tone, does it stay coherent, or does it drift between registers without motivation?' },
  { heading: 'THE ENDING', tiers: [1, 2, 3], body: 'Does the resolution pay off the spine the treatment established? Is it earned by the structure, or imposed? Within the logic of the identified tradition — is this the ending the setup promised?' },
  { heading: 'WHAT IS WORKING', tiers: [1, 2, 3], body: 'Genuine structural strengths — pointed to specifically. At least three. The writer must know what to protect before they revise. Begin here in spirit: Chekhov to Gorky.' },
  { heading: 'CHARACTER CONSISTENCY', tiers: [2, 3], body: 'Cross-reference every named character across the treatment. Flag any instance where a character\'s stated motivation, role, or behaviour contradicts something set up earlier. Name it and locate it precisely. If a character bible was provided, flag any deviation.' },
  { heading: 'TRADITION ALIGNMENT', tiers: [2, 3], body: 'Is the treatment setting up a film that delivers on the promises of its chosen tradition? Which conventions are being met at the structural level? Which deliberately broken — and does the break earn itself? Which are being accidentally bypassed?' },
  { heading: 'DEVELOPMENT DIRECTIVES', tiers: [3], body: '10–15 numbered single-line actionable instructions specific to this treatment, at the level of story and structure. Directive register — "do this", not "avoid that". Prioritised by impact. Most important first.' },
  { heading: 'WHERE TO BEGIN', body: 'Three things, ranked by structural importance. Most critical first. Plain language — no craft jargon. End with what the writer must protect: the genuine structural strength the next draft must not lose.' },
];

const VERDICT_FOOTER = "---\nVERDICT: [READY TO DRAFT / DEVELOP FURTHER / SIGNIFICANT REWORK NEEDED]\nOne honest paragraph. Reference the treatment's specific tradition and the film it is trying to become.\n---";

/** <800 words → tier 1 (micro), <3000 → tier 2 (short), else → tier 3 (full). Mirrors adaptiveAnalystConfig's thresholds (ai/config.ts) for consistency. */
export function reportTier(wordCount: number): 1 | 2 | 3 {
  if (wordCount < 800) return 1;
  if (wordCount < 3000) return 2;
  return 3;
}

/** Report section contract for the analyst (Brain 2) — scaled to submission length. */
export function buildTreatmentReportStructure(wordCount: number): string {
  const tier = reportTier(wordCount);
  const parts = SECTIONS
    .filter((s) => !s.tiers || s.tiers.includes(tier))
    .map((s) => `## ${s.heading}\n${s.body}`);
  return [CRITICAL, ...parts, VERDICT_FOOTER].join('\n\n');
}
