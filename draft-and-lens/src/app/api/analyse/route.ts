import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { recordStageTiming, withCostTracking, type CostEntry } from '../../../ai/cost-tracker';
import { runContinuityExtractor } from '../../../ai/brains/continuity-extractor';
import { runDetectionPass } from '../../../ai/detection-pass';
import { moderateSubmission } from '../../../ai/moderation';
import { FREE_WORD_LIMIT, runAnalysisPipeline } from '../../../ai/orchestrator';
import { DIFFERENTIATOR_COPY, qualifiesForDifferentiator } from '../../../lib/differentiator';
import { FULL_READING_MIN_WORDS, TESTER_WORD_CAP, countWords } from '../../../lib/limits';
import { claimMilestone } from '../../../lib/user-milestones';
import { logSubmissionCost } from '../../../lib/cost-log';
import { listKnownEntities, retireFactsForWork, storeFacts } from '../../../lib/continuity';
import { listFlagsForReading } from '../../../lib/continuity-flags';
import { isWorkAttached, resolveAttachment } from '../../../lib/manuscripts';
import {
  getPriorRevisionNotes,
  newWorkId,
  resolveRevision,
  storeReading,
} from '../../../lib/readings';
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
 *   { type: 'continuity', flags }   §6a detection results, after `done`
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
  // Continuity-ledger grouping (§2). Optional: absent for a standalone piece,
  // which stays the default. Ownership is verified before it is used.
  const manuscriptId = typeof body.manuscriptId === 'string' ? body.manuscriptId : null;

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

  // Too small to read as a piece — offer the conversation instead of a report.
  //
  // Defence-in-depth behind the client, exactly like the cap above, and for a
  // sharper reason: what happens without it is not a smaller reading, it is
  // 200 seconds of pipeline ending in a Studios verdict on thirty words. The
  // report's always-include set alone (overview, three quoted strengths,
  // revisions, growth, verdict) cannot be honestly filled from that.
  //
  // `offerFragment` tells the client which door to open. The message is
  // placeholder copy awaiting the Editor voice, like the rest of fragment mode.
  if (submittedWordCount > 0 && submittedWordCount < FULL_READING_MIN_WORDS) {
    return NextResponse.json(
      {
        error:
          "That's shorter than I can give a full reading to — a reading needs enough on the page to have something to be true about. Ask me about it directly instead and I'll tell you what I see.",
        offerFragment: true,
      },
      { status: 422 }
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
        // An unchanged resubmission may still be asking for something new.
        //
        // The cached-return below is correct only when NOTHING about the
        // submission differs. If the writer has picked a manuscript this work
        // is not yet filed in, the text is unchanged but the ledger outcome is
        // not: short-circuiting here silently discarded an explicit choice —
        // the panel said "Yes — part of <book>", the reading came back from
        // cache in seconds, and the book still read "(0 so far)" afterwards,
        // with nothing said to the writer.
        //
        // Falling through runs the full pipeline, which groups, extracts and
        // adjudicates. That is the same trade resolveRevision already makes
        // when a piece is re-read as an excerpt rather than a complete piece —
        // a fresh run is accepted because the stored one answers a different
        // question. Grouping cannot be honoured without extraction, and
        // extraction only runs on the full path.
        const groupingIsUnfiled =
          decision.kind === 'unchanged' &&
          manuscriptId !== null &&
          !(await isWorkAttached(userId, manuscriptId, decision.workId));

        if (decision.kind === 'unchanged' && !groupingIsUnfiled) {
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
        // Mentor addendum, Part B. Fetched only on a genuine revision, and
        // only from stored text — null when there is nothing real to pass, so
        // the prompt never invites a past it was not given. Best-effort: a
        // failure here costs the memory register, never the reading.
        const priorRevisionNotes =
          decision.kind === 'revised'
            ? await getPriorRevisionNotes(userId, decision.workId, null).catch(() => null)
            : null;
        const status =
          decision.kind === 'revised' ? 'revised' :
          decision.kind === 'refreshed' ? 'refreshed' :
          // Reached only via the grouping fall-through above: the text really
          // is unchanged, and saying 'new' about a piece already read would be
          // a plain falsehood to the writer.
          decision.kind === 'unchanged' ? 'unchanged' : 'new';

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
            priorRevisionNotes,
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

        // ── Differentiator method line (handover §6) ──────────────────────
        // AFTER `done` on purpose. The reading is already on screen, so this
        // cannot delay it and cannot fail it — and the line's own argument
        // depends on the writer having just read the memory it refers to.
        //
        // Two gates, and only the first is real:
        //   • memory — a genuine revision with prior notes actually retrieved;
        //   • quality — NOT ENFORCED AND NOT ENFORCEABLE, see lib/differentiator.
        //
        // claimMilestone is the once-ever guarantee and is asked LAST, so a
        // reading that fails the memory gate never burns the one showing this
        // account will ever get. It fails closed, so nothing appears until the
        // user_milestones migration is applied — which is what keeps
        // placeholder copy away from a real writer before Nenad approves it.
        if (
          qualifiesForDifferentiator({
            isGenuineRevision: decision.kind === 'revised',
            hasPriorNotes: priorRevisionNotes !== null,
          }) &&
          (await claimMilestone(userId, 'differentiator_method_line').catch(() => false))
        ) {
          send({ type: 'differentiator', text: DIFFERENTIATOR_COPY });
        }

        // Wall clock stops when the user has everything, not after the
        // best-effort persistence below — that work is invisible to them.
        const totalWallClockMs = Date.now() - runStartedAtMs;
        collectedEntries = [...collectedEntries, ...result.costEntries];

        // Persist the reading (best-effort) — stores the submitted text for
        // future diffing and the exact payload the client just received.
        // 'unchanged' belongs here too, via the grouping fall-through. Minting
        // a fresh id for text already filed under a work would duplicate the
        // piece and file it as an ADDITIONAL chapter — the same bug the
        // work_id keying in resolveAttachment exists to prevent.
        const workId =
          decision.kind === 'revised' ||
          decision.kind === 'refreshed' ||
          decision.kind === 'unchanged'
            ? decision.workId
            : newWorkId();
        // Resolve grouping before the insert so the row is never written
        // ungrouped and then updated. Returns null when the manuscript is not
        // this writer's, which is also how a forged id is refused — best-effort
        // like everything else here: a grouping failure must never cost the
        // writer the reading they already have on screen.
        const attachment = manuscriptId
          ? await resolveAttachment(userId, manuscriptId, mode, workId)
          : null;

        const readingId = await storeReading({
          userId,
          workId,
          mode,
          title: result.diagnostic.title,
          sourceText: clean,
          reading: payload,
          submissionType: cleanSubmissionType,
          manuscriptId: attachment?.manuscriptId ?? null,
          sequenceIndex: attachment?.sequenceIndex ?? null,
        });

        // Tell the client what was grouped, so a silent auto-group leaves a
        // visible trace it can undo. Sent after `done` deliberately: the
        // reading is already on screen and this must not delay it. A grouping
        // the writer never learns about is the dangerous case — it cannot be
        // caught, and a wrong one goes on to poison every later flag (§2).
        if (attachment) {
          send({
            type: 'grouped',
            workId,
            manuscriptId: attachment.manuscriptId,
            sequenceIndex: attachment.sequenceIndex,
          });

          // ── Continuity extraction (§9 Stage 1) ───────────────────────────
          // Gated on BOTH conditions, and neither is a preference:
          //   • complete pieces only (ruling 4) — an excerpt is mid-revision
          //     and not canonical, so holding the rest of the book to it is
          //     exactly backwards;
          //   • grouped only — continuity_facts.manuscript_id is NOT NULL, so
          //     a standalone piece has nowhere to put facts.
          // Runs after the reading has been delivered, so its latency and any
          // failure are invisible to the writer. A chapter that extracts
          // nothing simply contributes nothing.
          if (cleanSubmissionType === 'complete') {
            try {
              // Wrapped in withCostTracking so the extractor's tokens and
              // latency actually land in telemetry. Without it this call runs
              // outside any AsyncLocalStorage scope, recordBrainUsage finds no
              // store and silently drops the entry — the same way a full LLM
              // call gating every submission once stayed invisible in the
              // numbers (see the moderation note above). The pipeline's own
              // scope has already closed by this point, so extraction needs
              // its own rather than inheriting one.
              const { result: extracted, entries: extractionEntries } = await withCostTracking(
                async () => {
                  const known = await listKnownEntities(userId, attachment.manuscriptId);
                  return runContinuityExtractor({
                    text: clean,
                    chapterLabel: result.diagnostic.title || `Chapter ${attachment.sequenceIndex}`,
                    knownEntities: known,
                  });
                }
              );
              // Merge into the run's entries so extraction appears in the
              // per-stage telemetry breakdown alongside every other brain.
              collectedEntries = [...collectedEntries, ...extractionEntries];
              // Retire the previous draft's facts BEFORE storing the new ones,
              // so the ledger never briefly holds both. A revision replaces
              // what that chapter established; it does not add to it.
              await retireFactsForWork({
                userId,
                manuscriptId: attachment.manuscriptId,
                workId,
                keepReadingId: readingId,
              });
              const stored = await storeFacts({
                userId,
                manuscriptId: attachment.manuscriptId,
                readingId,
                sequenceIndex: attachment.sequenceIndex,
                facts: extracted.facts,
              });
              // Deliberately not logged through logSecurityEvent: extraction
              // counts are telemetry, not a security event, and widening that
              // typed union to fit would blur what a security event means.
              // The rejection pattern IS worth capturing — it is the earliest
              // signal the extractor has drifted — but it needs a telemetry
              // channel shaped for it rather than a misused one. Flagged in
              // SESSION_LOG rather than bodged in here.
              void stored;

              // ── Detection (§9 Stage 3) ─────────────────────────────────
              // Runs only when this submission actually contributed facts:
              // with nothing new in the ledger, every pair was adjudicated on
              // an earlier pass and this would be a round trip to learn that.
              //
              // Its own withCostTracking scope for the same reason extraction
              // has one — the pipeline's scope has long since closed, and
              // without a store recordBrainUsage silently drops every entry.
              //
              // Deliberately last in the block: detection reads the facts
              // extraction just wrote, and the reading has already been
              // delivered, so its latency is invisible and its failure costs
              // the writer nothing.
              if (stored > 0) {
                const { result: detected, entries: detectionEntries } = await withCostTracking(
                  async () =>
                    runDetectionPass({
                      userId,
                      manuscriptId: attachment.manuscriptId,
                      readingId,
                      diagnostic: result.diagnostic,
                      currentText: clean,
                    })
                );
                collectedEntries = [...collectedEntries, ...detectionEntries];
                void detected;

                // Read the flags BACK from the store rather than sending the
                // in-memory results. The ruling is that §6a renders from
                // stored flags on every view; sourcing the live view from
                // memory would give it a second, privileged path that no
                // later view shares, and the first divergence between them
                // would show up as a section that looks different on reload
                // than it did when written.
                if (readingId) {
                  const flags = await listFlagsForReading(userId, readingId);
                  if (flags.length > 0) send({ type: 'continuity', flags });
                }
              }
            } catch {
              /* extraction is best-effort; the reading is already delivered */
            }
          }
        }

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
