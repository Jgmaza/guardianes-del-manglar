import { describe, expect, it } from 'vitest';
import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from './env';

describe('@guardianes/database env', () => {
  it('returns null when public env is missing', () => {
    expect(getSupabasePublicConfig({})).toBeNull();
    expect(isSupabaseConfigured({})).toBe(false);
  });

  it('returns config when url and anon key are present', () => {
    const config = getSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-example',
    });
    expect(config).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-example',
    });
  });

  it('respects NEXT_PUBLIC_ENABLE_SUPABASE=false', () => {
    expect(
      isSupabaseConfigured({
        NEXT_PUBLIC_ENABLE_SUPABASE: 'false',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-example',
      }),
    ).toBe(false);
  });

  it('requires service role for persistence', () => {
    expect(
      isSupabaseServiceConfigured({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-example',
      }),
    ).toBe(false);

    expect(
      isSupabaseServiceConfigured({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-example',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      }),
    ).toBe(true);

    expect(
      isSupabaseServiceConfigured({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-example',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role',
        REPORTS_PERSISTENCE: 'memory',
      }),
    ).toBe(false);
  });
});
