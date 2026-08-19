import { describe, expect, it } from 'vitest';

import { buildRevisionDirective } from '../../src/prompts/fragments/revision';

/**
 * Mentor addendum Part B rests on one law: the analyst must never simulate a
 * past it does not have. The directive is the only place that law can be
 * broken, so the absence of prior notes is tested as carefully as their
 * presence.
 */
describe('buildRevisionDirective', () => {
  const change = 'The ending has been substantially reworked.';

  it('says nothing about earlier notes when there are none', () => {
    for (const none of [undefined, null, '']) {
      const d = buildRevisionDirective(change, none as string | null | undefined);
      expect(d).not.toMatch(/earlier reading/i);
      expect(d).not.toMatch(/recurring/i);
      expect(d).not.toMatch(/previous version of this work/i);
    }
  });

  it('still acknowledges the revision itself with no prior notes', () => {
    const d = buildRevisionDirective(change);
    expect(d).toContain(change);
    expect(d).toMatch(/REVISED version/);
  });

  it('passes real prior notes through verbatim and marks them real', () => {
    const prior = '1. **START HERE** The ending arrives before it is earned.';
    const d = buildRevisionDirective(change, prior);
    expect(d).toContain(prior);
    // The analyst is told these are stored text, not something it is imagining
    // — the exact confusion the no-fabrication law exists to prevent.
    expect(d).toMatch(/They are real; you are not\s+imagining them/);
  });

  it('keeps the earlier reading subordinate to the draft in hand', () => {
    const d = buildRevisionDirective(change, 'some prior note');
    expect(d).toMatch(/do not grade the revision/i);
    expect(d).toMatch(/do not reproduce the old notes/i);
    expect(d).toMatch(/the text wins/i);
  });

  it('permits a recurring tendency only where it is visible now', () => {
    const d = buildRevisionDirective(change, 'some prior note');
    expect(d).toMatch(/RECURRING tendency, but only one you can\s+point to in the text in front of you now/);
  });

  it('does not reproach a writer who did not act on a note', () => {
    // A writer may never have seen the note, or may have chosen against it.
    const d = buildRevisionDirective(change, 'some prior note');
    expect(d).toMatch(/without\s+reproach/i);
    expect(d).toMatch(/which is their right/i);
  });
});
