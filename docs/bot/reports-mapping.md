# Mapeo triage WhatsApp → `POST /api/v1/reports`

Contrato: [`docs/REPORTS_API.md`](../REPORTS_API.md).

El bot hoy **orienta** (entidad + contacto). El siguiente bloque crea el reporte canónico.

## Campos

| Campo API | Origen en el bot |
|---|---|
| `channel` | siempre `"whatsapp"` |
| `description` | resumen: tipo + nivel + zona + acción sugerida |
| `categoryCode` | mapear `TALA\|INCENDIO\|RESIDUOS\|FAUNA\|INVASION` → catálogo (hoy `uncategorized` hasta categorías C.R.A.) |
| `observedAt` | timestamp del mensaje (ISO) |
| `location.source` | `"whatsapp_shared_location"` si comparten pin; si no `"unknown"` |
| `location.lat/lng` | solo si hay ubicación compartida |
| `reporterHandle` | hash opaco del JID/From de Twilio (nunca teléfono en claro en el payload) |
| `clientReportId` | uuid por conversación completada |

## Privacidad

- Modo `ANONIMO`: no pedir nombre; `reporterHandle` opaco opcional.
- Modo `IDENTIFICADO`: el seguimiento ciudadano usa `trackingCode` + `trackingSecret` de la API, no PII en el dashboard.
- Rechazar email/phone en el body (strict schema de la API).

## Evidencias

`POST /api/v1/reports/:id/evidences` cuando el ciudadano envíe foto:

- `mediaKind: "photo"`
- `sharedLocation` si aplica
- Caveat: WhatsApp suele quitar EXIF.

## Stub

Ver `apps/whatsapp-bot/reports-client.js` (arma el payload; el POST live queda como siguiente commit).
