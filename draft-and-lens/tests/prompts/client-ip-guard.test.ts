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

  it('UI layers do not import prompts or ai directly', () => {
    const uiRoots = [
      path.join(root, 'src', 'components'),
      path.join(root, 'src', 'app'),
      path.join(root, 'src', 'lib'),
    ];
    const forbidden = ['@/prompts', '@/ai', "from '../prompts", "from '../ai"];
    for (const uiRoot of uiRoots) {
      if (!fs.existsSync(uiRoot)) continue;
      for (const file of walkTsFiles(uiRoot)) {
        if (file.includes(`${path.sep}api${path.sep}`)) continue;
        const src = fs.readFileSync(file, 'utf8');
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

  it('has 27 lens voices', () => {
    const types = fs.readFileSync(path.join(promptsDir, 'lenses', 'types.ts'), 'utf8');
    const match = types.match(/LENS_IDS = (\[[\s\S]*?\]) as const/);
    expect(match).not.toBeNull();
    const ids = JSON.parse(match![1]!.replace(/'/g, '"')) as string[];
    expect(ids).toHaveLength(27);
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
    expect(prompt).toContain('Do not re-identify');
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
