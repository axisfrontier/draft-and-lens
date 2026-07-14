import 'server-only';

/**
 * Craft principle: see inline PROMPT_RATIONALE.
 * Last reviewed: 2026-06-07 (verbatim migration from DraftAndLens.html)
 */

export const LENS_IDS = ["hemingway","carver","chekhov","oconnor","bukowski","nabokov","coppola","wenders","spielberg","coens","villeneuve","scott","welles","jeunet","tarantino","wachowski","sorkin","puzo","roth","bruckheimer","feige","lucas","king","fey","miyazaki","kaufman","simon","chandler","leonard","highsmith","leguin","christie","morrison","ferrante","blume"] as const;
export type LensId = (typeof LENS_IDS)[number];

export type LensCategory = 'directors' | 'writers' | 'screenwriters' | 'showrunners' | 'producers';

export interface LensMeta {
  name: string;
  surname?: string;
  descriptor: string;
  craftPhilosophy: string;
  category: LensCategory;
}
