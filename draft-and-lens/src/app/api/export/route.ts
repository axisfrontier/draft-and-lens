import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { exportUserData } from '../../../lib/readings';

/**
 * GET /api/export — download everything stored for the signed-in writer
 * (CHANGE 4, GDPR data-portability). Returns a JSON attachment of all their
 * works + readings. Only ever the requester's own rows.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }
  const data = await exportUserData(userId);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="draft-and-lens-export-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
