# TEAM_GUIDE — Cómo trabajar en Guardianes del Manglar

**Estado:** `IMPLEMENTED` (guía)  
**Audiencia:** todo el equipo de hackatón

---

## 1. Cómo está organizado el proyecto

```text
ManglarHack/                 ← carpeta host (notas personales, KMZ de trabajo)
└── apps/                    ← REPOSITORIO GIT (este proyecto)
    ├── README.md
    ├── docs/                ← fuente de verdad compartida
    └── (código futuro: apps/*, packages/*, services/*, data/*, scripts/*)
```

| Capa | Dónde | Estado hoy |
|------|-------|------------|
| Producto / alcance | `docs/PRODUCT_SCOPE.md`, `ROADMAP.md` | Docs listos |
| Arquitectura | `docs/ARCHITECTURE.md`, `DECISIONS.md` | Docs listos |
| Dominio | `docs/DOMAIN_MODEL.md` | Docs listos |
| Integraciones | `docs/INTEGRATIONS.md` | Docs listos |
| App web | `apps/web` | `IMPLEMENTED` (landing / fundación) |
| Código bot | `apps/whatsapp-bot` | **aún no existe** `PENDING` |
| Engines / validation / ui | `packages/*` | `IMPLEMENTED` (stubs de fundación) |
| Geo import tool | `tools/geo-import` | `IMPLEMENTED` (inspect/normalize/query) |
| Datos C.R.A. | `data/raw`, `data/processed`, `data/inspection` | `IMPLEMENTED` (locales) |
| Docs geo | `docs/GEO_*.md` | `IMPLEMENTED` |

Las notas del host en `ManglarHack/docs/` (RETO, ANALISIS_KMZ, KMZ) son **contexto personal/de equipo fuera de Git**. No las trates como parte del remoto salvo que se decida versionar derivados en `data/` (DECISIONS X7).

---

## 2. Dónde encontrar cada funcionalidad

Cuando exista el scaffold, usa esta guía mental:

| Quiero… | Miro primero |
|---------|----------------|
| Entender el reto y supuestos | `PROJECT_CONTEXT.md` |
| Saber si algo entra en el MVP | `PRODUCT_SCOPE.md` |
| Estados de reporte / alerta | `DOMAIN_MODEL.md` |
| Endpoints HTTP de reportes | `REPORTS_API.md` |
| Lógica de dominio reportes | `packages/report-engine` |
| Hash/EXIF/verificación evidencias | `packages/evidence-engine` |
| Por qué Supabase/Leaflet/etc. | `ARCHITECTURE.md` + `DECISIONS.md` |
| Si WhatsApp/IA están listos | `INTEGRATIONS.md` |
| Qué construir ahora | `ROADMAP.md` (P0) |
| Cómo abrir PR | `CONTRIBUTING.md` |
| Captura ciudadana / offline | futuro `apps/web` |
| Dashboard C.R.A. | futuro `apps/web` (rutas admin) |
| Geo PIP / export | futuro `services/api` + PostGIS |
| Parse KMZ | futuro `scripts/ingest-kmz` |
| Tipos compartidos | futuro `packages/shared` |

**Hoy no busques carpetas de código: no están creadas.** Evita “inventar” paths en demos.

---

## 3. Cómo colaborar

1. **Lee antes de codear (obligatorio):**  
   README → PROJECT_CONTEXT → PRODUCT_SCOPE → DOMAIN_MODEL → DECISIONS (secciones PENDING).
2. **Toma una historia P0** del ROADMAP; no empieces por P2.
3. **Resuelve o documenta bloqueos** (`X*` / `U*`) en el PR; no asumas vendors.
4. **Actualiza docs** si cambias decisiones o estados de integración.
5. **Etiquetas honestas:** nunca marques `IMPLEMENTED` sin código o evidencia en el repo.
6. **Principios inviolables:** reporte ≠ alerta; IA no valida; no inventar atributos C.R.A.; permisos solo preliminares.

Flujo Git: ver `CONTRIBUTING.md`.

---

## 4. Qué debe revisar cada integrante antes de modificar código

### Antes de tocar PWA / UI
- [ ] ¿La historia está en MVP (P0/P1)?
- [ ] ¿Estoy calculando geo en cliente? → **no** como fuente de verdad
- [ ] ¿Estoy mostrando un campo C.R.A. no mapeado desde ingest? → **prohibido**
- [ ] ¿El copy confunde reporte con alerta o permiso? → corregir

### Antes de tocar API / DB
- [ ] ¿El contrato de reporte sigue siendo canal-agnóstico?
- [ ] ¿Identidad separada del núcleo ambiental?
- [ ] ¿Migraciones/docs de dominio actualizados?
- [ ] ¿Secretos fuera del repo?

### Antes de tocar WhatsApp / bot
- [ ] ¿Tenemos path del bot y vendor (X1/X2)? Si no → spike documentado, no fake prod
- [ ] ¿El bot solo adapta al API canónico?

### Antes de tocar datos C.R.A. / ingest
- [ ] ¿Raw inmutable y trazable?
- [ ] ¿Campos solo los inspeccionados?
- [ ] ¿Licencia/publicación (X7) respetada?

### Antes de mencionar IA en pitch o ficha
- [ ] ¿Proveedor real y caso de uso acotado?
- [ ] ¿Está claro que no valida alertas oficiales?

---

## 5. Ritual corto de sincronización (sugerido)

Diario / inicio de bloque:

1. ¿Qué P0 avanzó?
2. ¿Algún `PENDING` se resolvió? → actualizar DECISIONS + INTEGRATIONS.
3. ¿La demo de 7 minutos sigue contable con lo construido?

---

## 6. Contacto de decisiones

Si hay conflicto entre docs, el orden de desempate es:

1. `DECISIONS.md` (lo más reciente en `main`)
2. `PRODUCT_SCOPE.md` / `DOMAIN_MODEL.md` para producto
3. `ARCHITECTURE.md` para estructura
4. Abrir PR de corrección documental el mismo día

---

## 7. Estado actual en una frase

**Hay monorepo funcional (Next.js + paquetes + tests/build) y docs; aún no hay funcionalidades de negocio ni integraciones productivas.**
