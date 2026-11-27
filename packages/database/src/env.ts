/**
 * Reads Supabase config from environment.
 * Prefer server-only names (SUPABASE_URL / SUPABASE_ANON_KEY) so Next.js cannot
 * bake empty NEXT_PUBLIC_* literals into the production server bundle.
 * Never exports the service role key to client bundles.
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

function readEnv(env: NodeJS.ProcessEnv, key: string): string {
  // Dynamic access avoids Next.js build-time inlining of NEXT_PUBLIC_* empties.
  return String(env[key] ?? '').trim();
}

export function getSupabasePublicConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabasePublicConfig | null {
  const url =
    readEnv(env, 'SUPABASE_URL') || readEnv(env, 'NEXT_PUBLIC_SUPABASE_URL');
  const anonKey =
    readEnv(env, 'SUPABASE_ANON_KEY') || readEnv(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return getSupabasePublicConfig(env) !== null;
}

/**
 * True when SUPABASE_SERVICE_ROLE_KEY is present (preferred for server writes).
 */
export function isSupabaseServiceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const serviceKey = readEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  return isSupabaseConfigured(env) && serviceKey.length > 0;
}

/**
 * Reports API persists to Supabase when URL + anon (or service) keys exist.
 * Force memory only with REPORTS_PERSISTENCE=memory.
 * NEXT_PUBLIC_ENABLE_SUPABASE=false is ignored for reports (Vercel builds often
 * baked that flag empty/false and left production stuck on an empty memory store).
 */
export function isReportsPersistenceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (readEnv(env, 'REPORTS_PERSISTENCE') === 'memory') {
    return false;
  }
  return isSupabaseConfigured(env);
}

/**
 * Geo RPC (point-in-polygon) needs the service role for PostGIS RPC.
 */
export function isSupabaseGeoConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isSupabaseServiceConfigured(env);
}
