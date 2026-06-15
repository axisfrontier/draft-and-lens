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
 * Last reviewed: 2026-06-07 (ported verbatim from DraftAndLens.html)
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

/** Port of buildSystemPromptWithDiagnostic() — Brain 2 must not re-identify tradition. */
export function buildAnalystSystemPrompt(
  mode: AnalysisMode,
  genre: string,
  diagnostic: DiagnosticResult
): string {
  const base = buildSystemPrompt(mode, genre);
  if (!diagnostic.tradition) return base;

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

INTENTIONAL JUXTAPOSITION AND REGISTER SPECIFICITY — MANDATORY:

Before critiquing any montage, structural contrast, or tonal shift — identify:
1. Is this intentional juxtaposition? (past/present, mythic/contemporary, specific/abstract)
2. If yes — is the juxtaposition earning its effect? Does it deepen what came before?
3. REGISTER SPECIFICITY: When contemporary material (news clips, social media, YouTube) appears alongside mythic/gothic material — the craft question is not "should this exist?" but "is the contemporary material specific enough to inhabit the same moral world as the mythic material?" Generic news-speak ("we grew fat on greed") lacks the specificity of the surrounding world. A single shot of a specific mundane act — one worker, one action, one moment — can carry what an abstract voiceover cannot. The problem is not the juxtaposition; it may be the specificity of the contemporary material.

INTENTIONAL JUXTAPOSITION — MANDATORY AWARENESS: Before critiquing any montage, structural contrast, or tonal shift — consider whether it is an intentional juxtaposition. The writer may be deliberately placing abstract or rhetorical material next to specific embodied material to create meaning through contrast. If so, the note is not 'remove this' but 'is the juxtaposition earning its effect?' Ask: does the contrast deepen what came before, or dilute it? Does the abstract material add something the specific cannot carry alone — or does it explain what the specific has already made felt? Explore both possibilities before concluding.

NARRATIVE STRUCTURE — MANDATORY BEFORE ANY NOTE: Identify what narrative structure this work uses before giving any note about missing backstory, absent character development, or incomplete emotional preparation. Non-linear structures, frame narratives, reverse chronologies, and multi-timeline works deliver these elements out of sequential order by design. A script that opens with the transformed figure and then flashes back 264 years to show human origins HAS provided the backstory. Confirm the structure — then evaluate whether it does its job with sufficient specificity and weight.`;

  return base + diagnosticBlock;
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
  const limit = 14000;
  const truncatedText =
    text.length > limit
      ? `${text.slice(0, limit)}\n\n[Text truncated at 14,000 characters — analyse what is present]`
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
