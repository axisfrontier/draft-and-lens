'use client';

/**
 * Stage C — minimal upload + streaming-reading screen (the vertical slice for
 * the Stage D browser security check).
 *
 * CLIENT-ONLY. Imports nothing from src/prompts or src/ai — it talks to the
 * server exclusively through POST /api/analyse and renders the streamed result.
 * The submission-type union and the stream-event shapes are declared locally on
 * purpose: importing the server-only AnalysisMode would pull a `server-only`
 * module into the client bundle and fail the build — exactly the boundary the
 * security check guards.
 *
 * Stage E: the full report renders via <ReportView> — verdict band, character
 * bible, scores/radar, story arc, the section-by-section reading with the
 * Report ⇄ Notes-on-the-text toggle (inline anchoring, §18), action callouts,
 * the partial-read banner, and the industry-match panel.
 * Still deferred: glossary tooltips (§19), lenses, conversation.
 */

import { useAuth } from '@clerk/nextjs';
import { useRef, useState } from 'react';

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

// ⟦…⟧ anchor brackets (U+27E6 / U+27E7), built from char codes so the literal
// glyphs aren't embedded in source. Stripped for display; full anchoring is §18.
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
    setStage('Reading your work'); // show progress immediately, before the first server stage
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

  // While Brain 2 streams, show its raw text (anchors stripped) as a live
  // preview; once the final report lands, swap in the full report view.
  const streamingPreview = report === '' ? stripAnchors(streamed) : '';

  return (
    <main className="min-h-screen bg-paper p-8 text-ink">
      <h1 className="font-serif text-2xl">Draft &amp; Lens</h1>
      <p className="mt-1 text-sm text-ink-soft">A reading, not a rewrite.</p>

      {/* 1 · choose the submission type — must-choose (§15) */}
      <section className="mt-6">
        <p className="text-sm font-medium">1 · Choose the type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setMode(t.value)}
              disabled={running}
              className={`rounded border px-3 py-1.5 text-sm ${
                mode === t.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink-soft text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* 2 · add the work */}
      <section className="mt-6">
        <p className="text-sm font-medium">2 · Paste your work</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={running}
          rows={12}
          placeholder="Paste your script, treatment, story, or play…"
          className="mt-2 w-full rounded border border-ink-soft bg-paper p-3 text-sm text-ink"
        />
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-xs">
          <span className="text-ink-faint">
            Tip: paste a complete piece or a single chapter (up to ~
            {TESTER_WORD_CAP.toLocaleString()} words) for the sharpest reading.
          </span>
          <span className={overCap ? 'font-medium text-amber-d' : 'text-ink-faint'}>
            {wordCount.toLocaleString()} / {TESTER_WORD_CAP.toLocaleString()} words
          </span>
        </div>
        {overCap && (
          <p
            className="mt-2 rounded px-3 py-2 text-sm text-ink-mid"
            style={{ background: 'rgba(168,108,16,.12)', borderLeft: '3px solid var(--amber)' }}
          >
            Draft &amp; Lens reads best in focused pieces right now — please paste up to about{' '}
            {TESTER_WORD_CAP.toLocaleString()} words (a chapter, a short story, or an excerpt works
            well). Full-length novels and scripts are coming soon. Trim to under{' '}
            {TESTER_WORD_CAP.toLocaleString()} words and you’re good to go.
          </p>
        )}
        <p className="mt-2 text-xs text-ink-faint">
          Your work is yours. We never train AI on it — it’s sent only to generate your reading,
          and never shared with anyone else. You can delete it anytime.
        </p>
      </section>

      {/* 3 · analyse / stop */}
      <section className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={analyse}
          disabled={!canAnalyse}
          className="rounded bg-ink px-4 py-2 text-sm text-paper disabled:opacity-40"
        >
          3 · Analyse
        </button>
        {running && (
          <button
            type="button"
            onClick={stop}
            className="rounded border border-ink-soft px-4 py-2 text-sm text-ink"
          >
            Stop
          </button>
        )}
        {!running && isSignedIn !== true && (
          <span className="text-sm text-ink-soft">
            Sign in (top right) to analyse your work.
          </span>
        )}
        {!running && isSignedIn === true && mode === null && text.trim() !== '' && (
          <span className="text-sm text-ink-soft">Choose a type to enable analysis.</span>
        )}
        {running && stage !== '' && (
          <span className="text-sm text-ink-soft">{stage}…</span>
        )}
      </section>

      {error !== '' && (
        <p className="mt-4 rounded border border-ink-soft px-3 py-2 text-sm text-ink">
          Couldn’t complete: {error}
        </p>
      )}

      {/* live streaming preview — before the final report lands */}
      {streamingPreview !== '' && (
        <article className="mt-6 whitespace-pre-wrap font-serif text-[0.95rem] leading-relaxed text-ink">
          {streamingPreview}
        </article>
      )}

      {/* revision-awareness banner (§ CHANGE 3) */}
      {report !== '' && revisionStatus === 'unchanged' && (
        <p className="mt-6 rounded border-l-4 border-teal bg-cream px-4 py-2 text-sm text-ink-mid">
          No changes detected since your last reading — showing your previous reading.
        </p>
      )}
      {report !== '' && revisionStatus === 'revised' && (
        <p className="mt-6 rounded border-l-4 border-amber bg-cream px-4 py-2 text-sm text-ink-mid">
          Updated reading — this responds to your revision of an earlier draft.
        </p>
      )}

      {/* the full reading */}
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
