import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { restoreWork, softDeleteWork } from '../../../../lib/readings';

/**
 * Per-work actions for the signed-in writer (CHANGE 4).
 *   DELETE → soft-delete (recoverable within the grace window)
 *   PATCH { action: 'restore' } → undo the soft-delete
 * Always scoped to the requester's own rows.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { workId: string } }
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const ok = await softDeleteWork(userId, params.workId);
  if (!ok) return NextResponse.json({ error: 'Could not delete that work.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { workId: string } }
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === 'restore') {
    const ok = await restoreWork(userId, params.workId);
    if (!ok) return NextResponse.json({ error: 'Could not restore that work.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
