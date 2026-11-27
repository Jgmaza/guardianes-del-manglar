/**
 * Shared domain contracts.
 */

export type {
  Alert,
  AlertStatus,
  Evidence,
  EvidenceExif,
  EvidenceMediaKind,
  EvidenceVerification,
  EvidenceVerificationKind,
  EvidenceVerificationResult,
  GeoPoint,
  PublicReportTrackingView,
  Report,
  ReportCategory,
  ReportCategorySource,
  ReportChannel,
  ReportEvent,
  ReportEventType,
  ReportLocation,
  ReportStatus,
  ReportVerification,
  ReportVerificationKind,
  ReporterReference,
  SanitizedReportExport,
} from './reports';

export interface ReportSummary {
  id: string;
  trackingCode: string;
  channel: import('./reports').ReportChannel;
  status: import('./reports').ReportStatus;
  location: import('./reports').GeoPoint;
  createdAt: string;
}

export interface HealthStatus {
  service: string;
  ok: boolean;
  checkedAt: string;
}
