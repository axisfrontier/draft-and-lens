import { describe, expect, it } from 'vitest';

import { findPublicationApparatus } from '../../src/lib/provenance';

/**
 * The governing asymmetry: a miss is accepted, a false positive tells a writer
 * their own work is somebody else's. So most of what is pinned here is what
 * must NOT fire — and the false-positive cases are drawn from things writers
 * genuinely put in their own manuscripts.
 */
describe('findPublicationApparatus — what must never fire', () => {
  it('ignores a title page and byline', () => {
    // The original sketch named these as signals. They are the single most
    // ordinary thing at the top of a submitted draft, so treating them as
    // evidence would fire hardest on the most careful writers.
    expect(
      findPublicationApparatus('THE SALT LINE\n\nA Novel\n\nby Jane Smith\n\nChapter One\n\nThe tide came in.')
    ).toBeNull();
  });

  it('ignores a writer asserting their own copyright', () => {
    expect(findPublicationApparatus('© 2026 Jane Smith\n\nThe hall was cold that morning.')).toBeNull();
    expect(findPublicationApparatus('Copyright 2026 Jane Smith')).toBeNull();
  });

  it('ignores prose that merely discusses fiction or publishing', () => {
    expect(
      findPublicationApparatus('She had been told her novel was a work of fiction in the worst sense.')
    ).toBeNull();
    expect(
      findPublicationApparatus('He had published a book once, he said, and never wrote another.')
    ).toBeNull();
  });

  it('ignores an epigraph', () => {
    // Writers quote other writers at the head of their own work constantly.
    expect(
      findPublicationApparatus('"The past is never dead."\n— William Faulkner\n\nChapter One')
    ).toBeNull();
  });

  it('ignores an empty or trivial submission', () => {
    expect(findPublicationApparatus('')).toBeNull();
    expect(findPublicationApparatus('The tide came in.')).toBeNull();
  });
});

describe('findPublicationApparatus — the apparatus a publisher adds', () => {
  it('catches the rights reservation formula', () => {
    expect(findPublicationApparatus('All rights reserved.\n\nThe tide came in.')?.signal).toBe(
      'all-rights-reserved'
    );
  });

  it('catches reproduction and permissions boilerplate', () => {
    expect(
      findPublicationApparatus('No part of this book may be reproduced without permission.')?.signal
    ).toBe('no-part-may-be-reproduced');
    expect(findPublicationApparatus('Reprinted by permission of the publisher.')?.signal).toBe(
      'reprinted-by-permission'
    );
  });

  it('catches prior-publication statements', () => {
    expect(findPublicationApparatus('First published in Great Britain in 1981')?.signal).toBe(
      'first-published'
    );
    expect(findPublicationApparatus('Originally published by Alfred A. Knopf')?.signal).toBe(
      'first-published'
    );
  });

  it('catches trade identifiers and cataloguing', () => {
    expect(findPublicationApparatus('ISBN: 978-0-00-000000-0')?.signal).toBe('isbn');
    expect(findPublicationApparatus('Library of Congress Cataloging-in-Publication Data')?.signal).toBe(
      'library-of-congress'
    );
  });

  it('catches the standard disclaimer page, not a passing phrase', () => {
    expect(
      findPublicationApparatus(
        'This is a work of fiction. Names, characters, and incidents are the products of the author’s imagination.'
      )?.signal
    ).toBe('fiction-disclaimer');
  });

  it('finds apparatus wherever it sits, not only at the top', () => {
    // It clusters at the front of a scanned page but trails at the end of a
    // copied extract.
    const trailing = `${'The tide came in. '.repeat(60)}\n\nAll rights reserved.`;
    expect(findPublicationApparatus(trailing)?.signal).toBe('all-rights-reserved');
  });

  it('returns a label, never the matched text', () => {
    // Nothing about a declined submission is stored, including in telemetry.
    const hit = findPublicationApparatus('ISBN: 978-0-00-000000-0');
    expect(Object.keys(hit ?? {})).toEqual(['signal']);
  });
});
