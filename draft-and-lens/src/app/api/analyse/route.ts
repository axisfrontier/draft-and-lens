import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { recordStageTiming, withCostTracking, type CostEntry } from '../../../ai/cost-tracker';
import { moderateSubmission } from '../../../ai/moderation';
import { FREE_WORD_LIMIT, runAnalysisPipeline } from '../../../ai/orchestrator';
import { TESTER_WORD_CAP, countWords } from '../../../lib/limits';
import { logSubmissionCost } from '../../../lib/cost-log';
import { newWorkId, resolveRevision, storeReading } from '../../../lib/readings';
import { logSecurityEvent } from '../../../lib/security-log';
import { logSubmissionTelemetry, type TraditionSource } from '../../../lib/telemetry-log';
import type { AnalysisMode } from '../../../prompts/types';

/**
 * POST /api/analyse — Stage B (minimal vertical slice).
 *
 * Wires the request to the already-built brain pipeline and streams Brain 2's
 * reading back as it is written. Deliberately minimal for the first browser
 * security check:
 *   - NO auth / rate-limit / tier gating yet (local-only; the security spine is
 *     re-added before any deploy — Architecture §09, Stage H).
 *   - mode is REQUIRED and validated; the server never infers it (§15).
 *   - the word limit is enforced BEFORE any Anthropic call (a law): `wordLimit`
 *     is passed into runAnalysisPipeline, which truncates via computeCoverage
 *     before the first brain runs.
 *
 * Response: newline-delimited JSON (NDJSON). One object per line:
 *   { type: 'stage', stage, title }   pipeline stage transitions (§15)
 *   { type: 'text',  delta }          live Brain 2 text deltas (anchors intact)
 *   { type: 'done',  report, diagnostic, coverage, scores, market, bible }
 *   { type: 'error', message }
 * The final `report` is authoritative — it includes the post-stream narrator
 * correction, which the streamed deltas predate.
 */

// The Anthropic SDK + `server-only` prompt modules require the Node runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Long readings stream well past the default; raised for deploy (no effect locally).
export const maxDuration = 300;

const MODES: ReadonlySet<string> = new Set<AnalysisMode>([
  'script',
  'story',
  'play',
  'treatment',
]);

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Minimal input hygiene — normalise line endings and trim. Control-character
 *  stripping belongs in Stage H hardening, not the minimal slice. */
function sanitise(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

export async function POST(req: NextRequest): Promise<Response> {
  // Phase 1 telemetry: the clock starts at request receipt, so every downstream
  // measurement is relative to the same origin the user experiences as "submit".
  const runStartedAtMs = Date.now();
  const runId = newWorkId();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  // Require a signed-in user — readings are stored per writer (CHANGE 3).
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/analyse' });
    return NextResponse.json({ error: 'Please sign in to analyse your work.' }, { status: 401 });
  }

  const { text, mode, genre, intent, bible, skipBible, submissionType, forceRefresh } = body;

  // mode required + validated — the server never infers the submission type (§15).
  if (typeof mode !== 'string' || !MODES.has(mode)) {
    return badRequest('Submission type required: "script", "story", "play", or "treatment".');
  }

  // Excerpt vs complete piece — defaults to 'complete', never trust the client blindly.
  const cleanSubmissionType: 'complete' | 'excerpt' =
    submissionType === 'excerpt' ? 'excerpt' : 'complete';

  const clean = sanitise(typeof text === 'string' ? text : '');
  if (!clean) return badRequest('No text submitted.');

  const submittedWordCount = countWords(clean);
  // Whether the tradition reaching the analyst came from the writer or from
  // Brain 1's auto-detection. Recorded so the Phase 3 A/B ladder can measure
  // whether supplying it saves any time at all.
  const traditionSource: TraditionSource =
    typeof genre === 'string' && genre.trim() !== '' ? 'user_selected' : 'auto';

  // Tester-phase cap — defence-in-depth behind the client block (CHANGE: input cap).
  if (submittedWordCount > TESTER_WORD_CAP) {
    return NextResponse.json(
      {
        error: `Draft & Lens reads best in focused pieces right now — please paste up to about ${TESTER_WORD_CAP.toLocaleString()} words (a chapter, a short story, or an excerpt). Full-length novels and scripts are coming soon.`,
      },
      { status: 413 }
    );
  }

  // ── Moderation gate (CHANGE 2) + revision awareness (CHANGE 3) — run
  // CONCURRENTLY rather than sequentially. They are independent: one checks
  // content safety, the other checks for a matching prior submission — neither
  // needs the other's result. Previously they ran one after another, paying
  // both latencies in series for every submission (measured: ~2.4s + ~1.2s).
  // Running them together costs only whichever is slower. The only tradeoff:
  // on a blocked submission, the revision lookup ran for nothing — acceptable,
  // since blocks are rare and the saving applies to the overwhelming majority
  // of (allowed) submissions.
  //
  // Blocked content is never persisted or processed; only a minimal, non-content
  // event is logged. Tuned for literature: serious dark fiction passes.
  // Wrapped in a cost-tracking context so the gate's tokens AND latency are
  // captured. Previously moderateSubmission ran outside any tracked context, so
  // recordBrainUsage found no store and silently dropped it — which is exactly
  // how a full LLM call gating every submission stayed invisible in the numbers.
  const [
    { result: verdict, entries: gateEntries },
    { result: decision, entries: revisionEntries },
  ] = await Promise.all([
    withCostTracking(() => moderateSubmission(clean)),
    withCostTracking(async () => {
      const startedAtMs = Date.now();
      const d = await resolveRevision(userId, mode, clean, cleanSubmissionType, forceRefresh === true);
      recordStageTiming('resolveRevision', { startedAtMs, endedAtMs: Date.now() }, 'supabase');
      return d;
    }),
  ]);
  if (verdict.status === 'block') {
    // Minimal log — category only, NEVER the submitted text (breach hook).
    logSecurityEvent('moderation_blocked', { category: verdict.category });
    await logSubmissionTelemetry({
      runId,
      wordCount: submittedWordCount,
      mode,
      submissionType: cleanSubmissionType,
      traditionValue: null,
      traditionSource,
      totalWallClockMs: Date.now() - runStartedAtMs,
      timeToFirstVisibleContentMs: null,
      timeToFirstStageMs: null,
      outcome: 'blocked',
      entries: gateEntries,
    });
    return NextResponse.json(
      {
        error:
          'This submission can’t be analysed — it appears to fall outside our Acceptable Use Policy. ' +
          'Draft & Lens reads serious fiction of all kinds, including dark and difficult work; if you ' +
          'believe this was blocked in error, please get in touch.',
        blocked: true,
      },
      { status: 422 }
    );
  }
  if (verdict.status === 'error') {
    await logSubmissionTelemetry({
      runId,
      wordCount: submittedWordCount,
      mode,
      submissionType: cleanSubmissionType,
      traditionValue: null,
      traditionSource,
      totalWallClockMs: Date.now() - runStartedAtMs,
      timeToFirstVisibleContentMs: null,
      timeToFirstStageMs: null,
      outcome: 'error',
      entries: gateEntries,
    });
    return NextResponse.json(
      { error: 'We couldn’t check your submission just now. Please try again in a moment.' },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown): void => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      // First-content markers. `firstStage` is when the progress pills first
      // move; `firstText` is when the first non-placeholder content reaches the
      // client. Until Phase 5A surfaces the tradition mid-stream, firstText is
      // the true "first meaningful thing the user sees".
      let firstStageAtMs: number | null = null;
      let firstTextAtMs: number | null = null;
      // Accumulated outside the try so a failed run still reports the stages it
      // did complete — a slow run that errors is exactly the case worth seeing.
      let collectedEntries: CostEntry[] = [...gateEntries, ...revisionEntries];

      try {
        // Revision awareness (CHANGE 3) already resolved above, concurrently
        // with moderation. Unchanged resubmission → return the stored reading
        // verbatim (no model call, no drift). A genuine revision → a fresh
        // reading that names it. Any storage problem degrades to an ordinary
        // fresh reading (see resolveRevision's own fail-open contract).
        if (decision.kind === 'unchanged') {
          send({ type: 'done', ...decision.reading, revision: { status: 'unchanged', readAt: decision.readAt } });
          const now = Date.now();
          await logSubmissionTelemetry({
            runId,
            wordCount: submittedWordCount,
            mode,
            submissionType: cleanSubmissionType,
            traditionValue: null,
            traditionSource,
            totalWallClockMs: now - runStartedAtMs,
            // The stored reading renders immediately on arrival, so first
            // visible content and completion are the same instant here.
            timeToFirstVisibleContentMs: now - runStartedAtMs,
            timeToFirstStageMs: null,
            outcome: 'unchanged',
            entries: collectedEntries,
          });
          return;
        }
        const revisionNote = decision.kind === 'revised' ? decision.note : undefined;
        const status =
          decision.kind === 'revised' ? 'revised' :
          decision.kind === 'refreshed' ? 'refreshed' : 'new';

        const result = await runAnalysisPipeline(
          {
            mode: mode as AnalysisMode,
            text: clean,
            genre: typeof genre === 'string' ? genre : undefined,
            intent: typeof intent === 'string' ? intent : undefined,
            bible: typeof bible === 'string' ? bible : undefined,
            skipBible: skipBible === true,
            submissionType: cleanSubmissionType,
            // Word-limit enforcement happens BEFORE any API call inside the
            // pipeline (computeCoverage runs before Brain 1). Law upheld.
            wordLimit: FREE_WORD_LIMIT,
            revisionNote,
          },
          {
            onStage: (stage, title) => {
              if (firstStageAtMs === null) firstStageAtMs = Date.now();
              send({ type: 'stage', stage, title });
            },
            // 5A — sent the instant Brain 1 resolves, well before the analyst's
            // first token. Only the fields the final `done` payload already
            // exposes to the client (nothing new leaves the server).
            onDiagnostic: (diagnostic) => {
              send({
                type: 'diagnostic',
                tradition: diagnostic.tradition,
                register: diagnostic.register,
                title: diagnostic.title,
              });
            },
            onAnalystText: (delta) => {
              if (firstTextAtMs === null) firstTextAtMs = Date.now();
              send({ type: 'text', delta });
            },
            // 5C — progressive reveal. Fires the instant EACH brain resolves,
            // independent of the others and well before the analyst finishes
            // (measured: 60-150s earlier in the Phase 3 ladder). Same fields
            // the final `done` payload already carries — nothing new exposed.
            onScores: (scores) => send({ type: 'scores', scores }),
            onMarket: (market) => send({ type: 'market', market }),
            onBible: (bible) => send({ type: 'bible', bible }),
            signal: req.signal,
          }
        );

        // Send the coverage signal WITHOUT readText — never echo the user's
        // own submitted text back to the client (§13 banner needs the rest).
        const { truncated, wordsRead, wordsTotal, fractionRead, coverage } =
          result.coverage;
        const payload = {
          report: result.report,
          diagnostic: result.diagnostic,
          coverage: { truncated, wordsRead, wordsTotal, fractionRead, coverage },
          scores: result.scores,
          market: result.market,
          bible: result.bible,
        };
        send({ type: 'done', ...payload, revision: { status } });
        // Wall clock stops when the user has everything, not after the
        // best-effort persistence below — that work is invisible to them.
        const totalWallClockMs = Date.now() - runStartedAtMs;
        collectedEntries = [...collectedEntries, ...result.costEntries];

        // Persist the reading (best-effort) — stores the submitted text for
        // future diffing and the exact payload the client just received.
        const workId =
          decision.kind === 'revised' || decision.kind === 'refreshed' ? decision.workId : newWorkId();
        await storeReading({
          userId,
          workId,
          mode,
          title: result.diagnostic.title,
          sourceText: clean,
          reading: payload,
          submissionType: cleanSubmissionType,
        });

        // Cost log (financial model data collection) — metadata + token counts
        // only, never the text. Best-effort, never blocks the reading.
        // NOTE: deliberately still only `result.costEntries`. submission_costs
        // has one column pair per known brain, so passing the new moderation /
        // resolveRevision entries would generate columns that table does not
        // have and fail the insert — silently losing the cost row. Bringing
        // moderation into cost accounting needs its own migration; flagged as a
        // recommendation, not actioned here.
        await logSubmissionCost({
          submissionId: workId,
          wordCount: result.coverage.wordsRead,
          mode,
          submissionType: cleanSubmissionType,
          entries: result.costEntries,
        });

        await logSubmissionTelemetry({
          runId,
          wordCount: result.coverage.wordsRead,
          mode,
          submissionType: cleanSubmissionType,
          traditionValue: result.diagnostic.tradition || null,
          traditionSource,
          totalWallClockMs,
          timeToFirstVisibleContentMs:
            firstTextAtMs === null ? null : firstTextAtMs - runStartedAtMs,
          timeToFirstStageMs:
            firstStageAtMs === null ? null : firstStageAtMs - runStartedAtMs,
          outcome: 'completed',
          entries: collectedEntries,
        });
      } catch (err) {
        // A client disconnect / Stop surfaces as an AbortError — stay quiet,
        // the pipeline has already been aborted via req.signal.
        if ((err as Error)?.name !== 'AbortError') {
          send({ type: 'error', message: (err as Error)?.message ?? 'Analysis failed.' });
        }
        await logSubmissionTelemetry({
          runId,
          wordCount: submittedWordCount,
          mode,
          submissionType: cleanSubmissionType,
          traditionValue: null,
          traditionSource,
          totalWallClockMs: Date.now() - runStartedAtMs,
          timeToFirstVisibleContentMs:
            firstTextAtMs === null ? null : firstTextAtMs - runStartedAtMs,
          timeToFirstStageMs:
            firstStageAtMs === null ? null : firstStageAtMs - runStartedAtMs,
          outcome: 'error',
          entries: collectedEntries,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no', // disable proxy buffering so deltas flush live
    },
  });
}
