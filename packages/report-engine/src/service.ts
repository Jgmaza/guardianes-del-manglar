import type {
  Alert,
  Evidence,
  EvidenceVerification,
  PublicReportTrackingView,
  Report,
  ReportCategory,
  ReportEvent,
  ReportStatus,
  ReportVerification,
  ReporterReference,
  SanitizedReportExport,
} from '@guardianes/contracts';
import {
  buildEvidenceVerifications,
  createEvidenceFromBytes,
  timingSafeEqualHex,
  type AttachEvidenceInput,
} from '@guardianes/evidence-engine';
import {
  createReportSchema,
  createPreliminaryAlertSchema,
  trackReportSchema,
  type CreatePreliminaryAlertInput,
  type CreateReportInput,
  type TrackReportInput,
} from '@guardianes/validation';
import {
  assertNoPiiFields,
  stripReporterFromDashboardReport,
  toPublicTrackingView,
  toSanitizedExport,
} from './anonymity';
import { createDefaultCategoryCatalog, resolveCategory, upsertCategory } from './categories';
import {
  createTrackingCode,
  createTrackingSecret,
  hashReporterHandle,
  hashSecret,
  newId,
} from './ids';
import { assertTransition } from './status';
import {
  createInMemoryStore,
  getReportEvidences,
  type ReportDomainStore,
} from './store';

export type CreateReportResult = {
  report: Report;
  trackingCode: string;
  /** Shown once — store only the hash thereafter */
  trackingSecret: string;
  category: ReportCategory | null;
  reporterReference: ReporterReference | null;
};

export class ReportService {
  constructor(private readonly store: ReportDomainStore) {}

  static create(seedCategories?: ReportCategory[]): ReportService {
    const categories = seedCategories ?? createDefaultCategoryCatalog();
    return new ReportService(createInMemoryStore(categories));
  }

  getStore(): ReportDomainStore {
    return this.store;
  }

  listCategories(): ReportCategory[] {
    return this.store.categories.filter((c) => c.active);
  }

  registerCategory(
    input: Omit<ReportCategory, 'id' | 'createdAt'> & { id?: string },
  ): ReportCategory {
    this.store.categories = upsertCategory(this.store.categories, input);
    const found = this.store.categories.find((c) => c.code === input.code);
    if (!found) throw new Error('Failed to register category');
    return found;
  }

  createReport(raw: unknown): CreateReportResult {
    const input = createReportSchema.parse(raw) as CreateReportInput;
    assertNoPiiFields(input as unknown as Record<string, unknown>);

    const now = new Date().toISOString();
    const observedAt = input.observedAt ?? now;
    const category = resolveCategory(this.store.categories, {
      categoryId: input.categoryId,
      categoryCode: input.categoryCode,
    });

    let reporterReference: ReporterReference | null = null;
    if (input.reporterHandle) {
      reporterReference = {
        id: newId(),
        channelHandleHash: hashReporterHandle(input.reporterHandle),
        createdAt: now,
      };
      this.store.reporters.set(reporterReference.id, reporterReference);
    }

    const trackingCode = createTrackingCode();
    const trackingSecret = createTrackingSecret();
    const report: Report = {
      id: newId(),
      trackingCode,
      trackingSecretHash: hashSecret(trackingSecret),
      channel: input.channel,
      status: 'submitted',
      categoryId: category?.id ?? null,
      description: input.description ?? null,
      location: input.location,
      observedAt,
      receivedAt: now,
      clientReportId: input.clientReportId ?? null,
      reporterReferenceId: reporterReference?.id ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.store.reports.set(report.id, report);
    this.store.reportsByTrackingCode.set(trackingCode, report.id);
    this.appendEvent(report.id, 'created', {
      channel: report.channel,
      categoryId: report.categoryId,
    });
    if (category) {
      this.appendEvent(report.id, 'category_assigned', {
        categoryId: category.id,
        categoryCode: category.code,
        source: category.source,
      });
    }

    return { report, trackingCode, trackingSecret, category, reporterReference };
  }

  assignCategory(reportId: string, categoryCode: string): Report {
    const report = this.requireReport(reportId);
    const category = resolveCategory(this.store.categories, { categoryCode });
    if (!category) throw new Error(`Unknown or inactive category: ${categoryCode}`);
    report.categoryId = category.id;
    report.updatedAt = new Date().toISOString();
    this.appendEvent(report.id, 'category_assigned', {
      categoryId: category.id,
      categoryCode: category.code,
      source: category.source,
    });
    return report;
  }

  async addEvidence(
    reportId: string,
    input: Omit<AttachEvidenceInput, 'reportId'>,
  ): Promise<{ evidence: Evidence; verifications: EvidenceVerification[] }> {
    const report = this.requireReport(reportId);
    const evidence = await createEvidenceFromBytes({ ...input, reportId });
    this.store.evidences.set(evidence.id, evidence);
    const list = this.store.evidencesByReport.get(reportId) ?? [];
    list.push(evidence.id);
    this.store.evidencesByReport.set(reportId, list);

    const verifications = buildEvidenceVerifications({
      evidence,
      reportLocation: report.location,
    });
    this.store.evidenceVerifications.push(...verifications);

    const auto: ReportVerification = {
      id: newId(),
      reportId,
      kind: 'automated_consistency',
      result: verifications.every((v) => v.result === 'pass' || v.result === 'not_applicable')
        ? 'pass'
        : verifications.some((v) => v.result === 'fail')
          ? 'inconclusive'
          : 'inconclusive',
      summary:
        'Automated consistency checks completed. Institutional validation is still required before official use.',
      reviewerRole: 'system',
      createdAt: new Date().toISOString(),
    };
    this.store.reportVerifications.push(auto);

    this.appendEvent(reportId, 'evidence_added', {
      evidenceId: evidence.id,
      sha256: evidence.sha256,
      mimeType: evidence.mimeType,
    });
    this.appendEvent(reportId, 'verification_recorded', {
      evidenceId: evidence.id,
      verificationIds: verifications.map((v) => v.id),
      reportVerificationId: auto.id,
    });

    report.updatedAt = new Date().toISOString();
    return { evidence, verifications };
  }

  transitionStatus(reportId: string, toStatus: ReportStatus, reason?: string): Report {
    const report = this.requireReport(reportId);
    assertTransition(report.status, toStatus);
    const from = report.status;
    report.status = toStatus;
    report.updatedAt = new Date().toISOString();
    this.appendEvent(reportId, 'status_changed', { from, to: toStatus, reason });
    return report;
  }

  createPreliminaryAlert(raw: unknown): Alert {
    const input = createPreliminaryAlertSchema.parse(raw) as CreatePreliminaryAlertInput;
    const report = this.requireReport(input.reportId);
    if (report.status === 'rejected') {
      throw new Error('Cannot create alert from a rejected report');
    }

    const alert: Alert = {
      id: newId(),
      reportId: report.id,
      status: 'preliminary',
      title: input.title,
      rationale: input.rationale,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    this.store.alerts.push(alert);
    this.appendEvent(report.id, 'alert_created', {
      alertId: alert.id,
      status: alert.status,
    });

    if (report.status === 'accepted' || report.status === 'under_review') {
      const from = report.status;
      assertTransition(from, 'alerted');
      report.status = 'alerted';
      report.updatedAt = new Date().toISOString();
      this.appendEvent(report.id, 'status_changed', {
        from,
        to: 'alerted',
        reason: 'preliminary_alert_created',
      });
    }

    return alert;
  }

  track(raw: unknown): PublicReportTrackingView {
    const input = trackReportSchema.parse(raw) as TrackReportInput;
    const reportId = this.store.reportsByTrackingCode.get(input.trackingCode);
    if (!reportId) throw new Error('Report not found');
    const report = this.requireReport(reportId);
    if (!timingSafeEqualHex(report.trackingSecretHash, hashSecret(input.trackingSecret))) {
      throw new Error('Invalid tracking credentials');
    }

    this.appendEvent(report.id, 'tracking_viewed', { at: new Date().toISOString() });
    const category =
      this.store.categories.find((c) => c.id === report.categoryId) ?? null;
    const evidences = getReportEvidences(this.store, report.id);
    const alerts = this.store.alerts.filter((a) => a.reportId === report.id);

    return toPublicTrackingView({
      report,
      category,
      evidenceCount: evidences.length,
      hasPreliminaryAlert: alerts.some((a) => a.status === 'preliminary' || a.status === 'active'),
      events: this.store.events.filter((e) => e.reportId === report.id),
    });
  }

  dashboardView(reportId: string): ReturnType<typeof stripReporterFromDashboardReport> {
    return stripReporterFromDashboardReport(this.requireReport(reportId));
  }

  exportSanitized(reportId: string): SanitizedReportExport {
    const report = this.requireReport(reportId);
    const category = this.store.categories.find((c) => c.id === report.categoryId) ?? null;
    return toSanitizedExport({
      report,
      category,
      evidenceCount: getReportEvidences(this.store, reportId).length,
    });
  }

  listEvents(reportId: string): ReportEvent[] {
    return this.store.events.filter((e) => e.reportId === reportId);
  }

  private requireReport(reportId: string): Report {
    const report = this.store.reports.get(reportId);
    if (!report) throw new Error(`Report not found: ${reportId}`);
    return report;
  }

  private appendEvent(
    reportId: string,
    type: ReportEvent['type'],
    payload: Record<string, unknown>,
  ): ReportEvent {
    const event: ReportEvent = {
      id: newId(),
      reportId,
      type,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.store.events.push(event);
    return event;
  }
}

/** @deprecated use ReportService / createTrackingCode from ids */
export { createTrackingCode } from './ids';
