import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildAnalystSystemPrompt } from '../../src/prompts/analyst';
import type { DiagnosticResult } from '../../src/prompts/types';

const root = path.join(__dirname, '..', '..');
const promptsDir = path.join(root, 'src', 'prompts');
const aiDir = path.join(root, 'src', 'ai');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTsFiles(full));
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Distinctive phrases that must never appear in a client bundle. */
const FORBIDDEN_CLIENT_PHRASES = [
  'STEP ONE — IDENTIFY THE TRADITION. THIS IS NOT OPTIONAL.',
  'WHAT A TREATMENT IS — READ THIS FIRST:',
  'You are Steven Spielberg reviewing a piece of writing.',
  'ANCHORING — IMPORTANT FOR THE READER:',
  'Whenever a note quotes a specific phrase, line, or passage VERBATIM',
  'ANTHROPIC_API_KEY',
  'sk-ant-',
];

describe('client-IP guard', () => {
  it('every prompts/ module imports server-only', () => {
    for (const file of walkTsFiles(promptsDir)) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src, file).toMatch(/^import 'server-only';/);
    }
  });

  it('every ai/ module imports server-only', () => {
    for (const file of walkTsFiles(aiDir)) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src, file).toMatch(/^import 'server-only';/);
    }
  });

  /**
   * `import type` is stripped before checking, and that is a narrowing of the
   * guard rather than a hole in it.
   *
   * What this test defends is prompt IP reaching the browser. A type-only
   * import emits NO JavaScript — TypeScript erases it — so it cannot carry a
   * prompt string into a bundle even in principle. Matching on it flagged
   * `lib/cost-log.ts` for `import type { CostEntry }`, a file that also
   * declares `server-only` and therefore cannot be client-bundled at all.
   *
   * The real protections are unchanged and separately asserted: every
   * prompts/ and ai/ module declares `server-only` (the two tests above), and
   * the built bundle is grepped for prompt phrases (the test below). A VALUE
   * import from prompts/ or ai/ still fails here.
   */
  it('UI layers do not import prompts or ai directly', () => {
    const uiRoots = [
      path.join(root, 'src', 'components'),
      path.join(root, 'src', 'app'),
      path.join(root, 'src', 'lib'),
    ];
    const forbidden = ['@/prompts', '@/ai', "from '../prompts", "from '../ai"];
    // Drops `import type { X } from '...'` — including multi-line forms —
    // while leaving every value import in place to be checked.
    const stripTypeImports = (src: string) =>
      src.replace(/^\s*import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    for (const uiRoot of uiRoots) {
      if (!fs.existsSync(uiRoot)) continue;
      for (const file of walkTsFiles(uiRoot)) {
        if (file.includes(`${path.sep}api${path.sep}`)) continue;
        const src = stripTypeImports(fs.readFileSync(file, 'utf8'));
        for (const needle of forbidden) {
          expect(src.includes(needle), `${file} imports ${needle}`).toBe(false);
        }
      }
    }
  });

  it('prompt IP exists server-side (sanity check)', () => {
    const scriptSystem = fs.readFileSync(path.join(promptsDir, 'modes', 'script.ts'), 'utf8');
    expect(scriptSystem).toContain('STEP ONE — IDENTIFY THE TRADITION. THIS IS NOT OPTIONAL.');
    const lensPrompts = fs.readFileSync(path.join(promptsDir, 'lenses', 'prompts.ts'), 'utf8');
    expect(lensPrompts).toContain('You are Steven Spielberg reviewing a piece of writing.');
    const anchor = fs.readFileSync(path.join(promptsDir, 'fragments', 'anchor-directive.ts'), 'utf8');
    expect(anchor).toContain('ANCHORING — IMPORTANT FOR THE READER:');
  });
});

describe('prompts integrity', () => {
  it('has all four mode system prompts', () => {
    for (const mode of ['script', 'story', 'play', 'treatment']) {
      expect(fs.existsSync(path.join(promptsDir, 'modes', `${mode}.ts`))).toBe(true);
    }
  });

  /**
   * The count is a tripwire against an accidental deletion, NOT the real
   * check. It went stale once already — eight voices were added and this
   * assertion kept asserting 27 — so the invariant below is what actually
   * protects the feature: every advertised id must resolve to both a meta
   * entry and a system prompt. An id in the list with no prompt behind it is
   * a lens the UI offers and the API cannot serve.
   *
   * A deliberate change to the roster means updating this number in the same
   * commit that changes LENS_IDS.
   */
  it('advertises 35 lens voices, each with meta and a system prompt', () => {
    const lensDir = path.join(promptsDir, 'lenses');
    const types = fs.readFileSync(path.join(lensDir, 'types.ts'), 'utf8');
    const match = types.match(/LENS_IDS = (\[[\s\S]*?\]) as const/);
    expect(match).not.toBeNull();
    const ids = JSON.parse(match![1]!.replace(/'/g, '"')) as string[];
    expect(ids).toHaveLength(35);

    const meta = fs.readFileSync(path.join(lensDir, 'meta.ts'), 'utf8');
    const prompts = fs.readFileSync(path.join(lensDir, 'prompts.ts'), 'utf8');
    const missingMeta = ids.filter((id) => !meta.includes(`"${id}":`));
    const missingPrompt = ids.filter((id) => !prompts.includes(`"${id}":`));
    expect(missingMeta, `lens ids with no meta entry: ${missingMeta.join(', ')}`).toEqual([]);
    expect(missingPrompt, `lens ids with no system prompt: ${missingPrompt.join(', ')}`).toEqual([]);
  });

  it('Brain 2 never re-identifies the tradition', () => {
    const diagnostic: DiagnosticResult = {
      tradition: 'Mythic allegory in the Conrad tradition',
      register: 'elevated',
      ambition: 'moral fable',
      craftQuestions: ['Does the spine hold?'],
      strengths: ['Opening image'],
      primaryConcern: 'Narrator restatement',
      title: 'Test',
      summary: 'Test',
      formNotes: '',
    };
    const prompt = buildAnalystSystemPrompt('script', 'Auto-detect', diagnostic);
    expect(prompt).toContain('ESTABLISHED DIAGNOSTIC');
    // Verbatim from the prototype prompt (lowercase, mid-sentence): "established
    // fact — do not re-identify, do not override". The prompt is the source of
    // truth (ported verbatim from DraftAndLens.html); the test conforms to it.
    expect(prompt).toContain('do not re-identify');
    expect(prompt).toContain(diagnostic.tradition);
  });
});

describe('built client bundle guard (run after next build)', () => {
  it('no prompt phrase in .next/static chunks when build exists', () => {
    const staticDir = path.join(root, '.next', 'static');
    if (!fs.existsSync(staticDir)) {
      expect(true).toBe(true);
      return;
    }
    const chunks: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.js')) chunks.push(fs.readFileSync(p, 'utf8'));
      }
    };
    walk(staticDir);
    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      for (const phrase of FORBIDDEN_CLIENT_PHRASES) {
        expect(chunk.includes(phrase), `leak: ${phrase}`).toBe(false);
      }
    }
  });
});
