'use client';

import { useState } from 'react';

import { hasAnchors } from '@/lib/anchor';
import { countWords } from '@/lib/limits';

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

const LENS_GROUPS: ReadonlyArray<{ label: string; names: string[] }> = [
  { label: 'Directors', names: ['Spielberg', 'Coppola', 'Coen Brothers', 'Villeneuve', 'Ridley Scott', 'Wilder', 'Jeunet', 'Wenders', 'Tarantino', 'Wachowskis', 'Lucas', 'Petalune'] },
  { label: 'Novelists & Short Story Writers', names: ['Hemingway', 'Carver', "O'Connor", 'Chekhov', 'Nabokov', 'Bukowski', 'Atwood', 'Eyre'] },
  { label: 'Screenwriters', names: ['Sorkin', 'Roth', 'Kaufman', 'Pinter'] },
  { label: 'Showrunners', names: ['Simon', 'Key'] },
  { label: 'Producers', names: ['Bruckheimer', 'Feige'] },
];

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
  const mode = '';
  const wc = countWords(submittedText);
  const pages = Math.max(1, Math.round(wc / 250));

  const sidebarSections = parsed.sections.map((s, i) => ({
    id: `sec-${String(i + 1).padStart(2, '0')}`,
    label: s.heading,
  }));

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

  const sidebarLink = {
    display: 'block',
    padding: '.4rem 1.25rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '.6rem',
    letterSpacing: '.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-faint)',
    textDecoration: 'none',
    borderLeft: '2px solid transparent',
    lineHeight: 1.4,
  };

  const sidebarGroup = {
    fontFamily: 'var(--font-serif)',
    fontSize: '.72rem',
    fontWeight: 700,
    letterSpacing: '.02em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-soft)',
    padding: '.9rem 1.25rem .3rem',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr var(--sidebar-w)', minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── RIGHT SIDEBAR ── */}
      <aside style={{
        position: 'sticky', top: 'var(--nav-h)',
        gridColumn: 2, gridRow: 1,
        height: 'calc(100vh - var(--nav-h))',
        overflowY: 'auto', background: 'var(--cream)',
        borderLeft: '1px solid var(--rule-l)',
        padding: '1.5rem 0', alignSelf: 'start',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '.52rem',
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: 'var(--ink-faint)', padding: '0 1.25rem .75rem',
          borderBottom: '1px solid var(--rule-l)', marginBottom: '.5rem',
        }}>Jump to</div>

        <div style={sidebarGroup}>Overview</div>
        <a href="#sec-title" style={sidebarLink}>Title &amp; summary</a>
        <a href="#sec-verdict" style={sidebarLink}>Verdict</a>
        <a href="#sec-bible" style={sidebarLink}>Character bible</a>

        <div style={sidebarGroup}>Dashboard</div>
        <a href="#sec-dashboard" style={sidebarLink}>Dimension map</a>
        <a href="#sec-arc" style={sidebarLink}>Story arc</a>

        <div style={sidebarGroup}>Analysis</div>
        {sidebarSections.map((s) => (
          <a key={s.id} href={`#${s.id}`} style={sidebarLink}>{s.label}</a>
        ))}

        <div style={sidebarGroup}>Action</div>
        <a href="#sec-three" style={sidebarLink}>Three things</a>
        <a href="#sec-lenses" style={sidebarLink}>Editorial lenses</a>
        <a href="#sec-studios" style={sidebarLink}>Studio match</a>

        <div style={{ ...sidebarGroup, marginTop: '1.25rem' }}>Reference</div>
        <a href="/about" style={sidebarLink}>About</a>
        <a href="/glossary" style={sidebarLink}>Glossary</a>
        <a href="/feedback" style={sidebarLink}>Feedback</a>
        <a href="mailto:hello@draftandlens.com" style={sidebarLink}>Contact</a>
        <a href="#sec-disclaimer" style={sidebarLink}>Disclaimer</a>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        gridColumn: 1, gridRow: 1,
        background: 'var(--paper)', minHeight: '100vh',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 3rem 8rem' }}>

          <PartialReadBanner coverage={coverage} />

          {/* Title block */}
          <div id="sec-title" style={{
            padding: '3.5rem 0 2.5rem',
            display: 'grid', gridTemplateColumns: '1fr 200px',
            gap: '3rem', borderBottom: '1px solid var(--rule)',
          }}>
            <div>
              {traditionLine && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                  letterSpacing: '.22em', textTransform: 'uppercase',
                  color: 'var(--ink-soft)', marginBottom: '1rem',
                }}>
                  {traditionLine}
                </div>
              )}
              {title && (
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 700, lineHeight: 1.05,
                  letterSpacing: '-.02em', color: 'var(--ink)',
                  marginBottom: '.6rem',
                }}>
                  {title}
                </h1>
              )}
              {!title && (
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 700, lineHeight: 1.05,
                  letterSpacing: '-.02em', color: 'var(--ink)',
                  marginBottom: '.6rem',
                }}>
                  Untitled
                </h1>
              )}
            </div>
            <div>
              <div style={{
                border: '1px solid var(--rule-l)', padding: '1rem',
                background: 'var(--cream)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                  letterSpacing: '.2em', textTransform: 'uppercase',
                  color: '#c8b898', marginBottom: '.6rem',
                }}>Document</div>
                {[
                  { label: 'Pages', value: String(pages) },
                  { label: 'Words', value: wc.toLocaleString() },
                  { label: 'Mode', value: mode || 'Story' },
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

          {/* Verdict */}
          <div id="sec-verdict">
            {verdict && <VerdictBand verdict={verdict} />}
          </div>

          {/* Bible */}
          <div id="sec-bible">
            <BiblePanel bible={bible} />
          </div>

          {/* Dashboard */}
          <div id="sec-dashboard">
            <ScoresDashboard scores={scores} />
          </div>

          {/* Story Arc */}
          <div id="sec-arc">
            <StoryArc beats={scores?.beats ?? []} />
          </div>

          {/* Editorial Analysis header */}
          <div style={{
            padding: '2.5rem 0 1.5rem',
          }}>
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

          {/* Download row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'flex-start', gap: '.75rem',
            padding: '1.5rem 0', borderBottom: '1px solid var(--rule-l)',
            marginBottom: '2.5rem',
          }}>
            <button type="button" style={{
              fontFamily: 'var(--font-mono)', fontSize: '.62rem',
              letterSpacing: '.16em', textTransform: 'uppercase',
              padding: '.55rem 1.1rem', background: 'transparent',
              border: '1px solid var(--rule)', color: 'var(--ink-soft)',
              cursor: 'pointer',
            }}>New Analysis</button>
            <button
              type="button"
              onClick={() => {
                const el = document.createElement('textarea');
                el.value = report;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
              }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '.62rem',
                letterSpacing: '.16em', textTransform: 'uppercase',
                padding: '.55rem 1.1rem', background: 'transparent',
                border: '1px solid var(--rule)', color: 'var(--ink-soft)',
                cursor: 'pointer',
              }}
            >Copy to Clipboard</button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([report], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title || 'DraftLens-Report'}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '.62rem',
                letterSpacing: '.16em', textTransform: 'uppercase',
                padding: '.55rem 1.1rem',
                background: 'var(--black-band)', color: 'var(--paper)',
                border: '1px solid var(--black-band)',
                cursor: 'pointer',
              }}
            >Download Report</button>
          </div>

          {/* Report ⇄ Notes toggle */}
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

          {/* Sections */}
          {view === 'anchored' && anchored ? (
            <AnchoredView report={report} text={submittedText} />
          ) : (
            <>
              <div style={{ marginTop: anchored ? 0 : 0 }}>
                {parsed.sections.map((sec, i) =>
                  sec.body.trim() ? (
                    <div key={i} id={`sec-${String(i + 1).padStart(2, '0')}`}>
                      <ReportSection
                        index={i}
                        heading={sec.heading}
                        body={sec.body.trim()}
                        defaultOpen
                        tinted={i % 2 === 1}
                      />
                    </div>
                  ) : null
                )}
              </div>
              <CraftDirectives parsed={parsed} />
            </>
          )}

          {/* Lenses — Choose a Voice */}
          <div id="sec-lenses" style={{ marginTop: '2.5rem' }}>
            <div style={{
              padding: '2rem 0 1.5rem',
              borderBottom: '1px solid var(--rule)',
              marginBottom: '1.75rem',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                letterSpacing: '.2em', textTransform: 'uppercase',
                color: 'var(--amber-d)', marginBottom: '.4rem',
              }}>Editorial lenses</div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.4rem',
                fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em',
              }}>How other tradition experts might read this</div>
            </div>

            {LENS_GROUPS.map((group) => (
              <div key={group.label}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                  letterSpacing: '.2em', textTransform: 'uppercase',
                  color: 'var(--amber-d)', margin: '1.5rem 0 .75rem',
                  paddingBottom: '.4rem', borderBottom: '1px solid var(--rule-l)',
                }}>{group.label}</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '.4rem', marginBottom: '.5rem',
                }}>
                  {group.names.map((name) => (
                    <div key={name} style={{
                      display: 'flex', alignItems: 'center', gap: '.4rem',
                      padding: '.35rem .5rem',
                      border: '1px solid var(--rule-l)', background: 'var(--cream)',
                      cursor: 'pointer', width: '100%',
                    }}>
                      <div style={{
                        width: 38, height: 38, flexShrink: 0,
                        background: 'var(--ink-mid)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '.5rem',
                          color: 'var(--ink-faint)', textTransform: 'uppercase',
                        }}>{name.charAt(0)}</span>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                        letterSpacing: '.06em', textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                      }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Market */}
          <div id="sec-studios">
            <MarketPanel market={market} />
          </div>

          {/* Disclaimer */}
          <div id="sec-disclaimer" style={{
            marginTop: '3rem', paddingTop: '2rem',
            borderTop: '1px solid var(--rule-l)',
            fontFamily: 'var(--font-mono)', fontSize: '.62rem',
            letterSpacing: '.06em', color: 'var(--ink-faint)',
            lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 500, marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.12em' }}>Disclaimer</div>
            <p style={{ marginBottom: '.5rem' }}>Your work is yours. Draft &amp; Lens does not claim any rights over the scripts or stories you submit, and submissions are not used to train models.</p>
            <p>Editorial lenses are AI-generated analytical perspectives inspired by the documented craft principles of the named figures. They are not affiliated with, endorsed by, or representative of those individuals.</p>
          </div>

          {/* Footer */}
          <footer style={{
            textAlign: 'center', padding: '3rem 1rem 2rem',
            marginTop: '3rem', borderTop: '1px solid var(--rule)',
            fontFamily: 'var(--font-mono)', fontSize: '.6rem',
            letterSpacing: '.12em', color: 'var(--ink-faint)',
          }}>
            Copyright &copy; 2026 Draft&amp;Lens
          </footer>

        </div>
      </div>
    </div>
  );
}
