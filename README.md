# Guardianes del Manglar

**Estado:** fundación técnica `IMPLEMENTED` · funcionalidades de negocio `PENDING`  
**Etiquetas:** `CONFIRMED` · `PROPOSED` · `PENDING` · `IMPLEMENTED`

---

## Qué es

Guardianes del Manglar es una herramienta digital de **ciencia ciudadana** para monitorear el ecosistema de manglar del Atlántico colombiano (enfoque Barranquilla / jurisdicción C.R.A.), capturar observaciones geolocalizadas y entregar a la autoridad ambiental **evidencia verificable** y **alertas tempranas** para la toma de decisiones.

Este repositorio es la fuente de verdad técnica y de producto del equipo.

---

## Problema que resuelve

La C.R.A. necesita saber, con rapidez y trazabilidad:

1. **Dónde** ocurre una amenaza o cambio en el manglar **ahora**, y con qué **prioridad de conservación** oficial coincide.
2. **Cómo validar** que un dato ciudadano es confiable antes de usarlo en expediente o alerta oficial.
3. **Cómo sostener** la participación de colegios y turistas más allá del evento.

---

## Usuarios objetivo

| Actor | Necesidad principal |
|-------|---------------------|
| Ciudadano / turista | Reportar fácil, con o sin cuenta, con o sin red |
| Colegio / voluntario (“Guardián”) | Participar de forma sostenida y formativa |
| Organización | Coordinar reportes y evidencias |
| Administrador C.R.A. | Revisar, validar, alertar y exportar datos abiertos |

---

## Funcionalidades principales

> Alcance: [`docs/PRODUCT_SCOPE.md`](docs/PRODUCT_SCOPE.md).

Captura geolocalizada, PWA + WhatsApp, cruce con prioridades C.R.A., evidencias, validación, dashboard, export abierto, solicitudes preliminares y participación.

Dominio de **reportes/evidencias/alertas preliminares** + API v1: `IMPLEMENTED` (store in-memory).  
UI ciudadana (reportar/seguimiento), PWA offline y dashboard C.R.A. con mapa Leaflet (fixture): `IMPLEMENTED`.  
WhatsApp adapter: `PENDING`.

---

## Arquitectura general

```text
apps/web (Next.js) ──┐
                     ├──► packages/* (contracts, engines, validation, ui, database)
WhatsApp (PENDING) ──┘         │
                               └── Supabase / PostGIS (configurado, sin credenciales)
```

Detalle: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Stack tecnológico

| Capa | Tecnología | Estado |
|------|------------|--------|
| Monorepo | pnpm workspaces + Turborepo | `IMPLEMENTED` |
| Web | Next.js App Router + React + TypeScript | `IMPLEMENTED` |
| Estilos | Tailwind CSS | `IMPLEMENTED` |
| Validación | Zod (`@guardianes/validation`) | `IMPLEMENTED` |
| Calidad | ESLint, Prettier, Vitest, Playwright (preparado) | `IMPLEMENTED` |
| Datos | Supabase client factories (sin secretos) | `IMPLEMENTED` (stubs) |
| PostGIS / ingest KMZ | pipeline + SQL GiST | `IMPLEMENTED` (carga live DB `PENDING`) |
| Mapas Leaflet | — | `PENDING` |
| WhatsApp / IA | — | `PENDING` |
| Deploy | Vercel (`vercel.json`) | `PROPOSED` (listo para configurar) |

---

## Estructura del monorepo

```text
apps/web/                 Next.js App Router
packages/contracts/       Tipos de dominio
packages/database/        Clientes Supabase (anon / service)
packages/geo-engine/      Helpers geo de fundación
packages/evidence-engine/ Reglas mínimas de evidencia
packages/report-engine/   Tracking / draft parse
packages/ui/              Componentes UI compartidos
packages/validation/      Schemas Zod
tools/geo-import/         Placeholder de ingest KMZ
docs/                     Fuente de verdad del equipo
```

---

## Requisitos

- Node.js ≥ 20
- pnpm 9.x (`packageManager`: `pnpm@9.15.0`)

Guía completa: [`docs/INSTALL.md`](docs/INSTALL.md).

---

## Cómo instalar y ejecutar

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e   # requiere: pnpm --filter @guardianes/web exec playwright install
```

---

## Estado actual del desarrollo

| Área | Estado |
|------|--------|
| Documentación de fundación | `IMPLEMENTED` |
| Scaffold monorepo + Next.js + paquetes | `IMPLEMENTED` |
| Página inicial | `IMPLEMENTED` |
| typecheck / lint / test / build | Verificados en fundación |
| Schema DB / PostGIS / ingest KMZ | `PENDING` |
| Captura, dashboard, WhatsApp, alertas | `PENDING` |

**Fase actual:** F1 completa. Siguiente: F2 (datos C.R.A.) / F3 (API reportes) según [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [INSTALL](docs/INSTALL.md) | Instalación y scripts |
| [PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md) | Reto y supuestos |
| [PRODUCT_SCOPE](docs/PRODUCT_SCOPE.md) | MVP |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Arquitectura |
| [DOMAIN_MODEL](docs/DOMAIN_MODEL.md) | Dominio |
| [DECISIONS](docs/DECISIONS.md) | Decisiones |
| [CONTRIBUTING](docs/CONTRIBUTING.md) | Contribución |
| [ROADMAP](docs/ROADMAP.md) | Fases |
| [INTEGRATIONS](docs/INTEGRATIONS.md) | Integraciones |
| [TEAM_GUIDE](docs/TEAM_GUIDE.md) | Guía del equipo |

---

## Principios `CONFIRMED`

1. Un reporte es independiente de su canal de origen.
2. Un reporte no equivale a una alerta validada.
3. La IA no reemplaza la validación institucional.
4. La evaluación de permisos es preliminar, nunca una autorización.
5. La identidad del denunciante se separa de los datos ambientales.
6. El procesamiento geográfico pertenece al backend.
7. Los datos originales de la C.R.A. deben conservarse.
8. Preferir un diseño simple antes que microservicios.
