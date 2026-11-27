import { describe, expect, it } from 'vitest';
import { getFoundationSnapshot } from './foundation';

describe('foundation snapshot', () => {
  it('returns app defaults without requiring Supabase', () => {
    const snapshot = getFoundationSnapshot();
    expect(snapshot.appName.length).toBeGreaterThan(0);
    expect(snapshot.sampleTrackingCode.startsWith('GDM-')).toBe(true);
    expect(typeof snapshot.supabaseReady).toBe('boolean');
  });
});
