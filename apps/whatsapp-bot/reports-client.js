import { randomUUID, createHash } from "node:crypto";

const TIPO_TO_CATEGORY = {
  TALA: "tala",
  INCENDIO: "incendio",
  RESIDUOS: "residuos",
  FAUNA: "fauna",
  INVASION: "invasion",
};

/**
 * Arma el body canónico para POST /api/v1/reports.
 * Sin PII. Persiste vía API (memoria o Supabase según env del web).
 */
export function buildReportPayload(session, opts = {}) {
  const {
    from = "",
    observedAt = new Date().toISOString(),
    location = null,
    categoryCode,
  } = opts;

  const reporterHandle = from
    ? createHash("sha256").update(String(from)).digest("hex").slice(0, 24)
    : undefined;

  const resolvedCategory =
    categoryCode ??
    TIPO_TO_CATEGORY[String(session.tipo || "").toUpperCase()] ??
    "uncategorized";

  const description = [
    `Tipo: ${session.tipo ?? "N/D"}`,
    `Alerta: ${session.nivel ?? "N/D"}`,
    `Zona: ${session.zona ?? "N/D"}`,
    `Privacidad: ${session.privacidad ?? "N/D"}`,
    session.prioridad ? `Prioridad: ${session.prioridad}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const body = {
    channel: "whatsapp",
    observedAt,
    description,
    categoryCode: resolvedCategory,
    clientReportId: randomUUID(),
    triage: {
      tipo: session.tipo ?? undefined,
      nivel: session.nivel ?? undefined,
      zona: session.zona ?? undefined,
      privacidad: session.privacidad ?? undefined,
      prioridad: session.prioridad ?? undefined,
    },
  };

  // Drop empty triage keys
  body.triage = Object.fromEntries(
    Object.entries(body.triage).filter(([, v]) => v != null && v !== ""),
  );
  if (!Object.keys(body.triage).length) delete body.triage;

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
