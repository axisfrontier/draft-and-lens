'use client';

import { SignInButton, SignUpButton, SignedOut, useAuth } from '@clerk/nextjs';
import { useCallback, useRef, useState, type CSSProperties } from 'react';

import { ReportSkeleton } from '@/components/analysis/ReportSkeleton';
import { ReportView } from '@/components/analysis/ReportView';
import type {
  Coverage,
  Diagnostic,
  Market,
  Mode,
  Scores,
} from '@/components/analysis/types';
import { TESTER_WORD_CAP, countWords } from '@/lib/limits';

const TYPES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'script', label: 'Film Script' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'story', label: 'Story' },
  { value: 'play', label: 'Stage Play' },
];

const LENSES = [
  'Hemingway', 'Carver', 'Chekhov', "O'Connor", 'Nabokov', 'Bukowski',
  'Spielberg', 'Villeneuve', 'Coppola', 'Tarantino', 'Welles', 'Wilder',
  'Sorkin', 'Pinter', 'Goldman', 'Wachowskis', 'Ridley Scott',
  'Coen Brothers', 'Jeunet', 'Wenders', 'Feige', 'Bruckheimer',
];

type StreamEvent =
  | { type: 'stage'; stage: string; title: string }
  | { type: 'text'; delta: string }
  | {
      type: 'done';
      report: string;
      diagnostic: Diagnostic;
      coverage: Coverage;
      scores: Scores | null;
      market: Market | null;
      bible: string;
      revision?: { status: RevisionStatus };
    }
  | { type: 'error'; message: string };

type RevisionStatus = 'new' | 'revised' | 'unchanged';

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error reading file: ' + (reader.error?.message ?? 'unknown')));
    reader.readAsText(file);
  });
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.fountain', '.fdx', '.docx'];

export default function AppHomePage() {
  const { isSignedIn } = useAuth();
  const [mode, setMode] = useState<Mode | null>(null);
  const [submissionType, setSubmissionType] = useState<'complete' | 'excerpt' | null>(null);
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('');
  const [streamed, setStreamed] = useState('');
  const [report, setReport] = useState('');
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [bible, setBible] = useState('');
  const [revisionStatus, setRevisionStatus] = useState<RevisionStatus | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileText, setUploadedFileText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [bibleInput, setBibleInput] = useState('');
  const [bibleSkip, setBibleSkip] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveText = text.trim() || uploadedFileText;
  const wordCount = countWords(effectiveText);
  const overCap = wordCount > TESTER_WORD_CAP;
  const canAnalyse =
    isSignedIn === true &&
    mode !== null &&
    submissionType !== null &&
    wordCount > 0 &&
    !running &&
    !overCap;

  const handleFile = useCallback(async (file: File) => {
    setUploadError('');
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ext === '.doc') {
      setUploadError('Old-style .doc files cannot be read in the browser. Re-save as .docx, .pdf, or .txt.');
      return;
    }
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setUploadError('Unsupported format. Use PDF, DOCX, TXT, Fountain, or FDX.');
      return;
    }
    try {
      const content = await readFileAsText(file);
      if (content.trim().length < 20) {
        setUploadError('That file opened but almost no readable text came out. Try a .txt or text-based PDF.');
        return;
      }
      setUploadedFileName(file.name);
      setUploadedFileText(content);
    } catch (err) {
      setUploadError('Error reading file: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFileName('');
    setUploadedFileText('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  async function analyse(): Promise<void> {
    if (mode === null) return;
    setRunning(true);
    setError('');
    setStreamed('');
    setReport('');
    setStage('Reading your work');
    setCoverage(null);
    setDiagnostic(null);
    setScores(null);
    setMarket(null);
    setBible('');
    setRevisionStatus(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          text: effectiveText,
          submissionType,
          ...(bibleSkip ? { skipBible: true } : bibleInput.trim() ? { bible: bibleInput.trim() } : {}),
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || res.body === null) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (line.trim() === '') continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }
          if (evt.type === 'stage') setStage(evt.title);
          else if (evt.type === 'text') setStreamed((prev) => prev + evt.delta);
          else if (evt.type === 'done') {
            setReport(evt.report);
            setDiagnostic(evt.diagnostic);
            setCoverage(evt.coverage);
            setScores(evt.scores);
            setMarket(evt.market);
            setBible(evt.bible);
            setRevisionStatus(evt.revision?.status ?? 'new');
          } else if (evt.type === 'error') setError(evt.message);
        }
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        setError((e as Error)?.message ?? 'Analysis failed.');
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop(): void {
    abortRef.current?.abort();
  }

  const kicker: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '.68rem',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--label-amber)',
    fontWeight: 500,
    marginBottom: '.35rem',
  };

  const badge = (n: number, active = true): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '2rem', height: '2rem', borderRadius: '50%',
    background: active ? 'var(--amber)' : 'var(--border-dark)',
    color: active ? 'var(--black-band)' : 'var(--ink-soft)',
    fontFamily: 'var(--font-mono)', fontSize: '.95rem', fontWeight: 600,
    flexShrink: 0,
  });

  const showUpload = report === '' && !running;

  return (
    <main style={{
      minHeight: '100vh',
      background: showUpload ? 'var(--black-band)' : 'var(--paper)',
      color: showUpload ? 'var(--paper-dark)' : 'var(--ink)',
    }}>

      {/* ── UPLOAD SCREEN ── */}
      {showUpload && (
        <>
          <div style={{
            maxWidth: 1320, margin: '0 auto',
            padding: '2.5rem 3rem 0',
            display: 'flex', gap: '4.5rem', alignItems: 'stretch',
          }}>
            {/* LEFT: pitch */}
            <div style={{ flex: '1.05', minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.9rem, 2.6vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--paper)',
                letterSpacing: '-.03em',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}>
                An editorial intelligence.<br />
                <em style={{ fontWeight: 300, color: 'var(--amber)', fontStyle: 'italic' }}>Not a ghostwriter.</em>
              </h1>

              <p style={{
                fontSize: '.92rem', color: 'var(--rule)', lineHeight: 1.85,
                marginBottom: '1.75rem',
              }}>
                Draft &amp; Lens reads your script or story the way a master editor would — on its own terms, within its own tradition. Not a rubric, and never a rewrite: a reading that shows you what&rsquo;s working and how to take it further. Then, if you want, go deeper — apply the editorial sensibility of celebrated directors, novelists, and screenwriters, each a lens on how that voice might read your work. Optional, and entirely on your terms.
              </p>

              <div style={{
                borderTop: '1px solid var(--border-deeper)',
                borderBottom: '1px solid var(--border-deeper)',
                padding: '1rem 0',
              }}>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 400,
                  color: 'var(--rule)', lineHeight: 1.6,
                }}>
                  &ldquo;It&rsquo;s like having an editor and mentor working with you.&rdquo;
                </p>
              </div>
            </div>

            {/* Vertical divider */}
            <div style={{ width: 1, background: 'var(--border-deeper)', alignSelf: 'stretch', flexShrink: 0 }} />

            {/* RIGHT: upload form */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>

              <SignedOut>
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: 'rgba(245, 241, 232, 0.92)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  borderRadius: 18,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: '2rem',
                  gap: '.85rem',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-serif)', fontSize: '1.15rem',
                    fontWeight: 700, color: 'var(--ink)',
                    maxWidth: 340, lineHeight: 1.4,
                  }}>
                    Create a free account to start your reading
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '.8rem',
                    color: 'var(--ink-faint)', maxWidth: 320, lineHeight: 1.6,
                  }}>
                    Your work stays private and is never used to train AI.
                  </p>
                  <div style={{ display: 'flex', gap: '.6rem', marginTop: '.4rem' }}>
                    <SignUpButton mode="modal">
                      <button type="button" style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.65rem',
                        letterSpacing: '.14em', textTransform: 'uppercase',
                        padding: '.7rem 1.4rem', background: 'var(--amber)',
                        border: '1px solid var(--amber)', color: 'var(--black-band)',
                        cursor: 'pointer', fontWeight: 500, borderRadius: 12,
                      }}>
                        Create account
                      </button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <button type="button" style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.65rem',
                        letterSpacing: '.14em', textTransform: 'uppercase',
                        padding: '.7rem 1.4rem', background: 'transparent',
                        border: '1px solid var(--ink-mid)', color: 'var(--ink-soft)',
                        cursor: 'pointer', fontWeight: 500, borderRadius: 12,
                      }}>
                        Sign in
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </SignedOut>

              <div style={{ marginBottom: '.25rem' }}>
                <div style={kicker}>New analysis</div>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
                  fontWeight: 700, color: 'var(--paper)',
                }}>
                  Upload your work
                </div>
              </div>

              {/* Step 1 — Add your work */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.2rem' }}>
                <span style={badge(1)}>1</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                  letterSpacing: '.14em', textTransform: 'uppercase',
                  color: 'var(--paper)', fontWeight: 500,
                }}>Add your work</span>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                style={{
                  background: dragOver ? 'rgba(200,146,42,.06)' : 'var(--surface-input)',
                  padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                  borderRadius: 18, border: `1px solid ${dragOver ? 'var(--amber)' : 'var(--amber-d)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 96, transition: 'all .15s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.fountain,.fdx,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                {uploadedFileName ? (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                      letterSpacing: '.08em', color: 'var(--amber-l)', marginBottom: '.5rem',
                    }}>{uploadedFileName}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                        letterSpacing: '.16em', textTransform: 'uppercase',
                        padding: '.55rem 1.1rem', background: 'var(--black-band)',
                        color: 'var(--amber-l)', border: '1px solid var(--amber)',
                        cursor: 'pointer', fontWeight: 500, borderRadius: 10,
                      }}
                    >Upload new file</button>
                  </div>
                ) : (
                  <div>
                    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto .6rem', display: 'block', opacity: .7 }}>
                      <path d="M11 2 L11 16 M2 1 L2 17 Q6.5 15.5 11 17 Q15.5 15.5 20 17 L20 1 Q15.5 2.5 11 1 Q6.5 2.5 2 1Z" stroke="#c8b898" strokeWidth="1.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '.88rem',
                      fontStyle: 'italic', fontWeight: 400, color: '#ffffff', marginBottom: '.5rem',
                    }}>Drop file or click to upload</p>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                      letterSpacing: '.08em', color: 'var(--ink-faint)',
                    }}>.PDF &middot; .TXT &middot; .FOUNTAIN &middot; .FDX &middot; .DOCX</p>
                  </div>
                )}
              </div>

              {/* Paste area */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={running}
                rows={4}
                placeholder="Or paste your script or story here..."
                style={{
                  width: '100%', fontFamily: 'var(--font-sans)',
                  fontSize: '.88rem', lineHeight: 1.8,
                  padding: '1rem 1.25rem', background: 'var(--surface-input)',
                  border: '1px solid var(--amber-d)', color: 'var(--paper-dark)',
                  outline: 'none', resize: 'vertical', fontStyle: 'italic',
                  borderRadius: 18,
                }}
              />

              {/* Word count */}
              {wordCount > 0 && (
                <div style={{ marginTop: '.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                      letterSpacing: '.1em', color: '#ffffff',
                    }}>{wordCount.toLocaleString()} words</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.65rem',
                      letterSpacing: '.08em', color: 'var(--ink-faint)',
                    }}>limit: {TESTER_WORD_CAP.toLocaleString()}</span>
                  </div>
                  <div style={{
                    height: 2, background: 'var(--border-deeper)',
                    borderRadius: 1, marginTop: '.4rem', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      background: overCap ? 'var(--error)' : 'var(--amber-d)',
                      transition: 'width .3s, background .3s',
                      width: `${Math.min(100, (wordCount / TESTER_WORD_CAP) * 100)}%`,
                    }} />
                  </div>
                  {overCap && (
                    <div style={{
                      marginTop: '.5rem', fontFamily: 'var(--font-mono)',
                      fontSize: '.62rem', letterSpacing: '.06em',
                      color: '#ffffff', lineHeight: 1.6,
                    }}>
                      Please paste up to {TESTER_WORD_CAP.toLocaleString()} words. Full-length support is coming soon.
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--border-deeper)', marginTop: '1rem' }} />
                </div>
              )}

              {/* Step 2 — type */}
              <div style={{ borderRadius: 14, padding: '.9rem 1rem .5rem', margin: '0 -1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.7rem' }}>
                  <span style={badge(2)}>2</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                    letterSpacing: '.14em', textTransform: 'uppercase',
                    color: 'var(--paper)', fontWeight: 500,
                  }}>What are you submitting?</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.4rem' }}>
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setMode(t.value)}
                      disabled={running}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                        letterSpacing: '.1em', textTransform: 'uppercase',
                        padding: '.65rem .3rem',
                        background: mode === t.value ? 'var(--amber)' : 'transparent',
                        color: mode === t.value ? 'var(--black-band)' : 'var(--paper)',
                        border: `1px solid ${mode === t.value ? 'var(--amber)' : 'var(--amber-l)'}`,
                        cursor: 'pointer', borderRadius: 10,
                        transition: 'all .15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complete piece vs excerpt */}
              <div style={{ borderRadius: 14, padding: '.5rem 1rem 0', margin: '0 -1rem' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                  letterSpacing: '.14em', textTransform: 'uppercase',
                  color: 'var(--paper)', fontWeight: 500, marginBottom: '.7rem',
                }}>Complete piece or excerpt?</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.4rem' }}>
                  {(
                    [
                      { value: 'complete', label: 'Complete piece' },
                      { value: 'excerpt', label: 'Excerpt' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSubmissionType(t.value)}
                      disabled={running}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                        letterSpacing: '.1em', textTransform: 'uppercase',
                        padding: '.65rem .3rem',
                        background: submissionType === t.value ? 'var(--amber)' : 'transparent',
                        color: submissionType === t.value ? 'var(--black-band)' : 'var(--paper)',
                        border: `1px solid ${submissionType === t.value ? 'var(--amber)' : 'var(--amber-l)'}`,
                        cursor: 'pointer', borderRadius: 10,
                        transition: 'all .15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginTop: '-.25rem' }}>
                <div style={{ flex: 1, borderTop: '1px solid var(--border-deeper)' }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                  letterSpacing: '.16em', textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}>Optional</span>
                <div style={{ flex: 1, borderTop: '1px solid var(--border-deeper)' }} />
              </div>

              {/* Character bible */}
              <div style={{ border: '1px solid var(--border-dark)', background: 'var(--black-band)' }}>
                <div style={{
                  padding: '.75rem 1rem', borderBottom: '1px solid var(--border-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                      letterSpacing: '.14em', textTransform: 'uppercase',
                      color: 'var(--label-amber)', fontWeight: 500, marginBottom: '.2rem',
                    }}>Character bible</div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: '.85rem',
                      color: 'var(--rule)', fontStyle: 'italic',
                    }}>Built automatically from your submission.</div>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                    cursor: 'pointer', flexShrink: 0, marginLeft: '1rem',
                  }}>
                    <input
                      type="checkbox"
                      checked={bibleSkip}
                      onChange={(e) => setBibleSkip(e.target.checked)}
                      style={{ width: 13, height: 13, accentColor: 'var(--amber-d)' }}
                    />
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.65rem',
                      letterSpacing: '.12em', textTransform: 'uppercase',
                      color: 'var(--rule)',
                    }}>Skip</span>
                  </label>
                </div>
                <div style={{ padding: '.75rem 1rem' }}>
                  <label style={{
                    fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                    letterSpacing: '.14em', textTransform: 'uppercase',
                    color: 'var(--label-amber)', fontWeight: 500,
                    display: 'block', marginBottom: '.4rem',
                  }}>
                    Paste your own to use instead{' '}
                    <span style={{ color: 'var(--ink-soft)' }}>(optional)</span>
                  </label>
                  <textarea
                    value={bibleInput}
                    onChange={(e) => setBibleInput(e.target.value)}
                    rows={3}
                    placeholder="Characters, traits, relationships, voice patterns, wants, history — anything the analysis should know."
                    style={{
                      width: '100%', fontFamily: 'var(--font-sans)',
                      fontSize: '.8rem', lineHeight: 1.7,
                      padding: '.5rem .85rem', background: 'var(--surface-deep)',
                      border: '1px solid var(--border-deeper)', color: 'var(--rule)',
                      outline: 'none', resize: 'vertical', fontStyle: 'italic',
                    }}
                  />
                </div>
              </div>

              {/* Upload error */}
              {uploadError && (
                <div style={{
                  padding: '.55rem .9rem', background: 'rgba(139,32,32,.12)',
                  border: '1px solid rgba(139,32,32,.4)',
                  fontFamily: 'var(--font-mono)', fontSize: '.62rem',
                  color: 'var(--error)',
                }}>{uploadError}</div>
              )}

              {/* Step 3 — Analyse */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginTop: '.5rem' }}>
                <span style={badge(3, canAnalyse)}>3</span>
                <button
                  type="button"
                  onClick={analyse}
                  disabled={!canAnalyse}
                  style={{
                    flex: 1, fontFamily: 'var(--font-mono)',
                    fontSize: '.65rem', letterSpacing: '.22em',
                    textTransform: 'uppercase', padding: '.95rem',
                    background: canAnalyse ? 'var(--amber)' : 'var(--border-dark)',
                    color: canAnalyse ? 'var(--black-band)' : 'var(--ink-soft)',
                    border: 'none', cursor: canAnalyse ? 'pointer' : 'not-allowed',
                    fontWeight: 500, borderRadius: 18,
                    transition: 'all .15s',
                  }}
                >
                  Analyse
                </button>
              </div>

              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                letterSpacing: '.08em', color: 'var(--ink-faint)',
                textAlign: 'center', marginTop: '.5rem', lineHeight: 1.6,
              }}>
                Your work is yours. We never train AI on it — it&apos;s sent only to generate your reading.
              </p>

              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                letterSpacing: '.08em', color: 'var(--ink-faint)',
                textAlign: 'center', fontStyle: 'italic',
              }}>Analysis streams as it arrives</p>

            </div>
          </div>

          {/* Divider */}
          <div style={{
            borderTop: '1px solid var(--border-deeper)',
            maxWidth: 1320, margin: '2.5rem auto 0',
          }} />

          {/* Editorial Lenses */}
          <div style={{
            maxWidth: 900, margin: '0 auto',
            padding: '2rem 2.5rem 0', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '.72rem',
              letterSpacing: '.14em', textTransform: 'uppercase',
              color: 'var(--rule)', marginBottom: '.5rem',
            }}>Editorial Lenses</div>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '.82rem',
              color: 'var(--ink-faint)', fontStyle: 'italic',
              marginBottom: '1rem', lineHeight: 1.6,
              maxWidth: 680, marginLeft: 'auto', marginRight: 'auto',
            }}>
              After analysis, apply the perspective of any of these voices to your work — some of the most influential and celebrated practitioners in their fields.
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '.4rem',
              justifyContent: 'center', maxWidth: 820, margin: '0 auto',
            }}>
              {LENSES.map((name) => (
                <span key={name} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                  letterSpacing: '.08em', color: 'var(--rule)',
                  padding: '.22rem .65rem', border: '1px solid var(--ink-mid)',
                  whiteSpace: 'nowrap',
                }}>{name}</span>
              ))}
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '.55rem',
              letterSpacing: '.06em', color: 'var(--ink-faint)',
              lineHeight: 1.6, fontStyle: 'italic', marginTop: '.85rem',
              maxWidth: 640, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Editorial lenses are AI-generated analytical perspectives inspired by the documented craft principles of these figures. They are not affiliated with, endorsed by, or representative of these individuals.
            </p>
          </div>

          {/* Footer */}
          <footer style={{
            textAlign: 'center', padding: '2.5rem 1rem 2rem',
            marginTop: '2rem', borderTop: '1px solid var(--border-deeper)',
            fontFamily: 'var(--font-mono)', fontSize: '.6rem',
            letterSpacing: '.12em', color: 'var(--ink-faint)',
          }}>
            Copyright &copy; 2026 Draft&amp;Lens
          </footer>
        </>
      )}

      {/* ── RUNNING STATE ── */}
      {running && (
        <div style={{
          position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, zIndex: 68,
          background: 'var(--black-band)',
          padding: '.7rem 2.5rem',
        }}>
          {(() => {
            const stageKeys = ['read', 'structure', 'writing', 'support'] as const;
            const stageMap: Record<string, string> = { read: 'read', structure: 'structure', writing: 'writing', 'Final check': 'support' };
            const currentKey = stageMap[stage] ?? (stage === 'Mapping the structure' || stage === 'Verifying the narrator' ? 'structure' : stage === 'Writing the reading' ? 'writing' : stage === 'Reading your work' ? 'read' : '');
            const stageIndex = Math.max(0, stageKeys.indexOf(currentKey as typeof stageKeys[number]));
            return (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '2rem',
                  maxWidth: 1100, margin: '0 auto',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontSize: '.95rem',
                      color: 'var(--paper)', marginBottom: '.4rem',
                    }}>{stage || 'Reading your work'}</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.62rem',
                      color: 'var(--paper-dark)', marginBottom: '.5rem',
                    }}>
                      {wordCount < 800
                        ? 'Your reading will be ready in about 20 seconds'
                        : wordCount < 3000
                        ? 'Your reading will be ready in about 1 minute'
                        : 'Your reading will be ready in 2–3 minutes'}
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      {stageKeys.map((s, i) => {
                        const labels = ['Reading', 'Structure', 'Writing the reading', 'Market & bible'];
                        const isActive = currentKey === s;
                        return (
                          <div key={s} style={{
                            fontFamily: 'var(--font-mono)', fontSize: '.5rem',
                            letterSpacing: '.1em', textTransform: 'uppercase',
                            padding: '.15rem .5rem', borderRadius: 20,
                            border: isActive ? '1px solid var(--amber)' : '1px solid var(--border-dark)',
                            background: isActive ? 'var(--amber)' : 'transparent',
                            color: isActive ? 'var(--black-band)' : 'var(--paper-dark)',
                            animation: isActive ? `pillFlash 1s ease-in-out ${i * 0.15}s infinite` : 'none',
                          }}>
                            {labels[i]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={stop}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.55rem',
                      letterSpacing: '.14em', textTransform: 'uppercase',
                      color: 'var(--paper)', background: 'transparent',
                      border: '1px solid var(--border-dark)',
                      padding: '.35rem .8rem', borderRadius: 20,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    Stop
                  </button>
                </div>
                {/* Progress track — fills as stages advance, sweeps continuously within a stage */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: 3, background: 'var(--border-dark)',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${((stageIndex + 1) / stageKeys.length) * 100}%`,
                    background: 'linear-gradient(90deg, var(--amber) 0%, var(--amber-l) 50%, var(--amber) 100%)',
                    backgroundSize: '200% 100%',
                    transition: 'width 1s ease',
                    animation: 'progressSweep 1.1s linear infinite',
                  }} />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── ANALYSIS SKELETON ── */}
      {running && report === '' && (
        <ReportSkeleton mode={mode} wordCount={wordCount} streamedText={streamed} />
      )}

      {/* ── ERROR ── */}
      {error !== '' && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 3rem' }}>
          <p style={{
            marginTop: '1rem', padding: '.75rem 1rem',
            fontSize: '.85rem', color: 'var(--error)',
            borderLeft: '2px solid var(--error)',
            background: 'rgba(192,80,80,.08)',
          }}>
            Could not complete: {error}
          </p>
        </div>
      )}

      {/* ── REPORT ── */}
      {report !== '' && (
        <ReportView
          report={report}
          diagnostic={diagnostic}
          scores={scores}
          market={market}
          bible={bible}
          submittedText={text || uploadedFileText}
          coverage={coverage}
          mode={mode ?? undefined}
          revisionStatus={revisionStatus ?? undefined}
        />
      )}
    </main>
  );
}
