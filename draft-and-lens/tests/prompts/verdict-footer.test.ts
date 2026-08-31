import { describe, expect, it } from 'vitest';

import { buildScriptReportStructure } from '../../src/prompts/report/script-structure';
import { buildStoryReportStructure } from '../../src/prompts/report/story-structure';
import { buildTreatmentReportStructure } from '../../src/prompts/report/treatment-structure';
import { extractVerdict } from '../../src/components/analysis/report';

/**
 * The prompt asks for the bold verdict because that is what the model writes
 * anyway, on every path. This pins the two halves of that decision together:
 * the prompt asks for the form that actually occurs, AND every ruling each mode
 * can emit still parses — including the bold-plus-bracket shape the templates
 * now literally contain, in case a model ever echoes the menu verbatim.
 */

const MODES = [
  ['story', buildStoryReportStructure(), ['PUBLISH READY', 'DEVELOP FURTHER', 'SIGNIFICANT REWORK NEEDED']],
  ['script', buildScriptReportStructure(), ['RECOMMEND', 'CONSIDER WITH REVISIONS', 'PASS — BUT WATCH THE WRITER', 'PASS']],
  ['treatment', buildTreatmentReportStructure(), ['READY TO DRAFT', 'DEVELOP FURTHER', 'SIGNIFICANT REWORK NEEDED']],
] as const;

const DETAIL = 'This story is very close to being finished. '.repeat(21);

describe('the verdict footer', () => {
  it.each(MODES)('%s asks for the bold form', (_mode, structure) => {
    expect(structure).toContain('**VERDICT: [');
    expect(structure).toContain(']**');
    // and never leaves a bare one behind
    expect(structure).not.toMatch(/\n\s*VERDICT: \[/);
  });

  it.each(MODES)('%s: every ruling it can emit parses from the bold form', (_mode, _s, rulings) => {
    for (const r of rulings) {
      const v = extractVerdict(`## OVERVIEW\nBody.\n\n---\n**VERDICT: ${r}**\n\n${DETAIL}`);
      expect(v?.ruling, r).toBe(r);
      expect(v!.detail.length).toBeGreaterThan(400);
    }
  });

  it('parses the template shape itself, brackets and all', () => {
    const v = extractVerdict(`## OVERVIEW\nBody.\n\n---\n**VERDICT: [DEVELOP FURTHER]**\n\n${DETAIL}`);
    expect(v?.ruling).toBe('DEVELOP FURTHER');
  });

  it('keeps the safety net: bare and ## forms still parse', () => {
    for (const line of ['VERDICT: DEVELOP FURTHER', '## VERDICT: DEVELOP FURTHER']) {
      const v = extractVerdict(`## OVERVIEW\nBody.\n\n---\n${line}\n\n${DETAIL}`);
      expect(v?.ruling, line).toBe('DEVELOP FURTHER');
    }
  });
});
