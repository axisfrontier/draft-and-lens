import { describe, expect, it } from 'vitest';

import { LENS_GROUPS, LENS_NAMES } from '../../src/components/lenses/lens-directory';
import { LENS_META } from '../../src/prompts/lenses/meta';
import { LENS_IDS } from '../../src/prompts/lenses/types';

/**
 * The browser's lens directory and the server's lens set have to be the same
 * set of voices. They were not: the landing page carried its own hand-written
 * array of 22 names that had stopped being true — it advertised Wilder, Pinter
 * and Goldman, who are not lenses at all, and omitted fourteen who are. A
 * writer choosing the product on the strength of that list was reading a
 * promise nobody had kept since the voices changed.
 *
 * There is now one client directory, and this is what stops it drifting: add a
 * voice to LENS_IDS without adding it here, or leave a name here after the
 * voice goes, and this fails.
 */
describe('client lens directory matches the lens set', () => {
  const ids = LENS_GROUPS.flatMap((g) => g.entries.map((e) => e.id)).filter(
    (id): id is string => Boolean(id)
  );

  it('lists every lens the server has', () => {
    const missing = (LENS_IDS as readonly string[]).filter((id) => !ids.includes(id));
    expect(missing, `not offered in the browser: ${missing.join(', ')}`).toEqual([]);
  });

  it('offers no lens the server does not have', () => {
    const invented = ids.filter((id) => !(LENS_IDS as readonly string[]).includes(id));
    expect(invented, `offered but not a lens: ${invented.join(', ')}`).toEqual([]);
  });

  it('lists each lens exactly once', () => {
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids.length).toBe(LENS_IDS.length);
  });

  it('gives the landing page the same names, in group order', () => {
    // One source for both surfaces is the whole point; a separate array is how
    // the drift happened.
    expect(LENS_NAMES.length).toBe(LENS_IDS.length);
    expect(LENS_NAMES).toContain('Lucas');
  });

  it('names each lens as the server names it, allowing a display form', () => {
    // Display names may differ from the meta name where the meta is a surname
    // and the grid shows something fuller ("Le Guin", "Coen Brothers"), but the
    // id must resolve to real meta — a name with no voice behind it is the
    // failure this whole file exists for.
    for (const group of LENS_GROUPS) {
      for (const entry of group.entries) {
        if (!entry.id) continue;
        expect(LENS_META[entry.id as keyof typeof LENS_META], `${entry.id} has no meta`).toBeTruthy();
      }
    }
  });
});
