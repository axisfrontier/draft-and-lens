import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { deleteAllUserData } from '../../../lib/readings';
import { logSecurityEvent } from '../../../lib/security-log';

/**
 * DELETE /api/account — full account wipe (CHANGE 4, GDPR erasure).
 * Permanently removes ALL of the user's stored rows, then deletes the Clerk
 * account itself. Data is wiped first; the auth account is only removed if that
 * succeeds, so we never orphan a live account with no data or vice-versa.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'DELETE /api/account' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const wiped = await deleteAllUserData(userId);
  if (!wiped) {
    return NextResponse.json(
      { error: 'Something went wrong and nothing was deleted. Your data is exactly as it was.' },
      { status: 500 }
    );
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch {
    return NextResponse.json(
      {
        error:
          'Your stored work was deleted, but the account itself could not be removed. Please get in touch and we’ll finish it.',
      },
      { status: 500 }
    );
  }

  logSecurityEvent('account_deleted', { user: userId });
  return NextResponse.json({ ok: true });
}
