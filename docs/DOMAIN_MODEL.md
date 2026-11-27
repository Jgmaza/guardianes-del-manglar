# DOMAIN_MODEL — Guardianes del Manglar

**Estado del documento:** `IMPLEMENTED` (modelo + motores + API foundation)  
**Persistencia live Supabase:** migración SQL `IMPLEMENTED` · repository write-through `IMPLEMENTED` (requiere service role + migraciones aplicadas)

---

## 1. Definiciones de dominio

| Término | Definición | Estado |
|---------|------------|--------|
| **Report** | Registro canónico multi-canal de una observación ambiental | `CONFIRMED` |
| **ReportCategory** | Entrada de catálogo configurable (`system_placeholder` / `local_config` / `cra_official`) | `CONFIRMED` |
| **Evidence** | Foto/video + hash + metadatos (EXIF si existe) | `CONFIRMED` |
| **EvidenceVerification** | Resultado de chequeos automáticos de consistencia/integridad | `CONFIRMED` |
| **ReportVerification** | Chequeo a nivel reporte (automatizado o revisión institucional) | `CONFIRMED` |
| **ReportEvent** | Historial append-only de hechos del ciclo de vida | `CONFIRMED` |
| **Alert** | Aviso institucional; `preliminary` no es autorización | `CONFIRMED` |
| **ReporterReference** | Datos de contacto/handle **separados** del reporte ambiental | `CONFIRMED` |
| **Código + secreto de seguimiento** | Credencial opaca de consulta ciudadana | `CONFIRMED` |

---

## 2. Diferencias críticas

| Concepto | Significa | No significa |
|----------|-----------|--------------|
| Ubicación compartida | Punto enviado por canal/usuario | Que la foto se tomó ahí |
| GPS EXIF | Metadato del archivo si existe | Prueba forense automática |
| Fecha de captura (EXIF) | Claim del dispositivo | Fecha de hechos institucionales |
| Fecha de recepción | Cuándo el sistema recibió el artefacto | Cuándo ocurrió el evento |
| SHA-256 | Integridad de bytes almacenados | Autenticidad de origen |
| Validación institucional | Decisión C.R.A. | Resultado automático de IA/reglas |
| Alerta preliminar | Aviso operativo explícito | Permiso / sanción / alerta automática por solo crear reporte |

---

## 3. Relaciones

```text
ReporterReference? ──optional──► Report ──1:N──► Evidence
                                   │                 │
                                   │                 └── EvidenceVerification
                                   ├── ReportCategory?
                                   ├── ReportVerification
                                   ├── ReportEvent (1:N)
                                   └── Alert (0:N, explícitas)
```

WhatsApp y PWA producen el **mismo** `Report`.

---

## 4. Estados de reporte

`draft → queued_offline → submitted → geo_processed → under_review → needs_info → accepted → rejected → alerted`

Transiciones válidas: `@guardianes/report-engine` (`canTransition`).

`accepted` ≠ alerta. La alerta se crea con endpoint/servicio explícito.

---

## 5. Categorías

Catálogo configurable. Seed actual: `uncategorized` con `source=system_placeholder`.

**No** se inventan categorías oficiales C.R.A.  
Cuando la autoridad entregue el listado, se registran con `source=cra_official`.

---

## 6. Anonimato

- Crear reporte sin cuenta.
- `ReporterReference` fuera del núcleo ambiental.
- Dashboard/export/track sin identidad ni secretos.
- Secreto de seguimiento hasheado en reposo; IDs UUID no son credenciales de consulta.

---

## 7. Implementación

| Capa | Ubicación | Estado |
|------|-----------|--------|
| Tipos | `packages/contracts` | `IMPLEMENTED` |
| Zod | `packages/validation` | `IMPLEMENTED` |
| Evidencias | `packages/evidence-engine` | `IMPLEMENTED` |
| Reportes | `packages/report-engine` | `IMPLEMENTED` |
| SQL | `packages/database/.../002_reports.sql` | `IMPLEMENTED` |
| HTTP | `apps/web/src/app/api/v1/*` | `IMPLEMENTED` (memoria o Supabase) |
| Persistencia | `packages/database` + `PersistingReportService` | `IMPLEMENTED` |
| Docs API | `docs/REPORTS_API.md` | `IMPLEMENTED` |
