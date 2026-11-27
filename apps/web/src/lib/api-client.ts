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

export type FixtureReport = {
  id: string;
  trackingCode: string;
  channel: string;
  status: string;
  categoryCode: string;
  categoryLabel: string;
  description: string;
  location: {
    longitude: number;
    latitude: number;
    accuracyMeters?: number;
    source: string;
  };
  priorityHint?: string;
  observedAt: string;
  receivedAt: string;
  evidenceCount: number;
  hasPreliminaryAlert: boolean;
};

export async function loadFixtureReports(): Promise<FixtureReport[]> {
  const res = await fetch('/fixtures/demo-reports.json');
  const json = (await res.json()) as { fixture: boolean; reports: FixtureReport[] };
  return json.reports.map((r) => ({ ...r }));
}
