import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import { reconcileFlag } from '../../../../lib/continuity-flags';
import { logSecurityEvent } from '../../../../lib/security-log';

/**
 * POST /api/ledger/reconcile — the writer marks a continuity flag intentional.
 *
 * §5.5, and the item that has been blocking phase 3 since 2026-08-18. The
 * ledger has been able to read `reconciled_at` in three places since phase 2
 * and has never had anything that writes it: gatePair honours it, the state
 * lock check honours it, and no interaction existed to set it. This is that
 * interaction.
 *
 * A sibling action route like /detach rather than a verb on the manuscript
 * route, because it is keyed on a FLAG, not a fact or a manuscript, and
 * bending the existing PATCH — which requires a factId before it looks at
 * anything else — would mean restructuring its validation rather than adding
 * to it.
 *
 * Ownership is checked inside reconcileFlag against the flag's own user_id, so
 * a flag id belonging to someone else is indistinguishable from one that does
 * not exist. Same posture as every other route here.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route: 'POST /api/ledger/reconcile' });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const flagId = typeof body.flagId === 'string' ? body.flagId : '';
  if (!flagId) return NextResponse.json({ error: 'flagId is required.' }, { status: 400 });

  // Optional. §5.5 calls dismissal "permanent and informative" — the reason is
  // the informative half, and it is stored on the fact for the writer's own
  // later reading of their ledger, never shown back to the model.
  const reason = typeof body.reason === 'string' ? body.reason : null;

  const done = await reconcileFlag(userId, flagId, reason);
  if (!done) {
    return NextResponse.json(
      { error: "I couldn't mark that one as intentional." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
