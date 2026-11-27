# Instalación — Guardianes del Manglar

**Estado:** `IMPLEMENTED` (fundación monorepo)

## Requisitos

- Node.js **≥ 20**
- [pnpm](https://pnpm.io/) **9.x** (el repo declara `packageManager`: `pnpm@9.15.0`)
- Git

Opcional más adelante:

- Proyecto Supabase con PostGIS (`PENDING` credenciales)
- Cuenta Vercel para deploy
- Navegadores para Playwright (`pnpm exec playwright install`)

## Clonar e instalar

```bash
cd ManglarHack/apps   # raíz del repositorio Git
pnpm install
```

## Variables de entorno

```bash
cp .env.example apps/web/.env.local
# edita apps/web/.env.local — deja vacío Supabase hasta tener proyecto real
```

- `NEXT_PUBLIC_*`: únicas variables visibles en el navegador (URL + anon key).
- `SUPABASE_SERVICE_ROLE_KEY` / `DATABASE_URL`: **solo servidor**. Nunca en el cliente ni en Git.

## Scripts

Desde la raíz del monorepo:

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Next.js en http://localhost:3000 |
| `pnpm build` | Build de workspaces (turbo) |
| `pnpm typecheck` | TypeScript strict en paquetes + web |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (unit) |
| `pnpm test:e2e` | Playwright (requiere browsers instalados) |
| `pnpm format` | Prettier |
| `pnpm geo:inspect` | Inspección KMZ/KML C.R.A. |
| `pnpm geo:normalize` | Normaliza a `data/processed` |
| `pnpm geo:query-point -- <lon> <lat>` | Consulta local de cobertura |
| `pnpm geo:query-bbox -- <minLon> <minLat> <maxLon> <maxLat>` | Consulta local por bbox |

## Rutas de la app (`pnpm dev`)

| Ruta | Experiencia |
|------|-------------|
| `/` | Bienvenida ciudadana |
| `/reportar` | Wizard foto → ubicación → detalles (offline-ready) |
| `/seguimiento` | Código + secreto / cola local |
| `/cra` | Dashboard C.R.A. (mapa fixture + filtros) |

## Verificación de fundación

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Deploy Vercel `PROPOSED`

- Root Directory: raíz de este repo (`ManglarHack/apps` en el host).
- Install: `pnpm install`
- Build: `pnpm turbo run build --filter=@guardianes/web` (ver `vercel.json`)
- Framework: Next.js
- Configurar env en el dashboard de Vercel (nunca en el código)

## Qué aún no está

- Captura de reportes, dashboard C.R.A., ingest KMZ, WhatsApp e IA: ver `ROADMAP.md` (`PENDING`).
