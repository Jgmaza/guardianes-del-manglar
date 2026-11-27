export type DashboardReport = {
  id: string;
  trackingCode: string;
  channel: string;
  status: string;
  categoryCode: string | null;
  categoryLabel: string | null;
  description: string | null;
  location: {
    longitude: number;
    latitude: number;
    accuracyMeters?: number;
    source: string;
  };
  priorityHint: string | null;
  zoneHydro: string | null;
  unitHydro: string | null;
  dominantSpecies: string | null;
  managementZone: string | null;
  locality: string | null;
  observedAt: string;
  receivedAt: string;
  updatedAt?: string;
  evidenceCount: number;
  hasPreliminaryAlert: boolean;
  geoMatch?: unknown;
};

function withGeoDefaults(
  row: Partial<DashboardReport> &
    Pick<
      DashboardReport,
      'id' | 'trackingCode' | 'channel' | 'status' | 'location' | 'observedAt' | 'receivedAt' | 'evidenceCount' | 'hasPreliminaryAlert'
    >,
): DashboardReport {
  return {
    categoryCode: row.categoryCode ?? null,
    categoryLabel: row.categoryLabel ?? null,
    description: row.description ?? null,
    priorityHint: row.priorityHint ?? null,
    zoneHydro: row.zoneHydro ?? null,
    unitHydro: row.unitHydro ?? null,
    dominantSpecies: row.dominantSpecies ?? null,
    managementZone: row.managementZone ?? null,
    locality: row.locality ?? null,
    updatedAt: row.updatedAt,
    geoMatch: row.geoMatch,
    id: row.id,
    trackingCode: row.trackingCode,
    channel: row.channel,
    status: row.status,
    location: row.location,
    observedAt: row.observedAt,
    receivedAt: row.receivedAt,
    evidenceCount: row.evidenceCount,
    hasPreliminaryAlert: row.hasPreliminaryAlert,
  };
}

export async function fetchCategories() {
  const res = await fetch('/api/v1/categories');
  const json = (await res.json()) as {
    data: Array<{
      id: string;
      code: string;
      label: string;
      source: string;
      description?: string;
    }>;
  };
  return json.data;
}

export async function fetchDashboardReports(): Promise<DashboardReport[]> {
  const res = await fetch('/api/v1/reports');
  const json = (await res.json()) as { data?: DashboardReport[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'No se pudieron cargar los reportes');
  return (json.data ?? []).map((r) => withGeoDefaults(r));
}

export type OfficialImpactZone = {
  locality: string;
  hectares: number;
  polygonCount: number;
  dominantSpecies: string | null;
  managementZone: string | null;
  intervention: string | null;
  degradation: string | null;
  currentUse: string | null;
  landConflict: string | null;
  faunaPressure: string | null;
  impactScore: number;
};

export type ImpactZonesSummary = {
  source: { invemar: string; cra: string };
  craPriorityCounts: Array<{ priority: string; count: number }>;
  zones: OfficialImpactZone[];
};

export async function fetchOfficialImpactZones(): Promise<ImpactZonesSummary | null> {
  const res = await fetch('/api/v1/geo/impact-zones');
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: ImpactZonesSummary };
  return json.data ?? null;
}

export async function trackReport(trackingCode: string, trackingSecret: string) {
  const res = await fetch('/api/v1/reports/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingCode, trackingSecret }),
  });
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'No se pudo consultar el reporte');
  return json.data;
}

export async function patchReportStatus(id: string, toStatus: string, reason?: string) {
  const res = await fetch(`/api/v1/reports/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toStatus, reason }),
  });
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'No se pudo cambiar el estado');
  return json.data;
}

export async function createAlert(id: string, title: string, rationale: string) {
  const res = await fetch(`/api/v1/reports/${id}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, rationale, createdBy: 'cra_reviewer' }),
  });
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'No se pudo crear la alerta');
  return json.data;
}

export async function fetchReportEvents(id: string) {
  const res = await fetch(`/api/v1/reports/${id}/events`);
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'No se pudieron cargar eventos');
  return json.data;
}
