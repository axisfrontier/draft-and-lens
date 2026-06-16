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
 * Deferred to later stages: inline anchoring (§18), glossary tooltips (§19),
 * scores/radar, story arc, market, bible panels, lenses, conversation.
 */

import { useRef, useState } from 'react';

type Mode = 'script' | 'story' | 'play' | 'treatment';

const TYPES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'script', label: 'Film Script' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'story', label: 'Story' },
  { value: 'play', label: 'Stage Play' },
];

interface Coverage {
  truncated: boolean;
  wordsRead: number;
  wordsTotal: number;
  fractionRead: number;
  coverage: string;
}

type StreamEvent =
  | { type: 'stage'; stage: string; title: string }
  | { type: 'text'; delta: string }
  | { type: 'done'; report: string; coverage: Coverage }
  | { type: 'error'; message: string };

// ⟦…⟧ anchor brackets (U+27E6 / U+27E7), built from char codes so the literal
// glyphs aren't embedded in source. Stripped for display; full anchoring is §18.
const ANCHOR_OPEN = String.fromCharCode(0x27e6);
const ANCHOR_CLOSE = String.fromCharCode(0x27e7);
function stripAnchors(s: string): string {
  return s.split(ANCHOR_OPEN).join('').split(ANCHOR_CLOSE).join('');
}

export default function AppHomePage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('');
  const [streamed, setStreamed] = useState('');
  const [report, setReport] = useState('');
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const canAnalyse = mode !== null && text.trim().length > 0 && !running;

  async function analyse(): Promise<void> {
    if (mode === null) return;
    setRunning(true);
    setError('');
    setStreamed('');
    setReport('');
    setStage('');
    setCoverage(null);

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
            setCoverage(evt.coverage);
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

  const shown = stripAnchors(report !== '' ? report : streamed);

  return (
    <main className="min-h-screen bg-paper p-8 text-ink">
      <h1 className="font-serif text-2xl">Draft &amp; Lens</h1>
      <p className="mt-1 text-sm text-ink-soft">A reading, not a verdict.</p>

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
        {!running && mode === null && text.trim() !== '' && (
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

      {/* partial-read banner (§13) */}
      {coverage?.truncated === true && (
        <p className="mt-4 text-sm text-ink-soft">
          This reading covers the {coverage.coverage} — the opening only.
        </p>
      )}

      {/* the reading */}
      {shown !== '' && (
        <article className="mt-6 whitespace-pre-wrap font-serif text-[0.95rem] leading-relaxed text-ink">
          {shown}
        </article>
      )}
    </main>
  );
}
