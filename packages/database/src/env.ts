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
