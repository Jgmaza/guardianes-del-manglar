/**
 * Reads Supabase public config from environment.
 * Never reads or exports the service role key to client bundles.
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export function getSupabasePublicConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NEXT_PUBLIC_ENABLE_SUPABASE === 'false') {
    return false;
  }
  return getSupabasePublicConfig(env) !== null;
}

/**
 * Server-side persistence gate: public Supabase config + service role key.
 * When false, report API stays in-memory (demo/foundation mode).
 */
export function isSupabaseServiceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NEXT_PUBLIC_ENABLE_SUPABASE === 'false') {
    return false;
  }
  if (env.REPORTS_PERSISTENCE === 'memory') {
    return false;
  }
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  return isSupabaseConfigured(env) && serviceKey.length > 0;
}

/**
 * Geo RPC (point-in-polygon) can run even when report persistence is memory-only,
 * as long as service role credentials are present.
 */
export function isSupabaseGeoConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NEXT_PUBLIC_ENABLE_SUPABASE === 'false') {
    return false;
  }
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  return isSupabaseConfigured(env) && serviceKey.length > 0;
}
