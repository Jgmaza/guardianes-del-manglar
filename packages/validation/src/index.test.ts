import { describe, expect, it } from 'vitest';
import {
  createReportSchema,
  geoPointSchema,
  trackReportSchema,
  trackingCodeSchema,
} from './index';

describe('@guardianes/validation', () => {
  it('accepts a valid WGS84 point', () => {
    expect(geoPointSchema.safeParse({ longitude: -74.8, latitude: 10.9 }).success).toBe(true);
  });

  it('rejects out-of-range coordinates', () => {
    expect(geoPointSchema.safeParse({ longitude: -200, latitude: 10 }).success).toBe(false);
  });

  it('validates create report shape with location source', () => {
    const result = createReportSchema.safeParse({
      channel: 'pwa',
      location: { longitude: -74.8, latitude: 10.9, source: 'device_gps' },
      description: 'Foundation smoke',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unexpected PII keys on create payload via strict object', () => {
    const result = createReportSchema.safeParse({
      channel: 'pwa',
      location: { longitude: -74.8, latitude: 10.9, source: 'map_pin' },
      email: 'no@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('validates tracking credentials shape', () => {
    expect(trackingCodeSchema.safeParse('GDM-ABC12345').success).toBe(true);
    expect(
      trackReportSchema.safeParse({
        trackingCode: 'GDM-ABC12345',
        trackingSecret: 'a'.repeat(24),
      }).success,
    ).toBe(true);
  });
});
