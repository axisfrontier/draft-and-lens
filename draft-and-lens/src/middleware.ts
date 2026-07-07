import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Beta gate — single shared password (BETA_GATE_PASSWORD env var), checked
 * before Clerk. Verified via a SHA-256 cookie set by /api/beta-gate; the
 * gate page itself, its verify endpoint, and Stripe webhooks (server-to-server,
 * no browser cookie) are exempt. If BETA_GATE_PASSWORD is unset, the gate is
 * a no-op — safe for local dev without the env var.
 */
const GATE_EXEMPT_PREFIXES = ['/beta-gate', '/api/beta-gate', '/api/webhooks'];

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Clerk auth middleware (Phase 3a). Leaves all routes public by default —
 * route-level protection is enforced where needed (the analyse API requires a
 * signed-in user so readings can be stored per writer, CHANGE 3).
 */
export default clerkMiddleware(async (_auth, req) => {
  const { pathname } = req.nextUrl;
  if (GATE_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return;

  const gatePassword = process.env.BETA_GATE_PASSWORD;
  if (!gatePassword) return;

  const cookie = req.cookies.get('dl_beta')?.value;
  const expected = await sha256Hex(gatePassword);
  if (cookie === expected) return;

  const url = req.nextUrl.clone();
  url.pathname = '/beta-gate';
  url.search = '';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
