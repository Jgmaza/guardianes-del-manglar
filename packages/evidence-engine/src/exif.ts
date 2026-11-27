import type { EvidenceExif, GeoPoint } from '@guardianes/contracts';

export type ExifrLike = {
  parse: (
    input: Buffer | Uint8Array,
    options?: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | undefined>;
};

/**
 * Best-effort EXIF extraction.
 * WhatsApp and many messengers strip EXIF — missing data is inconclusive, not a failure of honesty.
 */
export async function extractExifIfPresent(
  bytes: Uint8Array | Buffer,
  exifr?: ExifrLike,
): Promise<EvidenceExif> {
  if (!exifr) {
    return {
      rawPresent: false,
      notes:
        'EXIF parser not configured. Absence of EXIF is common (e.g. WhatsApp) and is not treated as fraud by itself.',
    };
  }

  try {
    const parsed = await exifr.parse(Buffer.from(bytes), {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'latitude', 'longitude'],
    });

    if (!parsed || Object.keys(parsed).length === 0) {
      return {
        rawPresent: false,
        notes:
          'No EXIF payload detected. Messengers often strip metadata; shared chat location is not EXIF GPS.',
      };
    }

    const gps = readGps(parsed);
    const capturedAt = readCaptureDate(parsed);

    return {
      rawPresent: true,
      gps,
      capturedAt,
      notes:
        'EXIF GPS/date, when present, are device metadata claims — not institutional proof of authenticity.',
    };
  } catch {
    return {
      rawPresent: false,
      notes: 'EXIF parse failed; treated as unavailable metadata.',
    };
  }
}

function readGps(parsed: Record<string, unknown>): GeoPoint | undefined {
  const latitude = asFiniteNumber(parsed.latitude);
  const longitude = asFiniteNumber(parsed.longitude);
  if (latitude === undefined || longitude === undefined) return undefined;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined;
  return { latitude, longitude };
}

function readCaptureDate(parsed: Record<string, unknown>): string | undefined {
  const candidates = [parsed.DateTimeOriginal, parsed.CreateDate, parsed.ModifyDate];
  for (const value of candidates) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    if (typeof value === 'string' && value.trim()) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}
