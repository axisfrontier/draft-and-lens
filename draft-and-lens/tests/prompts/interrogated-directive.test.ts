import { describe, expect, it } from 'vitest';

import { buildPass1System } from '../../src/prompts/diagnostic';
import { BEST_IN_CLASS } from '../../src/prompts/interrogate/best-in-class';
import { buildInterrogateDirective } from '../../src/prompts/interrogate/directive';

/**
 * §21b, the analyst half — now every reading (merged 2026-09-01).
 *
 * THE PHRASING PINNED IN THIS FILE IS PINNED ON PURPOSE. Four tests here failed
 * during the 2026-09-01 register work because sentences had been reworded for
 * style; those exact sentences are what closed the 2026-08-28 quoting leak, so
 * the wording went back rather than the tests moving. If a test below fails,
 * restore the wording — do not move the test.
 *
 * Three helper lines were approved before any of this was built, each promising
 * a different reading, and the prompt still has to keep exactly the promise
 * they made — no more, no less. The helper lines are gone with the toggle but
 * they remain the specification.
 *
 * The failure this guards is not a crash. It is the reading quietly doing
 * something other than what the writer was told — which used to be guarded by
 * INTERROGATE_ANALYSIS_LIVE, and, now that the flag is retired, is guarded by
 * these assertions and by `readingStandardLine` alone.
 */
describe('the interrogated directive', () => {
  it('applies to every reading, with no way to opt a reading out', () => {
    // Was: 'adds nothing at all to an ordinary reading', asserting ''. The
    // merge inverts it. There is no depth argument left to pass, so the only
    // thing that could produce an empty directive is a bug — and an empty
    // directive is now a reading silently downgraded to the pre-merge product.
    for (const d of [
      buildInterrogateDirective(null, 'complete'),
      buildInterrogateDirective('carver', 'complete'),
      buildInterrogateDirective('carver', 'excerpt'),
      buildInterrogateDirective(null, 'excerpt'),
      buildInterrogateDirective(null),
    ]) {
      expect(d).not.toBe('');
      expect(d).toContain('THE AMBITION ITSELF');
    }
  });

  it('asks the ambition question on every reading', () => {
    for (const d of [
      buildInterrogateDirective('carver', 'complete'),
      buildInterrogateDirective(null, 'complete'),
      buildInterrogateDirective('carver', 'excerpt'),
    ]) {
      expect(d).toContain('was this ambition the right one for this material?');
      // Open in both directions: an ambition can be too small for the material
      // as easily as too large, and a mode that only ever finds overreach is a
      // verdict machine, not a reading.
      expect(d).toContain('smaller than the material deserves');
    }
  });

  it('gives a matched complete work its own tradition, and only that one', () => {
    const d = buildInterrogateDirective('carver', 'complete');
    expect(d).toContain(BEST_IN_CLASS.carver);
    expect(d).not.toContain(BEST_IN_CLASS.hemingway);
    // A horizon, not a threshold — the difference between a standard and a score.
    // The wording here changed on 2026-08-28. The old exemplar quoted a ready-made
    // question ("... is this piece reaching for that?"), which is precisely the
    // sentence shape that let the standard's own phrasing through; the demand it
    // stood for is unchanged and still asserted.
    expect(d).toContain("reaching for what the tradition's strongest work reaches for");
    expect(d).toContain('It is a horizon, not a threshold');
  });

  it('withholds the standard on an excerpt, and says so for the RIGHT reason', () => {
    // The 2026-08-23 ruling. The bug this catches is real and was live in the
    // first draft of the directive: an excerpt WITH a match was being told
    // nothing had fitted its tradition, which is a lie the reading could then
    // repeat to the writer.
    const d = buildInterrogateDirective('carver', 'excerpt');
    expect(d).not.toContain(BEST_IN_CLASS.carver);
    expect(d).toContain('This submission is an excerpt');
    expect(d).not.toContain('did not match any of the thirty-five voices');
  });

  it('sends no standard at all when nothing matched, and forbids improvising one', () => {
    const d = buildInterrogateDirective(null, 'complete');
    for (const id of ['carver', 'hemingway', 'chandler'] as const) {
      expect(d).not.toContain(BEST_IN_CLASS[id]);
    }
    expect(d).toContain('Do NOT improvise one');
    // The work's own ceiling is the standard instead — which is what the
    // approved no-match line promises the writer in their own words.
    expect(d).toContain('Hold the work against ITSELF at its fullest');
  });

  it('never tells the reading to explain its own machinery', () => {
    // Editor's voice: the writer was already told — at the top of the reading
    // since the merge, in the terms they chose before it. Either way a reading
    // that narrates why it could not find a lens is the product describing
    // itself, which the standing copy rule forbids outright.
    for (const d of [
      buildInterrogateDirective(null, 'complete'),
      buildInterrogateDirective('carver', 'excerpt'),
    ]) {
      expect(d).toMatch(/Do not explain it again in the reading|Say nothing about lenses/);
    }
  });

  /**
   * The three guards added 2026-08-28. Each closes a defect found by READING the
   * first real push-harder output, not by testing the prompt — so each test here
   * pins the instruction, and the thing it actually prevents is a property of the
   * prose the analyst writes. Evidence in SESSION_LOG.md, entry of 2026-08-27.
   */
  it('bans reusing the standard\'s own wording, in a form the model can measure', () => {
    const d = buildInterrogateDirective('carver', 'complete');
    // The general "do not quote" instruction was already present and the analyst
    // drifted past it. What makes this one different is that it is countable.
    expect(d).toContain('more than three consecutive words');
    expect(d).toContain('four or more words');
    // The countable rule alone did NOT hold on the 2026-08-28 verification run:
    // the standard's own phrasing came back inside a question, because the
    // instruction above it invited exactly that conversion. The worked example
    // is what carries the rule now, so it is pinned too.
    expect(d).toContain('TRANSLATE IT INTO THIS WORK BEFORE YOU WRITE A WORD OF IT');
    expect(d).toContain("built from THIS story's own nouns");
    // The illustration must stay marked as invented, or the model may read the
    // flat-clearance details as belonging to the submission in front of it.
    expect(d).toContain('NOT the submission you are reading');
  });

  it('keeps the yardstick on the matched tradition and inside the researched set', () => {
    const d = buildInterrogateDirective('carver', 'complete');
    expect(d).toContain('the ONLY standard this reading may hold the work against');
    // Refining within the tradition stays allowed — the analyst's instinct that
    // this was a British rather than American minimalism was correct and useful.
    // Only moving the measure onto an unresearched name is forbidden.
    expect(d).toContain('You may refine WITHIN it');
    expect(d).toMatch(/transfer the comparison to a writer outside this tradition/);
  });

  it('forbids the reading narrating itself, on every reading', () => {
    // Was seen under push pressure only, which is why it lives in the ambition
    // block all three cases share. Every reading is now a push read, so this
    // covers the whole product rather than an opt-in slice of it.
    for (const d of [
      buildInterrogateDirective('carver', 'complete'),
      buildInterrogateDirective(null, 'complete'),
      buildInterrogateDirective('carver', 'excerpt'),
    ]) {
      expect(d).toContain('DO NOT NARRATE THE READING');
      expect(d).toContain("The reading's honest verdict is");
    }
  });

  it('carries all three guards on every reading, not on a subset', () => {
    // Replaces 'leaves the ordinary reading untouched by all three guards'.
    // That test asserted the guards were confined to the push path; the merge
    // makes the opposite the requirement, and the guards are the reason the
    // merge is safe to make. A matched complete work carries all three.
    const d = buildInterrogateDirective('carver', 'complete');
    expect(d).toContain('more than three consecutive words');
    expect(d).toContain('the ONLY standard this reading may hold the work against');
    expect(d).toContain('DO NOT NARRATE THE READING');
  });
});

describe('Brain 1 is asked for the lens on every reading', () => {
  it('asks on every submission type, with no opt-out argument left', () => {
    // Was: 'leaves an ordinary diagnostic prompt exactly as it was', which
    // asserted the field was ABSENT without the flag. The merge removes the
    // flag and the second parameter with it; there is no longer a prompt shape
    // that omits the match, and the shorter JSON shape was deleted rather than
    // left as a branch nobody takes.
    for (const t of ['complete', 'excerpt'] as const) {
      expect(buildPass1System(t)).toContain('BEST-IN-CLASS LENS MATCH');
      expect(buildPass1System(t)).toContain('bestInClassLens');
    }
    expect(buildPass1System()).toContain('bestInClassLens');
  });

  it('names every lens from the single source', () => {
    const pushed = buildPass1System('complete');
    expect(pushed).toContain('bestInClassLens');
    // The roster is generated from LENS_IDS, so a new lens reaches Brain 1
    // without anyone remembering to add it here.
    expect(pushed).toContain('carver (Carver)');
    expect(pushed).toContain('blume (Blume)');
  });

  it('tells the model that null is expected, not a failure', () => {
    // Without this the model will always find something, and a near-miss sends
    // the analyst the wrong tradition's standard — worse than sending none,
    // because the writer cannot tell that it is wrong. This matters MORE after
    // the merge, not less: the instruction now runs on every submission, so a
    // model that stopped returning null would mismatch at full volume.
    const pushed = buildPass1System('complete');
    expect(pushed).toContain('RETURN null IF NOTHING GENUINELY FITS');
    expect(pushed).toContain('a near-miss is not a match');
  });

  it('no longer claims the writer asked to be pushed', () => {
    // Item 1 of the merge scope. Three strings asserted a request that no
    // writer makes any more; a prompt that tells the model the writer asked for
    // something they did not ask for is the same class of untruth the v6 law
    // forbids in the other direction.
    const p = buildPass1System('complete');
    expect(p).not.toContain('has asked to be pushed harder');
    expect(p).not.toContain('THIS READING ONLY');
  });
});
