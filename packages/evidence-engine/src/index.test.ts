import { describe, expect, it } from 'vitest';
import { createEvidenceFromBytes } from './attach';
import { compareCoordinates, distanceMeters } from './coordinates';
import { sha256Hex } from './hash';
import {
  isAllowedEvidenceMimeType,
  isWithinEvidenceSizeLimit,
  MAX_EVIDENCE_BYTES,
} from './media';
import {
  buildEvidenceVerifications,
  verifyFileIntegrity,
} from './verify';

describe('@guardianes/evidence-engine', () => {
  it('accepts image/video mime types and size bounds', () => {
    expect(isAllowedEvidenceMimeType('image/jpeg')).toBe(true);
    expect(isAllowedEvidenceMimeType('video/mp4')).toBe(true);
    expect(isAllowedEvidenceMimeType('application/pdf')).toBe(false);
    expect(isWithinEvidenceSizeLimit(1024)).toBe(true);
    expect(isWithinEvidenceSizeLimit(MAX_EVIDENCE_BYTES + 1)).toBe(false);
  });

  it('hashes file bytes with sha256', () => {
    const bytes = Buffer.from('guardianes-evidence');
    expect(sha256Hex(bytes)).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256Hex(bytes)).toBe(sha256Hex(bytes));
  });

  it('compares coordinates with tolerance', () => {
    const a = { longitude: -74.8, latitude: 10.9 };
    const b = { longitude: -74.8005, latitude: 10.9003 };
    expect(distanceMeters(a, b)).toBeGreaterThan(0);
    expect(compareCoordinates(a, b, 200).withinTolerance).toBe(true);
    expect(
      compareCoordinates(a, { longitude: -75.2, latitude: 10.9 }, 200).withinTolerance,
    ).toBe(false);
  });

  it('creates evidence and integrity verification without claiming origin authenticity', async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const evidence = await createEvidenceFromBytes({
      reportId: '00000000-0000-4000-8000-000000000001',
      bytes,
      mimeType: 'image/jpeg',
    });
    expect(evidence.sha256).toHaveLength(64);
    expect(evidence.exif.rawPresent).toBe(false);

    const integrity = verifyFileIntegrity(evidence);
    expect(integrity.result).toBe('pass');
    expect(integrity.summary.toLowerCase()).toContain('does not prove origin');

    const verifications = buildEvidenceVerifications({
      evidence,
      reportLocation: {
        longitude: -74.8,
        latitude: 10.9,
        source: 'device_gps',
      },
    });
    expect(verifications.some((v) => v.kind === 'exif_gps_vs_report_location')).toBe(true);
    expect(
      verifications.find((v) => v.kind === 'exif_gps_vs_report_location')?.result,
    ).toBe('not_applicable');
  });
});
