'use client';

import { useAuth } from '@clerk/nextjs';
import { useRef, useState, type CSSProperties } from 'react';

import { ReportView } from '@/components/analysis/ReportView';
import type {
  Coverage,
  Diagnostic,
  Market,
  Scores,
} from '@/components/analysis/types';
import { TESTER_WORD_CAP, countWords } from '@/lib/limits';

type Mode = 'script' | 'story' | 'play' | 'treatment';

const TYPES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'script', label: 'Film Script' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'story', label: 'Story' },
  { value: 'play', label: 'Stage Play' },
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

const ANCHOR_OPEN = String.fromCharCode(0x27e6);
const ANCHOR_CLOSE = String.fromCharCode(0x27e7);
function stripAnchors(s: string): string {
  return s.split(ANCHOR_OPEN).join('').split(ANCHOR_CLOSE).join('');
}

export default function AppHomePage() {
  const { isSignedIn } = useAuth();
  const [mode, setMode] = useState<Mode | null>(null);
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

  const wordCount = countWords(text);
  const overCap = wordCount > TESTER_WORD_CAP;
  const canAnalyse =
    isSignedIn === true && mode !== null && wordCount > 0 && !running && !overCap;

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
        body: JSON.stringify({ mode, text }),
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

  const streamingPreview = report === '' ? stripAnchors(streamed) : '';

  const kicker: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '.68rem',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--label-amber)',
    fontWeight: 500,
    marginBottom: '.35rem',
  };

  const showUpload = report === '' && !running;

  return (
    <main style={{
      minHeight: '100vh',
      background: showUpload ? 'var(--black-band)' : 'var(--paper)',
      color: showUpload ? 'var(--paper-dark)' : 'var(--ink)',
    }}>
      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: showUpload ? '3rem 2rem' : '2rem',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={kicker}>New analysis</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--paper)',
            display: showUpload ? 'block' : 'none',
          }}>
            Upload your work
          </h1>
        </div>

        <section style={{ marginBottom: '1.5rem' }}>
          <div style={kicker}>1 · What are you submitting?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.5rem' }}>
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setMode(t.value)}
                disabled={running}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '.58rem',
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  padding: '.4rem 1rem',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: mode === t.value ? 'var(--amber)' : 'var(--border-dark)',
                  background: mode === t.value ? 'var(--amber)' : 'transparent',
                  color: mode === t.value ? 'var(--black-band)' : 'var(--rule)',
                  fontWeight: mode === t.value ? 500 : 300,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <div style={kicker}>2 · Paste your work</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={running}
            rows={12}
            placeholder="Paste your script, treatment, story, or play..."
            style={{
              marginTop: '.5rem',
              width: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: '.88rem',
              lineHeight: 1.7,
              background: 'var(--surface-input)',
              color: 'var(--paper-dark)',
              border: '1px solid var(--border-dark)',
              padding: '1rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{
            marginTop: '.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '.62rem',
            letterSpacing: '.06em',
          }}>
            <span style={{ color: 'var(--ink-soft)' }}>
              Up to ~{TESTER_WORD_CAP.toLocaleString()} words for the sharpest reading.
            </span>
            <span style={{ color: overCap ? 'var(--amber-l)' : 'var(--ink-soft)' }}>
              {wordCount.toLocaleString()} / {TESTER_WORD_CAP.toLocaleString()}
            </span>
          </div>
          {overCap && (
            <p style={{
              marginTop: '.75rem',
              fontSize: '.82rem',
              lineHeight: 1.7,
              color: 'var(--amber-l)',
              borderLeft: '2px solid var(--amber)',
              paddingLeft: '1rem',
            }}>
              Please paste up to {TESTER_WORD_CAP.toLocaleString()} words — a chapter, a short story,
              or an excerpt. Full-length support is coming soon.
            </p>
          )}
          <p style={{
            marginTop: '.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '.55rem',
            letterSpacing: '.08em',
            color: 'var(--ink-soft)',
            fontStyle: 'italic',
          }}>
            Your work is yours. We never train AI on it — sent only to generate your reading,
            never shared with anyone else. Delete it anytime.
          </p>
        </section>

        <section style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={analyse}
            disabled={!canAnalyse}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '.65rem',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              padding: '.75rem 2rem',
              cursor: canAnalyse ? 'pointer' : 'not-allowed',
              background: canAnalyse ? 'var(--amber)' : 'var(--border-dark)',
              color: canAnalyse ? 'var(--black-band)' : 'var(--ink-soft)',
              border: 'none',
              fontWeight: 500,
              opacity: canAnalyse ? 1 : 0.5,
            }}
          >
            3 · Analyse
          </button>
          {running && (
            <button
              type="button"
              onClick={stop}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '.58rem',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                padding: '.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--ink-mid)',
                color: 'var(--ink-faint)',
                cursor: 'pointer',
              }}
            >
              Stop
            </button>
          )}
          {!running && isSignedIn !== true && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.1em', color: 'var(--ink-soft)' }}>
              Sign in (top right) to analyse your work.
            </span>
          )}
          {!running && isSignedIn === true && mode === null && text.trim() !== '' && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.1em', color: 'var(--ink-soft)' }}>
              Choose a type above to continue.
            </span>
          )}
          {running && stage !== '' && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.6rem', letterSpacing: '.1em', color: 'var(--amber-l)' }}>
              {stage}...
            </span>
          )}
        </section>
      </div>

      {error !== '' && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 2rem' }}>
          <p style={{
            marginTop: '1rem',
            padding: '.75rem 1rem',
            fontSize: '.85rem',
            color: 'var(--error)',
            borderLeft: '2px solid var(--error)',
            background: 'rgba(192,80,80,.08)',
          }}>
            Could not complete: {error}
          </p>
        </div>
      )}

      {streamingPreview !== '' && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 2rem' }}>
          <article style={{
            marginTop: '1.5rem',
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-serif)',
            fontSize: '.92rem',
            lineHeight: 1.88,
            color: 'var(--paper-dark)',
          }}>
            {streamingPreview}
          </article>
        </div>
      )}

      {report !== '' && revisionStatus === 'unchanged' && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 2rem' }}>
          <p style={{
            marginTop: '1.5rem',
            padding: '.6rem 1rem',
            fontSize: '.82rem',
            color: 'var(--teal)',
            borderLeft: '3px solid var(--teal)',
            background: 'var(--cream)',
          }}>
            No changes detected since your last reading — showing your previous reading.
          </p>
        </div>
      )}
      {report !== '' && revisionStatus === 'revised' && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 2rem' }}>
          <p style={{
            marginTop: '1.5rem',
            padding: '.6rem 1rem',
            fontSize: '.82rem',
            color: 'var(--amber)',
            borderLeft: '3px solid var(--amber)',
            background: 'var(--cream)',
          }}>
            Updated reading — this responds to your revision of an earlier draft.
          </p>
        </div>
      )}

      {report !== '' && (
        <ReportView
          report={report}
          diagnostic={diagnostic}
          scores={scores}
          market={market}
          bible={bible}
          submittedText={text}
          coverage={coverage}
        />
      )}
    </main>
  );
}
