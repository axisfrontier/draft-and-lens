/**
 * The lens directory the browser is allowed to know: names, ids and the groups
 * they are shown in. Nothing else — every craft philosophy and every lens
 * prompt stays server-side, where the IP boundary keeps it.
 *
 * ONE LIST, because there were two and they disagreed. The reading's lens grid
 * had all 35 voices; the landing page had its own hand-written array of 22 that
 * had not been updated since the voices changed. It advertised Wilder, Pinter
 * and Goldman, who are not lenses, and omitted fourteen who are — Lucas among
 * them, which is how the drift was noticed. A second copy of a list is a
 * promise nobody remembers to keep.
 *
 * The ids must match LENS_IDS exactly, and a test asserts it rather than
 * trusting this comment: see tests/prompts/lens-directory.test.ts.
 */

export interface LensEntry {
  name: string;
  /** Null only for a heading-like entry with no lens behind it. */
  id: string | null;
}

export const LENS_GROUPS: ReadonlyArray<{ label: string; entries: LensEntry[] }> = [
  { label: 'Literary Fiction', entries: [
    { name: 'Hemingway', id: 'hemingway' }, { name: 'Carver', id: 'carver' },
    { name: "O'Connor", id: 'oconnor' }, { name: 'Bukowski', id: 'bukowski' },
    { name: 'Nabokov', id: 'nabokov' }, { name: 'Chekhov', id: 'chekhov' },
    { name: 'Morrison', id: 'morrison' }, { name: 'Ferrante', id: 'ferrante' },
  ]},
  { label: 'Crime, Thriller & Suspense', entries: [
    { name: 'Chandler', id: 'chandler' }, { name: 'Leonard', id: 'leonard' },
    { name: 'Highsmith', id: 'highsmith' }, { name: 'Christie', id: 'christie' },
    { name: 'Puzo', id: 'puzo' },
  ]},
  { label: 'Horror & Speculative', entries: [
    { name: 'King', id: 'king' }, { name: 'Le Guin', id: 'leguin' },
  ]},
  { label: 'Art Cinema', entries: [
    { name: 'Welles', id: 'welles' }, { name: 'Wenders', id: 'wenders' },
    { name: 'Jeunet', id: 'jeunet' }, { name: 'Miyazaki', id: 'miyazaki' },
    { name: 'Coppola', id: 'coppola' }, { name: 'Villeneuve', id: 'villeneuve' },
    { name: 'Kaufman', id: 'kaufman' }, { name: 'Wachowskis', id: 'wachowski' },
    { name: 'Coen Brothers', id: 'coens' },
  ]},
  { label: 'Popular Cinema', entries: [
    { name: 'Spielberg', id: 'spielberg' }, { name: 'Tarantino', id: 'tarantino' },
    { name: 'Ridley Scott', id: 'scott' }, { name: 'Bruckheimer', id: 'bruckheimer' },
    { name: 'Feige', id: 'feige' }, { name: 'Lucas', id: 'lucas' },
  ]},
  { label: 'Screenplay & Television', entries: [
    { name: 'Sorkin', id: 'sorkin' }, { name: 'Roth', id: 'roth' },
    { name: 'Fey', id: 'fey' }, { name: 'Simon', id: 'simon' },
  ]},
  { label: 'Young Adult', entries: [
    { name: 'Blume', id: 'blume' },
  ]},
];

/** Every lens name, in group order — what the landing page lists. */
export const LENS_NAMES: readonly string[] = LENS_GROUPS.flatMap((g) =>
  g.entries.filter((e) => e.id).map((e) => e.name)
);
