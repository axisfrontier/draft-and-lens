import { describe, expect, it } from 'vitest';

import { partialReadNotice } from '../../src/app/api/lens/notice';

/**
 * Every string a writer can read is the editor speaking (CLAUDE.md). This one
 * is easy to get wrong in the specific way that section warns about, because it
 * is reporting a system limit — the temptation is a status line about a
 * submission, and the standing rule is that a limit is still something that
 * happened between the two of you.
 *
 * It also has to be TRUE. The middle is what gets dropped, not the end, so copy
 * about "the first N words" would be a tidier sentence describing something the
 * code does not do — and the whole reason this notice exists is that the writer
 * knows what was actually behind the reading.
 */

const NOTICE = partialReadNotice(2_310, 3_400);

describe('the partial-read notice', () => {
  it('says what was read and what was not', () => {
    expect(NOTICE).toContain('the opening and the ending');
    expect(NOTICE).toContain('not the middle');
  });

  it('gives both numbers, formatted', () => {
    expect(NOTICE).toContain('2,310');
    expect(NOTICE).toContain('3,400');
  });

  it('speaks as the editor, in the first person', () => {
    expect(NOTICE).toMatch(/\bI\b/);
  });

  it('uses none of the banned phrases', () => {
    // From CLAUDE.md's writer-facing copy rule.
    for (const banned of [
      'your submission', 'analysis complete', 'analysis failed', 'please try again',
      'Draft & Lens', 'could not', 'unable to', 'error', 'exceeded', 'limit',
      'truncat', 'word count', 'maximum',
    ]) {
      expect(NOTICE.toLowerCase(), banned).not.toContain(banned.toLowerCase());
    }
  });

  it('never describes its own machinery', () => {
    for (const machinery of ['character', 'window', 'cap', 'the system', 'processed']) {
      expect(NOTICE.toLowerCase(), machinery).not.toContain(machinery.toLowerCase());
    }
  });

  it('scales its numbers rather than hardcoding them', () => {
    const other = partialReadNotice(1_000, 9_999);
    expect(other).toContain('1,000');
    expect(other).toContain('9,999');
    expect(other).not.toContain('2,310');
  });
});
