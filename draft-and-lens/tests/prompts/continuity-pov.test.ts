import { describe, expect, it } from 'vitest';

import { CONTINUITY_EXTRACTOR_SYSTEM } from '../../src/prompts/continuity';

/**
 * `povCharacter` was in this prompt for months as a single `null` inside the
 * example JSON, with no sentence anywhere saying what it meant. The model did
 * the reasonable thing and copied the example: every fact in production came
 * back with a null POV, so `deriveMultiplePov` could never return true and the
 * cross-viewpoint gate it feeds had never once fired.
 *
 * A field the prompt never explains is a field the model will not fill. These
 * pin the explanation, because losing it again would be silent — nothing
 * fails, the gate simply goes quiet.
 */
describe('the extractor is told what povCharacter means', () => {
  it('defines it as the perceiving consciousness', () => {
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/povCharacter/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/through whose perception/i);
  });

  it('names the two registers that carry a viewpoint', () => {
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/first person/i);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/limited or close third/i);
  });

  it('makes null the answer everywhere else, and says so', () => {
    // The failure mode that matters is a guessed name, not a missing one: a
    // wrong POV removes the gentler treatment a real cross-viewpoint clash
    // should get, while a null loses nothing.
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/omniscient narration, which stands outside every character/i);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/null is the common answer/i);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/so guess nothing/i);
  });

  it('shows a filled POV in the example, not only a null one', () => {
    // The example taught "always null" for months. It now shows both.
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/"povCharacter":"sarah"/);
    expect(CONTINUITY_EXTRACTOR_SYSTEM).toMatch(/"povCharacter":null/);
  });
});
