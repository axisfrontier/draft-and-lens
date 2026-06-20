import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { moderateSubmission } from '../../../ai/moderation';
import { FREE_WORD_LIMIT, runAnalysisPipeline } from '../../../ai/orchestrator';
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
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  // Require a signed-in user — readings are stored per writer (CHANGE 3).
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to analyse your work.' }, { status: 401 });
  }

  const { text, mode, genre, intent, bible, skipBible } = body;

  // mode required + validated — the server never infers the submission type (§15).
  if (typeof mode !== 'string' || !MODES.has(mode)) {
    return badRequest('Submission type required: "script", "story", "play", or "treatment".');
  }

  const clean = sanitise(typeof text === 'string' ? text : '');
  if (!clean) return badRequest('No text submitted.');

  // ── Moderation gate (CHANGE 2) — runs BEFORE any storage or pipeline call.
  // Blocked content is never persisted or processed; only a minimal, non-content
  // event is logged. Tuned for literature: serious dark fiction passes.
  const verdict = await moderateSubmission(clean);
  if (verdict.status === 'block') {
    // Minimal log — timestamp + category only, NEVER the submitted text.
    console.warn(`[moderation] blocked submission · ${new Date().toISOString()} · ${verdict.category}`);
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

      try {
        const result = await runAnalysisPipeline(
          {
            mode: mode as AnalysisMode,
            text: clean,
            genre: typeof genre === 'string' ? genre : undefined,
            intent: typeof intent === 'string' ? intent : undefined,
            bible: typeof bible === 'string' ? bible : undefined,
            skipBible: skipBible === true,
            // Word-limit enforcement happens BEFORE any API call inside the
            // pipeline (computeCoverage runs before Brain 1). Law upheld.
            wordLimit: FREE_WORD_LIMIT,
          },
          {
            onStage: (stage, title) => send({ type: 'stage', stage, title }),
            onAnalystText: (delta) => send({ type: 'text', delta }),
            signal: req.signal,
          }
        );

        // Send the coverage signal WITHOUT readText — never echo the user's
        // own submitted text back to the client (§13 banner needs the rest).
        const { truncated, wordsRead, wordsTotal, fractionRead, coverage } =
          result.coverage;
        send({
          type: 'done',
          report: result.report,
          diagnostic: result.diagnostic,
          coverage: { truncated, wordsRead, wordsTotal, fractionRead, coverage },
          scores: result.scores,
          market: result.market,
          bible: result.bible,
        });
      } catch (err) {
        // A client disconnect / Stop surfaces as an AbortError — stay quiet,
        // the pipeline has already been aborted via req.signal.
        if ((err as Error)?.name !== 'AbortError') {
          send({ type: 'error', message: (err as Error)?.message ?? 'Analysis failed.' });
        }
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
