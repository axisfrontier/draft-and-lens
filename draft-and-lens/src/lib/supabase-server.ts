import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the SERVICE_ROLE key (CHANGE 3 / data layer).
 *
 * The browser never talks to Supabase directly — all reading storage goes through
 * the Next.js server, which checks the Clerk-authenticated user and only ever
 * touches that user's own rows. RLS is enabled on the table as defence-in-depth
 * (the anon role can read nothing); access control is enforced here in code.
 * NEVER import this from client code — `server-only` makes that a build error.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

/** True only when both the URL and the service-role key are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

export function getServiceClient(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error('Supabase is not configured (missing URL or service-role key).');
  }
  if (!client) {
    client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
