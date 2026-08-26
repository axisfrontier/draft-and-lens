import { describe, expect, it } from 'vitest';

import { buildPass1System } from '../../src/prompts/diagnostic';
import { BEST_IN_CLASS } from '../../src/prompts/interrogate/best-in-class';
import { buildInterrogateDirective } from '../../src/prompts/interrogate/directive';

/**
 * §21b, the analyst half. Three helper lines were approved before any of this
 * was built, each promising a different reading, and the prompt has to keep
 * exactly the promise the writer was shown — no more, and no less.
 *
 * The failure this guards is not a crash. It is the reading quietly doing
 * something other than what the writer was told, which is what
 * INTERROGATE_ANALYSIS_LIVE is shut against.
 */
describe('the push-harder directive', () => {
  it('adds nothing at all to an ordinary reading', () => {
    // Byte-identical prompts for a normal read, matched lens or not.
    expect(buildInterrogateDirective('read', null, 'complete')).toBe('');
    expect(buildInterrogateDirective('read', 'carver', 'complete')).toBe('');
  });

  it('asks the ambition question on every push read', () => {
    for (const d of [
      buildInterrogateDirective('push', 'carver', 'complete'),
      buildInterrogateDirective('push', null, 'complete'),
      buildInterrogateDirective('push', 'carver', 'excerpt'),
    ]) {
      expect(d).toContain('was this ambition the right one for this material?');
      // Open in both directions: an ambition can be too small for the material
      // as easily as too large, and a mode that only ever finds overreach is a
      // verdict machine, not a reading.
      expect(d).toContain('smaller than the material deserves');
    }
  });

  it('gives a matched complete work its own tradition, and only that one', () => {
    const d = buildInterrogateDirective('push', 'carver', 'complete');
    expect(d).toContain(BEST_IN_CLASS.carver);
    expect(d).not.toContain(BEST_IN_CLASS.hemingway);
    // A horizon, not a threshold — the difference between a standard and a score.
    expect(d).toContain('is this piece reaching for that?');
  });

  it('withholds the standard on an excerpt, and says so for the RIGHT reason', () => {
    // The 2026-08-23 ruling. The bug this catches is real and was live in the
    // first draft of the directive: an excerpt WITH a match was being told
    // nothing had fitted its tradition, which is a lie the reading could then
    // repeat to the writer.
    const d = buildInterrogateDirective('push', 'carver', 'excerpt');
    expect(d).not.toContain(BEST_IN_CLASS.carver);
    expect(d).toContain('This submission is an excerpt');
    expect(d).not.toContain('did not match any of the thirty-five voices');
  });

  it('sends no standard at all when nothing matched, and forbids improvising one', () => {
    const d = buildInterrogateDirective('push', null, 'complete');
    for (const id of ['carver', 'hemingway', 'chandler'] as const) {
      expect(d).not.toContain(BEST_IN_CLASS[id]);
    }
    expect(d).toContain('Do NOT improvise one');
    // The work's own ceiling is the standard instead — which is what the
    // approved no-match line promises the writer in their own words.
    expect(d).toContain('Hold the work against ITSELF at its fullest');
  });

  it('never tells the reading to explain its own machinery', () => {
    // Editor's voice: the writer was already told, in the terms they chose.
    // A reading that narrates why it could not find a lens is the product
    // describing itself, which the standing copy rule forbids outright.
    for (const d of [
      buildInterrogateDirective('push', null, 'complete'),
      buildInterrogateDirective('push', 'carver', 'excerpt'),
    ]) {
      expect(d).toMatch(/Do not explain it again in the reading|Say nothing about lenses/);
    }
  });
});

describe('Brain 1 is only asked for the lens on a push read', () => {
  it('leaves an ordinary diagnostic prompt exactly as it was', () => {
    const plain = buildPass1System('complete');
    expect(plain).not.toContain('bestInClassLens');
    expect(plain).not.toContain('BEST-IN-CLASS LENS MATCH');
    // Identical to the no-argument form: the default must not quietly opt in.
    expect(buildPass1System('complete', false)).toBe(plain);
  });

  it('names every lens from the single source when it does ask', () => {
    const pushed = buildPass1System('complete', true);
    expect(pushed).toContain('bestInClassLens');
    // The roster is generated from LENS_IDS, so a new lens reaches Brain 1
    // without anyone remembering to add it here.
    expect(pushed).toContain('carver (Carver)');
    expect(pushed).toContain('blume (Blume)');
  });

  it('tells the model that null is expected, not a failure', () => {
    // Without this the model will always find something, and a near-miss sends
    // the analyst the wrong tradition's standard — worse than sending none,
    // because the writer cannot tell that it is wrong.
    const pushed = buildPass1System('complete', true);
    expect(pushed).toContain('RETURN null IF NOTHING GENUINELY FITS');
    expect(pushed).toContain('a near-miss is not a match');
  });
});
