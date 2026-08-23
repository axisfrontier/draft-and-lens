'use client';

import { SignInButton, SignUpButton, SignedOut, useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import { ReportSkeleton } from '@/components/analysis/ReportSkeleton';
import { ReportView } from '@/components/analysis/ReportView';
import FragmentPanel, { type FragmentHandoff } from '@/components/fragment/FragmentPanel';
import { LENS_NAMES } from '@/components/lenses/lens-directory';
import type {
  ContinuityFlag,
  Diagnostic,
  Market,
  Mode,
  Scores,
} from '@/components/analysis/types';
import { FULL_READING_MIN_WORDS, TESTER_WORD_CAP, countWords } from '@/lib/limits';
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  UPLOAD_FORMAT_HINT,
  UPLOAD_MESSAGES,
  extensionOf,
  formatFor,
  rejectionReason,
  stripMarkdown,
  type UploadFormat,
} from '@/lib/upload-formats';

const TYPES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: 'script', label: 'Film Script' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'story', label: 'Story' },
  { value: 'play', label: 'Stage Play' },
];

type StreamEvent =
  | { type: 'stage'; stage: string; title: string }
  | { type: 'diagnostic'; tradition: string; register: string; title: string }
  | { type: 'text'; delta: string }
  | { type: 'scores'; scores: Scores | null }
  | { type: 'market'; market: Market | null }
  | { type: 'bible'; bible: string }
  | {
      type: 'done';
      report: string;
      diagnostic: Diagnostic;
      scores: Scores | null;
      market: Market | null;
      bible: string;
      revision?: { status: RevisionStatus; readAt?: string };
    }
  // Sent after `done`, only when the reading was grouped into a manuscript.
  | { type: 'grouped'; workId: string; manuscriptId: string; sequenceIndex: number | null }
  // Sent after `grouped`, only when detection found something worth showing.
  // Read back from the store server-side, so this carries exactly what a later
  // view of the same reading would load.
  | { type: 'continuity'; flags: ContinuityFlag[] }
  // Sent after `done`, at most once per account for the life of the account.
  // The server decides and records; the client only renders what it is given.
  | { type: 'differentiator'; text: string }
  // Sent after everything else, at most once per reading and once per account.
  | { type: 'nudge'; text: string }
  // Sent after `done`. Not once-ever: a pattern stays named until the writer
  // says it is not true of them.
  | { type: 'pattern'; tendency: string; text: string; trendNote?: string }
  | { type: 'goal_progress'; notes: Array<{ goalId: string; goal: string; note: string }> }
  | { type: 'goal_prompt' }
  | { type: 'error'; message: string };

type RevisionStatus = 'new' | 'revised' | 'unchanged' | 'refreshed';

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error reading file: ' + (reader.error?.message ?? 'unknown')));
    reader.readAsText(file);
  });
}

/**
 * Binary formats (.docx, .pdf) are extracted server-side. `readAsText` does not
 * throw on them, it returns mojibake, which is how an unreadable file used to
 * pass the drop zone and only fail once the writer was already on the analysis
 * screen with no way back.
 */
async function extractViaServer(file: File, format: UploadFormat): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body });
  const data = (await res.json().catch(() => null)) as { text?: string; error?: string } | null;
  if (!res.ok || typeof data?.text !== 'string') {
    throw new Error(data?.error ?? UPLOAD_MESSAGES.extractionFailed(format.label));
  }
  return data.text;
}

export default function AppHomePage() {
  const { isSignedIn } = useAuth();
  const [mode, setMode] = useState<Mode | null>(null);
  // Defaults to 'complete', which is both the ordinary case and what the server
  // already assumes when the field is absent. It started as null, and the cost
  // was a dead ANALYSE button on every first visit: nothing on screen said the
  // reading was waiting on this pill, so the button simply did not respond.
  const [submissionType, setSubmissionType] = useState<'complete' | 'excerpt' | null>('complete');
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('');
  // 5A — arrives ~15-20s in, well before the first analyst token; lets the
  // progress banner say "Reading this as <tradition>" instead of sitting on a
  // generic stage label for the entire writing wait.
  const [earlyDiagnostic, setEarlyDiagnostic] = useState<{ tradition: string; register: string } | null>(null);
  const [streamed, setStreamed] = useState('');
  const [report, setReport] = useState('');
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [bible, setBible] = useState('');
  const [revisionStatus, setRevisionStatus] = useState<RevisionStatus | null>(null);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileText, setUploadedFileText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBannerRef = useRef<HTMLDivElement>(null);
  const [progressBannerHeight, setProgressBannerHeight] = useState(0);

  // 3C — the analyst thinks silently before emitting its first token: ~2s at the
  // Sonnet tiers but 15-26s at the Opus tier (measured, Long-Tier brief Phase 2).
  // That gap is the last genuinely blank window in the wait — every other stage
  // now streams as it resolves (5A, 5C). Revealed on a delay rather than gated on
  // word count, so the short tiers never flash it and no server-side tier
  // threshold has to be mirrored here.
  const hasStreamedText = streamed.length > 0;
  const [analystThinking, setAnalystThinking] = useState(false);
  useEffect(() => {
    if (stage !== 'Writing the reading' || hasStreamedText) {
      setAnalystThinking(false);
      return;
    }
    const timer = setTimeout(() => setAnalystThinking(true), 4000);
    return () => clearTimeout(timer);
  }, [stage, hasStreamedText]);

  // The progress banner is `position: fixed` (overlays rather than pushes content),
  // so the skeleton below it needs matching top padding to avoid being covered.
  // Measured directly rather than guessed, since its content (and thus height)
  // varies with word count and stage label length.
  useEffect(() => {
    if (running && progressBannerRef.current) {
      setProgressBannerHeight(progressBannerRef.current.offsetHeight);
    }
  }, [running, stage, analystThinking]);

  /**
   * Continuity-ledger grouping (§2, ruling 2 — a single lightweight
   * confirm/adjust step, never a form). The suggestion is deterministic and
   * local on the server, so asking for it costs nothing and can happen while
   * the writer is still looking at the page.
   *
   * `null` for `chosen` means "standalone piece", which stays the default:
   * nothing is grouped unless the writer says so, because §2's risk table
   * makes silent wrong grouping the failure that poisons every later flag.
   */
  const [grouping, setGrouping] = useState<{
    band: 'auto' | 'confirm' | 'none';
    suggestion: { manuscriptId: string; title: string | null; sharedEntities: string[] } | null;
    manuscripts: Array<{ manuscriptId: string; title: string | null; chapters: number }>;
  } | null>(null);
  /** Set when a grouping was applied WITHOUT asking, so the report can show a
   *  non-blocking trace with an undo. Never set for a grouping the writer
   *  chose — they do not need telling what they just did. */
  const [autoGrouped, setAutoGrouped] = useState<{ workId: string; title: string } | null>(null);
  /** The manuscript this reading was actually filed under, whether auto-applied
   *  or chosen. Drives the sidebar link through to the ledger — separate from
   *  `autoGrouped`, which exists only to show the undo trace and so is set for
   *  auto-groupings alone. */
  const [groupedManuscriptId, setGroupedManuscriptId] = useState<string | null>(null);
  const [continuityFlags, setContinuityFlags] = useState<ContinuityFlag[]>([]);
  const [chosenManuscript, setChosenManuscript] = useState<string | null>(null);
  /** The "+ New book" pill is showing its title field. Not a disclosure for the
   *  choices themselves — those are always inline (Nenad's ruling 2026-08-23). */
  const [newBookOpen, setNewBookOpen] = useState(false);
  const [fragmentHandoff, setFragmentHandoff] = useState<FragmentHandoff | null>(null);
  /** The lens-voice gate asked whether this work is the writer's own. */
  const [provenanceHold, setProvenanceHold] = useState('');
  const [differentiator, setDifferentiator] = useState('');
  const [nudge, setNudge] = useState('');
  const [pattern, setPattern] = useState<{ tendency: string; text: string; trendNote?: string } | null>(null);
  /** What this reading says against the goals they already hold (Gap B). */
  const [goalNotes, setGoalNotes] = useState<Array<{ goalId: string; goal: string; note: string }>>([]);
  /** Server says this writer holds no goals — one line points at where they live. */
  const [goalPrompt, setGoalPrompt] = useState(false);
  const [newManuscriptTitle, setNewManuscriptTitle] = useState('');

  const effectiveText = text.trim() || uploadedFileText;
  const wordCount = countWords(effectiveText);
  const overCap = wordCount > TESTER_WORD_CAP;
  /**
   * Steps 2 and 3 stay inert until step 1 has something in it.
   *
   * The numbered steps promise an order, and an active format pill sitting
   * above an empty box breaks that promise — it invites an answer to "what is
   * it?" before there is an "it". Gated on `wordCount` rather than on `text`
   * so an uploaded file counts exactly as a paste does; `effectiveText` folds
   * both together, which is the same term `canAnalyse` already gates on.
   */
  const hasWork = wordCount > 0;
  /**
   * Step 3's choices are live once step 2 is answered.
   *
   * They are always VISIBLE from `hasWork` — that is the point of showing them
   * inline — but they cannot be acted on until a format exists, and that is not
   * decoration. `createManuscriptAndSelect` files a new book under `format: mode`,
   * so a null mode would create one with no format; and the suggestion request
   * itself refuses to run without a mode, for the reason given at its own gate.
   */
  const groupingReady = hasWork && mode !== null;
  const canAnalyse =
    isSignedIn === true &&
    mode !== null &&
    submissionType !== null &&
    wordCount > 0 &&
    !running &&
    !uploading &&
    !overCap;

  // Ask once the text has settled. Debounced because `effectiveText` changes
  // on every keystroke in the paste box, and this is a courtesy question, not
  // something worth a request per character.
  useEffect(() => {
    // Do not ask before the submission type is known. Criterion 5 of the
    // auto-grouping bar compares formats, and a null mode fails it closed — so
    // classifying early always returns `confirm`, shows the panel, and then
    // silently flips to `auto` the moment the writer picks a type. That made the
    // confirm step cancel itself, which is the safety mechanism failing open.
    if (isSignedIn !== true || wordCount === 0 || running || !mode) return;
    const t = setTimeout(() => {
      fetch('/api/ledger/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: effectiveText, mode }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setGrouping(d);
          // `auto` and `confirm` both pre-select the proposal. They no longer
          // differ in whether the writer SEES it: since 2026-08-23 the choices
          // are always inline, so an `auto` match arrives as a pill already
          // selected rather than as a grouping applied out of sight. The band
          // still decides whether the writer is interrupted — nothing asks —
          // but it no longer decides whether they can look.
          //
          // The bar for `auto` is deliberately high — see AUTO_MIN_* — because
          // a wrong silent grouping is far worse than a missed one. That bar is
          // unchanged; what changed is that a wrong one is now visible and one
          // click from corrected, before the reading rather than after it.
          if (d.suggestion && chosenManuscript === null) {
            setChosenManuscript(d.suggestion.manuscriptId);
          }
        })
        .catch(() => {
          /* grouping is an enhancement; never surface its failure */
        });
    }, 800);
    return () => clearTimeout(t);
    // chosenManuscript deliberately omitted: re-running on the writer's own
    // choice would fight them for control of the control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveText, isSignedIn, wordCount, running, mode]);

  /** Undo an auto-grouping. Detaches the whole work, not one version — see
   *  detachWork. The same correction is available later in the ledger view, so
   *  missing this line is not the only chance to fix it. */
  async function undoAutoGroup() {
    if (!autoGrouped) return;
    try {
      await fetch('/api/ledger/detach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workId: autoGrouped.workId }),
      });
    } catch {
      /* best-effort */
    }
    setAutoGrouped(null);
    setChosenManuscript(null);
    setGroupedManuscriptId(null);
    setContinuityFlags([]);
  }

  async function createManuscriptAndSelect() {
    const title = newManuscriptTitle.trim();
    if (!title) return;
    try {
      const res = await fetch('/api/ledger/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title, format: mode }),
      });
      if (!res.ok) return;
      const d = (await res.json()) as { manuscriptId: string };
      setChosenManuscript(d.manuscriptId);
      setGrouping((g) => ({
        // Stays 'confirm'. It no longer decides whether the control is on
        // screen — the choices are always inline — but it still records that
        // this grouping was the writer's own explicit act rather than a match
        // the server proposed, which is what keeps the auto-grouping trace and
        // its undo away from a book they just named themselves.
        band: 'confirm',
        suggestion: g?.suggestion ?? null,
        manuscripts: [
          { manuscriptId: d.manuscriptId, title, chapters: 0 },
          ...(g?.manuscripts ?? []),
        ],
      }));
      setNewManuscriptTitle('');
      // The new book is now the selected pill, so the title field has done its
      // job and closes behind it.
      setNewBookOpen(false);
    } catch {
      /* best-effort */
    }
  }

  const chosenTitle =
    grouping?.manuscripts.find((m) => m.manuscriptId === chosenManuscript)?.title ?? null;

  /**
   * Every failure below surfaces here, on the upload screen, with a message
   * naming what went wrong and what to do next. Nothing reaches
   * `uploadedFileText` unless it has passed extraction and the readable-text
   * gate, so an unreadable file can no longer carry the writer through to the
   * analysis screen.
   */
  const handleFile = useCallback(async (file: File) => {
    setUploadError('');
    setUploadedFileName('');
    setUploadedFileText('');
    // Clear the picker up front so re-choosing the same file still fires
    // `change`. Without this, a writer who fixes and re-saves a file cannot
    // retry it. The File handle above is unaffected.
    if (fileInputRef.current) fileInputRef.current.value = '';

    const ext = extensionOf(file.name);
    if (ext === '.doc') {
      setUploadError(UPLOAD_MESSAGES.legacyDoc);
      return;
    }
    const format = formatFor(file.name);
    if (format === null) {
      setUploadError(UPLOAD_MESSAGES.unsupported(ext));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(UPLOAD_MESSAGES.tooLarge(file.size));
      return;
    }

    setUploading(true);
    try {
      const raw = format.transport === 'server'
        ? await extractViaServer(file, format)
        : await readFileAsText(file);
      const content = format.ext === '.md' ? stripMarkdown(raw) : raw;

      const reason = rejectionReason(content, format);
      if (reason !== null) {
        setUploadError(reason);
        return;
      }
      setUploadedFileName(file.name);
      setUploadedFileText(content);
    } catch (err) {
      setUploadError(err instanceof Error && err.message !== ''
        ? err.message
        : UPLOAD_MESSAGES.readFailed(format.label));
    } finally {
      setUploading(false);
    }
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFileName('');
    setUploadedFileText('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /**
   * §5.5 — the writer says a flagged pair is intentional.
   *
   * Removed from view immediately rather than after the round trip: the click
   * is the writer correcting the tool, and making them wait to see their own
   * correction land reads as the tool arguing. If the request fails the flag
   * comes back, which is the honest outcome — it was not dismissed.
   */
  async function reconcileFlag(flagId: string): Promise<void> {
    const before = continuityFlags;
    setContinuityFlags((prev) => prev.filter((f) => f.flagId !== flagId));
    try {
      const res = await fetch('/api/ledger/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId }),
      });
      if (!res.ok) setContinuityFlags(before);
    } catch {
      setContinuityFlags(before);
    }
  }

  /**
   * The writer says a named pattern is not true of them.
   *
   * Optimistic like the flag control, and for the same reason: this is the
   * writer correcting the largest claim the product makes about them, and
   * making them wait to see it go reads as the tool holding its ground.
   */
  async function dismissPattern(tendency: string): Promise<void> {
    const before = pattern;
    setPattern(null);
    try {
      const res = await fetch('/api/patterns/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tendency }),
      });
      if (!res.ok) setPattern(before);
    } catch {
      setPattern(before);
    }
  }

  async function analyse(forceRefresh = false, confirmedOwn = false): Promise<void> {
    if (mode === null) return;

    // Too short to read as a piece — ask instead of proceeding.
    //
    // This is the fragment spec's governing principle at the one place the
    // writer can walk past it: pressing Analyse. It is not a gate on any
    // brain — every brain still runs at every length it is handed — and it
    // does not silently reroute. It hands the passage to the conversation and
    // lets the writer say what they actually wanted, which costs a click if
    // this is wrong and costs 200 seconds of pipeline and a Studios verdict on
    // thirty words if it is absent. See FULL_READING_MIN_WORDS.
    const forReading = (text.trim() || uploadedFileText).trim();
    if (countWords(forReading) < FULL_READING_MIN_WORDS) {
      setError('');
      setFragmentHandoff({
        passage: forReading,
        reason:
          "That's shorter than I can give a full reading to — a reading needs enough on the page to have something to be true about. Ask me about it directly instead and I'll tell you what I see.",
        nonce: Date.now(),
      });
      return;
    }

    setRunning(true);
    setError('');
    setStreamed('');
    setReport('');
    setProvenanceHold('');
    setDifferentiator('');
    setNudge('');
    setPattern(null);
    setGoalNotes([]);
    setGoalPrompt(false);
    setStage('Reading your work');
    setEarlyDiagnostic(null);
    setDiagnostic(null);
    setScores(null);
    setMarket(null);
    setBible('');
    setRevisionStatus(null);
    setReadAt(null);

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
          ...(forceRefresh ? { forceRefresh: true } : {}),
          ...(confirmedOwn ? { confirmedOwn: true } : {}),
          ...(chosenManuscript ? { manuscriptId: chosenManuscript } : {}),
          // A goal only exists because the writer typed it. Scope follows their
          // choice, and 'manuscript' is meaningless without a book to attach it
          // to — the server refuses one that is not theirs rather than
          // rescoping it to a standing goal.
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || res.body === null) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; provenanceHold?: boolean }
          | null;
        // The lens-voice gate asked a question rather than refusing. It is not
        // an error and must not be shown as one — the writer answers it and
        // the same submission goes through untouched.
        if (res.status === 409 && data?.provenanceHold) {
          setProvenanceHold(data.error ?? '');
          setRunning(false);
          return;
        }
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
          else if (evt.type === 'diagnostic') setEarlyDiagnostic({ tradition: evt.tradition, register: evt.register });
          else if (evt.type === 'text') setStreamed((prev) => prev + evt.delta);
          // 5C — progressive reveal. Sets state the instant each brain's
          // result arrives rather than waiting for `done`; `done` still sets
          // the same fields again as the authoritative final value, which is
          // a harmless no-op re-render when it matches what arrived early.
          else if (evt.type === 'scores') setScores(evt.scores);
          else if (evt.type === 'market') setMarket(evt.market);
          else if (evt.type === 'bible') setBible(evt.bible);
          else if (evt.type === 'done') {
            setReport(evt.report);
            setDiagnostic(evt.diagnostic);
            setScores(evt.scores);
            setMarket(evt.market);
            setBible(evt.bible);
            setRevisionStatus(evt.revision?.status ?? 'new');
            setReadAt(evt.revision?.readAt ?? null);
          } else if (evt.type === 'grouped') {
            setGroupedManuscriptId(evt.manuscriptId);
            // The undo trace, by contrast, is only surfaced when the grouping
            // was applied without asking; a writer who chose it needs no notice.
            if (grouping?.band === 'auto' && grouping.suggestion) {
              setAutoGrouped({
                workId: evt.workId,
                title: grouping.suggestion.title || 'your manuscript',
              });
            }
          } else if (evt.type === 'continuity') {
            setContinuityFlags(evt.flags);
          } else if (evt.type === 'differentiator') {
            setDifferentiator(evt.text);
          } else if (evt.type === 'nudge') {
            setNudge(evt.text);
          } else if (evt.type === 'pattern') {
            setPattern({ tendency: evt.tendency, text: evt.text, trendNote: evt.trendNote });
          } else if (evt.type === 'goal_progress') {
            setGoalNotes(evt.notes);
          } else if (evt.type === 'goal_prompt') {
            setGoalPrompt(true);
          } else if (evt.type === 'error') setError(evt.message);
        }
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        setError((e as Error)?.message ?? 'Something went wrong before I finished. Send it again.');
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
    // --label-amber is 4.31:1 on --black-band, under AA for body text.
    // --amber-l is 6.46:1 and is already the accent used beside it.
    color: 'var(--amber-l)',
    fontWeight: 500,
    marginBottom: '.35rem',
  };

  const badge = (n: number, active = true): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '2rem', height: '2rem', borderRadius: '50%',
    background: active ? 'var(--amber)' : 'var(--border-dark)',
    color: active ? 'var(--black-band)' : 'var(--paper-dark)',
    fontFamily: 'var(--font-mono)', fontSize: '.95rem', fontWeight: 500,
    flexShrink: 0,
  });

  /**
   * A step-2 choice pill, in one place because there are two groups of them
   * (format, and complete-vs-excerpt) and their disabled state must not drift.
   *
   * When the step is inert the selection is not painted amber. That matters
   * for `submissionType`, which defaults to 'complete': without this, one pill
   * sits filled and answered above an empty box, which is the loudest part of
   * the step looking live before it is.
   */
  const pill = (selected: boolean, enabled: boolean): CSSProperties => ({
    fontFamily: 'var(--font-mono)', fontSize: '.65rem',
    letterSpacing: '.22em', textTransform: 'uppercase',
    padding: '.65rem .3rem',
    background: selected && enabled ? 'var(--amber)' : 'transparent',
    color: selected && enabled ? 'var(--black-band)'
      : enabled ? 'var(--paper)' : 'var(--paper-dark)',
    border: `1px solid ${selected && enabled ? 'var(--amber)' : enabled ? 'var(--amber-l)' : 'var(--border-dark)'}`,
    cursor: enabled ? 'pointer' : 'not-allowed',
    borderRadius: 10,
    transition: 'all .15s',
  });

  /** A step heading dims with its step, so the label and its badge agree. */
  const stepLabel = (active: boolean): CSSProperties => ({
    fontFamily: 'var(--font-mono)', fontSize: '.72rem',
    letterSpacing: '.14em', textTransform: 'uppercase',
    color: active ? 'var(--paper)' : 'var(--paper-dark)', fontWeight: 500,
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
                <em style={{ fontWeight: 400, color: 'var(--amber)', fontStyle: 'italic' }}>Not a ghostwriter.</em>
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
                    // This overlay is near-paper, so the dark-surface tokens
                    // invert here: --ink-faint is 3.30:1 on paper, --ink-soft 6.66:1.
                    color: 'var(--ink-soft)', maxWidth: 320, lineHeight: 1.6,
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
                <span style={stepLabel(true)}>Your work</span>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (uploading) return;
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                style={{
                  background: dragOver ? 'rgba(200,146,42,.06)' : 'var(--surface-input)',
                  padding: '1.25rem', textAlign: 'center',
                  cursor: uploading ? 'progress' : 'pointer',
                  borderRadius: 18, border: `1px solid ${dragOver ? 'var(--amber)' : 'var(--amber-d)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 96, transition: 'all .15s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                {uploading ? (
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                    letterSpacing: '.08em', color: 'var(--amber-l)',
                  }}>Reading your file…</p>
                ) : uploadedFileName ? (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.72rem',
                      letterSpacing: '.08em', color: 'var(--amber-l)', marginBottom: '.5rem',
                    }}>{uploadedFileName}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.66rem',
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
                      fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                      letterSpacing: '.08em', color: 'var(--paper-dark)',
                    }}>{UPLOAD_FORMAT_HINT}</p>
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
                      letterSpacing: '.08em', color: 'var(--paper-dark)',
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
                  <span style={badge(2, hasWork)}>2</span>
                  <span style={stepLabel(hasWork)}>What is it?</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.4rem' }}>
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setMode(t.value)}
                      disabled={running || !hasWork}
                      style={pill(mode === t.value, hasWork)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complete piece vs excerpt — the second half of "what is it?",
                  so it sits under that heading as a quiet sub-label rather than
                  as its own unlabelled question. */}
              <div style={{ borderRadius: 14, padding: '.15rem 1rem .5rem', margin: '0 -1rem' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.64rem',
                  letterSpacing: '.14em', textTransform: 'uppercase',
                  color: hasWork ? 'var(--paper-dark)' : 'var(--border-dark)',
                  marginBottom: '.5rem',
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
                      disabled={running || !hasWork}
                      style={pill(submissionType === t.value, hasWork)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload error */}
              {uploadError && (
                <div style={{
                  padding: '.65rem .9rem', background: 'rgba(139,32,32,.12)',
                  border: '1px solid var(--error)',
                  fontFamily: 'var(--font-mono)', fontSize: '.7rem',
                  lineHeight: 1.6,
                  // --error is 4.01:1 on this band, under AA for body text, and
                  // this is the one message a stuck writer has to be able to
                  // read. The red border and tint carry the semantics instead.
                  color: 'var(--paper)',
                }} role="alert">{uploadError}</div>
              )}

              {/* Step 3 — where does it belong? */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', margin: '.6rem 0 -.2rem' }}>
                <span style={badge(3, hasWork)}>3</span>
                <span style={stepLabel(hasWork)}>Where does it belong?</span>
              </div>

              {/* Step 3 body — the grouping choices, always inline.
                  Nenad's ruling, 2026-08-23, replacing a cream card that held
                  a second copy of the step's own question, a click-to-reveal,
                  and radio inputs borrowed from no other part of the panel.

                  THREE THINGS THIS FIXES, and the third is the behavioural one:
                    • no container — the choices sit on the panel like every
                      other control rather than in a light card pasted onto a
                      dark surface;
                    • no radios — they are the same pills as step 2, from the
                      same `pill()` helper, so the two steps cannot drift apart;
                    • no hiding — the block used to render nothing at all when
                      the server was confident enough to group silently (band
                      'auto'). The high bar for `auto` is unchanged and nothing
                      interrupts the writer, but the grouping it chose is now
                      visible as a selected pill instead of happening out of
                      sight and being explained afterwards.

                  Visible from `hasWork` so the body and its badge agree; live
                  from `groupingReady`, because a format must exist first. */}
              {hasWork && (
                <div style={{ marginTop: '.7rem' }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: '.78rem',
                    color: 'var(--paper-dark)', lineHeight: 1.6,
                    marginBottom: '.6rem',
                  }}>
                    Chapters read as one book build a continuity ledger — a record of
                    what the book has established, carried across every chapter. A single
                    piece needs none of that.
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', alignItems: 'flex-start' }}>
                    {/* Standalone stays first and stays the default: nothing is
                        grouped unless something says so, per §2's risk table. */}
                    <button
                      type="button"
                      aria-pressed={chosenManuscript === null && !newBookOpen}
                      disabled={!groupingReady}
                      onClick={() => { setChosenManuscript(null); setNewBookOpen(false); }}
                      style={{ ...pill(chosenManuscript === null && !newBookOpen, groupingReady), padding: '.65rem .9rem' }}
                    >
                      On its own
                    </button>

                    {(grouping?.manuscripts ?? []).map((ms) => (
                      <div key={ms.manuscriptId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button
                          type="button"
                          aria-pressed={chosenManuscript === ms.manuscriptId && !newBookOpen}
                          disabled={!groupingReady}
                          onClick={() => { setChosenManuscript(ms.manuscriptId); setNewBookOpen(false); }}
                          style={{ ...pill(chosenManuscript === ms.manuscriptId && !newBookOpen, groupingReady), padding: '.65rem .9rem' }}
                        >
                          {ms.title || 'Untitled book'}
                        </button>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '.58rem',
                          letterSpacing: '.08em', color: 'var(--paper-dark)',
                          marginTop: '.3rem',
                        }}>
                          {ms.chapters} so far
                        </span>
                      </div>
                    ))}

                    <button
                      type="button"
                      aria-pressed={newBookOpen}
                      disabled={!groupingReady}
                      onClick={() => setNewBookOpen((v) => !v)}
                      style={{ ...pill(newBookOpen, groupingReady), padding: '.65rem .9rem' }}
                    >
                      + New book
                    </button>
                  </div>

                  {/* Why this one was proposed. Only where the selection IS the
                      server's suggestion — otherwise it would be evidence for a
                      choice the writer made on their own. */}
                  {chosenManuscript !== null &&
                    !newBookOpen &&
                    grouping?.suggestion?.manuscriptId === chosenManuscript &&
                    grouping.suggestion.sharedEntities.length > 0 && (
                      <div style={{
                        fontFamily: 'var(--font-sans)', fontSize: '.75rem',
                        color: 'var(--paper-dark)', fontStyle: 'italic',
                        marginTop: '.5rem',
                      }}>
                        Both mention {grouping.suggestion.sharedEntities.slice(0, 3).join(', ')}.
                      </div>
                    )}

                  {newBookOpen && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginTop: '.5rem' }}>
                      <input
                        placeholder="Give it a title…"
                        value={newManuscriptTitle}
                        onChange={(e) => setNewManuscriptTitle(e.target.value)}
                        style={{
                          flex: '1 1 12rem', fontFamily: 'var(--font-sans)',
                          fontSize: '.82rem', padding: '.6rem .8rem',
                          background: 'var(--surface-input)', color: 'var(--paper-dark)',
                          border: '1px solid var(--amber-d)', borderRadius: 10,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        disabled={newManuscriptTitle.trim() === ''}
                        onClick={createManuscriptAndSelect}
                        style={{ ...pill(false, newManuscriptTitle.trim() !== ''), padding: '.65rem .9rem' }}
                      >
                        Create
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 — Analyse */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginTop: '.5rem' }}>
                <span style={badge(4, canAnalyse)}>4</span>
                <button
                  type="button"
                  onClick={() => analyse()}
                  disabled={!canAnalyse}
                  style={{
                    flex: 1, fontFamily: 'var(--font-mono)',
                    fontSize: '.65rem', letterSpacing: '.22em',
                    textTransform: 'uppercase', padding: '.95rem',
                    background: canAnalyse ? 'var(--amber)' : 'var(--border-dark)',
                    color: canAnalyse ? 'var(--black-band)' : 'var(--paper-dark)',
                    border: 'none', cursor: canAnalyse ? 'pointer' : 'not-allowed',
                    fontWeight: 500, borderRadius: 18,
                    transition: 'all .15s',
                  }}
                >
                  Analyse
                </button>
              </div>

              {/* Why the button is not doing anything. The format cannot be
                  defaulted — the server never infers it (§15), and a story read
                  as a script is a wrong reading rather than a rough one — so
                  this is the one choice that genuinely blocks a reading. Saying
                  so beats a control that looks alive and does nothing. */}
              {!canAnalyse && !running && wordCount > 0 && !overCap && mode === null && (
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: '.78rem',
                  color: 'var(--paper-dark)', fontStyle: 'italic',
                  marginTop: '.5rem', textAlign: 'center',
                }}>
                  Tell me what this is first — I read a script and a story differently.
                </div>
              )}

              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                letterSpacing: '.08em', color: 'var(--paper-dark)',
                textAlign: 'center', marginTop: '.5rem', lineHeight: 1.6,
              }}>
                Your work is yours. We never train AI on it — it&apos;s sent only to generate your reading.
              </p>

              {provenanceHold && (
                <div style={{
                  marginTop: '1rem', padding: '.9rem 1.1rem',
                  border: '1px solid var(--border-dark)', borderRadius: 14,
                }}>
                  <p style={{
                    margin: 0, fontFamily: 'var(--font-serif)', fontSize: '.9rem',
                    lineHeight: 1.7, color: 'var(--paper)',
                  }}>
                    {provenanceHold}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setProvenanceHold(''); void analyse(false, true); }}
                    style={{
                      marginTop: '.7rem', background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '.6rem',
                      letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--amber-l)',
                    }}
                  >
                    It&apos;s mine — read it
                  </button>
                </div>
              )}

              {/* Fragment mode — a passage and a question, answered
                  conversationally and stored nowhere. Its own component with
                  its own state: this page already carries thirty pieces of
                  state for the reading pipeline, and fragment mode shares none
                  of them by design. */}
              <FragmentPanel handoff={fragmentHandoff} />

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
              color: 'var(--paper-dark)', fontStyle: 'italic',
              marginBottom: '1rem', lineHeight: 1.6,
              maxWidth: 680, marginLeft: 'auto', marginRight: 'auto',
            }}>
              After analysis, apply the perspective of any of these voices to your work — some of the most influential and celebrated practitioners in their fields.
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '.4rem',
              justifyContent: 'center', maxWidth: 820, margin: '0 auto',
            }}>
              {LENS_NAMES.map((name) => (
                <span key={name} style={{
                  fontFamily: 'var(--font-mono)', fontSize: '.66rem',
                  letterSpacing: '.08em', color: 'var(--rule)',
                  // --ink-mid is 1.55:1 here, under the 3:1 minimum for a
                  // component boundary. --ink-faint is 5.04:1 and stays quiet.
                  padding: '.22rem .65rem', border: '1px solid var(--ink-faint)',
                  whiteSpace: 'nowrap',
                }}>{name}</span>
              ))}
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '.64rem',
              letterSpacing: '.06em', color: 'var(--rule)',
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
            fontFamily: 'var(--font-mono)', fontSize: '.68rem',
            letterSpacing: '.12em', color: 'var(--paper-dark)',
          }}>
            Copyright &copy; 2026 Draft&amp;Lens
          </footer>
        </>
      )}

      {/* ── RUNNING STATE ── */}
      {running && (
        <div ref={progressBannerRef} style={{
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
                  // No padding here on purpose: the banner's own wrapper already
                  // carries '.7rem 2.5rem', which matches SiteNav's 2.5rem. An
                  // earlier fix added 2.5rem here as well, doubling it to 5rem —
                  // which pushed the stage header right of the logo and the Stop
                  // button left of the avatar by exactly that 40px.
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontSize: '.95rem',
                      color: 'var(--paper)', marginBottom: '.4rem',
                    }}>{stage || 'Reading your work'}</div>
                    {/* 5A — the single most reassuring signal available: the
                        tradition is known ~15-20s in, long before the analyst's
                        first token, but was previously withheld until `done`. */}
                    {earlyDiagnostic && (
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                        letterSpacing: '.03em', color: 'var(--amber-l)',
                        marginBottom: '.4rem', fontStyle: 'italic',
                      }}>
                        Reading this as {earlyDiagnostic.tradition.toLowerCase()}
                        {earlyDiagnostic.register ? ` — ${earlyDiagnostic.register.toLowerCase()}` : ''}
                      </div>
                    )}
                    {/* 3C — fills the silent pre-emission window on longer work.
                        Clears the moment the first token streams. */}
                    {analystThinking && (
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '.68rem',
                        letterSpacing: '.03em', color: 'var(--paper-dark)',
                        marginBottom: '.4rem', fontStyle: 'italic',
                      }}>
                        Thinking it through before writing.
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      {stageKeys.map((s, i) => {
                        const labels = ['Reading', 'Structure', 'Writing the reading', 'Market & bible'];
                        const isActive = currentKey === s;
                        return (
                          <div key={s} style={{
                            fontFamily: 'var(--font-mono)', fontSize: '.6rem',
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
                      fontFamily: 'var(--font-mono)', fontSize: '.64rem',
                      letterSpacing: '.14em', textTransform: 'uppercase',
                      color: 'var(--paper)', background: 'transparent',
                      border: '1px solid var(--ink-faint)',
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
        <div style={{ paddingTop: progressBannerHeight }}>
          <ReportSkeleton mode={mode} wordCount={wordCount} streamedText={streamed} extraTopOffset={progressBannerHeight} scores={scores} />
        </div>
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

      {/* Trace of an auto-grouping (§2). Non-blocking by design: nothing to
          dismiss, nothing gated behind it.

          WHAT THIS LINE IS FOR CHANGED ON 2026-08-23, and the copy changed with
          it. It used to be a disclosure — the grouping had been applied out of
          sight, and a grouping the writer never learns about cannot be
          corrected. Since step 3's choices went inline, an `auto` match is
          shown as a selected pill BEFORE the reading is sent, so the writer had
          it in front of them and could have changed it. Telling them afterwards
          that something happened without them is no longer true.

          So it now confirms rather than confesses: it names what the reading
          was read as, and keeps the correction one click away. That still earns
          its place — a wrong grouping goes on to poison every later flag, and
          the moment the reading lands is when the writer can first tell. The
          undo detaches the whole chapter; the same correction stays available
          in the ledger view afterwards. */}
      {report !== '' && autoGrouped && (
        <div
          style={{
            maxWidth: 760, margin: '1.25rem auto 0', padding: '.6rem .9rem',
            background: 'var(--cream)', borderLeft: '3px solid var(--amber)',
            fontSize: '.82rem', color: 'var(--ink-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}
        >
          <span>
            I read this as part of <strong>{autoGrouped.title}</strong> — how it was
            set when you sent it.{' '}
            <a href="/ledger" style={{ color: 'var(--amber-d)' }}>
              See what it has established
            </a>
          </span>
          <button
            type="button"
            onClick={undoAutoGroup}
            style={{
              flexShrink: 0, background: 'transparent', border: '1px solid var(--border-dark)',
              padding: '.2rem .6rem', cursor: 'pointer', color: 'var(--ink)',
              fontFamily: 'var(--font-mono)', fontSize: '.66rem',
              letterSpacing: '.1em', textTransform: 'uppercase',
            }}
          >
            Undo
          </button>
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
          mode={mode ?? undefined}
          manuscriptId={groupedManuscriptId ?? undefined}
          continuityFlags={continuityFlags}
          differentiator={differentiator || undefined}
          goalNotes={goalNotes}
          goalPrompt={goalPrompt}
          nudge={nudge || undefined}
          onDismissNudge={() => setNudge('')}
          onReconcileFlag={reconcileFlag}
          pattern={pattern ?? undefined}
          onDismissPattern={dismissPattern}
          revisionStatus={revisionStatus ?? undefined}
          readAt={readAt ?? undefined}
          onFreshReadingRequest={() => analyse(true)}
        />
      )}
    </main>
  );
}
