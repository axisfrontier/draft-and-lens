import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { logSecurityEvent } from '../../../../lib/security-log';
import { dismissPattern, isTendency } from '../../../../lib/writer-patterns';

/**
 * POST /api/patterns/dismiss — the writer says a named pattern is not true of
 * them.
 *
 * Its own route rather than a verb on the ledger, because a pattern is not a
 * manuscript's property: it spans a writer's whole body of work, and the
 * ledger routes are all scoped to one book.
 *
 * Permanent, per §5.5's idiom for continuity flags. The row is updated rather
 * than deleted — a deleted row would simply be recreated by the next reading
 * that found the same tendency, and the writer would be told the same thing
 * again by a product whose claim is that it notices.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/patterns/dismiss' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isTendency(body.tendency)) {
    return NextResponse.json({ error: 'tendency is required.' }, { status: 400 });
  }

  const done = await dismissPattern(userId, body.tendency);
  if (!done) {
    return NextResponse.json({ error: "I couldn't put that one aside." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
