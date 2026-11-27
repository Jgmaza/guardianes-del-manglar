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
 * True when SUPABASE_SERVICE_ROLE_KEY is present (preferred for server writes).
 */
export function isSupabaseServiceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NEXT_PUBLIC_ENABLE_SUPABASE === 'false') {
    return false;
  }
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  return isSupabaseConfigured(env) && serviceKey.length > 0;
}

/**
 * Reports API may persist when Supabase public config is on.
 * Prefers service role; falls back to anon if tables have no RLS (hackathon).
 * Force memory with REPORTS_PERSISTENCE=memory.
 */
export function isReportsPersistenceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.REPORTS_PERSISTENCE === 'memory') {
    return false;
  }
  if (env.NEXT_PUBLIC_ENABLE_SUPABASE === 'false') {
    return false;
  }
  return isSupabaseConfigured(env);
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
