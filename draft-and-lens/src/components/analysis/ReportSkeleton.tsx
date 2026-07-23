import type { CSSProperties } from 'react';

import { FormattedBody } from './FormattedBody';
import { parseReport } from './report';
import { getSkeletonSections } from './reportSkeletonSections';
import { ScoresDashboard } from './ScoresDashboard';
import { StoryArc } from './StoryArc';
import type { Mode, Scores } from './types';

/**
 * Pre-stream placeholder — mirrors ReportView's grid, sidebar, and section
 * layout exactly, so nothing jumps or restyles when the real ReportView
 * mounts on completion. Shown from the moment analysis starts until the
 * `done` SSE event arrives; see page.tsx. Section bodies fill in with the
 * real streamed text as each ## HEADING arrives (parsed live via
 * parseReport), so the page visibly populates during generation instead of
 * sitting frozen on placeholders until the whole response lands.
 *
 * 5C (progressive reveal): the scorer brain typically finishes 60-150s before
 * the analyst (measured, Phase 3 ladder), so its result is usually sitting in
 * state well before `done` fires. When `scores` is supplied, the Dashboard and
 * Story Arc placeholders below are replaced with the real components instead
 * of continuing to breathe emptily — the wait becomes a sequence of arrivals
 * rather than one long hold. Falls back to the placeholder when scores is
 * still null (not yet arrived, or the scorer failed) so nothing ever
 * renders broken mid-stream.
 */

function Bar({ width, height = '.9rem' }: { width: string; height?: string }) {
  const style: CSSProperties = {
    width, height,
    background: 'var(--rule-l)',
    borderRadius: 2,
    animation: 'breathe 2s ease-in-out infinite',
  };
  return <div style={style} />;
}

const sidebarLinkMuted: CSSProperties = {
  display: 'block',
  padding: '.4rem 1.25rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '.6rem',
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: 'var(--ink-soft)',
  borderLeft: '2px solid transparent',
  lineHeight: 1.4,
  opacity: 0.6,
};

const sidebarGroup: CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '.72rem',
  fontWeight: 700,
  letterSpacing: '.02em',
  textTransform: 'uppercase',
  color: 'var(--ink-soft)',
  padding: '.9rem 1.25rem .3rem',
};

const sectionHeading: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '.72rem',
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--amber-d)',
  marginBottom: '.9rem',
};

export function ReportSkeleton({
  mode, wordCount, streamedText, extraTopOffset = 0, scores,
}: {
  mode: Mode | null;
  wordCount: number;
  streamedText?: string;
  /** Extra px to clear a fixed banner sitting above this component (e.g. the
   *  in-progress status bar) — the sidebar's sticky offset must match it or
   *  it sticks underneath the banner once scrolled. */
  extraTopOffset?: number;
  /** 5C — when available (typically well before the analyst finishes), swaps
   *  the Dashboard/Story Arc placeholders for the real components. */
  scores?: Scores | null;
}) {
  const sections = getSkeletonSections(mode ?? 'story', wordCount);
  const pages = Math.max(1, Math.round(wordCount / 250));
  const modeLabel = mode === 'script' ? 'Film Script' : mode === 'treatment' ? 'Treatment' : mode === 'play' ? 'Stage Play' : 'Story';

  const streamedSections = streamedText ? parseReport(streamedText).sections : [];
  const findBody = (label: string): string | null => {
    const match = streamedSections.find((s) => s.heading.trim().toUpperCase() === label.toUpperCase());
    return match && match.body.trim() ? match.body.trim() : null;
  };

  const stickyTop = extraTopOffset
    ? `calc(var(--nav-h) + ${extraTopOffset}px)`
    : 'var(--nav-h)';
  const sidebarHeight = extraTopOffset
    ? `calc(100vh - var(--nav-h) - ${extraTopOffset}px)`
    : 'calc(100vh - var(--nav-h))';

  return (
    <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr var(--sidebar-w)', minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── SIDEBAR SHELL (muted) ── */}
      <aside className="report-sidebar" style={{
        position: 'sticky', top: stickyTop,
        gridColumn: 2, gridRow: 1,
        height: sidebarHeight,
        overflowY: 'auto', background: 'var(--cream)',
        borderLeft: '1px solid var(--rule-l)',
        padding: '0', alignSelf: 'start',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '.52rem',
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: 'var(--ink-faint)', padding: '.75rem 1.25rem .75rem',
          borderBottom: '1px solid var(--rule-l)', marginBottom: '.5rem',
        }}>Jump to</div>

        <div style={sidebarGroup}>Overview</div>
        <span style={sidebarLinkMuted}>Title &amp; summary</span>
        <span style={sidebarLinkMuted}>Verdict</span>
        <span style={sidebarLinkMuted}>Character bible</span>

        <div style={sidebarGroup}>Dashboard</div>
        <span style={sidebarLinkMuted}>Dimension map</span>
        <span style={sidebarLinkMuted}>Story arc</span>

        <div style={sidebarGroup}>Analysis</div>
        {sections.map((label) => (
          <span key={label} style={sidebarLinkMuted}>{label}</span>
        ))}

        <div style={sidebarGroup}>Action</div>
        <span style={sidebarLinkMuted}>Three things</span>
        <span style={sidebarLinkMuted}>Editorial lenses</span>
        <span style={sidebarLinkMuted}>Studio match</span>

        <div style={{ ...sidebarGroup, marginTop: '1.25rem' }}>Reference</div>
        <span style={sidebarLinkMuted}>About</span>
        <span style={sidebarLinkMuted}>Glossary</span>
        <span style={sidebarLinkMuted}>Feedback</span>
        <span style={sidebarLinkMuted}>Contact</span>
        <span style={sidebarLinkMuted}>Disclaimer</span>
      </aside>

      {/* ── MAIN CONTENT SKELETON ── */}
      <div style={{ gridColumn: 1, gridRow: 1, background: 'var(--paper)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 3rem 8rem' }}>

          {/* Title block */}
          <div style={{
            padding: '3.5rem 0 2.5rem',
            display: 'grid', gridTemplateColumns: '1fr 200px',
            gap: '1.5rem', borderBottom: '1px solid var(--rule)',
          }}>
            <div>
              <div style={{ marginBottom: '1rem' }}><Bar width="220px" height=".7rem" /></div>
              <div style={{ marginBottom: '1rem' }}><Bar width="60%" height="3rem" /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', borderLeft: '2px solid var(--rule)', paddingLeft: '1rem', maxWidth: 500 }}>
                <Bar width="100%" />
                <Bar width="80%" />
              </div>
            </div>
            <div>
              <div style={{ border: '1px solid var(--rule-l)', padding: '1rem', background: 'var(--cream)' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                  letterSpacing: '.2em', textTransform: 'uppercase',
                  color: 'var(--ink-soft)', marginBottom: '.6rem',
                }}>Document</div>
                {[
                  { label: 'Pages', value: String(pages) },
                  { label: 'Words', value: wordCount.toLocaleString() },
                  { label: 'Mode', value: modeLabel },
                ].map((item, i, arr) => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                    letterSpacing: '.06em', padding: '.3rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--rule-l)' : 'none',
                    color: 'var(--ink-soft)',
                  }}>
                    <span>{item.label}</span>
                    <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verdict placeholder */}
          <div style={{
            display: 'flex', alignItems: 'stretch',
            background: 'var(--black-band)', margin: '0 -3rem',
          }}>
            <div style={{ width: 4, background: 'var(--rule-l)', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <div style={{ width: 160, height: '1.7rem', background: 'var(--ink-mid)', borderRadius: 2, animation: 'breathe 2s ease-in-out infinite' }} />
              <div style={{ width: 1, background: 'var(--ink-mid)', alignSelf: 'stretch', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxWidth: 500, flex: 1 }}>
                <div style={{ width: '100%', height: '.85rem', background: 'var(--ink-mid)', borderRadius: 2, animation: 'breathe 2s ease-in-out infinite' }} />
                <div style={{ width: '70%', height: '.85rem', background: 'var(--ink-mid)', borderRadius: 2, animation: 'breathe 2s ease-in-out infinite' }} />
              </div>
            </div>
          </div>

          {/* Character bible placeholder */}
          <div style={{
            borderBottom: '1px solid var(--rule-l)',
            padding: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--amber-d)' }}>Character bible</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '.52rem', letterSpacing: '.1em', textTransform: 'uppercase',
                padding: '.2rem .5rem', background: 'rgba(168,108,16,.1)', color: 'var(--amber-d)', border: '1px solid rgba(168,108,16,.2)',
              }}>Auto-generated</span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--rule)' }}>▼</span>
          </div>

          {/* Dashboard — 5C: real component once scores has arrived, otherwise the placeholder */}
          {scores ? (
            <ScoresDashboard scores={scores} />
          ) : (
            <div style={{ padding: '1.5rem 0' }}>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700,
                color: 'var(--ink)', marginBottom: '1.25rem',
              }}>Craft balance</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                <div style={{
                  width: '100%', aspectRatio: '1 / 1', maxWidth: 280,
                  borderRadius: '50%', border: '1px solid var(--rule-l)',
                  background: 'var(--cream)', animation: 'breathe 2.4s ease-in-out infinite',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <Bar width="40%" height=".6rem" />
                      <Bar width="80px" height=".6rem" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Story arc — 5C: real component once scores.beats has arrived, otherwise the placeholder */}
          {scores?.beats?.length ? (
            <StoryArc beats={scores.beats} />
          ) : (
            <div style={{ padding: '1.5rem 0' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: '1rem',
              }}>Story arc · interpreted</div>
              <div style={{
                height: 220, background: 'var(--cream)', border: '1px solid var(--rule-l)',
                animation: 'breathe 2.4s ease-in-out infinite',
              }} />
            </div>
          )}

          {/* Editorial Analysis header */}
          <div style={{ padding: '1.5rem 0 1rem' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '.72rem',
              letterSpacing: '.2em', textTransform: 'uppercase',
              color: 'var(--amber-d)', marginBottom: '.4rem',
            }}>Editorial analysis</div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.4rem',
              fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em',
            }}>Section by section breakdown</div>
          </div>

          {/* Section placeholders — real headings; bodies fill in live as they stream */}
          {sections.map((label, i) => {
            const body = findBody(label);
            return (
              <div key={label} style={{
                padding: '1.5rem 0', borderTop: i > 0 ? '1px solid var(--rule-l)' : 'none',
                background: i % 2 === 1 ? 'var(--cream)' : 'transparent',
                margin: i % 2 === 1 ? '0 -1.5rem' : undefined,
                paddingLeft: i % 2 === 1 ? '1.5rem' : undefined,
                paddingRight: i % 2 === 1 ? '1.5rem' : undefined,
              }}>
                <div style={sectionHeading}>{label}</div>
                {body ? (
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontSize: '.92rem',
                    lineHeight: 1.85, color: 'var(--ink-soft)',
                  }}>
                    <FormattedBody text={body} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                    <Bar width="100%" />
                    <Bar width="95%" />
                    <Bar width="60%" />
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
