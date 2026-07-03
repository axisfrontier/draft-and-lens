'use client';

import Image from 'next/image';
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

interface LensEntry { name: string; id: string | null }

const LENS_GROUPS: ReadonlyArray<{ label: string; entries: LensEntry[] }> = [
  { label: 'Directors', entries: [
    { name: 'Spielberg', id: 'spielberg' }, { name: 'Coppola', id: 'coppola' },
    { name: 'Coen Brothers', id: 'coens' }, { name: 'Villeneuve', id: 'villeneuve' },
    { name: 'Ridley Scott', id: 'scott' }, { name: 'Welles', id: 'welles' },
    { name: 'Jeunet', id: 'jeunet' }, { name: 'Wenders', id: 'wenders' },
    { name: 'Tarantino', id: 'tarantino' }, { name: 'Wachowskis', id: 'wachowski' },
    { name: 'Lucas', id: 'lucas' }, { name: 'Miyazaki', id: 'miyazaki' },
  ]},
  { label: 'Novelists & Short Story Writers', entries: [
    { name: 'Hemingway', id: 'hemingway' }, { name: 'Carver', id: 'carver' },
    { name: "O'Connor", id: 'oconnor' }, { name: 'Chekhov', id: 'chekhov' },
    { name: 'Nabokov', id: 'nabokov' }, { name: 'Bukowski', id: 'bukowski' },
    { name: 'King', id: 'king' },
  ]},
  { label: 'Screenwriters', entries: [
    { name: 'Sorkin', id: 'sorkin' }, { name: 'Roth', id: 'roth' },
    { name: 'Kaufman', id: 'kaufman' }, { name: 'Puzo', id: 'puzo' },
  ]},
  { label: 'Showrunners', entries: [
    { name: 'Simon', id: 'simon' }, { name: 'Fey', id: 'fey' },
  ]},
  { label: 'Producers', entries: [
    { name: 'Bruckheimer', id: 'bruckheimer' }, { name: 'Feige', id: 'feige' },
  ]},
];

export function ReportView({
  report,
  diagnostic,
  scores,
  market,
  bible,
  submittedText,
  coverage,
  mode,
  revisionStatus,
}: {
  report: string;
  diagnostic: Diagnostic | null;
  scores: Scores | null;
  market: Market | null;
  bible: string;
  submittedText: string;
  coverage: Coverage | null;
  mode?: string;
  revisionStatus?: string;
}) {
  const verdict = extractVerdict(report);
  const parsed = parseReport(report);
  const anchored = hasAnchors(report);
  const [view, setView] = useState<'report' | 'anchored'>('report');

  // Lens voices
  const [activeLensId, setActiveLensId] = useState<string | null>(null);
  const [lensReadings, setLensReadings] = useState<Record<string, string>>({});
  const [lensLoading, setLensLoading] = useState<string | null>(null);

  // Personal editor
  const [convMessages, setConvMessages] = useState<Array<{role: 'user'|'assistant', content: string}>>([]);
  const [convInput, setConvInput] = useState('');
  const [convTarget, setConvTarget] = useState<string>('editorial');
  const [convLoading, setConvLoading] = useState(false);

  const callLens = async (lensId: string) => {
    if (lensLoading || (lensReadings[lensId] && activeLensId === lensId)) {
      setActiveLensId(lensId);
      return;
    }
    setActiveLensId(lensId);
    if (lensReadings[lensId]) return;
    setLensLoading(lensId);
    let reading = '';
    try {
      const res = await fetch('/api/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lensId,
          text: submittedText,
          tradition: diagnostic?.tradition,
          register: diagnostic?.register,
          ambition: diagnostic?.ambition,
        }),
      });
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as {type: string; delta?: string; reading?: string};
            if (ev.type === 'text' && ev.delta) {
              reading += ev.delta;
              setLensReadings((prev) => ({ ...prev, [lensId]: reading }));
            }
          } catch { /* ignore malformed */ }
        }
      }
    } catch { /* show error inline */ }
    setLensLoading(null);
  };

  const sendConvMessage = async () => {
    const msg = convInput.trim();
    if (!msg || convLoading) return;
    setConvInput('');
    const newMsg = { role: 'user' as const, content: msg };
    setConvMessages((prev) => [...prev, newMsg]);
    setConvLoading(true);
    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          target: convTarget,
          reportText: report,
          diagnostic,
          history: convMessages,
        }),
      });
      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let reply = '';
      let buf = '';
      setConvMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as {type: string; delta?: string};
            if (ev.type === 'text' && ev.delta) {
              reply += ev.delta;
              setConvMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: reply };
                return next;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
    setConvLoading(false);
  };

  const rawTitle = diagnostic && diagnostic.title && diagnostic.title !== 'Untitled' ? diagnostic.title : '';
  const title = rawTitle.length > 60 ? rawTitle.slice(0, 60).trimEnd() + '…' : rawTitle;
  const traditionLine = diagnostic
    ? [diagnostic.tradition, diagnostic.register].filter(Boolean).join('  ·  ')
    : '';
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
    <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: '1fr var(--sidebar-w)', minHeight: '100vh', background: 'var(--paper)' }}>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className="report-sidebar" style={{
        position: 'sticky', top: 'var(--nav-h)',
        gridColumn: 2, gridRow: 1,
        height: 'calc(100vh - var(--nav-h))',
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
        <a href="/about" target="_blank" rel="noopener noreferrer" style={sidebarLink}>About</a>
        <a href="/glossary" target="_blank" rel="noopener noreferrer" style={sidebarLink}>Glossary</a>
        <a href="/feedback" target="_blank" rel="noopener noreferrer" style={sidebarLink}>Feedback</a>
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

          {revisionStatus === 'unchanged' && (
            <p style={{
              marginTop: '2rem', marginBottom: '1rem', padding: '.85rem 1.25rem',
              fontSize: '.82rem', color: 'var(--teal)',
              borderLeft: '3px solid var(--teal)', background: 'var(--cream)',
            }}>
              No changes detected since your last reading — showing your previous reading.
            </p>
          )}
          {revisionStatus === 'revised' && (
            <p style={{
              marginTop: '2rem', marginBottom: '1rem', padding: '.85rem 1.25rem',
              fontSize: '.82rem', color: 'var(--amber)',
              borderLeft: '3px solid var(--amber)', background: 'var(--cream)',
            }}>
              Updated reading — this responds to your revision of an earlier draft.
            </p>
          )}

          {/* Title block */}
          <div id="sec-title" style={{
            scrollMarginTop: 'calc(var(--nav-h) + 1rem)',
            padding: `${revisionStatus ? '1rem' : '3.5rem'} 0 2.5rem`,
            display: 'grid', gridTemplateColumns: '1fr 200px',
            gap: '1.5rem', borderBottom: '1px solid var(--rule)',
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
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '100%',
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
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  textOverflow: 'ellipsis', maxWidth: '100%',
                }}>
                  Untitled
                </h1>
              )}
              {typeof diagnostic?.summary === 'string' && diagnostic.summary.trim() !== '' && (
                <div style={{
                  fontSize: '.88rem', lineHeight: 1.8, color: 'var(--ink-soft)',
                  maxWidth: '500px', borderLeft: '2px solid var(--rule)', paddingLeft: '1rem',
                }}>
                  {diagnostic.summary}
                </div>
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
                  { label: 'Mode', value: mode === 'script' ? 'Film Script' : mode === 'treatment' ? 'Treatment' : mode === 'play' ? 'Stage Play' : 'Story' },
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
          <div id="sec-verdict" style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
            {verdict && <VerdictBand verdict={verdict} />}
          </div>

          {/* Bible */}
          <div id="sec-bible" style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
            <BiblePanel bible={bible} />
          </div>

          {/* Dashboard */}
          <div id="sec-dashboard" style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
            <ScoresDashboard scores={scores} tradition={diagnostic?.tradition} />
          </div>

          {/* Story Arc */}
          <div id="sec-arc" style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
            <StoryArc beats={scores?.beats ?? []} />
          </div>

          {/* Editorial Analysis header */}
          <div style={{
            padding: '1.5rem 0 1rem',
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
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '.62rem',
                letterSpacing: '.16em', textTransform: 'uppercase',
                padding: '.55rem 1.1rem', background: 'transparent',
                border: '1px solid var(--rule)', color: 'var(--ink-soft)',
                cursor: 'pointer',
              }}
            >New Analysis</button>
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
                    <div key={i} id={`sec-${String(i + 1).padStart(2, '0')}`} style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
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
          <div id="sec-lenses" style={{ marginTop: '0', scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
            <div style={{
              padding: '1.5rem 0 1rem',
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

            {LENS_GROUPS.map((group) => {
              const groupHasActive = group.entries.some(e => e.id === activeLensId);
              return (
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
                    {group.entries.map(({ name, id }) => {
                      const isActive = id && activeLensId === id;
                      const isLoading = id && lensLoading === id;
                      return (
                        <div
                          key={name}
                          onClick={() => id && callLens(id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '.4rem',
                            padding: '.35rem .5rem',
                            border: `1px solid ${isActive ? 'var(--amber-d)' : 'var(--rule-l)'}`,
                            background: isActive ? 'var(--black-band)' : 'var(--cream)',
                            cursor: id ? 'pointer' : 'default',
                            width: '100%',
                            transition: 'border-color .15s, background .15s',
                          }}
                        >
                          <div style={{
                            width: 38, height: 38, flexShrink: 0,
                            background: 'var(--ink-mid)', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {id ? (
                              <Image
                                src={`/lenses/${id}.jpg`}
                                alt={name}
                                width={38} height={38}
                                style={{
                                  width: '100%', height: '100%',
                                  objectFit: 'cover',
                                  objectPosition: id === 'coens' ? 'center top' : 'center',
                                  display: 'block', filter: 'grayscale(100%)',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '.5rem',
                                color: 'var(--ink-faint)', textTransform: 'uppercase',
                              }}>{name.charAt(0)}</span>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                              letterSpacing: '.06em', textTransform: 'uppercase',
                              color: isActive ? 'var(--amber-l)' : 'var(--ink-soft)',
                              display: 'block',
                            }}>{name}</span>
                            {isLoading && (
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '.5rem',
                                color: 'var(--amber-d)', letterSpacing: '.06em',
                              }}>reading…</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reading panel — appears under this group if it contains the active lens */}
                  {groupHasActive && activeLensId && (lensReadings[activeLensId] || lensLoading === activeLensId) && (
                    <div style={{
                      marginTop: '.75rem', marginBottom: '.5rem',
                      background: 'var(--black-band)',
                      padding: '2rem 2.5rem', borderLeft: '2px solid var(--amber-d)',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                        letterSpacing: '.14em', textTransform: 'uppercase',
                        color: 'var(--amber-d)', marginBottom: '.75rem',
                      }}>
                        {group.entries.find(e => e.id === activeLensId)?.name ?? activeLensId}
                      </div>
                      <div style={{
                        fontSize: '.9rem', lineHeight: 1.85, color: 'var(--paper-dark)',
                        fontStyle: 'italic', whiteSpace: 'pre-wrap',
                      }}>
                        {lensReadings[activeLensId] || (
                          <span style={{ opacity: 0.5 }}>Reading your work through this lens…</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Market */}
          <div id="sec-studios" style={{ scrollMarginTop: 'calc(var(--nav-h) + 1rem)' }}>
            <MarketPanel market={market} />
          </div>

          {/* Personal editor */}
          <div id="sec-editor" style={{
            scrollMarginTop: 'calc(var(--nav-h) + 1rem)',
            background: 'var(--black-band)',
            margin: '3rem -3rem 0', padding: '3rem 3rem 2.5rem',
            borderTop: '3px solid var(--amber-d)',
          }}>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
              fontWeight: 700, color: 'var(--paper)', marginBottom: '1.25rem',
            }}>Speak with your editor</div>

            <div style={{ borderTop: '1px solid var(--border-dark)', marginBottom: '1.25rem' }} />

            {/* Address to row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                letterSpacing: '.16em', textTransform: 'uppercase',
                color: '#8a8070', marginRight: '.25rem', flexShrink: 0,
              }}>Address to</span>
              {(['editorial', ...LENS_GROUPS.flatMap(g => g.entries).filter(e => e.id).map(e => e.id!)] as string[]).map((targetId) => {
                const label = targetId === 'editorial' ? 'Editorial' : (LENS_GROUPS.flatMap(g => g.entries).find(e => e.id === targetId)?.name ?? targetId);
                const isActive = convTarget === targetId;
                return (
                  <button
                    key={targetId}
                    onClick={() => setConvTarget(targetId)}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      padding: '.3rem .75rem',
                      background: isActive ? 'var(--amber-d)' : 'transparent',
                      color: isActive ? 'var(--black-band)' : '#8a8070',
                      border: `1px solid ${isActive ? 'var(--amber-d)' : '#3a3530'}`,
                      cursor: 'pointer', outline: 'none',
                      appearance: 'none' as const,
                    }}
                  >{label}</button>
                );
              })}
            </div>

            {/* Message thread */}
            {convMessages.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {convMessages.map((msg, i) => (
                  <div key={i} style={{
                    marginBottom: '1rem',
                    paddingLeft: msg.role === 'user' ? '0' : '1rem',
                    borderLeft: msg.role === 'assistant' ? '2px solid var(--amber-d)' : 'none',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.55rem',
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      color: msg.role === 'user' ? '#8a8070' : 'var(--amber-d)',
                      marginBottom: '.3rem',
                    }}>{msg.role === 'user' ? 'You' : (
                      LENS_GROUPS.flatMap(g => g.entries).find(e => e.id === convTarget)?.name ?? 'Editor'
                    )}</div>
                    <div style={{
                      fontSize: '.88rem', lineHeight: 1.8,
                      color: msg.role === 'user' ? '#a0988a' : 'var(--paper-dark)',
                      whiteSpace: 'pre-wrap', fontStyle: msg.role === 'assistant' ? 'italic' : 'normal',
                    }}>{msg.content}</div>
                  </div>
                ))}
                {convLoading && (
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                    color: 'var(--amber-d)', letterSpacing: '.08em',
                  }}>writing…</div>
                )}
              </div>
            )}

            {/* Input */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
              <textarea
                rows={4}
                value={convInput}
                onChange={(e) => setConvInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { void sendConvMessage(); } }}
                placeholder="Ask about a specific note, push back on something, or ask a lens voice to go deeper…"
                style={{
                  flex: 1, resize: 'none',
                  background: 'var(--surface-input)', color: 'var(--paper-dark)',
                  border: '1px solid var(--amber-l)', outline: 'none',
                  padding: '1rem 1.25rem',
                  fontFamily: 'var(--font-serif)', fontSize: '.88rem',
                  lineHeight: 1.8, fontStyle: 'italic', borderRadius: 14,
                }}
              />
              <button
                onClick={() => void sendConvMessage()}
                disabled={convLoading || !convInput.trim()}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.62rem',
                  letterSpacing: '.14em', textTransform: 'uppercase',
                  padding: '.95rem 1.4rem',
                  background: (convLoading || !convInput.trim()) ? 'var(--border-dark)' : 'var(--amber-l)',
                  color: (convLoading || !convInput.trim()) ? '#fff' : 'var(--black-band)',
                  border: 'none', cursor: (convLoading || !convInput.trim()) ? 'not-allowed' : 'pointer',
                  fontWeight: 500, borderRadius: 14, flexShrink: 0,
                  transition: 'all .15s',
                }}
              >Send</button>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '.52rem',
              color: 'var(--ink-faint)', marginTop: '.4rem', letterSpacing: '.06em',
            }}>Press Enter to send</div>
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
            <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              {([['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Acceptable Use', '/acceptable-use']] as const).map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>{label}</a>
              ))}
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
