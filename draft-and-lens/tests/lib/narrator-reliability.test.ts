import { describe, expect, it } from 'vitest';

import { deriveUnreliableNarrator } from '../../src/ai/detection-pass';
import { mergeFrameEvidence } from '../../src/lib/manuscripts';
import type { DiagnosticResult } from '../../src/prompts/types';

/**
 * The mapping here is deliberately one-way, and these tests exist to keep it
 * that way. A wrong TRUE costs precision — a real contradiction is shown as
 * worth_checking instead of contradiction. A wrong FALSE costs correctness — it
 * promotes narration to the book's own voice and hardens the tier, which is
 * the §5.2 failure the gate exists to prevent. So the model may raise the
 * caution and may never lower it.
 */
function map(narratorReliability?: string): DiagnosticResult {
  return { structuralMap: { narratorReliability } } as unknown as DiagnosticResult;
}

describe('deriveUnreliableNarrator', () => {
  it('reads an unreliable narrator as true', () => {
    expect(deriveUnreliableNarrator(map('unreliable'))).toBe(true);
    expect(deriveUnreliableNarrator(map('Unreliable — he conceals the fire'))).toBe(true);
  });

  it('never returns false, whatever the map says', () => {
    // "unreliable" contains "reliable", so the substring test order matters as
    // much as the one-way rule.
    for (const answer of ['reliable', 'Reliable — nothing undercuts him', 'unclear', 'RELIABLE']) {
      expect(deriveUnreliableNarrator(map(answer))).toBeNull();
    }
  });

  it('is null when the field, the map or the diagnostic is missing', () => {
    expect(deriveUnreliableNarrator(map(undefined))).toBeNull();
    expect(deriveUnreliableNarrator(map(''))).toBeNull();
    expect(deriveUnreliableNarrator({} as DiagnosticResult)).toBeNull();
    expect(deriveUnreliableNarrator(undefined)).toBeNull();
  });

  it('is null for an answer it does not recognise', () => {
    // A model that ignores the enum must not be interpreted generously.
    expect(deriveUnreliableNarrator(map('the narrator is a dog'))).toBeNull();
  });
});

describe('the frame accumulates reliability the way it accumulates structure', () => {
  it('is sticky-true across chapters', () => {
    // A narrator shown to be unreliable in chapter 3 does not become
    // trustworthy in chapter 4.
    expect(mergeFrameEvidence(true, null)).toBe(true);
    expect(mergeFrameEvidence(true, false)).toBe(true);
  });

  it('records nothing from an absent answer', () => {
    expect(mergeFrameEvidence(null, null)).toBeNull();
  });
});
