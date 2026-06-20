import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Clerk auth middleware (Phase 3a). Leaves all routes public by default —
 * route-level protection is enforced where needed (the analyse API requires a
 * signed-in user so readings can be stored per writer, CHANGE 3).
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
