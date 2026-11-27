# Mapeo triage WhatsApp → `POST /api/v1/reports`

Contrato: [`docs/REPORTS_API.md`](../REPORTS_API.md).

El bot **orienta** (entidad + contacto) y al cerrar el triage hace POST canónico.
La API persiste en **Supabase** si hay service role; si no, memoria de proceso.

## Campos

| Campo API | Origen en el bot |
|---|---|
| `channel` | siempre `"whatsapp"` |
| `description` | resumen: tipo + nivel + zona + privacidad + prioridad |
| `categoryCode` | `TALA→tala`, `INCENDIO→incendio`, … (`local_config`; no es catálogo C.R.A.) |
| `triage` | `{ tipo, nivel, zona, privacidad, prioridad }` → `report_events.payload` |
| `observedAt` | timestamp del mensaje (ISO) |
| `location.source` | `"whatsapp_shared_location"` si comparten pin; si no `"unknown"` |
| `location.lat/lng` | pin WhatsApp o placeholder Atlántico |
| `reporterHandle` | hash opaco del From de Twilio (nunca teléfono en claro) |
| `clientReportId` | uuid por conversación completada |

## Flujo a base de datos

```text
Twilio webhook → apps/whatsapp-bot → POST /api/v1/reports
  → ReportService (dominio)
  → SupabaseReportsRepository (si SUPABASE_SERVICE_ROLE_KEY)
  → tablas reports / reporter_references / report_events / report_categories
```

## Privacidad

- Modo `ANONIMO`: no pedir nombre; `reporterHandle` opaco opcional.
- Modo `IDENTIFICADO`: seguimiento con `trackingCode` + `trackingSecret`, no PII en dashboard.
- Rechazar email/phone en el body (strict schema de la API).

## Evidencias

`POST /api/v1/reports/:id/evidences` cuando el ciudadano envíe foto:

- `mediaKind: "photo"`
- `sharedLocation` si aplica
- Caveat: WhatsApp suele quitar EXIF.

## Código

- Payload: `apps/whatsapp-bot/reports-client.js`
- Persistencia: `packages/database/src/reports-repository.ts`
- Cableado: `apps/web/src/server/report-service.ts`
