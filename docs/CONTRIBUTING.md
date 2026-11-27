# CONTRIBUTING — Guardianes del Manglar

**Estado:** `IMPLEMENTED` (proceso) · tooling de CI/test aún `PENDING`

---

## 1. Cómo clonar el repositorio

```bash
# Cuando exista el remoto (PENDING):
git clone <URL_DEL_REPO>
cd <nombre-carpeta-repo>
```

En el entorno local del equipo, la raíz Git es:

`ManglarHack/apps/`

No commitear la carpeta padre `ManglarHack/docs/` (notas personales / KMZ de trabajo) dentro de este repositorio salvo decisión explícita sobre `data/` (ver DECISIONS X7).

---

## 2. Cómo instalar dependencias

```bash
# Node ≥ 20 y pnpm 9.x
pnpm install
cp .env.example apps/web/.env.local
```

Detalle: [`INSTALL.md`](INSTALL.md). **Nunca** subir secretos reales.

---

## 3. Convenciones de ramas `PROPOSED`

| Rama | Uso |
|------|-----|
| `main` | Estable; protegida cuando haya remoto |
| `docs/*` | Solo documentación |
| `feat/*` | Funcionalidad nueva |
| `fix/*` | Corrección |
| `chore/*` | Tooling, deps, scaffold |
| `spike/*` | Experimentos descartables |

Ejemplos: `docs/project-context`, `feat/report-capture`, `chore/monorepo-scaffold`.

---

## 4. Convenciones de commits `PROPOSED`

[Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add report tracking code generation
fix: correct geo match when point on boundary
docs: mark WhatsApp vendor as PENDING
chore: add pnpm workspace skeleton
```

- Un commit = una intención clara.
- No mezclar refactor masivo con feature sin necesidad.
- Si cambia una decisión, mencionar `DECISIONS` en el cuerpo.

---

## 5. Cómo crear Pull Requests `PROPOSED`

1. Branch desde `main` actualizado.
2. Cambios acotados; actualizar docs si cambia comportamiento o decisiones.
3. PR con:
   - Resumen (qué / por qué)
   - Estado de integración tocada (`PENDING`/`IMPLEMENTED`)
   - Screenshots solo si hay UI
4. Checklist:
   - [ ] No secretos
   - [ ] No datos C.R.A. inventados
   - [ ] No presentar reporte como alerta automática
   - [ ] Docs alineados (README / DECISIONS / INTEGRATIONS)
5. Revisión de al menos un compañero cuando el equipo tenga ≥2 activos.

---

## 6. Cómo ejecutar pruebas

**Estado:** suite de tests `PENDING`.

Objetivo futuro `PROPOSED`:

```bash
pnpm test
pnpm lint
pnpm typecheck
```

Prioridad de pruebas cuando existan:

1. Contrato de creación de reporte.
2. Idempotencia offline (`client_report_id`).
3. Ingest/mapeo de campos KML (samples, no inventados).
4. PIP / geo match con fixtures pequeños.

No marques cobertura como existente hasta que haya tests reales.

---

## 7. Cómo documentar cambios

| Cambio | Actualizar |
|--------|------------|
| Decisión de arquitectura/producto | `DECISIONS.md` (+ ARCHITECTURE si aplica) |
| Alcance MVP | `PRODUCT_SCOPE.md`, `ROADMAP.md` |
| Nueva entidad/estado | `DOMAIN_MODEL.md` |
| Vendor / API externa | `INTEGRATIONS.md` |
| Onboarding | `TEAM_GUIDE.md`, `README.md` |
| Feature terminada | ROADMAP → marcar historia; etiquetas `IMPLEMENTED` |

Usar siempre: `CONFIRMED` · `PROPOSED` · `PENDING` · `IMPLEMENTED`.

---

## 8. Código de conducta técnico breve

- Preferir claridad a cleverness.
- No fingir integraciones.
- Preguntar en issues/PR si una incertidumbre (`U*` / `X*`) bloquea.
- Los datos originales C.R.A. no se “mejoran” silenciosamente.
