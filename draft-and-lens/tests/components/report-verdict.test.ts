import { describe, expect, it } from 'vitest';

import { extractVerdict, parseReport } from '../../src/components/analysis/report';

/**
 * `ReportView` renders a permanent "Verdict" sidebar link, so a verdict that
 * fails to parse is not a quiet degradation — it is a link that scrolls the
 * writer to an empty div at the end of their reading.
 *
 * It failed on every report whose closing paragraph ran past 400 characters,
 * which the structure prompts ask for ("one honest paragraph") and which three
 * consecutive real readings delivered at 839, 909 and 911. These tests are
 * sized against that reality rather than against a short fixture, because a
 * short fixture is exactly what let the cap survive.
 */

const PARA = (n: number): string => 'This story is very close to being finished. '.repeat(Math.ceil(n / 44)).slice(0, n);

const body = `## OVERVIEW
The story works in British literary minimalism.

## WHERE TO GROW NEXT
One forward direction for the writer.
`;

describe('extractVerdict', () => {
  // Every shape three real readings actually produced. The format is the
  // model's whim, so all of them must parse identically.
  const shapes = [
    ['bare — what the structure prompt asks for', 'VERDICT: DEVELOP FURTHER'],
    ['bolded', '**VERDICT: DEVELOP FURTHER**'],
    ['as a heading', '## VERDICT: DEVELOP FURTHER'],
    ['bracketed', 'VERDICT: [DEVELOP FURTHER]'],
    ['heading and bolded', '## **VERDICT: DEVELOP FURTHER**'],
  ] as const;

  it.each(shapes)('parses the ruling when written %s', (_label, line) => {
    const v = extractVerdict(`${body}\n---\n${line}\n\n${PARA(900)}`);
    expect(v?.ruling).toBe('DEVELOP FURTHER');
  });

  // The regression itself.
  it.each([100, 399, 400, 401, 839, 911, 2000])(
    'keeps the whole detail paragraph at %i characters',
    (n) => {
      const v = extractVerdict(`${body}\n---\nVERDICT: DEVELOP FURTHER\n\n${PARA(n)}`);
      expect(v).not.toBeNull();
      expect(v!.detail.length).toBeGreaterThanOrEqual(n - 5);
    }
  );

  it('reads every ruling the three structure prompts can emit', () => {
    for (const r of ['PUBLISH READY', 'DEVELOP FURTHER', 'SIGNIFICANT REWORK NEEDED',
      'RECOMMEND', 'CONSIDER WITH REVISIONS', 'PASS — BUT WATCH THE WRITER', 'PASS',
      'READY TO DRAFT']) {
      const v = extractVerdict(`${body}\n---\nVERDICT: ${r}\n\n${PARA(900)}`);
      expect(v?.ruling, r).toBe(r);
    }
  });

  it('is not fooled by the word "verdict" in ordinary prose', () => {
    // A real ordinary reading opened a paragraph "The verdict here is that…".
    const report = `## OVERVIEW\nThe verdict here is that the restraint is earned.\n`;
    expect(extractVerdict(report)).toBeNull();
  });

  it('returns null when there is no verdict at all', () => {
    expect(extractVerdict(body)).toBeNull();
  });
});

describe('parseReport and the verdict', () => {
  const shapes = ['VERDICT: DEVELOP FURTHER', '**VERDICT: DEVELOP FURTHER**', '## VERDICT: DEVELOP FURTHER'];

  it.each(shapes)('never becomes a section, and never leaks into one (%s)', (line) => {
    const p = parseReport(`${body}\n---\n${line}\n\n${PARA(900)}`);
    expect(p.sections.map((s) => s.heading)).toEqual(['OVERVIEW', 'WHERE TO GROW NEXT']);
    expect(p.sections.some((s) => /VERDICT:/i.test(s.body))).toBe(false);
  });

  it('gives the same section list whichever shape the model picks', () => {
    const lists = shapes.map((line) =>
      parseReport(`${body}\n---\n${line}\n\n${PARA(900)}`).sections.map((s) => s.heading)
    );
    expect(new Set(lists.map((l) => l.join('|'))).size).toBe(1);
  });

  it('still lifts WHAT TO REVISE out into its own callout', () => {
    const p = parseReport(`${body}\n## WHAT TO REVISE\nDo the thing.\n\n---\nVERDICT: DEVELOP FURTHER\n\n${PARA(900)}`);
    expect(p.revisionList?.heading).toBe('WHAT TO REVISE');
    expect(p.sections.some((s) => s.heading === 'WHAT TO REVISE')).toBe(false);
  });

  it('reopens a section if one somehow follows the verdict', () => {
    const p = parseReport(`${body}\n---\nVERDICT: DEVELOP FURTHER\n\n${PARA(200)}\n\n## AFTERWORD\nTrailing.\n`);
    expect(p.sections.map((s) => s.heading)).toContain('AFTERWORD');
  });
});
