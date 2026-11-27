import type {
  PublicReportTrackingView,
  Report,
  ReportCategory,
  ReportEvent,
  SanitizedReportExport,
} from '@guardianes/contracts';

/** Fields forbidden on public create/track/export payloads (citizen-facing). */
const FORBIDDEN_PUBLIC_KEYS = [
  'trackingSecret',
  'trackingSecretHash',
  'reporterReferenceId',
  'optionalContactEncrypted',
  'channelHandleHash',
  'phone',
  'email',
  'nombre',
  'cedula',
] as const;

/**
 * Rejects obvious PII/secret keys on citizen create payloads.
 * `reporterHandle` is allowed as an opaque optional input and is hashed into ReporterReference.
 */
export function assertNoPiiFields(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    const normalized = key.toLowerCase();
    if (
      FORBIDDEN_PUBLIC_KEYS.some((f) => f.toLowerCase() === normalized) ||
      normalized.includes('password') ||
      (normalized.includes('secret') && normalized !== 'trackingsecret')
    ) {
      throw new Error(`PII or secret field is not allowed on this payload: ${key}`);
    }
  }
}

export function toPublicTrackingView(options: {
  report: Report;
  category: ReportCategory | null;
  evidenceCount: number;
  hasPreliminaryAlert: boolean;
  events: ReportEvent[];
}): PublicReportTrackingView {
  return {
    trackingCode: options.report.trackingCode,
    status: options.report.status,
    categoryCode: options.category?.code ?? null,
    categoryLabel: options.category?.label ?? null,
    observedAt: options.report.observedAt,
    receivedAt: options.report.receivedAt,
    evidenceCount: options.evidenceCount,
    hasPreliminaryAlert: options.hasPreliminaryAlert,
    events: options.events.map((e) => ({ type: e.type, createdAt: e.createdAt })),
  };
}

export function toSanitizedExport(options: {
  report: Report;
  category: ReportCategory | null;
  evidenceCount: number;
}): SanitizedReportExport {
  return {
    id: options.report.id,
    trackingCode: options.report.trackingCode,
    channel: options.report.channel,
    status: options.report.status,
    categoryCode: options.category?.code ?? null,
    description: options.report.description,
    location: options.report.location,
    observedAt: options.report.observedAt,
    receivedAt: options.report.receivedAt,
    evidenceCount: options.evidenceCount,
  };
}

export function stripReporterFromDashboardReport(report: Report): Omit<
  Report,
  'trackingSecretHash' | 'reporterReferenceId'
> & { trackingSecretHash?: never; reporterReferenceId?: never } {
  return {
    id: report.id,
    trackingCode: report.trackingCode,
    channel: report.channel,
    status: report.status,
    categoryId: report.categoryId,
    description: report.description,
    location: report.location,
    observedAt: report.observedAt,
    receivedAt: report.receivedAt,
    clientReportId: report.clientReportId,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
