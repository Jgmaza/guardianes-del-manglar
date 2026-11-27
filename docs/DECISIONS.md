# DECISIONS — Decisiones de arquitectura y producto

**Estado del documento:** `IMPLEMENTED` (registro vivo)  
**Regla:** todo cambio de decisión se hace en PR que actualice este archivo + docs afectados.

Leyenda: `CONFIRMED` · `PROPOSED` · `PENDING` · `IMPLEMENTED`

---

## 1. Decisiones confirmadas `CONFIRMED`

| ID | Decisión | Razón |
|----|----------|-------|
| C1 | El Git del producto vive en `ManglarHack/apps/` | Separar notas/datos personales del host del repo colaborativo |
| C2 | Nombre de producto: **Guardianes del Manglar** | Identidad de pitch y repo |
| C3 | App web en **React + TypeScript + Next.js App Router** | Velocidad de equipo + tipado + Vercel |
| C4 | Canales de entrada: **PWA** y **WhatsApp** al mismo sistema de reportes | Alcance del reto + accesibilidad |
| C5 | **Un reporte canónico** independiente del canal | Evita dobles verdades |
| C6 | Reporte ≠ alerta validada | Cumplir principio institucional |
| C7 | Geo autoritativo en **backend** (PostGIS) | Integridad y rendimiento |
| C8 | **Leaflet** en cliente | Suficiente para MVP mapas |
| C9 | Objetivo de datos: **PostgreSQL + PostGIS** | PIP sobre polígonos C.R.A. |
| C10 | **Supabase** es el candidato oficial a evaluar/usar para DB/Auth/Storage | Tiempo de hackatón |
| C11 | Deploy web orientado a **Vercel** | Compatibilidad pedida |
| C12 | Reutilizar chatbot **JS** existente; no reescribir sin necesidad | Principio de economía |
| C13 | Conservar originales C.R.A.; no inventar atributos | Credibilidad y ética de datos |
| C14 | IA no reemplaza validación institucional | Principio del brief |
| C15 | Solicitudes de intervención son **preliminares**, nunca autorización | Riesgo legal |
| C16 | Identidad del denunciante separada de datos ambientales | Privacidad / anonimato |
| C17 | Preferir monorepo modular a microservicios | Simplicidad |
| C18 | Documentación con etiquetas de estado honestas | Jurado y onboarding |

---

## 2. Decisiones provisionales `PROPOSED`

| ID | Decisión | Razón | Qué falta para confirmar |
|----|----------|-------|---------------------------|
| P1 | pnpm workspaces + Turborepo | Estándar monorepo TS | → pasó a `IMPLEMENTED` (I3) |
| P2 | Una sola app web multi-rol (Next.js) | Un deploy, menos superficie | Validar UX roles |
| P3 | API vía Route Handlers / server de Next + Supabase (provisional) | Evitar microservicio extra en hackatón | Confirmar PostGIS + límites |
| P4 | Offline = cola IndexedDB + sync idempotente | Cumplir “con/sin conexión” | Spike PWA |
| P5 | Export MVP = GeoJSON + CSV | Formato abierto entregable | Implementación |
| P6 | Gamificación mínima | Responder sostenibilidad sin overbuild | Diseño mecánico |
| P7 | Capa mapa simplificada / filtrada | 14.7k polígonos pesan | Pipeline simplify |
| P8 | Realtime dashboard vía poll o Supabase Realtime | “Tiempo real” pragmático | Decisión de infra |
| P9 | ~~Vite~~ → **Next.js App Router** | Pedido explícito de fundación + Vercel | Confirmado en scaffold |

---

## 3. Decisiones pendientes `PENDING`

| ID | Tema | Opciones en juego | Bloquea |
|----|------|-------------------|---------|
| X1 | Ubicación del código del chatbot JS | Path local / otro repo | `apps/whatsapp-bot` |
| X2 | Proveedor WhatsApp | Por definir; no inventar | INTEGRATIONS WhatsApp |
| X3 | Runtime API definitivo | Edge Functions vs Node Vercel vs contenedor | ARCHITECTURE runtime |
| X4 | PostGIS en proyecto Supabase | ¿Habilitado? ¿límites? | Ingest + PIP |
| X5 | Catálogo de tipos de observación | Lista corta acordada con dominio | Formularios |
| X6 | Proveedor IA y casos de uso exactos | Ninguno / visión / texto | Ficha técnica |
| X7 | Licencia y publicación del KMZ | Repo privado de datos / solo derivado | `data/raw` público |
| X8 | Política PII / retención | Plazos, cifrado, acceso C.R.A. | Identity store |
| X9 | Basemap tiles | OSM u otro | Mapas |
| X10 | Org/nombre GitHub remoto | — | Publicación entregable |
| X11 | Versiones Node/pnpm | LTS pin | CI |

---

## 4. Implementado en código `IMPLEMENTED`

| ID | Qué | Notas |
|----|-----|-------|
| I1 | Documentación inicial del repositorio | README + docs listados en el brief de fundación |
| I2 | `git init` en `ManglarHack/apps/` | Remoto GitHub aún `PENDING` |
| I3 | Monorepo pnpm + Turborepo | Workspaces `apps/*`, `packages/*`, `tools/*` |
| I4 | `apps/web` Next.js App Router + Tailwind | Página inicial de fundación |
| I5 | Packages foundation | contracts, database, geo/evidence/report-engine, ui, validation |
| I6 | Zod, ESLint, Prettier, Vitest, Playwright config | typecheck/lint/test/build verificados |
| I7 | Supabase client factories sin credenciales | `.env.example` + `vercel.json` |
| I8 | Pipeline geo KMZ→NDJSON + inspección documentada | `data/raw`, `data/processed`, docs GEO_* |
| I9 | Schema PostGIS `geographic_layers` / `geographic_features` + GiST | migración SQL; apply live `PENDING` |
| I10 | Dominio Report/Evidence/Alert + API v1 + tracking secreto | motores + tests; store memoria / SQL listo |
| I11 | Catálogo de categorías configurable sin taxonomía C.R.A. inventada | placeholder `uncategorized` |
| I12 | Experiencias ciudadano + PWA offline + dashboard C.R.A. + Leaflet fixture | rutas `/`, `/reportar`, `/seguimiento`, `/cra` |

**Aún no `IMPLEMENTED`:** carga live a Supabase, WhatsApp adapter, capa C.R.A. completa en browser, IA.

---

## 5. Decisiones explícitamente rechazadas (por ahora)

| Idea | Por qué no |
|------|------------|
| Microservicios por dominio | Complejidad injustificada en hackatón |
| PIP solo en el browser como fuente de verdad | Manipulable y pesado |
| Tratar todo reporte como alerta | Viola principio C.R.A. |
| Inventar manglares/atributos “oficiales” | Riesgo de desinformación |
| App nativa obligatoria | Fuera de entregable; PWA basta |

---

## 6. Cómo actualizar este registro

1. Abrir PR.
2. Mover ítems `PENDING` → `PROPOSED`/`CONFIRMED` con razón.
3. Si se implementa en código, marcar `IMPLEMENTED` y enlazar PR/commit.
4. Sincronizar README / ARCHITECTURE / INTEGRATIONS si el cambio es visible.
