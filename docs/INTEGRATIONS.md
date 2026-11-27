# INTEGRATIONS — Dependencias externas

**Estado del documento:** `IMPLEMENTED` (inventario)  
**Regla:** no listar credenciales; no simular conexiones productivas.

Leyenda de estado por integración: `CONFIRMED` (se usará / ya acordado) · `PROPOSED` · `PENDING` · `IMPLEMENTED` (cableado en código).

---

## 1. WhatsApp

| Campo | Valor |
|-------|-------|
| Propósito | Canal de entrada de reportes (texto, ubicación, medios) |
| Componente interno | `apps/whatsapp-bot` `PROPOSED` |
| Proveedor | **No definido** — no inventar nombre de vendor |
| Código existente | Reutilizar chatbot JS del equipo — **path `PENDING`** |
| Contrato hacia el core | Adapter → API de creación de reporte canónico |
| Estado integración | `PENDING` |
| Riesgos | Webhooks, media download, verificación, costos, ToS |

Hasta X1/X2 en `DECISIONS.md`, la demo oficial puede basarse en PWA sin fingir WhatsApp productivo.

---

## 2. Supabase

| Campo | Valor |
|-------|-------|
| Propósito | PostgreSQL, Auth, Storage de evidencias; candidato a Realtime |
| Extensión crítica | **PostGIS** — habilitación a verificar |
| Estado | `PROPOSED` (plataforma) · proyecto real `PENDING` · client factories `IMPLEMENTED` (sin credenciales) |
| Secretos | URL/keys solo en env; nunca en Git |
| Pendiente | Confirmar PostGIS, límites de storage, políticas RLS |

No hay proyecto enlazado en este repo todavía.

---

## 3. Vercel

| Campo | Valor |
|-------|-------|
| Propósito | Hosting de la PWA; posible hosting de API según D-runtime |
| Estado | `PROPOSED` · cuenta/proyecto `PENDING` · deploy `PENDING` |
| Notas | Cold start / duración de funciones pueden afectar PIP pesado — ver DECISIONS X3 |

---

## 4. Datos geográficos de la C.R.A.

| Campo | Valor |
|-------|-------|
| Entrega al equipo | Archivo **KMZ** (KML 2.2 OGC, WGS84) |
| Contenido observado | `doc.kml` (+ XSL); geometrías Polygon/MultiGeometry; ~14.7k features en el análisis del equipo |
| Atributos | Solo los presentes tras inspección del KML; **prohibido inventar** |
| Ubicación actual | Material de trabajo en carpeta host `ManglarHack/docs/` (fuera de este Git) |
| En este repo | `data/raw` / `data/processed` aún `PENDING` (y licencia X7) |
| Pipeline | `tools/geo-import` inspección + normalización `IMPLEMENTED` |
| Persistencia | migración PostGIS `IMPLEMENTED` · carga live Supabase `PENDING` |
| Uso runtime | PostGIS GiST (autoritativo) + consulta NDJSON local de verificación |
| Estado integración | Raw/processed locales `IMPLEMENTED` · DB remota `PENDING` |

Cualquier campo mostrado en UI como “oficial” debe trazarse al ingest documentado.

---

## 5. IA y proveedores externos

| Campo | Valor |
|-------|-------|
| Rol permitido | Sugerencias (p. ej. clasificación tentativa, ayuda a consistencia) |
| Rol prohibido | Validación institucional / alerta automática vinculante |
| Proveedor | `PENDING` — no asumir OpenAI/Anthropic/etc. |
| Estado | `PENDING` · opcional P1 |
| Declaración | Obligatorio en ficha técnica si se usa, con estado real |

Otras libs/servicios (tiles, email, SMS, analytics): `PENDING` hasta elegirlos.

---

## 6. Leaflet / basemap

| Campo | Valor |
|-------|-------|
| Librería mapa | Leaflet `CONFIRMED` (elección) · uso en código `PENDING` |
| Tiles | `PENDING` (p. ej. OSM u otro con atribución) |

---

## 7. Matriz resumen

| Integración | Decisión | Implementación en código |
|-------------|---------|---------------------------|
| WhatsApp provider | `PENDING` | `PENDING` |
| Bot JS reutilizado | `CONFIRMED` intención | `PENDING` (falta path) |
| Supabase | `PROPOSED` | factories `IMPLEMENTED` · proyecto `PENDING` |
| PostGIS | `CONFIRMED` necesidad | `PENDING` |
| Vercel | `PROPOSED` | `PENDING` |
| KMZ C.R.A. | `CONFIRMED` fuente | ingest `PENDING` |
| IA | `PENDING` | `PENDING` |
| Leaflet | `CONFIRMED` | mapa web `IMPLEMENTED` (fixture sample) |

---

## 8. Reportes / evidencias (API)

| Campo | Valor |
|-------|-------|
| Dominio | `@guardianes/report-engine` + `@guardianes/evidence-engine` |
| HTTP | `/api/v1/reports*` |
| Store actual | In-memory process singleton |
| SQL | `002_reports.sql` |
| Estado | Domain+API `IMPLEMENTED` · persistencia remota `PENDING` |

---

## 9. Criterio de honestidad

Si una integración no tiene credenciales, contrato o código cableado, su estado máximo es `PENDING` o `PROPOSED`.  
**Nunca** marcar `IMPLEMENTED` por existir solo un mock visual.
