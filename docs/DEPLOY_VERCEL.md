# Deploy — Vercel (`main`)

`dev` = integración. `main` = producción (este workflow).

## Secrets de GitHub (repo → Settings → Secrets)

| Secret | Dónde sacarlo |
|---|---|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` tras `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

## Enlazar el proyecto (una vez, local)

```bash
cd guardianes-del-manglar   # raíz del monorepo (= ManglarHack/apps)
npx vercel login
npx vercel link             # crea .vercel/ (gitignored)
# Copia orgId / projectId a los secrets de GitHub
```

Root Directory en Vercel: **`apps/web`**.  
Framework: Next.js — ver `apps/web/vercel.json`.  
Node.js en el proyecto Vercel: **22.x**.

## Flujo

1. PR `issue/…` → `dev` (CI verde)
2. PR `dev` → `main` (solo Jose)
3. Push a `main` dispara **Deploy Vercel (main)**
