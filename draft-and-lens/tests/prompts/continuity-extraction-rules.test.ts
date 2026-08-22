import { describe, expect, it } from 'vitest';

import { CONTINUITY_EXTRACTOR_SYSTEM } from '../../src/prompts/continuity';

/**
 * Two defects found on real output, 2026-08-22, both invisible in the sense
 * that nothing failed — the ledger simply filled with facts that could never
 * meet each other.
 *
 *   1. "He thought her eyes were grey" was filed as `character:dessie
 *      eye_colour=grey`. The claim is about MARTA. Filed under the thinker it
 *      invents a property Dessie does not have, and the real disagreement —
 *      her eyes green in narration, grey in his head — has nothing to meet.
 *   2. `hair_colour_location = "grey at the sides"`. A qualifier climbed into
 *      the attribute name, and facts are matched by entity + attribute, so
 *      that fact can only ever be compared with another that phrased its
 *      qualifier identically.
 *
 * Both are prompt rules, because no code check can know whose property a claim
 * is or whether a name is a property or a qualifier. These pin the rules.
 */
describe('the entity is the subject of the claim', () => {
  it('says so before the register section, where the mistake is made', () => {
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/THE ENTITY IS WHOM THE CLAIM IS ABOUT — NEVER WHO MAKES IT/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/never to the character doing the describing/i);
  });

  it('carries the exact failure as a worked example', () => {
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/He thought her eyes were grey/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/WRONG: entity .?character:dessie/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/RIGHT: entity .?character:marta/);
  });

  it('points the thinker at the fields that exist for them', () => {
    // register and povCharacter are where the holder of a belief belongs.
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/recorded in .?register.? and .?povCharacter/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/hides the real disagreement/i);
  });
});

describe('an attribute names the property and nothing else', () => {
  it('pins the observed failure as a WRONG example', () => {
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/WRONG: attribute .?hair_colour_location/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/RIGHT: attribute .?hair_colour.?, value .?grey at the sides/);
  });

  it('names the general rule, not only the instance', () => {
    // Where on the body, at what age, under what light, according to whom.
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/Qualifiers belong in the VALUE, always/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/which in practice means never/);
  });
});
