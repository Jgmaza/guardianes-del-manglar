import type {
  Alert,
  DashboardReportListItem,
  PublicReportTrackingView,
  Report,
  ReportCategory,
  ReportEvent,
  ReportGeoMatch,
  ReportStatus,
  SanitizedReportExport,
} from '@guardianes/contracts';
import type { SupabaseReportsRepository } from '@guardianes/database';
import {
  ReportService,
  type CreateReportResult,
  getReportEvidences,
} from '@guardianes/report-engine';
import type { AttachEvidenceInput } from '@guardianes/evidence-engine';
import { matchReportLocation } from './geo-match';

/**
 * Domain service + optional Supabase write-through / hydrate-on-read.
 * Bot and PWA keep calling the same HTTP contract; persistence is invisible to clients.
 */
export class PersistingReportService {
  constructor(
    private readonly inner: ReportService,
    private readonly repo: SupabaseReportsRepository | null,
  ) {}

  get persistenceEnabled(): boolean {
    return this.repo != null;
  }

  getStore() {
    return this.inner.getStore();
  }

  listCategories(): ReportCategory[] {
    return this.inner.listCategories();
  }

  registerCategory(
    input: Omit<ReportCategory, 'id' | 'createdAt'> & { id?: string },
  ): ReportCategory {
    const category = this.inner.registerCategory(input);
    if (this.repo) {
      void this.repo.upsertCategory(category).catch((err) => {
        console.error('Failed to persist category', err);
      });
    }
    return category;
  }

  async createReport(raw: unknown): Promise<CreateReportResult> {
    const result = this.inner.createReport(raw);
    if (this.repo) {
      const events = this.inner.listEvents(result.report.id);
      await this.repo.persistCreate(result, events);
    }

    // Best-effort CRA + INVEMAR join (PostGIS). Never blocks create on geo failure.
    try {
      const match = await matchReportLocation({
        longitude: result.report.location.longitude,
        latitude: result.report.location.latitude,
      });
      if (match) {
        await this.applyGeoMatch(result.report.id, match);
        result.report = this.inner.getStore().reports.get(result.report.id) ?? result.report;
      }
    } catch (err) {
      console.error('Geo match after create failed', err);
    }

    return result;
  }

  async applyGeoMatch(reportId: string, match: ReportGeoMatch): Promise<Report> {
    await this.ensureReport(reportId);
    const before = new Set(this.inner.listEvents(reportId).map((e) => e.id));
    const report = this.inner.applyGeoMatch(reportId, match);
    if (this.repo) {
      const events = this.inner.listEvents(reportId).filter((e) => !before.has(e.id));
      await this.repo.persistReportUpdate(report, events);
    }
    return report;
  }

  listReportsForDashboard(): DashboardReportListItem[] {
    return this.inner.listReportsForDashboard();
  }

  async listReportsForDashboardHydrated(): Promise<DashboardReportListItem[]> {
    if (this.repo) {
      try {
        await this.repo.hydrateRecent(this.inner.getStore(), 100);
      } catch (err) {
        console.error('Failed to hydrate dashboard reports from Supabase', err);
      }
    }
    return this.inner.listReportsForDashboard();
  }

  async assignCategory(reportId: string, categoryCode: string): Promise<Report> {
    await this.ensureReport(reportId);
    const before = new Set(this.inner.listEvents(reportId).map((e) => e.id));
    const report = this.inner.assignCategory(reportId, categoryCode);
    if (this.repo) {
      const events = this.inner.listEvents(reportId).filter((e) => !before.has(e.id));
      await this.repo.persistReportUpdate(report, events);
    }
    return report;
  }

  async addEvidence(
    reportId: string,
    input: Omit<AttachEvidenceInput, 'reportId'>,
  ) {
    await this.ensureReport(reportId);
    const before = new Set(this.inner.listEvents(reportId).map((e) => e.id));
    const { evidence, verifications } = await this.inner.addEvidence(reportId, input);
    if (this.repo) {
      const store = this.inner.getStore();
      const report = store.reports.get(reportId);
      const reportVerification = store.reportVerifications
        .filter((v) => v.reportId === reportId)
        .at(-1);
      if (report && reportVerification) {
        const events = this.inner.listEvents(reportId).filter((e) => !before.has(e.id));
        await this.repo.persistEvidenceBundle({
          evidence,
          evidenceVerifications: verifications,
          reportVerification,
          report,
          events,
        });
      }
    }
    return { evidence, verifications };
  }

  async transitionStatus(
    reportId: string,
    toStatus: ReportStatus,
    reason?: string,
  ): Promise<Report> {
    await this.ensureReport(reportId);
    const before = new Set(this.inner.listEvents(reportId).map((e) => e.id));
    const report = this.inner.transitionStatus(reportId, toStatus, reason);
    if (this.repo) {
      const events = this.inner.listEvents(reportId).filter((e) => !before.has(e.id));
      await this.repo.persistReportUpdate(report, events);
    }
    return report;
  }

  async createPreliminaryAlert(raw: unknown): Promise<Alert> {
    const reportId =
      typeof raw === 'object' && raw && 'reportId' in raw
        ? String((raw as { reportId: string }).reportId)
        : '';
    if (reportId) await this.ensureReport(reportId);
    const before = reportId
      ? new Set(this.inner.listEvents(reportId).map((e) => e.id))
      : new Set<string>();
    const alert = this.inner.createPreliminaryAlert(raw);
    if (this.repo) {
      const report = this.inner.getStore().reports.get(alert.reportId);
      if (report) {
        const events = this.inner
          .listEvents(alert.reportId)
          .filter((e) => !before.has(e.id));
        await this.repo.persistAlert(alert, report, events);
      }
    }
    return alert;
  }

  async track(raw: unknown): Promise<PublicReportTrackingView> {
    if (this.repo && typeof raw === 'object' && raw && 'trackingCode' in raw) {
      const code = String((raw as { trackingCode: string }).trackingCode);
      await this.repo.hydrateByTrackingCode(this.inner.getStore(), code);
    }
    const view = this.inner.track(raw);
    if (this.repo) {
      const reportId = this.inner.getStore().reportsByTrackingCode.get(view.trackingCode);
      if (reportId) {
        const events = this.inner.listEvents(reportId);
        const last = events.at(-1);
        if (last?.type === 'tracking_viewed') {
          await this.repo.persistEvent(last).catch((err) => {
            console.error('Failed to persist tracking_viewed', err);
          });
        }
      }
    }
    return view;
  }

  async dashboardView(reportId: string) {
    await this.ensureReport(reportId);
    return this.inner.dashboardView(reportId);
  }

  async exportSanitized(reportId: string): Promise<SanitizedReportExport> {
    await this.ensureReport(reportId);
    return this.inner.exportSanitized(reportId);
  }

  async listEvents(reportId: string): Promise<ReportEvent[]> {
    await this.ensureReport(reportId);
    return this.inner.listEvents(reportId);
  }

  listEvidences(reportId: string) {
    return getReportEvidences(this.inner.getStore(), reportId);
  }

  private async ensureReport(reportId: string): Promise<void> {
    if (!this.repo) return;
    if (this.inner.getStore().reports.has(reportId)) return;
    await this.repo.hydrateById(this.inner.getStore(), reportId);
  }
}
