import 'server-only';

import { EVIDENCE_GATING, WHAT_TO_REVISE } from './shared';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-26 (added Theme, Protagonist, Antagonist, Pace, Commercial; reordered)
 * 2026-07-13: restructured into tiered sections (report scales to submission
 * length — Excerpt/Speed proposal). Full-length (tier 3) text is byte-for-byte
 * identical to the pre-tiering constant; only which sections are INCLUDED
 * varies by tier, no section body text changed.
 * 2026-07-23: replaced word-count tiers with evidence-gating (Corpus P26) —
 * section inclusion is now decided by the model against the text, not by a
 * fixed word-count threshold. Collapsed the two-headed prescriptive tail
 * (Action Plan / What To Fix Next) into one prioritised WHAT TO REVISE list.
 */

interface ReportSection {
  heading: string;
  body: string;
}

const SECTIONS: ReportSection[] = [
  { heading: 'OVERVIEW', body: 'Name the tradition this script is working in. Explain what that means for how it will be evaluated — what rules apply, what questions it must answer. State what this script is trying to achieve. Then: does the overall craft serve that ambition? This section orients everything that follows. It is a diagnosis of intent and register — not a summary.' },
  { heading: 'FIRST IMPRESSION', body: 'Does the opening establish the correct register immediately? Does page one command the reader and establish what kind of film this is? What promise is made — and is it kept across the full script?' },
  { heading: 'STRUCTURE', body: 'How does the script build momentum? Evaluate structure at the scene and sequence level, not through generic beat-sheet labels — for each key sequence, ask what is actually changing within it and what it costs the character to get through it. A script can technically hit every expected plot point and still fail if its scenes and sequences aren\'t individually doing dramatic work. Name the key structural moments by approximate position. Where is the engine working? Where is it stalling? If a subplot is present, evaluate it as another dimension of the same central question the main plot is asking, not as an isolated B-story — does it deepen, complicate, or test that question, or does it run parallel without ever touching the main thread? Evaluate structure appropriate to the identified tradition — a mythic allegory is not evaluated on three-act thriller structure.' },
  { heading: 'CHARACTER', body: "Are the characters serving the story's tradition? In realist work: want vs need, agency, character revealed under pressure. In mythic work: do the characters retain human specificity while embodying larger forces — are they both a symbol AND a specific person? Quote specific moments." },
  { heading: 'DIALOGUE', body: "Is dialogue doing the right work for the identified register? Sorkin's standard: every scene is an argument with a point of friction. Realist standard: characters talk around what they mean. Mythic/allegorical standard: declarative dialogue may be appropriate when the register has established the right to it — evaluate whether it earns its weight. Quote what works and what doesn't." },
  { heading: 'THEME', body: 'What moral position or central idea is this script exploring? Is it embodied in the action and character — or stated in dialogue? Is the theme specific enough to be felt, or is it announced? Where does the script commit to its thematic argument most fully — and where does it flinch?' },
  { heading: 'VISUAL WRITING', body: 'Do the action lines carry the right register for the tradition? Is the world specific enough to be felt — or generic? Are action lines creating atmosphere and meaning, not just describing what happens?' },
  { heading: 'TONE', body: 'Is the tonal register established clearly and maintained consistently? Where does it hold? Where does it fracture — and is that fracture intentional or accidental?' },
  { heading: 'PROTAGONIST', body: 'Who is the protagonist? What do they want and what do they need? How does the script reveal character under pressure? Does the protagonist drive the story or react to it? Is their arc — or refusal of arc — appropriate to the script\'s tradition?' },
  { heading: 'ANTAGONIST', body: 'Who or what opposes the protagonist? Is the antagonistic force specific and credible within the script\'s tradition? Does the opposition create genuine dramatic pressure — or is it under-written? In mythic work: does the antagonist embody a real force, or merely a function?' },
  { heading: 'PACE', body: 'Does the script move at the right speed for its tradition? Where does it accelerate effectively? Where does it stall? Are scenes running the length they need — no longer, no shorter? Name the specific scenes where pace is lost or found.' },
  { heading: 'COMMERCIAL', body: 'Where does this script sit in the current market? What comparable works or precedents exist? What makes it distinct — and is that distinction a selling point or a barrier? Who would greenlight this, and why?' },
  { heading: 'WHAT IS WORKING', body: 'Genuine strengths — quoted and specific. At least three. The writer must know what to protect before they revise. Chekhov to Gorky: begin with what is genuinely working.' },
  { heading: 'CHARACTER CONSISTENCY', body: 'Cross-reference every named character. Flag any instance where established voice, behaviour, or stated beliefs contradict something set up earlier. Name it and locate it precisely. If a character bible was provided, flag any deviation.' },
  { heading: 'GENRE ALIGNMENT', body: 'Is the script delivering on the promises of its chosen tradition? Which conventions are being met? Which deliberately broken — and does the break earn itself within the script\'s own logic? Which are being accidentally bypassed?' },
  { heading: 'WHAT TO REVISE', body: WHAT_TO_REVISE },
];

const VERDICT_FOOTER = '---\nVERDICT: [RECOMMEND / CONSIDER WITH REVISIONS / PASS — BUT WATCH THE WRITER / PASS]\nOne honest paragraph. Name the script\'s specific tradition and ambition. Say what would need to change for the verdict to change.\n---';

/** Report section contract for the analyst (Brain 2) — section inclusion is
 *  evidence-gated (see EVIDENCE_GATING), not word-count-tiered. */
export function buildScriptReportStructure(): string {
  const parts = SECTIONS.map((s) => `## ${s.heading}\n${s.body}`);
  return [EVIDENCE_GATING, ...parts, VERDICT_FOOTER].join('\n\n');
}
