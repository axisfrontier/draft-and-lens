'use client';

/**
 * The full editorial reading — Stage E container.
 *
 * Composes: partial-read banner → header (title + tradition) → verdict band →
 * character bible → scores dashboard → story arc → [Report ⇄ Notes toggle] →
 * the section-by-section reading (or the anchored manuscript) → industry match.
 *
 * Takes the streamed `report` (anchors intact) plus the side-channel results
 * from /api/analyse. Imports nothing from src/prompts or src/ai.
 */
import { useState } from 'react';

import { hasAnchors } from '@/lib/anchor';

import { AnchoredView } from './AnchoredView';
import { BiblePanel } from './BiblePanel';
import { CraftDirectives } from './CraftDirectives';
import { MarketPanel } from './MarketPanel';
import { PartialReadBanner } from './PartialReadBanner';
import { ReportSection } from './ReportSection';
import { ScoresDashboard } from './ScoresDashboard';
import { StoryArc } from './StoryArc';
import { VerdictBand } from './VerdictBand';
import { extractVerdict, parseReport } from './report';
import type { Coverage, Diagnostic, Market, Scores } from './types';

export function ReportView({
  report,
  diagnostic,
  scores,
  market,
  bible,
  submittedText,
  coverage,
}: {
  report: string;
  diagnostic: Diagnostic | null;
  scores: Scores | null;
  market: Market | null;
  bible: string;
  submittedText: string;
  coverage: Coverage | null;
}) {
  const verdict = extractVerdict(report);
  const parsed = parseReport(report);
  const anchored = hasAnchors(report);
  const [view, setView] = useState<'report' | 'anchored'>('report');

  const title =
    diagnostic && diagnostic.title && diagnostic.title !== 'Untitled' ? diagnostic.title : '';
  const traditionLine = diagnostic
    ? [diagnostic.tradition, diagnostic.register].filter(Boolean).join('  ·  ')
    : '';

  const tabStyle = (activeTab: boolean) => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '.6rem',
    letterSpacing: '.12em',
    textTransform: 'uppercase' as const,
    padding: '.5rem 1.1rem',
    background: activeTab ? 'var(--ink)' : 'transparent',
    color: activeTab ? 'var(--paper)' : 'var(--ink-soft)',
    border: 'none',
    cursor: 'pointer',
  });

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <PartialReadBanner coverage={coverage} />

      {/* Header — tradition placement + title */}
      {(title || traditionLine) && (
        <header style={{ marginBottom: '1.1rem' }}>
          {traditionLine && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '.62rem',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--amber-d)',
                marginBottom: '.5rem',
              }}
            >
              {traditionLine}
            </div>
          )}
          {title && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-.01em',
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
          )}
        </header>
      )}

      {verdict && <VerdictBand verdict={verdict} />}

      <BiblePanel bible={bible} />

      <ScoresDashboard scores={scores} />

      <StoryArc beats={scores?.beats ?? []} />

      {/* Report ⇄ Notes-on-the-text toggle (only when there are anchors) */}
      {anchored && (
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'inline-flex', border: '1px solid var(--ink-mid)', borderRadius: 8, overflow: 'hidden' }}>
            <button type="button" onClick={() => setView('report')} style={tabStyle(view === 'report')}>
              Report
            </button>
            <button type="button" onClick={() => setView('anchored')} style={tabStyle(view === 'anchored')}>
              Notes on the text
            </button>
          </div>
        </div>
      )}

      {view === 'anchored' && anchored ? (
        <AnchoredView report={report} text={submittedText} />
      ) : (
        <>
          <div style={{ marginTop: anchored ? 0 : '1.5rem' }}>
            {parsed.sections.map((sec, i) =>
              sec.body.trim() ? (
                <ReportSection
                  key={i}
                  index={i}
                  heading={sec.heading}
                  body={sec.body.trim()}
                  // All sections open by default — the reading is meant to be read
                  // in full; collapsing signalled "less important" (Change 1).
                  defaultOpen
                  tinted={i % 2 === 1}
                />
              ) : null
            )}
          </div>
          <CraftDirectives parsed={parsed} />
        </>
      )}

      <MarketPanel market={market} />
    </div>
  );
}
