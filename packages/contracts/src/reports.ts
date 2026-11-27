/**
 * Report / evidence domain contracts.
 * Categories are configurable; official CRA catalog is PENDING external supply.
 */

export type ReportChannel = 'pwa' | 'whatsapp';

export type ReportStatus =
  | 'draft'
  | 'queued_offline'
  | 'submitted'
  | 'geo_processed'
  | 'under_review'
  | 'needs_info'
  | 'accepted'
  | 'rejected'
  | 'alerted';

export type GeoPoint = {
  longitude: number;
  latitude: number;
};

export type ReportLocation = GeoPoint & {
  /** GPS accuracy in meters when provided by the client/device */
  accuracyMeters?: number;
  /** How the citizen shared the location (not proof of photo capture place) */
  source: 'device_gps' | 'map_pin' | 'whatsapp_shared_location' | 'unknown';
};

export type ReportCategorySource = 'system_placeholder' | 'local_config' | 'cra_official';

/**
 * Configurable catalog entry.
 * Do NOT treat `system_placeholder` / `local_config` as official CRA taxonomy
 * until `cra_official` entries are supplied by the authority.
 */
export type ReportCategory = {
  id: string;
  code: string;
  label: string;
  description?: string;
  active: boolean;
  source: ReportCategorySource;
  createdAt: string;
};

export type ReporterReference = {
  id: string;
  /** Opaque handle — never expose on citizen dashboards or open exports */
  channelHandleHash?: string;
  optionalContactEncrypted?: string;
  createdAt: string;
  notes?: string;
};

export type Report = {
  id: string;
  trackingCode: string;
  /** Hash only — never store raw tracking secret at rest in domain records */
  trackingSecretHash: string;
  channel: ReportChannel;
  status: ReportStatus;
  categoryId: string | null;
  description: string | null;
  location: ReportLocation;
  observedAt: string;
  receivedAt: string;
  clientReportId: string | null;
  reporterReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceMediaKind = 'photo' | 'video' | 'other';

export type EvidenceExif = {
  capturedAt?: string;
  gps?: GeoPoint;
  rawPresent: boolean;
  /** WhatsApp and other messengers often strip EXIF — absence is expected */
  notes?: string;
};

export type Evidence = {
  id: string;
  reportId: string;
  mediaKind: EvidenceMediaKind;
  mimeType: string;
  byteLength: number;
  sha256: string;
  storageKey: string;
  /** Shared/accompanying location if the channel sent one with the media (not EXIF) */
  sharedLocation?: GeoPoint;
  exif: EvidenceExif;
  receivedAt: string;
  createdAt: string;
};

export type EvidenceVerificationKind =
  | 'file_integrity'
  | 'exif_gps_vs_report_location'
  | 'shared_location_vs_report_location'
  | 'capture_time_consistency';

export type EvidenceVerificationResult = 'pass' | 'fail' | 'inconclusive' | 'not_applicable';

export type EvidenceVerification = {
  id: string;
  evidenceId: string;
  reportId: string;
  kind: EvidenceVerificationKind;
  result: EvidenceVerificationResult;
  /**
   * Human-readable, careful wording. Must not claim cryptographic proof of origin
   * nor that shared coordinates prove where a photo was taken.
   */
  summary: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type ReportVerificationKind =
  | 'automated_consistency'
  | 'institutional_review';

export type ReportVerification = {
  id: string;
  reportId: string;
  kind: ReportVerificationKind;
  result: EvidenceVerificationResult;
  summary: string;
  reviewerRole: 'system' | 'cra_reviewer';
  createdAt: string;
};

export type ReportEventType =
  | 'created'
  | 'category_assigned'
  | 'evidence_added'
  | 'verification_recorded'
  | 'status_changed'
  | 'alert_created'
  | 'tracking_viewed';

export type ReportEvent = {
  id: string;
  reportId: string;
  type: ReportEventType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AlertStatus = 'preliminary' | 'active' | 'dismissed' | 'closed';

/**
 * Preliminary / institutional alert. Creating a report does NOT auto-create an alert.
 * `preliminary` means operational draft for CRA — not a legal authorization.
 */
export type Alert = {
  id: string;
  reportId: string;
  status: AlertStatus;
  title: string;
  rationale: string;
  createdBy: 'system_rule' | 'cra_reviewer';
  createdAt: string;
};

/** Public tracking view — no PII, no secret, no reporter reference */
export type PublicReportTrackingView = {
  trackingCode: string;
  status: ReportStatus;
  categoryCode: string | null;
  categoryLabel: string | null;
  observedAt: string;
  receivedAt: string;
  evidenceCount: number;
  hasPreliminaryAlert: boolean;
  events: Array<{ type: ReportEventType; createdAt: string }>;
};

/** Dashboard/export sanitization excludes reporter + secrets */
export type SanitizedReportExport = {
  id: string;
  trackingCode: string;
  channel: ReportChannel;
  status: ReportStatus;
  categoryCode: string | null;
  description: string | null;
  location: ReportLocation;
  observedAt: string;
  receivedAt: string;
  evidenceCount: number;
};
