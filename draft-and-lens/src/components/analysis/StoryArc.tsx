'use client';

/**
 * Story Arc — Stage E. Tension / Pace / Emotion plotted from the scorer's
 * beats (pct + intensity), with act dividers, hover tooltips, and a toggleable
 * legend. Beat→curve math ported verbatim from the prototype's arc renderer:
 * each line is plotted independently from its own value, no shared offset.
 */
import { useState } from 'react';

interface Beat {
  pct: number;
  tension: number;
  pace: number;
  emotion: number;
  label: string;
  note: string;
}

const W = 860;
const H = 180;

type LineKey = 'tension' | 'pace' | 'emotion';

const LINES: ReadonlyArray<{
  key: LineKey;
  label: string;
  colour: string;
  dash?: string;
}> = [
  { key: 'tension', label: 'Tension', colour: 'var(--tension)' },
  { key: 'pace', label: 'Pace', colour: 'var(--pace)' },
  { key: 'emotion', label: 'Emotion', colour: 'var(--emotion)', dash: '5 4' },
];

const clampY = (v: number): number => Math.max(10, Math.min(170, v));

export function StoryArc({ beats }: { beats: Beat[] }) {
  const [hidden, setHidden] = useState<Record<LineKey, boolean>>({
    tension: false,
    pace: false,
    emotion: false,
  });
  const [hover, setHover] = useState<{ label: string; note: string; leftPct: number } | null>(
    null
  );

  if (!beats || beats.length === 0) return null;

  const toY = (v: number) => H - (v / 10) * (H - 20) - 10;

  const points = beats.map((b) => ({
    x: (b.pct / 100) * W,
    tension: clampY(toY(b.tension || 5)),
    pace: clampY(toY(b.pace || 5)),
    emotion: clampY(toY(b.emotion || 5)),
    label: b.label,
    note: b.note,
  }));

  const origin = { x: 0, tension: 90, pace: 90, emotion: 90 };
  const allPts = [origin, ...points];

  const lineStr = (key: LineKey): string =>
    allPts.map((p) => `${p.x.toFixed(0)},${p[key].toFixed(0)}`).join(' ');

  const toggle = (key: LineKey): void =>
    setHidden((h) => ({ ...h, [key]: !h[key] }));

  return (
    <section style={{ marginTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--rule-l)' }}>
      {/* header: label + info, legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '.72rem',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'var(--amber-d)',
            }}
          >
            Story arc · interpreted
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {LINES.map((l) => (
            <div
              key={l.key}
              onClick={() => toggle(l.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.45rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '.72rem',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                userSelect: 'none',
                opacity: hidden[l.key] ? 0.4 : 1,
              }}
            >
              <div style={{ width: 12, height: 2, borderRadius: 1, background: l.colour }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* the arc */}
      <div
        style={{
          background: 'var(--cream)',
          border: '1px solid var(--rule-l)',
          position: 'relative',
          height: 180,
        }}
      >
        {hover && (
          <div
            style={{
              position: 'absolute',
              left: `${hover.leftPct}%`,
              bottom: 'calc(100% + 10px)',
              transform: 'translateX(-50%)',
              background: 'var(--black-band)',
              borderLeft: '2px solid var(--amber)',
              padding: '.65rem .9rem',
              pointerEvents: 'none',
              zIndex: 20,
              maxWidth: 220,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '.72rem',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: '#c8b898',
                marginBottom: '.25rem',
              }}
            >
              {hover.label}
            </div>
            <div style={{ fontSize: '.78rem', lineHeight: 1.5, color: 'var(--paper-dark)', fontStyle: 'italic' }}>
              {hover.note}
            </div>
          </div>
        )}
        <svg width="100%" height="180" viewBox="0 0 860 180" preserveAspectRatio="none" style={{ display: 'block' }}>
          {/* horizontal guides */}
          <line x1="0" y1="45" x2="860" y2="45" stroke="var(--rule-l)" strokeWidth=".8" />
          <line x1="0" y1="90" x2="860" y2="90" stroke="var(--rule-l)" strokeWidth=".8" />
          <line x1="0" y1="135" x2="860" y2="135" stroke="var(--rule-l)" strokeWidth=".8" />
          {/* act dividers */}
          <line x1="258" y1="0" x2="258" y2="180" stroke="var(--rule)" strokeWidth="1" strokeDasharray="5 4" />
          <line x1="602" y1="0" x2="602" y2="180" stroke="var(--rule)" strokeWidth="1" strokeDasharray="5 4" />
          <text x="129" y="13" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--rule)" letterSpacing="2">ACT I</text>
          <text x="430" y="13" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--rule)" letterSpacing="2">ACT II</text>
          <text x="731" y="13" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--rule)" letterSpacing="2">ACT III</text>
          {/* the three lines */}
          {LINES.map((l) =>
            hidden[l.key] ? null : (
              <polyline
                key={l.key}
                points={lineStr(l.key)}
                fill="none"
                stroke={l.colour}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={l.dash}
              />
            )
          )}
          {/* beat markers */}
          {points.map((p, i) => (
            <g key={i}>
              <g transform={`translate(${(p.x - 8).toFixed(0)},${(p.tension - 31).toFixed(0)})`} opacity=".7">
                <path
                  d="M8,2 L8,12 M1,1 L1,13 Q4.5,12 8,13 Q11.5,12 15,13 L15,1 Q11.5,2 8,1 Q4.5,2 1,1Z"
                  stroke="var(--ink-soft)"
                  strokeWidth=".9"
                  fill="none"
                  strokeLinejoin="round"
                />
              </g>
              <circle
                cx={p.x.toFixed(0)}
                cy={p.tension.toFixed(0)}
                r="5"
                fill="var(--paper)"
                stroke="var(--amber)"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() =>
                  setHover({ label: p.label, note: p.note, leftPct: (p.x / W) * 100 })
                }
                onMouseLeave={() => setHover(null)}
              />
            </g>
          ))}
        </svg>
      </div>

      <div
        style={{
          marginTop: '.75rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '.68rem',
          letterSpacing: '.08em',
          color: '#8a8070',
          fontStyle: 'italic',
        }}
      >
        Arc reflects page order. If your story is told non-chronologically — events presented out
        of sequence — this structural reading may not map to your intended narrative shape.
      </div>
    </section>
  );
}
