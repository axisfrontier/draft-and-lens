import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { BEST_IN_CLASS } from '../../src/prompts/interrogate/best-in-class';
import { LENS_META } from '../../src/prompts/lenses/meta';
import { LENS_IDS } from '../../src/prompts/lenses/types';

/**
 * §21c best-in-class research has to describe exactly the voices that exist.
 *
 * This is the third hand-kept copy of the lens list in this project, and the
 * previous two both drifted. The landing page's array advertised Wilder, Pinter
 * and Goldman, who are not lenses, and omitted fourteen who are — that is what
 * lens-directory.test.ts was written to stop. The research repeated the same
 * failure independently: it shipped with Goldman again, plus Woolf (real in the
 * source, but as an example in the analyst's SIX-tradition taxonomy in
 * prompts/modes/story.ts, which is not the 35-lens set), and with no entry at
 * all for Blume, Le Guin, Morrison, Puzo or Sorkin.
 *
 * A gap here is not cosmetic once §21c is wired. Push harder promises a writer
 * the standard their tradition sets for itself; a lens with no entry means that
 * promise has nothing behind it, which is the exact condition
 * INTERROGATE_ANALYSIS_LIVE existed to prevent (retired by the merge,
 * 2026-09-01; the separation in directive.ts is the guarantee now). So this fails on a lens added
 * without an entry, and on an entry for a voice that is not a lens.
 *
 * THE MODULE IS CANONICAL (Nenad, 2026-08-26). src/prompts/interrogate/best-in-class.ts
 * is what the analyst actually reads; the markdown at the REPO ROOT is the
 * human-readable research and cannot be the runtime source — it sits a level
 * above the Next app and is never traced into the deployment. So this file
 * checks three things against each other: module, markdown, and LENS_IDS. The
 * markdown is read as text, the same way client-ip-guard.test.ts reads what it
 * checks.
 */

const RESEARCH = path.resolve(__dirname, '../../../DraftAndLens_BestInClass_Research.md');

/** Key a name the way the research heading writes it: letters only, lowercased. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Lens ids by every name they can honestly be called.
 *
 * The meta names are not uniform — four are full names ("Eric Roth", "Kevin
 * Feige", "Mario Puzo", "Orson Welles") where the rest are surnames — so a
 * heading may use the full name or its last word. Both are accepted; nothing
 * looser is, because a substring rule would quietly match "Roth" against "Coen
 * Brothers". A collision here would make the mapping meaningless, so the first
 * test asserts there is none rather than assuming it.
 */
const idsByName = new Map<string, string[]>();
for (const id of LENS_IDS) {
  const name = LENS_META[id].name;
  const surname = name.split(/\s+/).pop() ?? name;
  for (const alias of new Set([key(name), key(surname)])) {
    idsByName.set(alias, [...(idsByName.get(alias) ?? []), id]);
  }
}

/** The voice each `### ` heading is about — "Roth / Bellow / …" is about Roth. */
function researchHeadings(): string[] {
  const text = readFileSync(RESEARCH, 'utf8');
  return [...text.matchAll(/^### (.+)$/gm)].map((m) => (m[1] ?? '').split('/')[0]!.trim());
}

describe('best-in-class research covers exactly the lens set', () => {
  it('names each lens unambiguously', () => {
    const ambiguous = [...idsByName].filter(([, ids]) => ids.length > 1);
    expect(ambiguous.map(([n]) => n), 'name matches more than one lens').toEqual([]);
  });

  it('has an entry for every lens', () => {
    const covered = new Set(researchHeadings().map((h) => idsByName.get(key(h))?.[0]));
    const missing = (LENS_IDS as readonly string[]).filter((id) => !covered.has(id));
    expect(missing, `no best-in-class standard researched for: ${missing.join(', ')}`).toEqual([]);
  });

  it('has no entry for anything that is not a lens', () => {
    const orphans = researchHeadings().filter((h) => !idsByName.has(key(h)));
    expect(orphans, `researched but not a lens: ${orphans.join(', ')}`).toEqual([]);
  });

  it('writes exactly one entry per lens', () => {
    const headings = researchHeadings();
    const ids = headings.map((h) => idsByName.get(key(h))?.[0]).filter(Boolean);
    expect(headings.length).toBe(LENS_IDS.length);
    expect(new Set(ids).size).toBe(LENS_IDS.length);
  });
});

/**
 * Text as it reads, not as it is formatted: the markdown hard-wraps at eighty
 * columns and marks its labels with asterisks, the module unwraps and
 * capitalises them. Neither difference is a difference in what the analyst is
 * told, and pinning either file's line breaks would make ordinary editing fail
 * the suite for no reason.
 */
const prose = (s: string) =>
  s.replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

describe('the module and the research say the same thing', () => {
  /** Each markdown section body, keyed by lens id. */
  function markdownSections(): Map<string, string> {
    const text = readFileSync(RESEARCH, 'utf8');
    const out = new Map<string, string>();
    const blocks = text.split(/^### /m).slice(1);
    for (const block of blocks) {
      const [heading = '', ...rest] = block.split('\n');
      const id = idsByName.get(key(heading.split('/')[0]!.trim()))?.[0];
      // Body stops at the next '## ' heading and drops the '---' rules.
      const body = rest.join('\n').split(/^##+ /m)[0]!.replace(/---/g, '');
      if (id) out.set(id, body);
    }
    return out;
  }

  it('has a module entry for every lens, with real content in it', () => {
    for (const id of LENS_IDS) {
      // A blank or stub entry would pass a key check and give the analyst
      // nothing — which is exactly the promise the flag exists to protect.
      expect(BEST_IN_CLASS[id]?.length, `${id} has no standard`).toBeGreaterThan(200);
      expect(BEST_IN_CLASS[id], `${id} is missing a half`).toContain('THE STANDARD:');
    }
  });

  it('carries the same words as the research it was written from', () => {
    const md = markdownSections();
    for (const id of LENS_IDS) {
      expect(prose(BEST_IN_CLASS[id]), `${id} has drifted from the markdown`).toBe(
        prose(md.get(id) ?? '')
      );
    }
  });
});
