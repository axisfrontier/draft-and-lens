import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { classifyMatch } from '../../../../lib/manuscript-match';
import { buildCandidates, createManuscript, listManuscripts } from '../../../../lib/manuscripts';
import { logSecurityEvent } from '../../../../lib/security-log';

/**
 * POST /api/ledger/suggest — "does this look like part of something you're
 * already writing?" (§2 option C).
 *
 * Deterministic and local: `classifyMatch` makes no model call, so this is
 * cheap enough to run while the writer is still looking at the upload form.
 * Returns the proposal AND the full manuscript list, so the confirm step can
 * offer "no, this one instead" without a second round trip — ruling 2 asked
 * for a single lightweight step, and two requests to render one line of UI
 * would not be that.
 *
 * Returning null for `suggestion` is the common and correct answer: a first
 * upload, a standalone piece, or anything the matcher cannot vouch for.
 *
 * PUT/PATCH semantics deliberately absent — this endpoint only reads and, on
 * explicit request, creates a manuscript. It never attaches anything; grouping
 * is applied when the reading is stored (see /api/analyse).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/ledger/suggest' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Creating a new manuscript is folded into this endpoint rather than given
  // its own: from the writer's side "start a new book" is one option in the
  // same confirm step, not a separate act.
  if (body.action === 'create') {
    const title = typeof body.title === 'string' ? body.title : null;
    const format = typeof body.format === 'string' ? body.format : null;
    const manuscriptId = await createManuscript(userId, title, format);
    if (!manuscriptId) {
      return NextResponse.json({ error: "I couldn't start that book." }, { status: 400 });
    }
    return NextResponse.json({ manuscriptId }, { status: 201 });
  }

  const text = typeof body.text === 'string' ? body.text : '';
  const mode = typeof body.mode === 'string' ? body.mode : null;
  const [candidates, manuscripts] = await Promise.all([
    buildCandidates(userId),
    listManuscripts(userId),
  ]);

  // `band` decides whether the client asks at all (§2, confidence banding):
  //   auto    — group without prompting
  //   confirm — a match exists but could be coincidence; show the step
  //   none    — nothing to propose
  const classification = text
    ? classifyMatch(text, candidates, mode)
    : { band: 'none' as const, suggestion: null, failedCriteria: [] };

  return NextResponse.json({
    band: classification.band,
    suggestion: classification.suggestion,
    failedCriteria: classification.failedCriteria,
    manuscripts,
  });
}
