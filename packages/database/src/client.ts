import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './env';

/**
 * Browser / server public client (anon key only).
 * Returns null when env is not configured — no fake credentials.
 */
export function createSupabaseBrowserClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient | null {
  const config = getSupabasePublicConfig(env);
  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Server-only client using the service role key.
 * Throws if called without a key — never embed this in the browser.
 */
export function createSupabaseServiceClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient {
  const config = getSupabasePublicConfig(env);
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config || !serviceKey) {
    throw new Error(
      'Supabase service client requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return createClient(config.url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
