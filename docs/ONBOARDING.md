# Onboarding — Guardianes del Manglar

Repo: https://github.com/Jgmaza/guardianes-del-manglar

## 1) Arranque

1. Acepta la invitación de GitHub.
2. Clona y parte siempre de **`dev`**:

```bash
git clone https://github.com/Jgmaza/guardianes-del-manglar.git
cd guardianes-del-manglar
git checkout dev && git pull
git checkout -b issue/<n>-slug
```

3. Instala y corre la web:

```bash
pnpm install
pnpm dev   # → http://localhost:3000
```

## 2) Dónde va cada cosa

| Qué entregas | Dónde | Rama |
|---|---|---|
| Visuales / reseña turista-habitante | `deliveries/<tu-nombre>/` + link Figma/Pencil | `issue/<n>-…` |
| Chatbot WhatsApp | `apps/whatsapp-bot/` | `issue/<n>-…` |
| Árbol de decisión / clasificación | `docs/bot/` (y refs en el issue) | `issue/<n>-…` |
| Código web / API | `apps/web/`, `packages/` | `issue/<n>-…` |
| Docs de producto | `docs/` | `issue/<n>-…` |

**No subas a `dev` ni a `main` en directo.** Solo PRs a `dev`.

## 3) Flujo diario

```
issue/#N → rama issue/N-slug desde dev → PR → dev → (Jose) → main
```

Detalle: [`BRANCHES.md`](./BRANCHES.md).  
API de reportes: [`REPORTS_API.md`](./REPORTS_API.md).
