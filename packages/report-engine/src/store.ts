import type {
  Alert,
  Evidence,
  EvidenceVerification,
  Report,
  ReportCategory,
  ReportEvent,
  ReportVerification,
  ReporterReference,
} from '@guardianes/contracts';

export type ReportDomainStore = {
  categories: ReportCategory[];
  reports: Map<string, Report>;
  reportsByTrackingCode: Map<string, string>;
  evidences: Map<string, Evidence>;
  evidencesByReport: Map<string, string[]>;
  evidenceVerifications: EvidenceVerification[];
  reportVerifications: ReportVerification[];
  events: ReportEvent[];
  alerts: Alert[];
  reporters: Map<string, ReporterReference>;
};

export function createInMemoryStore(categories: ReportCategory[] = []): ReportDomainStore {
  return {
    categories: [...categories],
    reports: new Map(),
    reportsByTrackingCode: new Map(),
    evidences: new Map(),
    evidencesByReport: new Map(),
    evidenceVerifications: [],
    reportVerifications: [],
    events: [],
    alerts: [],
    reporters: new Map(),
  };
}

export function getReportEvidences(store: ReportDomainStore, reportId: string): Evidence[] {
  const ids = store.evidencesByReport.get(reportId) ?? [];
  return ids
    .map((id) => store.evidences.get(id))
    .filter((e): e is Evidence => Boolean(e));
}
