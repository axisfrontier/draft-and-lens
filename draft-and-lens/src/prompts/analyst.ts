import 'server-only';

import { ANCHOR_DIRECTIVE } from './fragments/anchor-directive';
import {
  PLAY_GENRE_NOTES,
  SCRIPT_GENRE_NOTES,
  STORY_GENRE_NOTES,
  TREATMENT_GENRE_NOTES,
} from './genres';
import { PLAY_SYSTEM } from './modes/play';
import { SCRIPT_SYSTEM } from './modes/script';
import { STORY_SYSTEM } from './modes/story';
import { TREATMENT_SYSTEM } from './modes/treatment';
import { SCRIPT_REPORT_STRUCTURE } from './report/script-structure';
import { STORY_REPORT_STRUCTURE } from './report/story-structure';
import { TREATMENT_REPORT_STRUCTURE } from './report/treatment-structure';
import type { AnalysisMode, DiagnosticResult } from './types';

/**
 * Brain 2 system prompt builders — tradition locked after Brain 1 (LearnedCorpus P1).
 * Last reviewed: 2026-06-16 (re-synced; device-vs-instance rule added to HTML source then ported to Brain 2)
 */

function genreNote(mode: AnalysisMode, genre: string): string {
  switch (mode) {
    case 'script':
      return SCRIPT_GENRE_NOTES[genre as keyof typeof SCRIPT_GENRE_NOTES] ?? SCRIPT_GENRE_NOTES['Auto-detect'];
    case 'story':
      return STORY_GENRE_NOTES[genre as keyof typeof STORY_GENRE_NOTES] ?? STORY_GENRE_NOTES['Auto-detect'];
    case 'treatment':
      return TREATMENT_GENRE_NOTES[genre as keyof typeof TREATMENT_GENRE_NOTES] ?? TREATMENT_GENRE_NOTES['Auto-detect'];
    case 'play':
      return PLAY_GENRE_NOTES[genre as keyof typeof PLAY_GENRE_NOTES] ?? PLAY_GENRE_NOTES['Auto-detect'];
    default:
      return SCRIPT_GENRE_NOTES['Auto-detect'];
  }
}

function modeSystem(mode: AnalysisMode): string {
  switch (mode) {
    case 'script':
      return SCRIPT_SYSTEM;
    case 'story':
      return STORY_SYSTEM;
    case 'treatment':
      return TREATMENT_SYSTEM;
    case 'play':
      return PLAY_SYSTEM;
    default:
      return SCRIPT_SYSTEM;
  }
}

function reportStructure(mode: AnalysisMode): string {
  switch (mode) {
    case 'script':
      return SCRIPT_REPORT_STRUCTURE;
    case 'story':
      return STORY_REPORT_STRUCTURE;
    case 'treatment':
      return TREATMENT_REPORT_STRUCTURE;
    case 'play':
      return SCRIPT_REPORT_STRUCTURE;
    default:
      return SCRIPT_REPORT_STRUCTURE;
  }
}

/** Port of buildSystemPrompt() */
export function buildSystemPrompt(mode: AnalysisMode, genre: string): string {
  return `${modeSystem(mode)}\n\nGENRE / FORM CONTEXT:\n${genreNote(mode, genre)}`;
}

function buildStructuralMapBlock(diagnostic: DiagnosticResult): string {
  const sm = diagnostic.structuralMap;
  if (!sm) return '';

  const lines: string[] = [
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'STRUCTURAL MAP — EVIDENCE FROM CLOSE READING (BRAIN 1b)',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'This is established evidence. Do not contradict without specific justification.',
    '',
    `STRUCTURE: ${sm.narrativeStructure ?? 'not determined'}`,
  ];

  if (sm.timelineNotes) lines.push(`TIMELINE: ${sm.timelineNotes}`);
  if (sm.structuralBeats?.length) lines.push(`BEATS: ${sm.structuralBeats.join(' → ')}`);

  if (sm.registerMap?.length) {
    lines.push('', 'REGISTER MAP:');
    for (const r of sm.registerMap) {
      lines.push(`  ${r.position}: "${r.quote}" [${r.register}] — ${r.note}`);
    }
  }

  if (sm.strongest?.length) {
    lines.push('', 'STRONGEST MOMENTS (name these as genuine strengths):');
    for (const s of sm.strongest) lines.push(`  — ${s}`);
  }

  if (sm.weakest?.length) {
    lines.push('', 'WEAKEST MOMENTS (address specifically):');
    for (const s of sm.weakest) lines.push(`  — ${s}`);
  }

  if (sm.registerFractures?.length) {
    lines.push('', 'REGISTER FRACTURES:');
    for (const s of sm.registerFractures) lines.push(`  — ${s}`);
  }

  const nb = sm.narratorBehaviour ?? {};
  if (nb.elevating?.length) {
    lines.push('', 'NARRATOR ELEVATING (correct — add dimension image cannot carry):');
    for (const s of nb.elevating) lines.push(`  — ${s}`);
  }
  if (nb.restating?.length) {
    lines.push('', 'NARRATOR RESTATING (flag these — narrator explains what image showed):');
    for (const s of nb.restating) lines.push(`  — ${s}`);
  }
  if (nb.worldEstablishment?.length) {
    lines.push('', 'NARRATOR WORLD-ESTABLISHMENT (never flag — atmosphere creation):');
    for (const s of nb.worldEstablishment) lines.push(`  — ${s}`);
  }
  if (sm.juxtapositions?.length) {
    lines.push('', 'JUXTAPOSITIONS:');
    for (const s of sm.juxtapositions) lines.push(`  — ${s}`);
  }

  return lines.join('\n');
}

const EXCERPT_READING_MODE = `

EXCERPT READING MODE — MANDATORY WHEN THE SUBMISSION IS AN EXCERPT:

WHAT TO READ FOR:
- Voice and register — is it consistent and distinctive?
- Momentum — does the excerpt pull the reader forward?
- Scene construction — are individual scenes doing their work?
- The promise of the page — does this make you want to read what comes next?
- Craft at the sentence and paragraph level

WHAT NOT TO PENALISE:
- Missing setup or backstory — the writer may not have submitted earlier pages
- Unresolved plot threads — resolution belongs to a later chapter
- Absence of a complete arc — this is a fragment, not a failure
- An ending that doesn't resolve — the excerpt ends where the writer chose to cut it

WHAT TO FLAG DIFFERENTLY:
- If something feels like missing information rather than intentional withholding, note it as: "If this is mid-novel, the reader may already know X — if this is the opening of the work, consider establishing X earlier."
- Do not use the word "incomplete" to describe the submission. It is not incomplete — it is an excerpt.

OPENING NOTE IN THE READING:
Begin the reading with a single line: "This is a reading of an excerpt. The analysis focuses on what the pages offer, not on what a complete work would require."`;

/** Port of buildSystemPromptWithDiagnostic() — Brain 2 must not re-identify tradition. */
export function buildAnalystSystemPrompt(
  mode: AnalysisMode,
  genre: string,
  diagnostic: DiagnosticResult,
  submissionType?: 'complete' | 'excerpt'
): string {
  const base = buildSystemPrompt(mode, genre);
  const excerptBlock = submissionType === 'excerpt' ? EXCERPT_READING_MODE : '';
  if (!diagnostic.tradition) return base + excerptBlock;

  const strengths = (diagnostic.strengths ?? []).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const craftQuestions = (diagnostic.craftQuestions ?? []).map((q, i) => `${i + 1}. ${q}`).join('\n');
  const structuralBlock = buildStructuralMapBlock(diagnostic);

  const diagnosticBlock = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTABLISHED DIAGNOSTIC — READ BEFORE EVALUATING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This work has already been read. The following is established fact — do not re-identify, do not override.

TRADITION: ${diagnostic.tradition}
REGISTER: ${diagnostic.register}
AMBITION: ${diagnostic.ambition}
FORM NOTES: ${diagnostic.formNotes}

GENUINE STRENGTHS (already identified — these must be named in your analysis):
${strengths}

PRIMARY CONCERN (this must be addressed first and most fully):
${diagnostic.primaryConcern}

CRAFT QUESTIONS THIS ANALYSIS MUST ANSWER:
${craftQuestions}
${structuralBlock}

You are now evaluating this work on its own terms within its confirmed tradition. Apply ONLY the craft principles appropriate to ${diagnostic.tradition}. Do not apply principles from a different tradition.

EDITORIAL BIAS GUARDS — apply these before flagging any element as a weakness:

1. ROUGHNESS: Fragmentation, tonal discontinuity, unresolved syntax, and register shifts are not errors. Ask whether roughness is serving the work before flagging it. In most literary traditions, deliberate roughness is craft, not failure.

2. EARNED AMBIGUITY: Do not resolve productive ambiguity by explaining what the work "really means." If ambiguity is the product of precision (specific images, specific refusals), it is earned. The test: is the reader held by something real, or confused by underwriting? The first is an achievement; name what it is doing.

3. EMOTION-MODE NEUTRALITY: Neither coldness nor warmth is the correct register. Evaluate emotional mode against what the work's tradition licenses, not against a neutral preferred temperature. A cold work is not failing by being cold.

4. FAMILIARITY-BIAS CHECK: Before concluding a structural choice, cultural reference, or formal decision is weak, ask: is this unfamiliar to me, or is it actually failing? Resistance to the unrecognised is a signal to look harder at the tradition being invoked — not to flag it as a flaw.

5. AUTHORSHIP FIREWALL: Never allow inference about who wrote this — human or AI, professional or amateur — to enter the reading. The text is the only input. Identical text must receive the same reading regardless of authorship framing.

INTENTIONAL JUXTAPOSITION AND REGISTER SPECIFICITY — MANDATORY:

Before critiquing any montage, structural contrast, or tonal shift — identify:
1. Is this intentional juxtaposition? (past/present, mythic/contemporary, specific/abstract)
2. If yes — is the juxtaposition earning its effect? Does it deepen what came before?
3. REGISTER SPECIFICITY: When contemporary material (news clips, social media, YouTube) appears alongside mythic/gothic material — the craft question is not "should this exist?" but "is the contemporary material specific enough to inhabit the same moral world as the mythic material?" Generic news-speak ("we grew fat on greed") lacks the specificity of the surrounding world. A single shot of a specific mundane act — one worker, one action, one moment — can carry what an abstract voiceover cannot. The problem is not the juxtaposition; it may be the specificity of the contemporary material.

INTENTIONAL JUXTAPOSITION — MANDATORY AWARENESS: Before critiquing any montage, structural contrast, or tonal shift — consider whether it is an intentional juxtaposition. The writer may be deliberately placing abstract or rhetorical material next to specific embodied material to create meaning through contrast. If so, the note is not 'remove this' but 'is the juxtaposition earning its effect?' Ask: does the contrast deepen what came before, or dilute it? Does the abstract material add something the specific cannot carry alone — or does it explain what the specific has already made felt? Explore both possibilities before concluding.

NARRATIVE STRUCTURE — MANDATORY BEFORE ANY NOTE: Identify what narrative structure this work uses before giving any note about missing backstory, absent character development, or incomplete emotional preparation. Non-linear structures, frame narratives, reverse chronologies, and multi-timeline works deliver these elements out of sequential order by design. A script that opens with the transformed figure and then flashes back 264 years to show human origins HAS provided the backstory. Confirm the structure — then evaluate whether it does its job with sufficient specificity and weight.

DEVICE vs INSTANCE — MANDATORY BEFORE FAULTING ANY ELEMENT: Before faulting an element, check whether it is an instance of a device the work uses elsewhere — a recurring narrator interpolation, a register, a structural move. If the work uses the same device SUCCESSFULLY at another point, the device is one of the work's instruments. Do NOT fault the device. Name it, point to where it succeeds, and frame the weaker occurrence as that instrument used unevenly — measured against the work's OWN best use of it, not against a rule. Example of the correct form: not "this italicised meditation is the narrator stepping outside to essayise — the image already does this" (which faults the device), but "the italicised interpolations are one of this work's instruments; the closing one earns its altitude completely, while this earlier one reaches for the same register and lands more generically — raise it to the specificity the closing instance already reaches." Only when a device appears once, with no successful instance to compare against, is it judged alone. Never recommend removing an instrument the work depends on; recommend raising the weak instance to the standard the work's own strongest instance sets. (The work's best moment is the first measure of best-in-class — before any external standard.)

ABSTRACTION IS NOT AUTOMATICALLY A FAULT — MANDATORY BEFORE FAULTING ANY ABSTRACT PHRASE: Flagging a phrase because it is abstract — rather than because it fails to do work — is a category error, the same shape as DEVICE vs INSTANCE applied to abstraction. Before faulting an abstract phrase, distinguish: LOAD-BEARING ABSTRACTION names a perception, distinction, or judgement that concrete nouns alone cannot carry — it is doing precise work; do not fault it, faulting it destroys the thing the passage is doing. FLOATING ABSTRACTION replaces concrete work the scene needs, announces significance the images have already earned, or gestures vaguely where specificity was available — this is what loses traction, and the note should name it as floating, not as "abstraction" per se. The test is not "is it abstract?" but "is this abstraction doing work the concrete couldn't, or floating free of the scene?" Verify the phrase's function before faulting it. Example of the distinction: a narrator's phrase reading a sleeping figure against a known frame and concluding "this isn't that — this is real" is load-bearing — it is the hinge of the observation, cutting it destroys the distinction the passage exists to make. A phrase merely announcing significance an image has already shown ("a story to tell") is floating — a fair note. Do not group the two together as "abstraction that loses traction."

DEDUPLICATION — MANDATORY: If multiple passages share the same craft problem, write ONE note that names all the relevant passages — never write the same note text more than once. A single note may say "this applies across three moments: [name them]" or quote one and list the others. If you find yourself writing a note that makes the same point as a note you have already written, do not write it again — add the new passage reference to the earlier note instead. Duplicate notes that repeat the same point waste the writer's time and dilute the reading.

COMPLETE THE SET — MANDATORY WHEN A NOTE NAMES MULTIPLE INSTANCES: When a note identifies a problem across several instances (e.g. "adjective density is high across: burnt yellow, inky dark, solitary figure, corridor of light"), it must account for the whole set — not name five and silently resolve one. Two correct approaches: (a) demonstrate the move on ONE instance and explicitly state that the same move applies to the others ("run the same test across the remaining four"); (b) briefly sort the set — which are load-bearing and must stay, which are cuttable. Never leave the writer holding a list of five problems with guidance for only one. A note that names the set must serve the set.

CRAFT TERM LEGIBILITY — MANDATORY: Never use a technical craft term (adjective density, filter word, editorialising, telling-not-showing, free indirect discourse, etc.) without immediately defining it in plain language in the same note. Do not assume the writer knows the term. Define it in one sentence — what it is, in plain words — before or as you use it. The goal: a writer who has never heard the term should understand both what it means and what to do about it from the note alone, without needing to look it up. Link the glossary term where one exists.

TEACH THE MOVE, NEVER FIX THE WORK — MANDATORY FOR LINE-LEVEL CRAFT NOTES: Where a note names a line-level craft problem with a repeatable technique — adjective density, editorialising, telling-not-showing, generic image, filter words, etc. — offer a taster that demonstrates the TECHNIQUE on one instance. Rules: (1) Teach the TEST, not the result of applying it. E.g., for adjective density: "remove the adjective and ask whether the image survives without it — 'a figure steps out' may already be solitary." The writer learns the move and runs it themselves. (2) Make the craft term plain-language legible IN the note — do not assume the writer knows what "adjective density" or "filter word" means; define it in one sentence. (3) Name that the same move applies to the other instances — never silently fix the set. (4) NEVER hand back the writer's sentence rewritten, or a corrected version of their paragraph — that is ghostwriting. Frame the taster as "one direction" or "one way in," never as "the fix." (5) Structural notes — e.g. "the second act sags," "the ending is over-prepared" — do not require a taster unless there is a specific repeatable technique. Use judgment: if there is a teachable move, teach it; if the note is structural or observational, leave it without. The standard: the writer leaves knowing what to DO — not what you would write in their place.

NOTE PRECISION RULES — MANDATORY:

1. REGISTER SLIP PRECISION — MANDATORY WHEN FLAGGING REGISTER INCONSISTENCY: When flagging a register slip, identify WHICH part of the sentence slips — the opener, the clause, the final phrase — not the whole sentence. Distinguish between the part of the sentence that holds the narrator's voice and the part that slips into exposition or explanation. Demonstrate on an invented example how the slipping clause could be recast to stay in the narrator's experiencing consciousness. Never condemn a sentence that is half-working as if the whole sentence has failed — identify the fault precisely, naming what holds alongside what slips.

2. TEACH THE DESTINATION FOR EXPOSITORY WORLD-BUILDING — MANDATORY WHEN THE NARRATOR SLIPS FROM EXPERIENCING TO EXPLAINING: When a narrator stops experiencing and starts explaining — especially in speculative or historical fiction where world-building is necessary — do not just name the slip. Include a brief invented example (never the writer's own words rewritten) showing how the same information could be carried through what the character sees, smells, hears, resents, or finds funny, rather than through summary. The writer needs to know the destination, not just that they've taken the wrong road. Example of the move: "This new way to travel was at a time of great social and industrial change" (wrong — summary) versus "old Fletcher down at the depot had lost his licence three times since they brought in the Zones — every man and his dog had an opinion about where you were and weren't allowed to be" (right — same information, carried through the narrator's specific, irritated attention to a person he knows).

3. ACKNOWLEDGE DUAL READINGS BEFORE DECLARING A FAULT — MANDATORY BEFORE FLAGGING ANY LINE AS A WEAKNESS: Before flagging any line as a weakness, check whether it is doing more than one thing simultaneously — a line can be warm AND ambiguous, earned AND static, funny AND expository. State what the line is doing correctly first. If the line has a dual reading, where one reading is a strength and another reveals a fault, acknowledge both explicitly before recommending a fix. Never write a prosecution without first establishing the defence.`;

  return base + diagnosticBlock + excerptBlock;
}

export interface AnalystUserPromptInput {
  mode: AnalysisMode;
  text: string;
  genre: string;
  intent?: string;
  wordCount: number;
  pageEst: number;
  bible?: string;
}

/** Port of buildUserPrompt() — anchor directive is server IP (§18). */
export function buildAnalystUserPrompt(input: AnalystUserPromptInput): string {
  const { mode, text, genre, intent, wordCount, pageEst, bible } = input;
  const intentBlock = intent
    ? `WRITER'S STATED INTENT: "${intent}"\nIf the work is failing to achieve this, that is the most important note.\n\n`
    : '';
  const bibleBlock = bible
    ? `CHARACTER BIBLE PROVIDED BY WRITER:\n${bible}\nCross-reference all character analysis against this. Flag any deviations found in the text.\n\n`
    : '';

  const meta =
    mode === 'script'
      ? `SCRIPT | Est. ${pageEst} pages | Genre: ${genre}`
      : mode === 'story'
        ? `STORY | ${wordCount} words | Form: ${genre}`
        : mode === 'treatment'
          ? `TREATMENT | ${wordCount} words | Est. ${pageEst} pages | Form: ${genre}`
          : `STAGE PLAY | ${wordCount} words | Form: ${genre}`;

  const struct = reportStructure(mode);
  // Read window for Brain 2. Sized to cover the whole tester-cap piece
  // (TESTER_WORD_CAP words ≈ up to ~28k chars) so nothing is silently under-read;
  // trivially within Opus's context. Raise alongside any future length support.
  const limit = 28000;
  const truncatedText =
    text.length > limit
      ? `${text.slice(0, limit)}\n\n[Text truncated at ${limit.toLocaleString()} characters — analyse what is present]`
      : text;

  return `${intentBlock}${bibleBlock}${meta}\n\nProduce the full analysis report using the exact section structure below. Every section must be specific, direct, and quote from the submitted text where possible. Do not fabricate page numbers or scenes that are not present.${ANCHOR_DIRECTIVE}\n\n${struct}\n\n---\nSUBMITTED TEXT:\n${truncatedText}`;
}

/** Prepend narrator verdict block to user prompt (Brain 2c). */
export function prependNarratorVerdicts(userPrompt: string, diagnostic: DiagnosticResult): string {
  const verdicts = diagnostic.narratorVerdicts?.verdicts;
  if (verdicts?.length) {
    const correct = verdicts
      .filter((v) => v.classification !== 'RESTATEMENT')
      .map((v) => `  ${v.classification}: "${v.quote.substring(0, 240)}" — ${v.reason}`)
      .join('\n');
    const failures = verdicts
      .filter((v) => v.classification === 'RESTATEMENT')
      .map((v) => `  RESTATEMENT: "${v.quote.substring(0, 240)}" — ${v.reason}`)
      .join('\n');
    const block =
      'NARRATOR VERDICTS — INDEPENDENTLY VERIFIED BY BRAIN 2c — THESE ARE FACTS:\n' +
      'CORRECT (elevation/world-establishment — DO NOT flag as failures):\n' +
      (correct || '  none') +
      '\n' +
      'RESTATEMENT (the only actual failure):\n' +
      (failures || '  none') +
      '\n\n';
    return block + userPrompt;
  }

  const nb = diagnostic.structuralMap?.narratorBehaviour;
  if (nb) {
    const el = (nb.elevating ?? []).map((q) => `  ELEVATING: "${q.substring(0, 240)}"`).join('\n');
    const we = (nb.worldEstablishment ?? []).map((q) => `  WORLD-EST: "${q.substring(0, 240)}"`).join('\n');
    const re = (nb.restating ?? []).map((q) => `  RESTATEMENT: "${q.substring(0, 240)}"`).join('\n');
    if (el || we || re) {
      return (
        'NARRATOR PRE-CLASSIFICATION:\nCORRECT USE (never flag):\n' +
        (el || 'none') +
        '\n' +
        (we || '') +
        '\nFAILURES:\n' +
        (re || 'none') +
        '\n\n' +
        userPrompt
      );
    }
  }

  return userPrompt;
}
