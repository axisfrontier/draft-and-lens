import 'server-only';

/**
 * Fragment routing — the decision half of fragment mode (Fragment Handling &
 * Revision Loop spec, 2026-08-20).
 *
 * WHAT THIS FILE IS NOT: a size check. The spec's architectural decision is to
 * route on available context, never on input size, because "fragment vs full"
 * is a proxy variable, every proxy needs a threshold, and every threshold
 * recreates the word-count dead zone somewhere new. Nothing here reads a word
 * count and nothing here infers what kind of thing was pasted.
 *
 * What it decides is narrower and answerable without inference: given what the
 * writer asked for and what exists in the system, can D&L do its job on this?
 * Two guards, both structural:
 *
 *   • "does this fit with what you've read of my work" with nothing read →
 *     there is no prior to fit against, so this is a redirect to a full read.
 *   • "is this authentic to its tradition" with no tradition named → tradition
 *     cannot be identified from a fragment (it is the method's load-bearing
 *     dependency), so the honest move is to ask, not to guess.
 *
 * Everything else is answerable at fragment scale and goes to the model, which
 * carries its own instruction to redirect rather than half-answer a question
 * that needs the whole piece. That half cannot be decided here — it depends on
 * what the writer typed in the free-text box, and pattern-matching prose for
 * "is this really a structural question" is exactly the kind of guess this
 * feature exists to refuse.
 */

/** What the writer asked for, from the upfront ask. */
export type FragmentAsk =
  /** Line-level craft: rhythm, verb load, concreteness, where it goes slack. */
  | 'craft'
  /** Consistency against what D&L has already read of this writer's work. */
  | 'fit'
  /** Authenticity to a tradition the writer names. */
  | 'tradition'
  /** Anything the writer typed themselves. */
  | 'free';

export const FRAGMENT_ASKS: readonly FragmentAsk[] = ['craft', 'fit', 'tradition', 'free'];

export function isFragmentAsk(value: unknown): value is FragmentAsk {
  return typeof value === 'string' && (FRAGMENT_ASKS as readonly string[]).includes(value);
}

export interface FragmentRouteInput {
  ask: FragmentAsk;
  /** Has D&L read anything of this writer's work before? A lookup, not a guess. */
  hasPriorContext: boolean;
  /** The tradition the writer named, where they named one. */
  namedTradition?: string | null;
}

export type FragmentRoute =
  /** Answerable at this scale — build the prompt and stream a reply. */
  | { kind: 'answer' }
  /** Needs the whole piece. Not a decline: it routes back to a path that works. */
  | { kind: 'redirect'; because: 'nothing-read-yet' }
  /** Answerable, but not without one more thing from the writer. */
  | { kind: 'ask-again'; missing: 'tradition' };

/**
 * Route one fragment ask.
 *
 * Deliberately total and deliberately dull: every branch is a fact the caller
 * already holds, so this is testable without a database and cannot drift from
 * whatever the UI happens to be showing.
 */
export function decideFragmentRoute(input: FragmentRouteInput): FragmentRoute {
  if (input.ask === 'fit' && !input.hasPriorContext) {
    // The UI does not offer this option without context, but the UI is not the
    // authority — a request can say anything, and answering "does this fit
    // with what you've read" having read nothing is precisely the confident
    // nonsense the governing principle forbids.
    return { kind: 'redirect', because: 'nothing-read-yet' };
  }

  if (input.ask === 'tradition' && !input.namedTradition?.trim()) {
    return { kind: 'ask-again', missing: 'tradition' };
  }

  return { kind: 'answer' };
}
