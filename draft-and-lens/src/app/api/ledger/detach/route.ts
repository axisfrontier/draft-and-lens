import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { detachWork } from '../../../../lib/manuscripts';
import { logSecurityEvent } from '../../../../lib/security-log';

/**
 * POST /api/ledger/detach — remove a chapter from its manuscript.
 *
 * The correction path for a wrong grouping, reachable from two places by
 * design: the undo on the report line straight after an auto-group, and the
 * chapter list in the ledger view later. §2 makes silent wrong grouping the
 * failure that poisons every subsequent flag, so reversing it must not depend
 * on the writer catching it in the moment.
 *
 * Detaches by work, not by reading — see detachWork.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/ledger/detach' });
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const workId = typeof body.workId === 'string' ? body.workId : '';
  if (!workId) return NextResponse.json({ error: 'workId is required.' }, { status: 400 });

  const done = await detachWork(userId, workId);
  if (!done) return NextResponse.json({ error: 'Could not detach.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
