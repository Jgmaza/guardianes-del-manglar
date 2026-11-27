import { randomUUID, createHash } from "node:crypto";

/**
 * Arma el body canónico para POST /api/v1/reports.
 * No envía PII. El POST live se conecta cuando REPORTS_API_URL esté configurada.
 */
export function buildReportPayload(session, opts = {}) {
  const {
    from = "",
    observedAt = new Date().toISOString(),
    location = null,
    categoryCode = "uncategorized",
  } = opts;

  const reporterHandle = from
    ? createHash("sha256").update(String(from)).digest("hex").slice(0, 24)
    : undefined;

  const description = [
    `Tipo: ${session.tipo ?? "N/D"}`,
    `Alerta: ${session.nivel ?? "N/D"}`,
    `Zona: ${session.zona ?? "N/D"}`,
    `Privacidad: ${session.privacidad ?? "N/D"}`,
  ].join(" | ");

  const body = {
    channel: "whatsapp",
    observedAt,
    description,
    categoryCode,
    clientReportId: randomUUID(),
  };

  if (reporterHandle) body.reporterHandle = reporterHandle;

  if (location?.latitude != null && location?.longitude != null) {
    body.location = {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      accuracyMeters: location.accuracyMeters,
      source: location.source ?? "whatsapp_shared_location",
    };
  } else {
    // Punto neutro Atlántico cuando aún no hay pin de WhatsApp
    body.location = {
      latitude: 10.9685,
      longitude: -74.7813,
      source: "unknown",
    };
  }

  return body;
}

/**
 * POST opcional. Si no hay REPORTS_API_URL, retorna null (triage-only).
 */
export async function createReport(session, opts = {}) {
  const base = process.env.REPORTS_API_URL;
  if (!base) return null;

  const payload = buildReportPayload(session, opts);
  const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reports API ${res.status}: ${text}`);
  }

  return res.json();
}
