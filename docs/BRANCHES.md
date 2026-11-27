# Sistema de ramas — Guardianes del Manglar

`main` y `dev` están **al mismo nivel**: se puede pushear a cualquiera; no hace falta PR entre ellas.

| Rama | Para qué | Quién escribe |
|---|---|---|
| **`main`** | Producción / deploy **Vercel** | Equipo (push directo) |
| **`dev`** | Integración / pruebas | Equipo (push directo) |
| **`issue/<n>-slug`** | Trabajo de un issue (opcional) | Quien tenga el issue |
| **`work/<persona>`** | Rama personal opcional | Cada quien |

CI puede correr en pushes/PRs a `dev`/`main`. Deploy a Vercel al entrar cambios a **`main`** (workflow `Deploy Vercel`).

## Flujo

```
trabajo local  →  push a main   (prod)
               →  push a dev    (integración)
               →  rama issue/… o work/… (opcional)
```

### Reglas

1. **`main` y `dev` son pares.** No hay gate `dev → main` ni PR obligatorio.
2. Push directo a `main` / `dev` está permitido. **Sin force-push ni borrar** esas ramas (protección GitHub).
3. Ramas `issue/…` o `work/…` son opcionales para trabajo aislado; se pueden mergear o cherry-pick a `main`/`dev` como convenga.
4. Si abres un issue: en el commit/PR opcional usa `Closes #<n>`.

### Cómo trabajar

```bash
git fetch origin
git checkout main   # o: git checkout dev
git pull
# …trabajar, commit…
git push origin HEAD
```

Rama de issue (opcional):

```bash
git checkout -b issue/<n>-slug
# …trabajar…
git push -u origin HEAD
# merge/cherry-pick a main o dev cuando esté listo
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
