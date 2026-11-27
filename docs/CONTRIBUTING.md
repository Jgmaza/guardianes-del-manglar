# CONTRIBUTING — Guardianes del Manglar

**Estado:** `IMPLEMENTED` (proceso) · tooling de CI/test aún `PENDING`

---

## 1. Cómo clonar el repositorio

```bash
git clone https://github.com/Jgmaza/guardianes-del-manglar.git
cd guardianes-del-manglar
git checkout dev && git pull
```

Onboarding corto: [`ONBOARDING.md`](ONBOARDING.md).  
Ramas: [`BRANCHES.md`](BRANCHES.md) (`main` y `dev` al mismo nivel; push directo OK).

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

## 3. Convenciones de ramas

| Rama | Uso |
|------|-----|
| `main` | Producción; push directo |
| `dev` | Integración; mismo nivel que `main` |
| `issue/<n>-slug` | Trabajo de un issue (sale de `dev`) |
| `work/<persona>` | Rama personal opcional |

Detalle y comandos: [`BRANCHES.md`](BRANCHES.md).

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

## 5. Pull Requests (opcionales) `PROPOSED`

No son obligatorios: puedes pushear directo a `main` o `dev`. Si usas PR (rama `issue/…` o `work/…`):

1. Cambios acotados; actualizar docs si cambia comportamiento o decisiones.
2. PR con resumen (qué / por qué) y estado de integración si aplica.
3. Checklist:
   - [ ] No secretos
   - [ ] No datos C.R.A. inventados
   - [ ] No presentar reporte como alerta automática
   - [ ] Docs alineados (README / DECISIONS / INTEGRATIONS)

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
