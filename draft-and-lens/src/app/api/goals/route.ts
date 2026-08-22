import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { logSecurityEvent } from '../../../lib/security-log';
import { createGoal, listGoals, normaliseGoal } from '../../../lib/writer-goals';

/**
 * Writer-set goals (Mentor Completeness spec, Gap B).
 *   GET  → every live goal, both scopes, most specific first
 *   POST → record one the writer typed
 *
 * Its own route rather than a verb on the ledger, for the same reason
 * /api/patterns/dismiss is: a standing goal spans a writer's whole body of
 * work, and every ledger route is scoped to one book.
 *
 * There is no inference anywhere in here and there never can be — a goal only
 * exists because a writer typed it.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'GET /api/goals' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  return NextResponse.json({ goals: await listGoals(userId) });
}

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/goals' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const goal = normaliseGoal(body.goal);
  if (!goal) return NextResponse.json({ error: 'goal is required.' }, { status: 400 });
  const manuscriptId = typeof body.manuscriptId === 'string' ? body.manuscriptId : null;

  const created = await createGoal({ userId, manuscriptId, goal });
  if (!created) {
    return NextResponse.json(
      { error: "I couldn't hold on to that one. Try me again." },
      { status: 400 }
    );
  }
  return NextResponse.json({ goal: created });
}
