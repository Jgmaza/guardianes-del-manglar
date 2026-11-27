import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Alert,
  Evidence,
  EvidenceVerification,
  Report,
  ReportCategory,
  ReportEvent,
  ReportGeoMatch,
  ReportVerification,
  ReporterReference,
} from '@guardianes/contracts';
import type { CreateReportResult, ReportDomainStore } from '@guardianes/report-engine';

type CategoryRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  active: boolean;
  source: ReportCategory['source'];
  created_at: string;
};

type ReporterRow = {
  id: string;
  channel_handle_hash: string | null;
  optional_contact_encrypted: string | null;
  notes: string | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  tracking_code: string;
  tracking_secret_hash: string;
  channel: Report['channel'];
  status: Report['status'];
  category_id: string | null;
  description: string | null;
  location_longitude: number;
  location_latitude: number;
  location_accuracy_meters: number | null;
  location_source: Report['location']['source'];
  observed_at: string;
  received_at: string;
  client_report_id: string | null;
  reporter_reference_id: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  report_id: string;
  type: ReportEvent['type'];
  payload: Record<string, unknown>;
  created_at: string;
};

type EvidenceRow = {
  id: string;
  report_id: string;
  media_kind: Evidence['mediaKind'];
  mime_type: string;
  byte_length: number;
  sha256: string;
  storage_key: string;
  shared_longitude: number | null;
  shared_latitude: number | null;
  exif: Evidence['exif'];
  received_at: string;
  created_at: string;
};

type EvidenceVerificationRow = {
  id: string;
  evidence_id: string;
  report_id: string;
  kind: EvidenceVerification['kind'];
  result: EvidenceVerification['result'];
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
};

type ReportVerificationRow = {
  id: string;
  report_id: string;
  kind: ReportVerification['kind'];
  result: ReportVerification['result'];
  summary: string;
  reviewer_role: ReportVerification['reviewerRole'];
  created_at: string;
};

type AlertRow = {
  id: string;
  report_id: string;
  status: Alert['status'];
  title: string;
  rationale: string;
  created_by: Alert['createdBy'];
  created_at: string;
};

export function categoryToRow(category: ReportCategory): Omit<CategoryRow, 'created_at'> & {
  created_at?: string;
} {
  return {
    id: category.id,
    code: category.code,
    label: category.label,
    description: category.description ?? null,
    active: category.active,
    source: category.source,
    created_at: category.createdAt,
  };
}

export function categoryFromRow(row: CategoryRow): ReportCategory {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    description: row.description ?? undefined,
    active: row.active,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function reportToRow(report: Report) {
  return {
    id: report.id,
    tracking_code: report.trackingCode,
    tracking_secret_hash: report.trackingSecretHash,
    channel: report.channel,
    status: report.status,
    category_id: report.categoryId,
    description: report.description,
    location_longitude: report.location.longitude,
    location_latitude: report.location.latitude,
    location_accuracy_meters: report.location.accuracyMeters ?? null,
    location_source: report.location.source,
    observed_at: report.observedAt,
    received_at: report.receivedAt,
    client_report_id: report.clientReportId,
    reporter_reference_id: report.reporterReferenceId,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };
}

export function reportFromRow(row: ReportRow): Report {
  return {
    id: row.id,
    trackingCode: row.tracking_code,
    trackingSecretHash: row.tracking_secret_hash,
    channel: row.channel,
    status: row.status,
    categoryId: row.category_id,
    description: row.description,
    location: {
      longitude: row.location_longitude,
      latitude: row.location_latitude,
      accuracyMeters: row.location_accuracy_meters ?? undefined,
      source: row.location_source,
    },
    observedAt: row.observed_at,
    receivedAt: row.received_at,
    clientReportId: row.client_report_id,
    reporterReferenceId: row.reporter_reference_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function eventToRow(event: ReportEvent) {
  return {
    id: event.id,
    report_id: event.reportId,
    type: event.type,
    payload: event.payload,
    created_at: event.createdAt,
  };
}

export function eventFromRow(row: EventRow): ReportEvent {
  return {
    id: row.id,
    reportId: row.report_id,
    type: row.type,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}

function reporterToRow(ref: ReporterReference) {
  return {
    id: ref.id,
    channel_handle_hash: ref.channelHandleHash ?? null,
    optional_contact_encrypted: ref.optionalContactEncrypted ?? null,
    notes: ref.notes ?? null,
    created_at: ref.createdAt,
  };
}

function reporterFromRow(row: ReporterRow): ReporterReference {
  return {
    id: row.id,
    channelHandleHash: row.channel_handle_hash ?? undefined,
    optionalContactEncrypted: row.optional_contact_encrypted ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function evidenceToRow(evidence: Evidence) {
  return {
    id: evidence.id,
    report_id: evidence.reportId,
    media_kind: evidence.mediaKind,
    mime_type: evidence.mimeType,
    byte_length: evidence.byteLength,
    sha256: evidence.sha256,
    storage_key: evidence.storageKey,
    shared_longitude: evidence.sharedLocation?.longitude ?? null,
    shared_latitude: evidence.sharedLocation?.latitude ?? null,
    exif: evidence.exif,
    received_at: evidence.receivedAt,
    created_at: evidence.createdAt,
  };
}

function evidenceFromRow(row: EvidenceRow): Evidence {
  const shared =
    row.shared_longitude != null && row.shared_latitude != null
      ? { longitude: row.shared_longitude, latitude: row.shared_latitude }
      : undefined;
  return {
    id: row.id,
    reportId: row.report_id,
    mediaKind: row.media_kind,
    mimeType: row.mime_type,
    byteLength: row.byte_length,
    sha256: row.sha256,
    storageKey: row.storage_key,
    sharedLocation: shared,
    exif: row.exif,
    receivedAt: row.received_at,
    createdAt: row.created_at,
  };
}

/**
 * Persists canonical reports to Supabase (service-role client).
 * Domain logic stays in `@guardianes/report-engine`; this is I/O only.
 */
export class SupabaseReportsRepository {
  constructor(private readonly client: SupabaseClient) {}

  /** Upserts by code and returns the durable category id stored in Supabase. */
  async upsertCategory(category: ReportCategory): Promise<string> {
    // Reuse existing UUID when code already exists (memory seeds new ids each boot).
    const { data: existing, error: lookupError } = await this.client
      .from('report_categories')
      .select('id')
      .eq('code', category.code)
      .maybeSingle();
    if (lookupError) throw new Error(`upsertCategory.lookup: ${lookupError.message}`);

    const durableId = (existing as { id?: string } | null)?.id ?? category.id;
    const row = categoryToRow({
      ...category,
      id: durableId,
    });

    const { error } = await this.client
      .from('report_categories')
      .upsert(row, { onConflict: 'code' });
    if (error) throw new Error(`upsertCategory: ${error.message}`);
    return durableId;
  }

  async listCategories(): Promise<ReportCategory[]> {
    const { data, error } = await this.client
      .from('report_categories')
      .select('*')
      .eq('active', true)
      .order('code');
    if (error) throw new Error(`listCategories: ${error.message}`);
    return ((data ?? []) as CategoryRow[]).map(categoryFromRow);
  }

  async persistCreate(result: CreateReportResult, events: ReportEvent[]): Promise<void> {
    if (result.category) {
      const durableCategoryId = await this.upsertCategory(result.category);
      result.category.id = durableCategoryId;
      result.report.categoryId = durableCategoryId;
    }

    if (result.reporterReference) {
      const { error: reporterError } = await this.client
        .from('reporter_references')
        .upsert(reporterToRow(result.reporterReference));
      if (reporterError) throw new Error(`persistCreate.reporter: ${reporterError.message}`);
    }

    const { error: reportError } = await this.client
      .from('reports')
      .upsert(reportToRow(result.report));
    if (reportError) throw new Error(`persistCreate.report: ${reportError.message}`);

    if (events.length) {
      const { error: eventsError } = await this.client
        .from('report_events')
        .upsert(events.map(eventToRow));
      if (eventsError) throw new Error(`persistCreate.events: ${eventsError.message}`);
    }
  }

  async persistReportUpdate(report: Report, events: ReportEvent[] = []): Promise<void> {
    const { error } = await this.client.from('reports').upsert(reportToRow(report));
    if (error) throw new Error(`persistReportUpdate: ${error.message}`);
    if (events.length) {
      const { error: eventsError } = await this.client
        .from('report_events')
        .upsert(events.map(eventToRow));
      if (eventsError) throw new Error(`persistReportUpdate.events: ${eventsError.message}`);
    }
  }

  async persistEvidenceBundle(input: {
    evidence: Evidence;
    evidenceVerifications: EvidenceVerification[];
    reportVerification: ReportVerification;
    report: Report;
    events: ReportEvent[];
  }): Promise<void> {
    const { error: evidenceError } = await this.client
      .from('evidences')
      .upsert(evidenceToRow(input.evidence));
    if (evidenceError) throw new Error(`persistEvidence: ${evidenceError.message}`);

    if (input.evidenceVerifications.length) {
      const { error } = await this.client.from('evidence_verifications').upsert(
        input.evidenceVerifications.map((v) => ({
          id: v.id,
          evidence_id: v.evidenceId,
          report_id: v.reportId,
          kind: v.kind,
          result: v.result,
          summary: v.summary,
          details: v.details,
          created_at: v.createdAt,
        })),
      );
      if (error) throw new Error(`persistEvidence.verifications: ${error.message}`);
    }

    const { error: rvError } = await this.client.from('report_verifications').upsert({
      id: input.reportVerification.id,
      report_id: input.reportVerification.reportId,
      kind: input.reportVerification.kind,
      result: input.reportVerification.result,
      summary: input.reportVerification.summary,
      reviewer_role: input.reportVerification.reviewerRole,
      created_at: input.reportVerification.createdAt,
    });
    if (rvError) throw new Error(`persistEvidence.reportVerification: ${rvError.message}`);

    await this.persistReportUpdate(input.report, input.events);
  }

  async persistAlert(alert: Alert, report: Report, events: ReportEvent[]): Promise<void> {
    const { error } = await this.client.from('alerts').upsert({
      id: alert.id,
      report_id: alert.reportId,
      status: alert.status,
      title: alert.title,
      rationale: alert.rationale,
      created_by: alert.createdBy,
      created_at: alert.createdAt,
    });
    if (error) throw new Error(`persistAlert: ${error.message}`);
    await this.persistReportUpdate(report, events);
  }

  async persistEvent(event: ReportEvent): Promise<void> {
    const { error } = await this.client.from('report_events').upsert(eventToRow(event));
    if (error) throw new Error(`persistEvent: ${error.message}`);
  }

  /**
   * Loads a report graph into the in-memory domain store (idempotent merge).
   */
  async hydrateByTrackingCode(
    store: ReportDomainStore,
    trackingCode: string,
  ): Promise<Report | null> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('tracking_code', trackingCode)
      .maybeSingle();
    if (error) throw new Error(`hydrateByTrackingCode: ${error.message}`);
    if (!data) return null;
    return this.hydrateReportRow(store, data as ReportRow);
  }

  async hydrateById(store: ReportDomainStore, reportId: string): Promise<Report | null> {
    if (store.reports.has(reportId)) {
      return store.reports.get(reportId) ?? null;
    }
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();
    if (error) throw new Error(`hydrateById: ${error.message}`);
    if (!data) return null;
    return this.hydrateReportRow(store, data as ReportRow);
  }

  /**
   * Pull recent reports into the in-memory domain store for the CRA dashboard.
   * Idempotent merge — already-hydrated ids are skipped.
   */
  async hydrateRecent(store: ReportDomainStore, limit = 100): Promise<number> {
    const { data, error } = await this.client
      .from('reports')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`hydrateRecent: ${error.message}`);
    let loaded = 0;
    for (const row of (data ?? []) as ReportRow[]) {
      if (store.reports.has(row.id)) continue;
      await this.hydrateReportRow(store, row);
      loaded += 1;
    }
    return loaded;
  }

  private async hydrateReportRow(store: ReportDomainStore, row: ReportRow): Promise<Report> {
    const report = reportFromRow(row);
    store.reports.set(report.id, report);
    store.reportsByTrackingCode.set(report.trackingCode, report.id);

    if (report.categoryId && !store.categories.some((c) => c.id === report.categoryId)) {
      const { data: cat } = await this.client
        .from('report_categories')
        .select('*')
        .eq('id', report.categoryId)
        .maybeSingle();
      if (cat) {
        const category = categoryFromRow(cat as CategoryRow);
        if (!store.categories.some((c) => c.id === category.id)) {
          store.categories.push(category);
        }
      }
    }

    if (report.reporterReferenceId && !store.reporters.has(report.reporterReferenceId)) {
      const { data: reporter } = await this.client
        .from('reporter_references')
        .select('*')
        .eq('id', report.reporterReferenceId)
        .maybeSingle();
      if (reporter) {
        store.reporters.set(report.reporterReferenceId, reporterFromRow(reporter as ReporterRow));
      }
    }

    const { data: events } = await this.client
      .from('report_events')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true });
    for (const event of ((events ?? []) as EventRow[]).map(eventFromRow)) {
      if (!store.events.some((e) => e.id === event.id)) {
        store.events.push(event);
      }
      if (event.type === 'geo_matched' && event.payload && typeof event.payload === 'object') {
        const payload = event.payload as {
          cra?: ReportGeoMatch['cra'];
          invemar?: ReportGeoMatch['invemar'];
          matchedAt?: string;
        };
        if (payload.cra && payload.invemar) {
          store.geoMatches.set(report.id, {
            matchedAt: payload.matchedAt ?? event.createdAt,
            longitude: report.location.longitude,
            latitude: report.location.latitude,
            cra: payload.cra,
            invemar: payload.invemar,
          });
        }
      }
    }

    const { data: evidences } = await this.client
      .from('evidences')
      .select('*')
      .eq('report_id', report.id);
    const evidenceIds: string[] = [];
    for (const evidence of ((evidences ?? []) as EvidenceRow[]).map(evidenceFromRow)) {
      store.evidences.set(evidence.id, evidence);
      evidenceIds.push(evidence.id);
    }
    if (evidenceIds.length) {
      store.evidencesByReport.set(report.id, evidenceIds);
    }

    const { data: evVerifs } = await this.client
      .from('evidence_verifications')
      .select('*')
      .eq('report_id', report.id);
    for (const rowV of (evVerifs ?? []) as EvidenceVerificationRow[]) {
      const mapped: EvidenceVerification = {
        id: rowV.id,
        evidenceId: rowV.evidence_id,
        reportId: rowV.report_id,
        kind: rowV.kind,
        result: rowV.result,
        summary: rowV.summary,
        details: rowV.details ?? {},
        createdAt: rowV.created_at,
      };
      if (!store.evidenceVerifications.some((v) => v.id === mapped.id)) {
        store.evidenceVerifications.push(mapped);
      }
    }

    const { data: reportVerifs } = await this.client
      .from('report_verifications')
      .select('*')
      .eq('report_id', report.id);
    for (const rowV of (reportVerifs ?? []) as ReportVerificationRow[]) {
      const mapped: ReportVerification = {
        id: rowV.id,
        reportId: rowV.report_id,
        kind: rowV.kind,
        result: rowV.result,
        summary: rowV.summary,
        reviewerRole: rowV.reviewer_role,
        createdAt: rowV.created_at,
      };
      if (!store.reportVerifications.some((v) => v.id === mapped.id)) {
        store.reportVerifications.push(mapped);
      }
    }

    const { data: alerts } = await this.client.from('alerts').select('*').eq('report_id', report.id);
    for (const rowA of (alerts ?? []) as AlertRow[]) {
      const mapped: Alert = {
        id: rowA.id,
        reportId: rowA.report_id,
        status: rowA.status,
        title: rowA.title,
        rationale: rowA.rationale,
        createdBy: rowA.created_by,
        createdAt: rowA.created_at,
      };
      if (!store.alerts.some((a) => a.id === mapped.id)) {
        store.alerts.push(mapped);
      }
    }

    return report;
  }
}
