import type { ReactNode } from 'react';

import { GLOSSARY, glossaryIndex } from './glossary-data';
import { TermTooltip } from './TermTooltip';

/**
 * Glossary annotation — §19. Scans a plain-text run for craft terms (and their
 * aliases) and wraps each in a TermTooltip. Longest phrases match first; each
 * canonical term is annotated at most once per `counts` scope (the caller passes
 * one Map per report-body so a term isn't repeated down a section).
 */

const INDEX = glossaryIndex();

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// One combined, word-bounded, case-insensitive matcher (longest alternative first).
const PATTERN = new RegExp(
  '\\b(?:' + INDEX.map((e) => escapeRegExp(e.phrase)).join('|') + ')\\b',
  'gi'
);

export function annotateGlossary(
  text: string,
  counts: Map<string, number>,
  keyPrefix: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  PATTERN.lastIndex = 0;

  while ((m = PATTERN.exec(text)) !== null) {
    const matched = m[0];
    const lower = matched.toLowerCase();
    const found = INDEX.find((e) => e.phrase.toLowerCase() === lower);
    if (!found) continue;
    if ((counts.get(found.key) ?? 0) >= 1) continue; // annotate each term once per body

    if (m.index > last) nodes.push(text.slice(last, m.index));
    counts.set(found.key, 1);
    nodes.push(
      <TermTooltip
        key={`${keyPrefix}-g${i++}`}
        term={matched}
        gloss={GLOSSARY[found.key]?.gloss ?? ''}
      />
    );
    last = m.index + matched.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
