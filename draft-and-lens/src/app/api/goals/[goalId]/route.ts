import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { logSecurityEvent } from '../../../../lib/security-log';
import { dismissGoal, normaliseGoal, updateGoal } from '../../../../lib/writer-goals';

/**
 * Per-goal actions (Gap B). Always scoped to the requester's own rows.
 *   PATCH { goal }  → reword it
 *   DELETE          → set it aside
 *
 * SET ASIDE, NOT DISMISSED, everywhere the writer can see it. A pattern is
 * dismissed because it was wrong about them; a goal is set aside because they
 * have moved on from it — or because they got there. The row is kept either
 * way, so nothing re-suggests it and the record of what they were working
 * toward survives.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { goalId: string } }
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: '/api/goals/[goalId]' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { goal?: unknown };
  const goal = normaliseGoal(body.goal);
  if (!goal) return NextResponse.json({ error: 'goal is required.' }, { status: 400 });

  const ok = await updateGoal(userId, params.goalId, goal);
  if (!ok) {
    return NextResponse.json(
      { error: "I couldn't change that one. It still says what it said." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { goalId: string } }
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: '/api/goals/[goalId]' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const ok = await dismissGoal(userId, params.goalId);
  if (!ok) {
    return NextResponse.json(
      { error: "I couldn't put that one aside. I still have it." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
