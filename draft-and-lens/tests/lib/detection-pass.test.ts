import { describe, expect, it } from 'vitest';

import { deriveFrame, deriveMultiplePov } from '../../src/ai/detection-pass';
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

/**
 * gatePair demotes a cross-POV clash only on `multiplePov === true`, so this
 * derivation is the difference between that safety gate running and sitting
 * inert — which is what it did from the day it was written until now.
 */
describe('deriveMultiplePov', () => {
  const f = (povCharacter: string | null) => ({ povCharacter });

  it('reports multi-POV on two or more distinct POV characters', () => {
    expect(deriveMultiplePov([f('Sarah'), f('Marcus')])).toBe(true);
  });

  it('treats the same name in different case or spacing as ONE character', () => {
    // Without normalising, a single-POV book whose chapters record 'Sarah' and
    // 'sarah' would be declared multi-POV and start demoting its own findings.
    expect(deriveMultiplePov([f('Sarah'), f(' sarah '), f('SARAH')])).toBeNull();
  });

  it('is UNKNOWN, not false, on one POV character or none', () => {
    // One POV is equally the shape of a one-chapter manuscript or an extractor
    // that could not attribute POV. Claiming `false` would assert single-POV
    // on no evidence — the permissive default the narrative_frame column
    // header warns against.
    expect(deriveMultiplePov([f('Sarah'), f('Sarah')])).toBeNull();
    expect(deriveMultiplePov([f(null), f(null)])).toBeNull();
    expect(deriveMultiplePov([])).toBeNull();
  });

  it('ignores blank and whitespace-only attributions', () => {
    expect(deriveMultiplePov([f('Sarah'), f('   '), f('')])).toBeNull();
  });
});
