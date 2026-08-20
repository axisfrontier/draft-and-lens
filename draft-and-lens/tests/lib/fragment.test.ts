import { describe, expect, it } from 'vitest';

import { decideFragmentRoute, isFragmentAsk } from '../../src/lib/fragment';

/**
 * The spec's governing principle is "when context is insufficient for D&L's
 * method to run cleanly, ask rather than proceed" — so what these tests pin is
 * mostly the refusals. An answer that should have been a redirect is the
 * failure mode that discredits the feature; a redirect that should have been
 * an answer merely annoys.
 */
describe('decideFragmentRoute', () => {
  it('answers a craft question, with or without prior context', () => {
    // Line-level craft is the one thing that needs nothing but the passage.
    expect(decideFragmentRoute({ ask: 'craft', hasPriorContext: false })).toEqual({
      kind: 'answer',
    });
    expect(decideFragmentRoute({ ask: 'craft', hasPriorContext: true })).toEqual({
      kind: 'answer',
    });
  });

  it('redirects "does this fit" when nothing has been read', () => {
    // There is no prior to fit against. The UI does not offer this option
    // without context, but the request is not the UI and must not be trusted.
    expect(decideFragmentRoute({ ask: 'fit', hasPriorContext: false })).toEqual({
      kind: 'redirect',
      because: 'nothing-read-yet',
    });
  });

  it('answers "does this fit" once something has been read', () => {
    expect(decideFragmentRoute({ ask: 'fit', hasPriorContext: true })).toEqual({
      kind: 'answer',
    });
  });

  it('asks again for the tradition rather than inferring one', () => {
    // Tradition-first is the method's load-bearing dependency and a passage
    // cannot establish one. Guessing here is the single most damaging thing
    // fragment mode could do, so absence must route to a question.
    expect(decideFragmentRoute({ ask: 'tradition', hasPriorContext: true })).toEqual({
      kind: 'ask-again',
      missing: 'tradition',
    });
    expect(
      decideFragmentRoute({ ask: 'tradition', hasPriorContext: true, namedTradition: '   ' })
    ).toEqual({ kind: 'ask-again', missing: 'tradition' });
    expect(
      decideFragmentRoute({ ask: 'tradition', hasPriorContext: false, namedTradition: null })
    ).toEqual({ kind: 'ask-again', missing: 'tradition' });
  });

  it('answers a tradition question once the writer names one', () => {
    expect(
      decideFragmentRoute({ ask: 'tradition', hasPriorContext: false, namedTradition: 'noir' })
    ).toEqual({ kind: 'answer' });
  });

  it('sends free text to the model rather than pattern-matching it', () => {
    // Whether a typed question really needs the whole piece is a judgement the
    // model makes under instruction. Deciding it here would mean regexing
    // prose for intent — the kind of guess this feature exists to refuse.
    expect(
      decideFragmentRoute({ ask: 'free', hasPriorContext: false })
    ).toEqual({ kind: 'answer' });
    expect(decideFragmentRoute({ ask: 'free', hasPriorContext: true })).toEqual({
      kind: 'answer',
    });
  });

  it('never routes on size — there is no word count in the decision at all', () => {
    // Guards the architectural decision rather than a behaviour: the moment an
    // input length appears in this signature, the dead zone is back.
    const asks = ['craft', 'fit', 'tradition', 'free'] as const;
    for (const ask of asks) {
      const decided = decideFragmentRoute({
        ask,
        hasPriorContext: true,
        namedTradition: 'noir',
      });
      expect(decided.kind).toBe('answer');
    }
  });
});

describe('isFragmentAsk', () => {
  it('accepts the four asks and nothing else', () => {
    expect(isFragmentAsk('craft')).toBe(true);
    expect(isFragmentAsk('fit')).toBe(true);
    expect(isFragmentAsk('tradition')).toBe(true);
    expect(isFragmentAsk('free')).toBe(true);
    expect(isFragmentAsk('score')).toBe(false);
    expect(isFragmentAsk('')).toBe(false);
    expect(isFragmentAsk(null)).toBe(false);
    expect(isFragmentAsk(undefined)).toBe(false);
  });
});
