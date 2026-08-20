import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

import {
  createWriterLock,
  deleteFact,
  listLedger,
  lockFact,
  unlockFact,
  type LockKind,
} from '../../../../lib/continuity';
import { listChapters } from '../../../../lib/manuscripts';
import { logSecurityEvent } from '../../../../lib/security-log';

/**
 * The ledger for one manuscript (§6b) and the lock actions on it (§5.7).
 *
 *   GET    — the accumulated facts, grouped by entity
 *   POST   — add a writer-authored lock directly
 *   PATCH  — promote an existing fact to a lock, or release one
 *   DELETE — soft-delete a ledger row
 *
 * Ownership is enforced in the data layer on every call, not here: the
 * service-role client bypasses RLS, so a check in the route alone would be one
 * forgotten import away from a cross-user leak. The route's job is auth,
 * validation and status codes.
 *
 * No flagging: nothing in this route compares facts or reports contradictions.
 * That is phase 4 (§10).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOCK_KINDS: ReadonlySet<string> = new Set<LockKind>(['rule', 'state']);
const CATEGORIES: ReadonlySet<string> = new Set([
  'name',
  'physical',
  'age_date',
  'relationship',
]);

type Params = { params: { manuscriptId: string } };

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function requireUser(route: string): Promise<string | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    logSecurityEvent('auth_denied', { route });
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  return userId;
}

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  const user = await requireUser('GET /api/ledger/[manuscriptId]');
  if (typeof user !== 'string') return user;

  // Chapters come back alongside the facts so the view can show what is
  // grouped into this manuscript, not just what was extracted from it — the
  // correction surface for a wrong grouping (§2).
  const [entities, chapters] = await Promise.all([
    listLedger(user, params.manuscriptId),
    listChapters(user, params.manuscriptId),
  ]);
  return NextResponse.json({ entities, chapters });
}

export async function POST(req: NextRequest, { params }: Params): Promise<Response> {
  const user = await requireUser('POST /api/ledger/[manuscriptId]');
  if (typeof user !== 'string') return user;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const { entity, category, attribute, value, lockKind, lockFromSequence } = body;
  if (typeof entity !== 'string' || typeof attribute !== 'string' || typeof value !== 'string') {
    return badRequest('entity, attribute and value are required.');
  }
  if (typeof category !== 'string' || !CATEGORIES.has(category)) {
    return badRequest('category must be one of: name, physical, age_date, relationship.');
  }
  if (typeof lockKind !== 'string' || !LOCK_KINDS.has(lockKind)) {
    return badRequest('lockKind must be "rule" or "state".');
  }
  // §5.7 — a state lock holds "from a point onward" and is meaningless without
  // that point. Rejected here with a clear message rather than surfacing the
  // database check constraint as a 500.
  const seq = typeof lockFromSequence === 'number' ? lockFromSequence : null;
  if (lockKind === 'state' && seq === null) {
    return badRequest('A state lock needs lockFromSequence — the chapter it holds from.');
  }

  const factId = await createWriterLock(user, params.manuscriptId, {
    entity,
    category,
    attribute,
    value,
    lockKind: lockKind as LockKind,
    lockFromSequence: seq,
  });
  // null covers both "not your manuscript" and "storage unavailable". They are
  // deliberately not distinguished to the client: confirming that a manuscript
  // id exists but belongs to someone else is itself a small leak.
  if (!factId) return NextResponse.json({ error: "I couldn't lock that." }, { status: 400 });
  return NextResponse.json({ factId }, { status: 201 });
}

export async function PATCH(req: NextRequest, _ctx: Params): Promise<Response> {
  const user = await requireUser('PATCH /api/ledger/[manuscriptId]');
  if (typeof user !== 'string') return user;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const { factId, action, lockKind, lockFromSequence } = body;
  if (typeof factId !== 'string' || !factId) return badRequest('factId is required.');

  if (action === 'unlock') {
    const done = await unlockFact(user, factId);
    if (!done) return NextResponse.json({ error: "I couldn't unlock that." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'lock') {
    if (typeof lockKind !== 'string' || !LOCK_KINDS.has(lockKind)) {
      return badRequest('lockKind must be "rule" or "state".');
    }
    const seq = typeof lockFromSequence === 'number' ? lockFromSequence : null;
    if (lockKind === 'state' && seq === null) {
      return badRequest('A state lock needs lockFromSequence — the chapter it holds from.');
    }
    const done = await lockFact(user, factId, lockKind as LockKind, seq);
    if (!done) return NextResponse.json({ error: "I couldn't lock that." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return badRequest('action must be "lock" or "unlock".');
}

export async function DELETE(req: NextRequest, _ctx: Params): Promise<Response> {
  const user = await requireUser('DELETE /api/ledger/[manuscriptId]');
  if (typeof user !== 'string') return user;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest('Invalid JSON body.');
  }

  const { factId } = body;
  if (typeof factId !== 'string' || !factId) return badRequest('factId is required.');

  const done = await deleteFact(user, factId);
  if (!done) return NextResponse.json({ error: "I couldn't delete that." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
