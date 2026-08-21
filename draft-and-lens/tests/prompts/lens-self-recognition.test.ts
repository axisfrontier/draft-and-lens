import { describe, expect, it } from 'vitest';

import { LENS_SELF_RECOGNITION } from '../../src/prompts/lenses/self-recognition';
import { LENS_IDS } from '../../src/prompts/lenses/types';

/**
 * The line a lens says when handed its own work. What is pinned here is
 * coverage and shape — the voice itself is Nenad's to judge — plus the one
 * property that makes the moment work rather than merely refuse.
 */
describe('lens self-recognition lines', () => {
  it('covers every lens, with none left over', () => {
    // A missing line would fall through to `undefined` and stream an empty
    // reply, which reads as the lens having nothing to say about its own work.
    const covered = Object.keys(LENS_SELF_RECOGNITION).sort();
    expect(covered).toEqual([...LENS_IDS].sort());
  });

  it('stays short — a lens performing about its own authorship is a party trick', () => {
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      expect(line.length, id).toBeGreaterThan(20);
      expect(line.length, id).toBeLessThan(220);
    }
  });

  it('hands the moment back to the writer rather than ending on a refusal', () => {
    // Every line must ask for the writer's own work. This is the same instinct
    // as the fragment redirect: declining is only half of it, and the half
    // that matters is returning the writer to their own writing.
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      // Morrison's is the shortest form of the same move — "I would rather
      // hear you" hands back to the writer's voice rather than their pages,
      // which is exactly her register. The alternation covers it explicitly
      // rather than being loosened to any second-person pronoun, which would
      // stop testing anything.
      expect(line.toLowerCase(), id).toMatch(
        /\byours\b|\byou'?re working on\b|\byou have made\b|\byou wrote\b|\byou've (written|made)\b|what you have made|rather hear you/
      );
    }
  });

  it('claims the work in the first person', () => {
    // "I wrote it" is the whole point — the generic hold said "I think I've
    // read this before", which is the wrong sentence when the truth is known.
    for (const [id, line] of Object.entries(LENS_SELF_RECOGNITION)) {
      expect(line.toLowerCase(), id).toMatch(/\bmine\b|\bmy own\b|\bours\b|\bi wrote\b|\bi made\b|\bi built\b/);
    }
  });
});
