/**
 * Extracts verbatim prompt constants from DraftAndLens.html into scripts/.extracted/prompts.json
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'DraftAndLens.html'), 'utf8').match(
  /<script>([\s\S]*)<\/script>/
)?.[1];
if (!script) throw new Error('No script block');

function extractBacktickConst(name) {
  const marker = `const ${name} = \``;
  const start = script.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${name}`);
  let i = start + marker.length;
  let result = '';
  while (i < script.length) {
    const ch = script[i];
    if (ch === '\\') {
      result += script.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (ch === '`') return result;
    result += ch;
    i++;
  }
  throw new Error(`Unclosed template for ${name}`);
}

function extractObjectConst(name) {
  const marker = `const ${name} = `;
  const start = script.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${name}`);
  const braceStart = script.indexOf('{', start);
  let depth = 0;
  let i = braceStart;
  while (i < script.length) {
    const ch = script[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        const objSrc = script.slice(braceStart, i + 1);
        return vm.runInNewContext(`(${objSrc})`, {});
      }
    }
    i++;
  }
  throw new Error(`Unclosed object for ${name}`);
}

function extractFunction(name) {
  const marker = `function ${name}`;
  const start = script.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${name}`);
  const braceStart = script.indexOf('{', start);
  let depth = 0;
  let i = braceStart;
  while (i < script.length) {
    const ch = script[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return script.slice(start, i + 1);
    }
    i++;
  }
  throw new Error(`Unclosed function ${name}`);
}

const STRING_CONSTS = [
  'SCRIPT_SYSTEM',
  'STORY_SYSTEM',
  'PLAY_SYSTEM',
  'TREATMENT_SYSTEM',
  'SCRIPT_REPORT_STRUCTURE',
  'STORY_REPORT_STRUCTURE',
  'TREATMENT_REPORT_STRUCTURE',
  'PASS1_SYSTEM',
  'STRUCTURAL_READER_SYSTEM',
];

const OBJECT_CONSTS = [
  'SCRIPT_GENRE_NOTES',
  'STORY_GENRE_NOTES',
  'PLAY_GENRE_NOTES',
  'TREATMENT_GENRE_NOTES',
  'LENS_DATA',
];

const ARRAY_CONSTS = ['SCRIPT_GENRES', 'STORY_GENRES', 'PLAY_GENRES', 'TREATMENT_GENRES'];

const strings = {};
for (const name of STRING_CONSTS) strings[name] = extractBacktickConst(name);

const objects = {};
for (const name of OBJECT_CONSTS) {
  const raw = extractObjectConst(name);
  if (name === 'LENS_DATA') {
    objects[name] = Object.fromEntries(
      Object.entries(raw).map(([id, d]) => [
        id,
        {
          name: d.name,
          surname: d.surname,
          descriptor: d.descriptor,
          craftPhilosophy: d.craftPhilosophy,
        },
      ])
    );
  } else {
    objects[name] = raw;
  }
}

const arrays = {};
for (const name of ARRAY_CONSTS) {
  const marker = `const ${name} = `;
  const start = script.indexOf(marker);
  const bracketStart = script.indexOf('[', start);
  let depth = 0;
  let i = bracketStart;
  while (i < script.length) {
    if (script[i] === '[') depth++;
    if (script[i] === ']') {
      depth--;
      if (depth === 0) {
        arrays[name] = vm.runInNewContext(script.slice(bracketStart, i + 1), {});
        break;
      }
    }
    i++;
  }
}

const getLensFn = extractFunction('getLensSystemPrompt');
const getLensSystemPrompt = vm.runInNewContext(`${getLensFn}\ngetLensSystemPrompt;`, {});
const lensPrompts = {};
for (const id of Object.keys(objects.LENS_DATA)) {
  let p = getLensSystemPrompt(id);
  // Prototype ends prompts with "\\" + traditionContext; strip artefact backslash when empty.
  if (p.endsWith('\\')) p = p.slice(0, -1);
  lensPrompts[id] = p;
}

const buildFns = vm.runInNewContext(
  `(function() {
  ${STRING_CONSTS.map((n) => `const ${n} = ${JSON.stringify(strings[n])};`).join('\n')}
  ${OBJECT_CONSTS.filter((n) => n !== 'LENS_DATA')
    .map((n) => `const ${n} = ${JSON.stringify(objects[n])};`)
    .join('\n')}
  ${extractFunction('buildSystemPrompt')}
  ${extractFunction('buildSystemPromptWithDiagnostic')}
  return { buildSystemPrompt, buildSystemPromptWithDiagnostic };
  })()`,
  {}
);

const anchorMatch = script.match(
  /const anchorDirective = `([\s\S]*?)`\n  return `\$\{intentBlock\}/
);
const anchorDirective = anchorMatch?.[1] ?? '';

const knownWorkMatch = script.match(
  /(KNOWN-WORK CHECK \(do this FIRST\):[\s\S]*?If you are NOT highly confident it is a known work, leave "knownWork" as an empty string and treat it as an original work in the normal way\. Do not guess\.)/
);
const knownWorkCheck = knownWorkMatch?.[1] ?? '';

const narratorVerifier = script.match(
  /const system = `(You are classifying narrator behaviour[\s\S]*?Return ONLY valid JSON: \{ "verdicts": \[.*?\] \})`/
)?.[1];

const narratorCorrectorTemplate = script.match(
  /const system = `(You are a precise editorial corrector\.[\s\S]*?VERIFIED CORRECT NARRATOR LINES \(must not be criticised as failures\):\n)\$\{protectedList\}`/
)?.[1] + '${protectedList}';

const structuralReaderTreatmentBranch = script.match(
  /const treatmentLine = \/treatment\/i\.test\(modeLabel\)\s*\? `([\s\S]*?)`\s*: ''/
)?.[1];

const partialReadRules = [
  '- Open by telling the writer, in your own register, that this reading covers the opening portion only.',
  '- Evaluate fully and confidently ONLY what is present: opening, voice, register, inciting incident, how stakes and world are established.',
  '- For anything that depends on the whole — overall arc, midpoint, third act, ending, whether setups pay off, whether momentum is sustained — DO NOT CONCLUDE. You have not read it. Instead, name what the opening PROMISES or SETS UP, and frame the unseen as an open question.',
  "- NEVER invent a third-act problem. NEVER say the work \"loses momentum\", \"fails to resolve\", or \"the ending doesn't earn it\" if that material was not in the text you received.",
  '- Be confident about the opening; be explicitly provisional about the whole. This honesty is a feature, not a hedge.',
];

const conversationFnSource = script.slice(
  script.indexOf('function buildConvEditorialSystem()'),
  script.indexOf('function buildConvMessages')
);

const outDir = path.join(root, 'scripts', '.extracted');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'prompts.json'),
  JSON.stringify(
    {
      strings,
      objects,
      arrays,
      lensPrompts,
      anchorDirective,
      knownWorkCheck,
      narratorVerifier,
      narratorCorrectorTemplate,
      structuralReaderTreatmentBranch,
      partialReadRules,
      conversationFnSource,
      buildFnsSample: {
        script: buildFns.buildSystemPrompt('script', 'Auto-detect').slice(0, 80),
      },
    },
    null,
    2
  )
);

console.log('Lenses:', Object.keys(objects.LENS_DATA).length);
console.log('Lens prompts:', Object.keys(lensPrompts).length);
console.log('OK → scripts/.extracted/prompts.json');
