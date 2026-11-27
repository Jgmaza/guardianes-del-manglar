import type {
  Evidence,
  EvidenceVerification,
  GeoPoint,
  ReportLocation,
} from '@guardianes/contracts';
import { compareCoordinates } from './coordinates';
import { newId } from './ids';

export function verifyFileIntegrity(evidence: Evidence): EvidenceVerification {
  const hasHash = /^[a-f0-9]{64}$/i.test(evidence.sha256);
  return {
    id: newId(),
    evidenceId: evidence.id,
    reportId: evidence.reportId,
    kind: 'file_integrity',
    result: hasHash ? 'pass' : 'fail',
    summary: hasHash
      ? 'SHA-256 recorded for the stored bytes (integrity of the object). This does not prove origin authenticity.'
      : 'SHA-256 missing or malformed; file integrity check failed.',
    details: { sha256: evidence.sha256, byteLength: evidence.byteLength },
    createdAt: new Date().toISOString(),
  };
}

export function verifyExifGpsAgainstReport(
  evidence: Evidence,
  reportLocation: ReportLocation,
  toleranceMeters = 250,
): EvidenceVerification {
  const gps = evidence.exif.gps;
  if (!evidence.exif.rawPresent || !gps) {
    return {
      id: newId(),
      evidenceId: evidence.id,
      reportId: evidence.reportId,
      kind: 'exif_gps_vs_report_location',
      result: 'not_applicable',
      summary:
        'No EXIF GPS available (common when messengers strip metadata). Cannot compare capture GPS to report location.',
      details: { exifRawPresent: evidence.exif.rawPresent },
      createdAt: new Date().toISOString(),
    };
  }

  const comparison = compareCoordinates(gps, reportLocation, toleranceMeters);
  return {
    id: newId(),
    evidenceId: evidence.id,
    reportId: evidence.reportId,
    kind: 'exif_gps_vs_report_location',
    result: comparison.withinTolerance ? 'pass' : 'fail',
    summary: comparison.withinTolerance
      ? 'EXIF GPS is within tolerance of the reported location. This is a consistency signal, not proof the photo was taken there.'
      : 'EXIF GPS differs from the reported location beyond tolerance. Requires human review; not automatic fraud proof.',
    details: { ...comparison, exifGps: gps, reportLocation },
    createdAt: new Date().toISOString(),
  };
}

export function verifySharedLocationAgainstReport(
  sharedLocation: GeoPoint | undefined,
  evidence: Evidence,
  reportLocation: ReportLocation,
  toleranceMeters = 250,
): EvidenceVerification {
  if (!sharedLocation) {
    return {
      id: newId(),
      evidenceId: evidence.id,
      reportId: evidence.reportId,
      kind: 'shared_location_vs_report_location',
      result: 'not_applicable',
      summary: 'No shared channel location accompanied this media.',
      details: {},
      createdAt: new Date().toISOString(),
    };
  }

  const comparison = compareCoordinates(sharedLocation, reportLocation, toleranceMeters);
  return {
    id: newId(),
    evidenceId: evidence.id,
    reportId: evidence.reportId,
    kind: 'shared_location_vs_report_location',
    result: comparison.withinTolerance ? 'pass' : 'inconclusive',
    summary: comparison.withinTolerance
      ? 'Shared location is near the report point. Shared chat location is not the same as EXIF capture GPS.'
      : 'Shared location diverges from report point; treat as inconclusive pending institutional review.',
    details: { ...comparison, sharedLocation, reportLocation },
    createdAt: new Date().toISOString(),
  };
}

export function buildEvidenceVerifications(options: {
  evidence: Evidence;
  reportLocation: ReportLocation;
  toleranceMeters?: number;
}): EvidenceVerification[] {
  const tolerance = options.toleranceMeters ?? 250;
  return [
    verifyFileIntegrity(options.evidence),
    verifyExifGpsAgainstReport(options.evidence, options.reportLocation, tolerance),
    verifySharedLocationAgainstReport(
      options.evidence.sharedLocation,
      options.evidence,
      options.reportLocation,
      tolerance,
    ),
  ];
}
