'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fragment mode — the passage-and-a-question door (Fragment Handling &
 * Revision Loop spec, 2026-08-20).
 *
 * WHY THIS IS A DOOR THE WRITER CHOOSES, and not something detected.
 * The spec forbids routing on input size: fragment-vs-full is a proxy
 * variable, every proxy needs a threshold, and every threshold recreates the
 * word-count dead zone somewhere new. So nothing here measures the passage.
 * The writer says which kind of thing they want, and the server decides what
 * it can honestly answer from the context that exists.
 *
 * EPHEMERAL. Nothing is stored anywhere — not on the server, which writes
 * nothing on this path, and not here, which holds the exchange in component
 * state and drops it when the panel closes. That is the decision recorded in
 * the spec, not an unfinished edge.
 *
 * ALL COPY IN THIS FILE IS PLACEHOLDER, awaiting the Editor voice. It is
 * written to be in roughly the right register so the shape can be judged, and
 * to be obviously replaceable.
 */

type Ask = 'craft' | 'fit' | 'tradition' | 'free';

const mono = 'var(--font-mono)';

/**
 * When the writer pressed Analyse on something too short to read as a piece,
 * the page hands the passage over rather than making them paste it twice. The
 * nonce is what makes a second identical attempt reopen the panel.
 */
export interface FragmentHandoff {
  passage: string;
  reason: string;
  nonce: number;
}

export default function FragmentPanel({
  handoff,
}: {
  handoff?: FragmentHandoff | null;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [handoffReason, setHandoffReason] = useState('');
  const [hasContext, setHasContext] = useState(false);
  const [passage, setPassage] = useState('');
  const [ask, setAsk] = useState<Ask | null>(null);
  const [tradition, setTradition] = useState('');
  const [freeText, setFreeText] = useState('');
  const [reply, setReply] = useState('');
  const [route, setRoute] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // A handoff from the Analyse button: the writer asked for a reading on
  // something too short to give one to, so the passage comes across rather
  // than being pasted twice.
  useEffect(() => {
    if (!handoff) return;
    setOpen(true);
    setPassage(handoff.passage);
    setHandoffReason(handoff.reason);
    setAsk(null);
    setReply('');
    setRoute('');
    setError('');
  }, [handoff]);

  // Whether the "does this fit with what you've read" option is offered at all
  // is a fact about the account, not a guess about the text. A writer with
  // nothing read gets the smaller set, exactly as the spec requires.
  useEffect(() => {
    if (!open) return;
    let live = true;
    void (async () => {
      try {
        const res = await fetch('/api/works');
        if (!res.ok) return;
        const data = (await res.json()) as { works?: unknown[] };
        if (live) setHasContext(Array.isArray(data.works) && data.works.length > 0);
      } catch {
        /* no context is the safe default — the option simply is not offered */
      }
    })();
    return () => {
      live = false;
    };
  }, [open]);

  function reset(): void {
    abortRef.current?.abort();
    setPassage('');
    setAsk(null);
    setTradition('');
    setFreeText('');
    setReply('');
    setRoute('');
    setError('');
    setRunning(false);
    setHandoffReason('');
  }

  async function send(chosen: Ask): Promise<void> {
    if (!passage.trim() || running) return;
    if (chosen === 'free' && !freeText.trim()) return;
    setAsk(chosen);
    setReply('');
    setRoute('');
    setError('');
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          kind: 'fragment',
          passage,
          ask: chosen,
          namedTradition: tradition,
          message: freeText,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Something went wrong — try me again.");
        setRunning(false);
        return;
      }
      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as {
              type: string;
              delta?: string;
              route?: string;
              message?: string;
            };
            if (ev.type === 'route' && ev.route) setRoute(ev.route);
            if (ev.type === 'text' && ev.delta) {
              acc += ev.delta;
              setReply(acc);
            }
            if (ev.type === 'error') setError(ev.message || "Something went wrong — try me again.");
          } catch {
            /* a partial line — the next chunk completes it */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError("Something went wrong — try me again.");
    } finally {
      setRunning(false);
    }
  }

  if (!open) {
    return (
      <p style={{ textAlign: 'center', marginTop: '.75rem' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            fontFamily: mono, fontSize: '.68rem', letterSpacing: '.08em',
            color: 'var(--amber-l)', background: 'none', border: 'none',
            cursor: 'pointer', textDecoration: 'underline', padding: 0,
          }}
        >
          Just have a passage and a question?
        </button>
      </p>
    );
  }

  const canSend = passage.trim().length > 0 && !running;
  const optionStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left',
    fontFamily: 'var(--font-serif)', fontSize: '.85rem',
    padding: '.6rem .75rem', marginBottom: '.4rem',
    background: 'transparent', color: 'var(--paper)',
    border: '1px solid var(--border-dark)', borderRadius: 14,
    cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.5,
    lineHeight: 1.5,
  });

  return (
    <div style={{
      marginTop: '1rem', padding: '1rem',
      border: '1px solid var(--border-dark)', borderRadius: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          fontFamily: mono, fontSize: '.6rem', letterSpacing: '.22em',
          textTransform: 'uppercase', color: 'var(--amber-l)',
        }}>
          A passage and a question
        </span>
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          style={{
            fontFamily: mono, fontSize: '.6rem', letterSpacing: '.12em',
            color: 'var(--paper-dark)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
          }}
        >
          Close
        </button>
      </div>

      {handoffReason && (
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: '.88rem', lineHeight: 1.65,
          color: 'var(--paper)', marginTop: '.6rem',
        }}>
          {handoffReason}
        </p>
      )}

      <textarea
        value={passage}
        onChange={(e) => setPassage(e.target.value)}
        placeholder="Paste the passage…"
        rows={5}
        style={{
          width: '100%', marginTop: '.6rem', padding: '.7rem',
          fontFamily: 'var(--font-serif)', fontSize: '.9rem', lineHeight: 1.6,
          background: 'transparent', color: 'var(--paper)',
          border: '1px solid var(--border-dark)', borderRadius: 14,
          resize: 'vertical',
        }}
      />

      {/* The upfront ask. Three options plus free text — not a long menu, which
          reads as form-filling. Options are context-aware: the middle one is
          only offered when there is something to be consistent with. */}
      {passage.trim() && !reply && !running && (
        <div style={{ marginTop: '.6rem' }}>
          <p style={{
            fontFamily: mono, fontSize: '.62rem', letterSpacing: '.1em',
            color: 'var(--paper-dark)', marginBottom: '.5rem',
          }}>
            Tell me what you&apos;d like me to do with this.
          </p>

          <button type="button" style={optionStyle(true)} onClick={() => void send('craft')}>
            Just tell me how the writing itself is working.
          </button>

          <button
            type="button"
            style={optionStyle(hasContext)}
            disabled={!hasContext}
            onClick={() => void send('fit')}
          >
            Does this fit with what you&apos;ve read of my work so far?
            {!hasContext && (
              <span style={{
                display: 'block', fontFamily: mono, fontSize: '.58rem',
                letterSpacing: '.08em', color: 'var(--paper-dark)', marginTop: '.2rem',
              }}>
                Once I&apos;ve read something of yours.
              </span>
            )}
          </button>

          <div style={{ ...optionStyle(true), cursor: 'default' }}>
            <label htmlFor="frag-tradition" style={{ cursor: 'text' }}>
              I&apos;m writing something in{' '}
              <input
                id="frag-tradition"
                value={tradition}
                onChange={(e) => setTradition(e.target.value)}
                placeholder="which tradition?"
                style={{
                  fontFamily: 'var(--font-serif)', fontSize: '.85rem',
                  background: 'transparent', color: 'var(--amber-l)',
                  border: 'none', borderBottom: '1px solid var(--border-dark)',
                  width: '10rem', padding: '0 .2rem',
                }}
              />{' '}
              — does this sound authentic to it?
            </label>
            <button
              type="button"
              onClick={() => void send('tradition')}
              style={{
                display: 'block', marginTop: '.4rem', fontFamily: mono,
                fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase',
                color: 'var(--amber-l)', background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
              }}
            >
              Ask
            </button>
          </div>

          <div style={{ ...optionStyle(true), cursor: 'default' }}>
            <input
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Or ask me something else…"
              onKeyDown={(e) => { if (e.key === 'Enter' && canSend) void send('free'); }}
              style={{
                width: '100%', fontFamily: 'var(--font-serif)', fontSize: '.85rem',
                background: 'transparent', color: 'var(--paper)',
                border: 'none', padding: 0,
              }}
            />
          </div>
        </div>
      )}

      {running && !reply && (
        <p style={{
          fontFamily: mono, fontSize: '.62rem', letterSpacing: '.12em',
          color: 'var(--paper-dark)', marginTop: '.6rem',
        }}>
          Reading it…
        </p>
      )}

      {reply && (
        <div style={{ marginTop: '.8rem' }}>
          {reply.split(/\n\n+/).map((para, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-serif)', fontSize: '.92rem',
              lineHeight: 1.7, color: 'var(--paper)', marginBottom: '.7rem',
            }}>
              {para}
            </p>
          ))}
          {!running && (
            <button
              type="button"
              onClick={reset}
              style={{
                fontFamily: mono, fontSize: '.6rem', letterSpacing: '.12em',
                textTransform: 'uppercase', color: 'var(--amber-l)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {route === 'redirect' ? 'Start again with the full piece' : 'Ask about another passage'}
            </button>
          )}
        </div>
      )}

      {error && (
        <p style={{
          fontFamily: mono, fontSize: '.65rem', letterSpacing: '.08em',
          color: 'var(--amber-l)', marginTop: '.6rem',
        }}>
          {error}
        </p>
      )}

      <p style={{
        fontFamily: mono, fontSize: '.58rem', letterSpacing: '.08em',
        color: 'var(--paper-dark)', marginTop: '.8rem', lineHeight: 1.6,
      }}>
        Nothing here is saved — this exchange disappears when you close it.
      </p>
    </div>
  );
}
