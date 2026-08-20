import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { listManuscripts } from '../../../lib/manuscripts';
import { logSecurityEvent } from '../../../lib/security-log';

/**
 * GET /api/ledger — the signed-in writer's manuscripts, for the ledger index.
 *
 * Separate from /api/works by design: a "work" is one text with its revisions,
 * a "manuscript" is the chapter grouping the ledger hangs off (§0.1, §2). They
 * answer different questions and the ledger view lives on its own route
 * (ruling 3), so it gets its own endpoint rather than overloading works.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'GET /api/ledger' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  const manuscripts = await listManuscripts(userId);
  return NextResponse.json({ manuscripts });
}
