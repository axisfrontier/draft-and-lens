import 'server-only';

import { LENS_META } from './meta';
import type { LensId } from './types';

/**
 * The mechanical check behind the 2026-09-05 ruling on the Trevor bug.
 *
 * WHAT IT FOUND. Brain 1 matched `carver` to a tradition it labelled British
 * twice — 2026-08-27 and again 2026-09-05, on two different stories — and the
 * analyst, told the tradition was British and handed an anonymous "BEST-IN-CLASS
 * FOR THIS TRADITION" block, reconciled the contradiction by naming Trevor, an
 * unresearched writer, instead of Carver. A cross-lens sweep the same day (3
 * further readings, correct matches, zero substitutions) showed the analyst-side
 * `STAY INSIDE THE MATCHED TRADITION` guard holds whenever its premise holds —
 * the defect is upstream, a Brain 1 false positive, and PASS1_LENS_MATCH already
 * names this exact failure mode: "a work of quiet domestic realism is not
 * 'Carver' because it is quiet."
 *
 * WHY A CONTRADICTION DETECTOR, NOT A CORRECTNESS VERIFIER. This cannot tell
 * whether `carver` or `hemingway` is the better match for a genuinely American
 * minimalist story, and it must not try — that is Brain 1's job, done with the
 * whole text in front of it. What this catches is narrower and cheaper: does
 * Brain 1's own `tradition` label actively CONTRADICT the region the matched
 * lens represents. A quiet British story and Carver is exactly that.
 *
 * WHY IT UNDER-FIRES ON PURPOSE. It only rejects on a positive contradiction —
 * absence of a region word in `tradition` is treated as agreement, not doubt.
 * A false reject is not free: it sends the writer `NO_MATCH`, telling them
 * their work fits none of the thirty-five when it may have, and Option B means
 * every reading now carries that line to the writer's face. Better to miss a
 * genuine cross-tradition drift than to manufacture one.
 *
 * REGION ONLY, DELIBERATELY. Both observed failures were region contradictions
 * (British tradition, American lens). No genre-incompatibility list is
 * maintained here — inventing one from two data points would be exactly the
 * over-fit this file's own design principle warns against. If a different
 * failure shape turns up (a genre contradiction, a form contradiction — prose
 * matched to a director), extend `LENS_REGION` and this function then, against
 * real evidence, not in advance of it.
 *
 * WHY `form` NEEDS NO NEW FIELD HERE. The roster mixes novelists with
 * directors/screenwriters/producers, and `LENS_META[lens].category` already
 * says which — a prose tradition matched to a screen-only lens (or the
 * reverse) is checked straight off that existing field. Adding a parallel
 * "form" table here would be the exact fourth-copy-of-the-lens-list drift
 * `src/prompts/diagnostic.ts` already refuses to create.
 */

type Region =
  | 'american' | 'british' | 'irish' | 'russian' | 'french'
  | 'german' | 'japanese' | 'canadian' | 'italian';

/**
 * Set only where the lens's OWN tradition is unambiguously regional. Left
 * unset for a lens whose defining work spans more than one — `nabokov`
 * (Russian-born, the relevant tradition is his English-language fiction, not
 * a national one), `highsmith` (much of the Ripley run is set and read as
 * European), `chandler` (English-born, but the tradition he represents —
 * hardboiled LA noir — is the American one, so this is the one deliberate
 * exception: region tracks the TRADITION, not the writer's birthplace).
 * Unset means the region check never fires for that lens — see the
 * under-fire design note above.
 */
export const LENS_REGION: Partial<Record<LensId, Region>> = {
  hemingway: 'american',
  carver: 'american',
  chekhov: 'russian',
  oconnor: 'american',
  bukowski: 'american',
  coppola: 'american',
  wenders: 'german',
  spielberg: 'american',
  coens: 'american',
  villeneuve: 'canadian',
  scott: 'british',
  welles: 'american',
  jeunet: 'french',
  tarantino: 'american',
  wachowski: 'american',
  sorkin: 'american',
  puzo: 'american',
  roth: 'american',
  bruckheimer: 'american',
  feige: 'american',
  lucas: 'american',
  king: 'american',
  fey: 'american',
  miyazaki: 'japanese',
  kaufman: 'american',
  simon: 'american',
  chandler: 'american',
  leonard: 'american',
  leguin: 'american',
  christie: 'british',
  morrison: 'american',
  ferrante: 'italian',
  blume: 'american',
};

/**
 * Every synonym a diagnostic's free-text `tradition` might plausibly use.
 * Deliberately includes sub-national markers that carry a region unambiguously
 * — "southern" is how the actual oconnor tradition string ("Southern Gothic
 * literary fiction") said "American" without the word appearing at all.
 */
const REGION_MARKERS: Record<Region, readonly string[]> = {
  american: ['american', 'u.s.', 'united states', 'southern gothic', 'southern', 'midwestern', 'appalachian', 'californian'],
  british: ['british', 'u.k.', 'britain', 'english', 'england', 'scottish', 'welsh'],
  irish: ['irish', 'ireland', 'dublin'],
  russian: ['russian', 'russia', 'soviet'],
  french: ['french', 'france', 'parisian'],
  german: ['german', 'germany'],
  japanese: ['japanese', 'japan'],
  canadian: ['canadian', 'canada'],
  italian: ['italian', 'italy'],
};

function regionsNamedIn(tradition: string): Region[] {
  const lower = tradition.toLowerCase();
  return (Object.keys(REGION_MARKERS) as Region[]).filter((region) =>
    REGION_MARKERS[region].some((marker) => lower.includes(marker))
  );
}

/** Prose vs screen, read off the roster's own category — see file header. */
function isScreenLens(lens: LensId): boolean {
  return LENS_META[lens].category !== 'writers';
}

const SCREEN_FORM_MARKERS = ['screenplay', 'teleplay', 'television', 'tv series', 'film script', 'stage play'];
const PROSE_FORM_MARKERS = ['novel', 'short story', 'short fiction', 'literary fiction', 'prose fiction'];

/**
 * Does Brain 1's own `tradition` label contradict the lens it matched?
 * Returns false ONLY on a positive contradiction — see the under-fire note
 * above. A lens with no `LENS_REGION` entry never fails the region check.
 */
export function verifyLensMatch(tradition: string, lens: LensId): boolean {
  const named = regionsNamedIn(tradition);
  const lensRegion = LENS_REGION[lens];
  if (lensRegion && named.length > 0 && !named.includes(lensRegion)) {
    return false;
  }

  const lower = tradition.toLowerCase();
  const namesScreenForm = SCREEN_FORM_MARKERS.some((m) => lower.includes(m));
  const namesProseForm = PROSE_FORM_MARKERS.some((m) => lower.includes(m));
  const lensIsScreen = isScreenLens(lens);
  if (namesScreenForm && !lensIsScreen) return false;
  if (namesProseForm && lensIsScreen) return false;

  return true;
}
