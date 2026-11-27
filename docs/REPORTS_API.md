# REPORTS_API — contratos HTTP v1

**Estado:** `IMPLEMENTED` (API foundation)  
**Persistencia Supabase:** `IMPLEMENTED` (activa cuando hay `SUPABASE_SERVICE_ROLE_KEY`; si no, memoria)

Base: `/api/v1`

Principios:

- Mismo contrato para PWA y WhatsApp.
- Sin cuenta obligatoria.
- `trackingCode` + `trackingSecret` (secreto solo al crear).
- Sin PII en dashboard/export/track.
- Reporte ≠ alerta validada.
- Categorías configurables; oficiales C.R.A. `PENDING`.

---

## GET `/api/v1/categories`

Lista el catálogo activo.

```json
{
  "data": [{ "id": "...", "code": "uncategorized", "source": "system_placeholder" }],
  "meta": { "note": "Official CRA categories are PENDING..." }
}
```

---

## POST `/api/v1/reports`

Crea un reporte canónico.

### Request
```json
{
  "channel": "pwa",
  "location": {
    "longitude": -74.85,
    "latitude": 10.98,
    "accuracyMeters": 12,
    "source": "device_gps"
  },
  "observedAt": "2026-11-27T18:00:00.000Z",
  "description": "Observación ciudadana",
  "categoryCode": "uncategorized",
  "clientReportId": "optional-uuid",
  "reporterHandle": "optional-opaque-handle",
  "triage": {
    "tipo": "TALA",
    "nivel": "AMARILLO",
    "zona": "BQ",
    "privacidad": "ANONIMO",
    "prioridad": "P1"
  }
}
```

`location.source`: `device_gps | map_pin | whatsapp_shared_location | unknown`

`triage` (opcional): snapshot del bot WhatsApp; se guarda en `report_events` (`type=created`), no como PII.

Campos PII explícitos (`email`, `phone`, etc.) son **rechazados** (objeto strict).

### Persistencia

1. Aplicar SQL: `packages/database/src/migrations/001_geographic.sql` + `002_reports.sql` en Supabase.
2. En `apps/web/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ENABLE_SUPABASE=true`.
3. El bot sigue igual: `REPORTS_API_URL` → `POST /api/v1/reports` (no habla con la DB).
4. Sin service role (o `REPORTS_PERSISTENCE=memory`): sigue en memoria de proceso.

### Response `201`
```json
{
  "data": {
    "id": "uuid",
    "trackingCode": "GDM-XXXXXXXX",
    "trackingSecret": "<once>",
    "status": "submitted",
    "category": { "code": "uncategorized", "source": "system_placeholder" },
    "observedAt": "...",
    "receivedAt": "..."
  }
}
```

---

## POST `/api/v1/reports/track`

### Request
```json
{ "trackingCode": "GDM-XXXXXXXX", "trackingSecret": "..." }
```

### Response `200`
Vista pública: status, categoría, fechas, evidenceCount, eventos resumidos.  
**Sin** reporter, secretos ni hashes.

---

## POST `/api/v1/reports/:id/evidences`

### Request
```json
{
  "mimeType": "image/jpeg",
  "contentBase64": "...",
  "sharedLocation": { "longitude": -74.85, "latitude": 10.98 },
  "mediaKind": "photo"
}
```

### Response `201`
Evidence + verifications + caveats:

- SHA-256 = integridad del archivo, no autenticidad de origen.
- Shared location ≠ EXIF GPS.
- EXIF puede faltar (p. ej. WhatsApp).
- Validación institucional pendiente.

---

## PATCH `/api/v1/reports/:id/status`

```json
{ "toStatus": "under_review", "reason": "triage" }
```

Transiciones inválidas → `400`.

---

## POST `/api/v1/reports/:id/alerts`

Crea alerta **preliminary** explícita.

```json
{
  "title": "Posible afectación",
  "rationale": "Evidencia + prioridad geo pendiente de cruce",
  "createdBy": "system_rule"
}
```

No autoriza intervenciones legales.

---

## GET `/api/v1/reports/:id/events`

Historial de `ReportEvent` (auditoría de dominio).

---

## Errores

| HTTP | Casos |
|------|-------|
| 400 | Payload inválido / transición ilegal / mime no permitido |
| 401 | Credenciales de seguimiento inválidas |
| 404 | Recurso inexistente |

---

## Zod / packages

- Inputs: `@guardianes/validation`
- Tipos: `@guardianes/contracts`
- Lógica: `@guardianes/report-engine`, `@guardianes/evidence-engine`
