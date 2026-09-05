import { describe, expect, it } from 'vitest';

import { LENS_IDS } from '../../src/prompts/lenses/types';
import { LENS_REGION, verifyLensMatch } from '../../src/prompts/lenses/tradition-guard';

/**
 * The 2026-09-05 verification pass, ruled after the Trevor bug. See
 * `src/prompts/lenses/tradition-guard.ts` for the full reasoning — this file
 * pins the behaviour against the REAL recorded cases, not invented ones.
 *
 * The two failure cases are Brain 1's actual `tradition` strings from the two
 * real substitutions, quoted verbatim from SESSION_LOG.md (2026-08-27 and
 * 2026-09-05) — not paraphrased, so a future edit to the marker lists can be
 * checked against the exact wording that broke it. The three clean cases are
 * the tradition strings from the same-day cross-lens sweep that did NOT
 * substitute, run specifically because their standards are distinct enough
 * that a substitution would be obvious. All five are pure-function checks —
 * no model call, no cost.
 */
describe('verifyLensMatch — the two real Trevor-bug cases, rejected', () => {
  it('rejects carver matched to the 2026-08-27 tradition (the first Trevor case)', () => {
    expect(verifyLensMatch('British literary minimalism', 'carver')).toBe(false);
  });

  it('rejects carver matched to the 2026-09-05 tradition (the second Trevor case)', () => {
    expect(verifyLensMatch('contemporary British literary realism', 'carver')).toBe(false);
  });
});

describe('verifyLensMatch — the three cross-lens sweep controls, kept', () => {
  it('keeps oconnor matched to Southern Gothic (region carried by "Southern", not the word "American")', () => {
    expect(verifyLensMatch('Southern Gothic literary fiction', 'oconnor')).toBe(true);
  });

  it('keeps chandler matched to hardboiled noir (no region named, no contradiction to find)', () => {
    expect(verifyLensMatch('hardboiled noir detective fiction', 'chandler')).toBe(true);
  });

  it('keeps leguin matched to speculative anthropology fiction (no region named)', () => {
    expect(verifyLensMatch('speculative literary anthropology fiction', 'leguin')).toBe(true);
  });
});

describe('verifyLensMatch — the design principle: absence of evidence is agreement', () => {
  it('does not reject when the tradition names no region at all', () => {
    expect(verifyLensMatch('minimalist domestic realism', 'carver')).toBe(true);
  });

  it('does not reject a lens with no authored region entry (nabokov), regardless of tradition', () => {
    expect(verifyLensMatch('British literary minimalism', 'nabokov')).toBe(true);
    expect(verifyLensMatch('contemporary Russian fiction', 'nabokov')).toBe(true);
  });

  it('does not reject when the named region agrees, even alongside other mentions', () => {
    expect(verifyLensMatch('American expatriate fiction set in Paris', 'carver')).toBe(true);
  });
});

describe('verifyLensMatch — form contradiction (screen vs prose)', () => {
  it('rejects a prose lens matched to a tradition naming a screenplay', () => {
    expect(verifyLensMatch('a contemporary screenplay in the minimalist tradition', 'carver')).toBe(false);
  });

  it('rejects a screen lens matched to a tradition naming a novel', () => {
    expect(verifyLensMatch('a literary fiction novel', 'spielberg')).toBe(false);
  });

  it('does not reject when no form is named', () => {
    expect(verifyLensMatch('Southern Gothic', 'oconnor')).toBe(true);
  });
});

describe('LENS_REGION completeness', () => {
  it('every key is a real lens id — no typo silently creating a 36th, non-existent one', () => {
    for (const key of Object.keys(LENS_REGION)) {
      expect(LENS_IDS as readonly string[], `"${key}" is not a real lens id`).toContain(key);
    }
  });

  it('exactly the two lenses documented as deliberately unset are unset — nabokov and highsmith', () => {
    const unset = LENS_IDS.filter((id) => !(id in LENS_REGION));
    expect(unset.sort()).toEqual(['highsmith', 'nabokov']);
  });
});
