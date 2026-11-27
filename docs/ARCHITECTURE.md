# ARCHITECTURE — Guardianes del Manglar

**Estado del documento:** `IMPLEMENTED` (fundación)  
**Scaffold monorepo / Next.js:** `IMPLEMENTED` · negocio `PENDING`

---

## 1. Arquitectura general

Estilo: **monorepo modular con un backend de aplicación** (no microservicios).

```text
┌──────────────────────┐     ┌─────────────────┐
│ apps/web (Next.js)   │     │ WhatsApp Bot JS │
│ App Router + Tailwind│     │ (PENDING path)  │
└──────────┬───────────┘     └────────┬────────┘
           │ server/client            │ webhooks
           └──────────┬───────────────┘
                      ▼
        packages: contracts · validation · report/geo/evidence-engine
        packages/database → Supabase (sin secretos en repo)
        tools/geo-import → ingest KMZ (placeholder)
                      ▼
     ┌──────────────────────────────────┐
     │ Supabase / PostgreSQL + PostGIS  │  (proyecto real PENDING)
     └──────────────────────────────────┘
```

Principios `CONFIRMED`: un reporte multi-canal; geo en backend; reporte ≠ alerta; IA no valida; datos C.R.A. conservados.

---

## 2. Ubicación del repositorio

| Path host | Rol |
|-----------|-----|
| `ManglarHack/` | Carpeta de trabajo personal del equipo (notas, KMZ, extractos) — **fuera** de este Git |
| `ManglarHack/apps/` | **Raíz del repositorio Git** de Guardianes del Manglar `CONFIRMED` |

La estructura interna del monorepo (cuando se cree el scaffold) es **relativa a esta raíz**.

---

## 3. Estructura de monorepo `IMPLEMENTED` (scaffold)

```text
.                          # git root = ManglarHack/apps/
├── apps/
│   └── web/               # Next.js App Router + Tailwind
├── packages/
│   ├── contracts/
│   ├── database/
│   ├── geo-engine/
│   ├── evidence-engine/
│   ├── report-engine/
│   ├── ui/
│   └── validation/
├── tools/
│   └── geo-import/        # Placeholder ingest KMZ
├── docs/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

> Path en disco: `ManglarHack/apps/apps/web` (host `apps/` + monorepo `apps/web`).  
> `apps/whatsapp-bot` y `data/*` siguen `PENDING`.

---

## 4. Responsabilidades

### `apps/web` `IMPLEMENTED` (fundación) / negocio `PENDING`
- Next.js App Router + Tailwind; landing de fundación.
- Futuro: UX por rol, captura, Leaflet, offline, dashboard.
- **No** calcula point-in-polygon oficial ni altera capa C.R.A.

### `apps/whatsapp-bot` `PENDING`
- Conversación y recolección de medios/ubicación.
- Adaptación al contrato canónico de reporte.

### `packages/contracts` · `validation` · engines · `ui` · `database` `IMPLEMENTED` (stubs)
- Contratos, Zod, helpers de reporte/geo/evidencia, UI base, factories Supabase.
- Sin persistencia real ni PIP PostGIS todavía.

### `tools/geo-import` `IMPLEMENTED` (placeholder)
- Plan de importación conservador; ingest real `PENDING`.
- No inventa atributos C.R.A.

### `data/*` `PENDING`
- `raw` / `processed` cuando se versionen derivados (ver X7).

---

## 5. Flujo de datos

### Ingesta C.R.A. (batch)
`KMZ/KML raw` → script ingest → tablas/geometrías PostGIS + metadatos de campos observados → (opcional) GeoJSON simplificado para UI.

### Reporte en tiempo de uso
1. Canal (PWA/WhatsApp) envía payload canónico.
2. API valida, guarda reporte + evidencias (Storage).
3. API ejecuta join espacial → adjunta resultado geo (prioridad/UH **solo si** existen en capa).
4. C.R.A. revisa en dashboard → puede crear alerta / solicitud preliminar.
5. Export lee vistas/tablas sanitizadas (sin PII innecesaria).

---

## 6. Integraciones externas

Ver [`INTEGRATIONS.md`](INTEGRATIONS.md).

| Sistema | Rol | Estado |
|---------|-----|--------|
| Vercel | Hosting PWA (± API) | `PROPOSED` |
| Supabase | DB/Auth/Storage/PostGIS | `PROPOSED` |
| WhatsApp provider | Transporte | `PENDING` |
| IA provider | Sugerencias | `PENDING` |
| Tiles mapa | Basemap Leaflet | `PENDING` (OSM u otro) |
| Capa C.R.A. | Zonificación | Archivo entregado al equipo; ingest `PENDING` |

---

## 7. Justificación de decisiones

| Elección | Por qué |
|----------|---------|
| Monorepo + un API | Velocidad hackatón, un dominio, menos ops |
| PWA única multi-rol | Un deploy, entregable claro, offline viable |
| PostGIS | Point-in-polygon serio sobre ~14k polígonos |
| Leaflet | Suficiente, liviano, sin vendor lock pesado |
| Supabase (candidato) | Auth+Storage+Postgres rápido; PostGIS a verificar |
| Bot separado | Reutilizar JS existente sin forzar rewrite React |
| Geo en backend | Evitar manipulación cliente y centralizar autoridad |
| Tags CONFIRMED/… | Honestidad ante jurado y equipo |

Decisiones abiertas (runtime API, vendor WhatsApp, etc.): [`DECISIONS.md`](DECISIONS.md).

---

## 8. Lo que esta arquitectura **no** es

- No es un GIS corporativo completo.
- No es un motor de permisos ambientales vinculante.
- No está `IMPLEMENTED` hasta existir scaffold y servicios reales.
