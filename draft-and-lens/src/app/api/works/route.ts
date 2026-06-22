import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { listWorks, purgeExpiredDeletions } from '../../../lib/readings';
import { logSecurityEvent } from '../../../lib/security-log';

/**
 * GET /api/works — the signed-in writer's saved works (CHANGE 4, "view what's
 * stored"). Lists only that user's own rows; soft-deleted works are excluded.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'GET /api/works' });
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }
  // Retention: purge this user's soft-deletes past the grace window on access.
  await purgeExpiredDeletions(userId);
  const works = await listWorks(userId);
  return NextResponse.json({ works });
}
