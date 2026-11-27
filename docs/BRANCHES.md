# Sistema de ramas — Guardianes del Manglar

Mismo método que en el juego (Hold the Box).

| Rama | Para qué | Quién escribe |
|---|---|---|
| **`main`** | Producción / deploy **Vercel** | Solo **Jose**, vía PR **`dev` → `main`** |
| **`dev`** | Integración diaria del equipo | Solo vía **PR** desde ramas de issue |
| **`issue/<n>-slug`** | Trabajo de un issue concreto (sale de `dev`) | Quien tenga el issue asignado |
| **`work/<persona>`** | Rama personal opcional (sync desde `dev`) | Cada quien |

CI corre en PRs a `dev`/`main`. Deploy a Vercel solo al entrar algo a **`main`** (workflow `Deploy Vercel`).

## Flujo

```
issue (GitHub)  →  rama issue/<n>-slug desde dev
                      ↓
                 PR → dev  (revisión Jose)
                      ↓
                 integración en dev
                      ↓
         PR dev → main  (solo Jose)
```

### Reglas

1. **Nadie hace push directo a `dev` ni a `main`.** Todo entra por PR.
2. **`main` solo recibe PRs desde `dev`**, y solo Jose los mergea.
3. **`dev` solo recibe PRs** desde `issue/...` (o `work/...` si hace falta).
4. Un issue → una rama → un PR (o PRs pequeños del mismo issue).
5. En el body del PR: `Closes #<n>`.

### Cómo empezar un issue

```bash
git fetch origin
git checkout dev
git pull origin dev
git checkout -b issue/<n>-slug   # número del issue + slug corto
# …trabajar, commit…
git push -u origin HEAD
gh pr create --base dev --title "…" --body "Closes #<n>"
```

### Ramas personales

| Persona | GitHub | Rama `work/*` |
|---|---|---|
| Jose | `@Jgmaza` | `work/jose` |
| Diógenes | `@DiogenesCelis` | `work/diogenes` |
| Luis | `@turriago` | `work/luis` |

Chatbot: carpeta `apps/whatsapp-bot/` (ver su README).  
Diseño / entregas visuales: `deliveries/<persona>/` o `docs/ux/`.  
Árboles de decisión del bot: `docs/bot/` o dentro de `apps/whatsapp-bot/docs/`.
