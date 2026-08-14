'use client';

/**
 * Inline note anchoring view — §18, Stage E. The submitted manuscript with the
 * analyst's notes pinned in the margin beside the exact lines they quote.
 * Clicking a note (or its highlighted span) links the two. Quotes the resolver
 * can't locate are shown as honest "general notes", never dropped.
 */
import { useMemo, useRef, useState } from 'react';

import { annotateGlossary } from '../glossary/annotate';
import { resolveAnchors, type AnchorSegment } from '@/lib/anchor';
import { findMisspellings, type SpellingFlag } from '@/lib/spelling';

import { SpellingMark } from './SpellingMark';

/** A run of text carrying both span systems at once. */
interface MergedRun {
  text: string;
  /** Index into `notes` when this run sits inside an anchored quote. */
  anchorIndex: number | null;
  /** Index into `flags` when this run is (part of) a flagged misspelling. */
  flagIndex: number | null;
  /** True on the FIRST run of a flag — the only one that renders a correction. */
  flagStart: boolean;
}

/**
 * Merge the anchor spans and the spelling spans over the same string.
 *
 * The two systems are independent and can overlap in any combination: a
 * misspelling may sit inside an anchored quote, outside one, or straddle its
 * edge. `segments` carry no absolute offsets, but they concatenate to `text`,
 * so offsets are recovered by accumulation; `findMisspellings` already reports
 * absolute indices. Splitting at every boundary from both systems yields runs
 * that belong to at most one of each — which is all the renderer needs.
 *
 * A flag straddling a segment boundary produces two runs sharing a flagIndex.
 * Only the first carries `flagStart`, so accepting a correction substitutes the
 * suggestion once rather than duplicating it across the pieces.
 */
function mergeRuns(text: string, segments: AnchorSegment[], flags: SpellingFlag[]): MergedRun[] {
  const runs: MergedRun[] = [];
  const startedFlags = new Set<number>();
  let cursor = 0;

  for (const seg of segments) {
    const segStart = cursor;
    const segEnd = cursor + seg.text.length;
    cursor = segEnd;

    const overlapping = flags
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.index < segEnd && f.index + f.found.length > segStart)
      .sort((a, b) => a.f.index - b.f.index);

    let local = segStart;
    for (const { f, i } of overlapping) {
      const from = Math.max(f.index, segStart);
      const to = Math.min(f.index + f.found.length, segEnd);
      if (from > local) {
        runs.push({ text: text.slice(local, from), anchorIndex: seg.anchorIndex, flagIndex: null, flagStart: false });
      }
      runs.push({
        text: text.slice(from, to),
        anchorIndex: seg.anchorIndex,
        flagIndex: i,
        flagStart: !startedFlags.has(i),
      });
      startedFlags.add(i);
      local = to;
    }
    if (local < segEnd) {
      runs.push({ text: text.slice(local, segEnd), anchorIndex: seg.anchorIndex, flagIndex: null, flagStart: false });
    }
  }

  return runs;
}

/** Apply accepted corrections to the original text, right-to-left so indices hold. */
function applyCorrections(text: string, flags: SpellingFlag[], accepted: ReadonlySet<number>): string {
  const chosen = [...accepted]
    .map((i) => flags[i])
    .filter((f): f is SpellingFlag => f !== undefined)
    .sort((a, b) => b.index - a.index);
  let out = text;
  for (const f of chosen) {
    out = out.slice(0, f.index) + f.suggestion + out.slice(f.index + f.found.length);
  }
  return out;
}

export function AnchoredView({ report, text }: { report: string; text: string }) {
  const [active, setActive] = useState<number | null>(null);
  const [accepted, setAccepted] = useState<ReadonlySet<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const markRefs = useRef<Record<number, HTMLElement | null>>({});
  const noteRefs = useRef<Record<number, HTMLElement | null>>({});

  // Hooks must run unconditionally on every render, so these — and the
  // resolveAnchors call they depend on — sit above the empty-text early
  // return below rather than after it.
  const { segments, notes, orphans } = resolveAnchors(report, text);
  // Regex scan over the whole manuscript — memoised so it does not re-run on
  // every hover, note activation, or acceptance.
  const flags = useMemo(() => findMisspellings(text), [text]);
  const runs = useMemo(() => mergeRuns(text, segments, flags), [text, segments, flags]);

  if (!text.trim()) {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--ink-soft)', padding: '2rem' }}>
        No submitted text is available to display.
      </p>
    );
  }

  // One count map shared across all notes + orphans, so a glossary term is
  // annotated at most once across the whole panel — mirrors FormattedBody's
  // per-body scoping for the main report sections.
  const glossCounts = new Map<string, number>();

  /** Clicking a span → scroll the note into view. */
  const activateFromSpan = (i: number): void => {
    setActive(i);
    noteRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  /** Clicking a note → scroll the anchored span into view. */
  const activateFromNote = (i: number): void => {
    setActive(i);
    markRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const countLine = notes.length
    ? `${notes.length} note${notes.length === 1 ? '' : 's'} pinned to the text${
        orphans.length ? ` · ${orphans.length} general` : ''
      }`
    : orphans.length
      ? 'Notes could not be pinned to specific lines — shown as general notes'
      : 'No line-anchored notes in this reading';

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '.62rem',
          letterSpacing: '.06em',
          color: 'var(--ink-soft)',
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        {countLine}
        {flags.length > 0 && (
          <span style={{ color: 'var(--error)' }}>
            {' · '}
            {flags.length} possible spelling{flags.length === 1 ? '' : 's'}
            {accepted.size > 0 ? ` · ${accepted.size} accepted` : ''}
          </span>
        )}
      </div>

      {/* Export — appears only once the writer has accepted something. Draft &
          Lens does not hold the manuscript, so corrections are never written
          back to stored text; the writer takes a corrected copy to their own
          file. Keeps source_text intact, which revision-matching diffs against. */}
      {accepted.size > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '.9rem',
            padding: '.7rem .9rem', marginBottom: '1.25rem',
            background: 'var(--cream)', borderLeft: '3px solid var(--green)',
          }}
        >
          <span style={{ fontSize: '.78rem', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            {accepted.size} correction{accepted.size === 1 ? '' : 's'} accepted. Your original
            text is unchanged — take a corrected copy back to your own draft.
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                .writeText(applyCorrections(text, flags, accepted))
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
            style={{
              flexShrink: 0,
              fontFamily: 'var(--font-mono)', fontSize: '.62rem',
              letterSpacing: '.12em', textTransform: 'uppercase',
              padding: '.5rem .9rem', cursor: 'pointer',
              background: copied ? 'var(--green)' : 'var(--ink)',
              color: 'var(--paper)', border: 'none', borderRadius: 3,
            }}
          >
            {copied ? 'Copied' : 'Copy corrected text'}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '3rem', alignItems: 'start', width: 'calc(100% + 280px)' }}>
        {/* manuscript with anchored spans */}
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '.92rem',
            lineHeight: 1.85,
            color: 'var(--ink)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {runs.map((r, i) => {
            const flag = r.flagIndex === null ? null : flags[r.flagIndex];
            const isAccepted = r.flagIndex !== null && accepted.has(r.flagIndex);

            // A flag split across a segment boundary renders its correction once,
            // on the first piece; the remaining pieces collapse to nothing.
            const body = flag && isAccepted
              ? (r.flagStart ? flag.suggestion : '')
              : r.text;

            const inner = flag ? (
              <SpellingMark
                flag={flag}
                accepted={isAccepted}
                onAccept={() => {
                  if (r.flagIndex === null) return;
                  const next = new Set(accepted);
                  next.add(r.flagIndex);
                  setAccepted(next);
                  setCopied(false);
                }}
              >
                {body}
              </SpellingMark>
            ) : (
              body
            );

            return r.anchorIndex === null ? (
              <span key={i}>{inner}</span>
            ) : (
              <mark
                key={i}
                ref={(el) => {
                  if (r.anchorIndex !== null) markRefs.current[r.anchorIndex] = el;
                }}
                onClick={() => r.anchorIndex !== null && activateFromSpan(r.anchorIndex)}
                style={{
                  background: active === r.anchorIndex ? 'rgba(168,108,16,.34)' : 'rgba(168,108,16,.14)',
                  borderBottom: `1.5px solid ${active === r.anchorIndex ? 'var(--amber)' : 'var(--amber-l)'}`,
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '.05em 0',
                  borderRadius: 2,
                }}
              >
                {inner}
              </mark>
            );
          })}
        </div>

        {/* margin notes */}
        <div>
          {notes.map((r, i) => (
            <div
              key={i}
              ref={(el) => { noteRefs.current[i] = el; }}
              onClick={() => activateFromNote(i)}
              style={{
                background: active === i ? 'var(--warm-mid)' : 'var(--cream)',
                borderLeft: `3px solid ${active === i ? 'var(--amber)' : 'var(--teal)'}`,
                borderRadius: '0 8px 8px 0',
                padding: '.7rem .9rem',
                marginBottom: '.7rem',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.55rem',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--teal)',
                  marginBottom: '.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.5rem',
                }}
              >
                Note {String(i + 1).padStart(2, '0')}
                {r.spanCount > 1 && (
                  <span
                    style={{
                      background: 'var(--amber-l)',
                      color: 'var(--amber-d)',
                      borderRadius: 10,
                      padding: '0 .45rem',
                      fontSize: '.5rem',
                      letterSpacing: '.08em',
                    }}
                  >
                    ×{r.spanCount}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '.8rem', lineHeight: 1.55, color: 'var(--ink-mid)' }}>
                {annotateGlossary(r.note, glossCounts, `note-${i}`)}
              </div>
            </div>
          ))}

          {orphans.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule-l)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.55rem',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft)',
                  marginBottom: '.6rem',
                }}
              >
                General notes (not pinned to a line)
              </div>
              {orphans.map((o, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: '3px solid var(--rule)',
                    borderRadius: '0 8px 8px 0',
                    padding: '.55rem .9rem',
                    marginBottom: '.55rem',
                    fontSize: '.78rem',
                    lineHeight: 1.55,
                    color: 'var(--ink-soft)',
                  }}
                >
                  {annotateGlossary(o, glossCounts, `orphan-${i}`)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
