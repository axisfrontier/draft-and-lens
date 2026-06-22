import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { listWorks } from '../../../lib/readings';

/**
 * GET /api/works — the signed-in writer's saved works (CHANGE 4, "view what's
 * stored"). Lists only that user's own rows; soft-deleted works are excluded.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }
  const works = await listWorks(userId);
  return NextResponse.json({ works });
}
