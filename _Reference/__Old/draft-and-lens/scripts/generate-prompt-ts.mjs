/**
 * Generates src/prompts/*.ts from scripts/.extracted/prompts.json (verbatim content).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'scripts', '.extracted', 'prompts.json'), 'utf8'));
const promptsDir = path.join(root, 'src', 'prompts');

const SERVER_HEADER = `import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */
`;

function tsString(value) {
  return JSON.stringify(value);
}

function write(rel, content) {
  const file = path.join(promptsDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('wrote', rel);
}

// ── Modes ──
const modeMap = {
  script: 'SCRIPT_SYSTEM',
  story: 'STORY_SYSTEM',
  play: 'PLAY_SYSTEM',
  treatment: 'TREATMENT_SYSTEM',
};
for (const [file, key] of Object.entries(modeMap)) {
  write(
    `modes/${file}.ts`,
    `${SERVER_HEADER}
/** Encodes tradition-first screenplay/story/play/treatment analysis (LearnedCorpus P1). */
export const ${key} = ${tsString(data.strings[key])};
`
  );
}

// ── Report structures ──
const reportMap = {
  'script-structure.ts': 'SCRIPT_REPORT_STRUCTURE',
  'story-structure.ts': 'STORY_REPORT_STRUCTURE',
  'treatment-structure.ts': 'TREATMENT_REPORT_STRUCTURE',
};
for (const [file, key] of Object.entries(reportMap)) {
  write(
    `report/${file}`,
    `${SERVER_HEADER}
/** Report section contract for the analyst (Brain 2). */
export const ${key} = ${tsString(data.strings[key])};
`
  );
}

write(
  'report/play-structure.ts',
  `${SERVER_HEADER}
/**
 * Prototype routes play mode to SCRIPT_REPORT_STRUCTURE (buildUserPrompt).
 * Re-export avoids duplicating identical structure text.
 */
export { SCRIPT_REPORT_STRUCTURE as PLAY_REPORT_STRUCTURE } from './script-structure';
`
);

// ── Genres ──
write(
  'genres/index.ts',
  `${SERVER_HEADER}
/** Genre-specific craft notes appended to mode system prompts. */
export const SCRIPT_GENRE_NOTES = ${JSON.stringify(data.objects.SCRIPT_GENRE_NOTES, null, 2)} as const;

export const STORY_GENRE_NOTES = ${JSON.stringify(data.objects.STORY_GENRE_NOTES, null, 2)} as const;

export const PLAY_GENRE_NOTES = ${JSON.stringify(data.objects.PLAY_GENRE_NOTES, null, 2)} as const;

export const TREATMENT_GENRE_NOTES = ${JSON.stringify(data.objects.TREATMENT_GENRE_NOTES, null, 2)} as const;

export const SCRIPT_GENRES = ${JSON.stringify(data.arrays.SCRIPT_GENRES)} as const;
export const STORY_GENRES = ${JSON.stringify(data.arrays.STORY_GENRES)} as const;
export const PLAY_GENRES = ${JSON.stringify(data.arrays.PLAY_GENRES)} as const;
export const TREATMENT_GENRES = ${JSON.stringify(data.arrays.TREATMENT_GENRES)} as const;

export type ScriptGenre = (typeof SCRIPT_GENRES)[number];
export type StoryGenre = (typeof STORY_GENRES)[number];
export type PlayGenre = (typeof PLAY_GENRES)[number];
export type TreatmentGenre = (typeof TREATMENT_GENRES)[number];
`
);

// ── Diagnostic & structural reader ──
write(
  'diagnostic.ts',
  `${SERVER_HEADER}
/** Brain 1 — tradition identification before any craft rule (LearnedCorpus P1). */
export const PASS1_SYSTEM = ${tsString(data.strings.PASS1_SYSTEM)};
`
);

write(
  'structural-reader.ts',
  `${SERVER_HEADER}
/** Brain 1b — evidence map only; no evaluation. */
export const STRUCTURAL_READER_SYSTEM = ${tsString(data.strings.STRUCTURAL_READER_SYSTEM)};

/** Appended to Brain 1b user message when mode is Treatment (§06a). */
export const STRUCTURAL_READER_TREATMENT_BRANCH = ${tsString(data.structuralReaderTreatmentBranch)};
`
);

// ── Fragments ──
write(
  'fragments/anchor-directive.ts',
  `${SERVER_HEADER}
/** ⟦…⟧ quote-wrapping instruction for Brain 2 (§18, server IP). */
export const ANCHOR_DIRECTIVE = ${tsString(data.anchorDirective)};
`
);

write(
  'fragments/known-work.ts',
  `${SERVER_HEADER}
/** Confidence-gated known-work check for Brain 4 (§14). */
export const KNOWN_WORK_CHECK = ${tsString(data.knownWorkCheck)};
`
);

write(
  'fragments/partial-read.ts',
  `${SERVER_HEADER}
/** Rules appended when tier truncation applies (§13). */
export const PARTIAL_READ_RULES = ${JSON.stringify(data.partialReadRules, null, 2)} as const;

/** Build the partial-read directive exactly as the prototype concatenates it. */
export function buildPartialReadDirective(wordsRead: number, wordsTotal?: number): string {
  const pct =
    wordsTotal && wordsTotal > 0
      ? \` (approximately \${Math.round((wordsRead / wordsTotal) * 100)}% of the ~\${wordsTotal.toLocaleString()}-word submission)\`
      : '';
  const header =
    'PARTIAL READ — CRITICAL HONESTY CONSTRAINT:\\n' +
    'You have received only the FIRST ' +
    wordsRead.toLocaleString() +
    ' words of a longer work' +
    pct +
    '. This is the OPENING ONLY.\\n' +
    'RULES:\\n';
  return header + PARTIAL_READ_RULES.map((r) => \`- \${r}\`).join('\\n') + '\\n\\n';
}
`
);

// ── Narrator ──
write(
  'narrator.ts',
  `${SERVER_HEADER}
/** Narrator verifier — Sonnet, pure JSON classification. */
export const NARRATOR_VERIFIER_SYSTEM = ${tsString(data.narratorVerifier)};

/**
 * Narrator corrector — Opus. Template uses \${protectedList} placeholder.
 * Rewrites (never deletes) notes that wrongly flag verified elevation lines.
 */
export const NARRATOR_CORRECTOR_TEMPLATE = ${tsString(data.narratorCorrectorTemplate)};

export function buildNarratorCorrectorSystem(protectedList: string): string {
  return NARRATOR_CORRECTOR_TEMPLATE.replace('\${protectedList}', protectedList);
}
`
);

// ── Lenses ──
const lensIds = Object.keys(data.objects.LENS_DATA);
write(
  'lenses/types.ts',
  `${SERVER_HEADER}
export const LENS_IDS = ${JSON.stringify(lensIds)} as const;
export type LensId = (typeof LENS_IDS)[number];

export type LensCategory = 'directors' | 'writers' | 'screenwriters' | 'showrunners' | 'producers';

export interface LensMeta {
  name: string;
  surname?: string;
  descriptor: string;
  craftPhilosophy: string;
  category: LensCategory;
}

/** UI grouping mirrors prototype lens strips (§16). */
export const LENS_CATEGORIES: Record<LensCategory, LensId[]> = {
  directors: ['spielberg', 'coppola', 'coens', 'villeneuve', 'scott', 'welles', 'jeunet', 'tarantino', 'wachowski', 'lucas', 'miyazaki'],
  writers: ['hemingway', 'carver', 'chekhov', 'oconnor', 'bukowski', 'nabokov', 'king'],
  screenwriters: ['sorkin', 'roth', 'kaufman', 'puzo'],
  showrunners: ['simon', 'fey'],
  producers: ['bruckheimer', 'feige'],
};
`
);

const metaEntries = Object.entries(data.objects.LENS_DATA).map(([id, meta]) => {
  let category = 'directors';
  for (const [cat, ids] of Object.entries({
    directors: ['spielberg', 'coppola', 'coens', 'villeneuve', 'scott', 'welles', 'jeunet', 'tarantino', 'wachowski', 'lucas', 'miyazaki'],
    writers: ['hemingway', 'carver', 'chekhov', 'oconnor', 'bukowski', 'nabokov', 'king'],
    screenwriters: ['sorkin', 'roth', 'kaufman', 'puzo'],
    showrunners: ['simon', 'fey'],
    producers: ['bruckheimer', 'feige'],
  })) {
    if (ids.includes(id)) category = cat;
  }
  return [id, { ...meta, category }];
});

write(
  'lenses/meta.ts',
  `${SERVER_HEADER}
import type { LensId, LensMeta } from './types';

export const LENS_META: Record<LensId, LensMeta> = ${JSON.stringify(Object.fromEntries(metaEntries), null, 2)} as Record<LensId, LensMeta>;
`
);

// Lens prompts as individual exports in prompts.ts (large file)
const lensPromptLines = Object.entries(data.lensPrompts)
  .map(([id, prompt]) => `  ${JSON.stringify(id)}: ${tsString(prompt)},`)
  .join('\n');

write(
  'lenses/prompts.ts',
  `${SERVER_HEADER}
import type { LensId } from './types';

/** Complete standalone system prompt per lens (§17). */
export const LENS_SYSTEM_PROMPTS: Record<LensId, string> = {
${lensPromptLines}
};
`
);

write(
  'lenses/index.ts',
  `${SERVER_HEADER}
export { LENS_IDS, LENS_CATEGORIES, type LensId, type LensMeta, type LensCategory } from './types';
export { LENS_META } from './meta';
export { LENS_SYSTEM_PROMPTS } from './prompts';

import type { LensId } from './types';
import { LENS_SYSTEM_PROMPTS } from './prompts';

/** Port of getLensSystemPrompt() — tradition is locked from Brain 1. */
export function getLensSystemPrompt(
  id: LensId,
  tradition?: string,
  register?: string,
  ambition?: string
): string {
  const base = LENS_SYSTEM_PROMPTS[id];
  if (!tradition) return base;
  return (
    base +
    \`\\n\\nCONFIRMED TRADITION: \${tradition}\\nREGISTER: \${register ?? ''}\\nAMBITION: \${ambition ?? ''}\\n\\nApply your specific craft intelligence to this tradition. Do not re-identify it.\`
  );
}
`
);

console.log('Done.');
