import { describe, expect, it } from 'vitest';

import { deriveFrame } from '../../src/ai/detection-pass';
import { pairKey } from '../../src/lib/continuity-flags';
import type { DiagnosticResult } from '../../src/prompts/types';

const withStructure = (narrativeStructure?: string): DiagnosticResult =>
  ({ structuralMap: narrativeStructure ? { narrativeStructure } : undefined }) as DiagnosticResult;

/**
 * deriveFrame decides whether a stated age differing across chapters can ever
 * be called a contradiction. Ruling 1a is unknown-and-demote, so the dangerous
 * direction is answering `false` (known linear) from something that does not
 * establish it — that permits a hard flag on what may simply be a flashback.
 */
describe('deriveFrame', () => {
  it('reads a linear manuscript as known-linear', () => {
    expect(deriveFrame(withStructure('linear')).nonLinear).toBe(false);
  });

  it('does NOT read "non-linear" as linear — the substring trap', () => {
    // 'non-linear' contains 'linear'. A naive check order inverts the answer
    // here, which is the worst available failure: it tells the gates a
    // flashback-heavy book is chronological.
    expect(deriveFrame(withStructure('non-linear')).nonLinear).toBe(true);
    expect(deriveFrame(withStructure('Non-Linear — opens at the end')).nonLinear).toBe(true);
    expect(deriveFrame(withStructure('nonlinear')).nonLinear).toBe(true);
  });

  it('treats the other non-chronological forms as non-linear', () => {
    expect(deriveFrame(withStructure('reverse chronology')).nonLinear).toBe(true);
    expect(deriveFrame(withStructure('multi-timeline')).nonLinear).toBe(true);
    expect(deriveFrame(withStructure('frame narrative')).nonLinear).toBe(true);
  });

  it('leaves linearity UNKNOWN when there is no structural map', () => {
    // The common case in the current beta: the structural reader is gated on
    // word count, so most submissions never produce a map at all. Unknown must
    // stay null — null demotes, and a missing map is not permission to assume.
    expect(deriveFrame(undefined).nonLinear).toBeNull();
    expect(deriveFrame(withStructure()).nonLinear).toBeNull();
  });

  it('leaves linearity unknown on an unrecognised description', () => {
    expect(deriveFrame(withStructure('something the model made up')).nonLinear).toBeNull();
  });

  it('never infers narrator reliability or POV count', () => {
    // Nothing in the pipeline establishes either as a fact. Inferring them
    // from narrativeStructure would be reading a signal that does not mean
    // what the gates would take it to mean.
    const frame = deriveFrame(withStructure('linear'));
    expect(frame.unreliableNarrator).toBeNull();
    expect(frame.multiplePov).toBeNull();
  });
});

/**
 * The idempotency guarantee rests entirely on this key. If it were
 * order-sensitive, the already-adjudicated lookup would miss half its hits and
 * every submission would re-pay for pairs it had already judged.
 */
describe('pairKey', () => {
  it('is order-independent', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'));
  });

  it('distinguishes genuinely different pairs', () => {
    expect(pairKey('a', 'b')).not.toBe(pairKey('a', 'c'));
  });
});
