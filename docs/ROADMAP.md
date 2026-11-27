# ROADMAP — Guardianes del Manglar

**Estado del documento:** `IMPLEMENTED` (plan)  
**Código de producto:** fundación monorepo `IMPLEMENTED` · historias de negocio aún no

Prioridades:

- **P0** — Imprescindible para demo/criterios de éxito de la hackatón  
- **P1** — Importante si hay tiempo; refuerza narrativa  
- **P2** — Deseable / post-hackatón temprano  

---

## 1. Fases del desarrollo

| Fase | Nombre | Objetivo | Estado |
|------|--------|----------|--------|
| F0 | Fundación documental | Docs + Git root | `IMPLEMENTED` |
| F1 | Scaffold monorepo | pnpm/turbo, Next.js web, packages, Vitest/Playwright | `IMPLEMENTED` |
| F2 | Datos C.R.A. | raw/processed + ingest + schema PostGIS + queries | `IMPLEMENTED` (normalización + SQL; carga live Supabase `PENDING`) |
| F3 | API de reportes | Crear/consultar reporte + evidencias + tracking + alertas preliminares | `IMPLEMENTED` (in-memory; persistencia live `PENDING`) |
| F4 | PWA captura + offline | Canal ciudadano mínimo | `IMPLEMENTED` (UI + IndexedDB + SW) |
| F5 | Geo match | PIP → prioridad/UH desde capa ingerida | `PENDING` |
| F6 | Dashboard C.R.A. | Lista, detalle, mapa, estados | `IMPLEMENTED` (UI + fixtures + Leaflet sample) |
| F7 | Export abierto | GeoJSON/CSV | `PENDING` |
| F8 | Validación + alertas | Flujo reporte → revisión → alerta | `PENDING` |
| F9 | WhatsApp | Adapter + bot reutilizado | `PENDING` (deps X1/X2) |
| F10 | Participación | Gamificación mínima | `PENDING` |
| F11 | Pitch kit | Ficha técnica 1p, demo script | `PENDING` |

Dependencias entre fases:

```text
F0 → F1 → F3 → F4
       ↘ F2 → F5 → F6 → F7
                ↘ F8
F3 → F9 (si vendor listo)
F4/F6 → F10
F6+F7+F8 → F11
```

---

## 2. Historias de usuario

### P0

| ID | Historia | Fase | Depende |
|----|----------|------|---------|
| H1 | Como ciudadano, quiero enviar una observación con ubicación y foto para que quede registrada | F3–F4 | F1 | API dominio `IMPLEMENTED`; UI captura `PENDING` |
| H2 | Como ciudadano, quiero un código de seguimiento sin exponer mis datos | F3 | H1 | `IMPLEMENTED` (API track) |
| H3 | Como sistema, quiero asociar el punto del reporte a la zonificación C.R.A. si intersecta | F5 | F2, H1 |
| H4 | Como analista C.R.A., quiero ver reportes en un panel con su prioridad geo | F6 | H3 |
| H5 | Como analista C.R.A., quiero exportar un subset en formato abierto | F7 | H4 |
| H6 | Como analista C.R.A., quiero marcar un reporte en revisión / aceptado / rechazado | F8 | H4 |
| H7 | Como analista C.R.A., quiero crear una **alerta** explícita a partir de un reporte aceptado | F8 | H6 |
| H8 | Como ciudadano offline, quiero que mi reporte se encole y se envíe al recuperar red | F4 | H1 |
| H9 | Como equipo, quiero ficha técnica y repo claros para el jurado | F11 | F0+ |

### P1

| ID | Historia | Fase | Depende |
|----|----------|------|---------|
| H10 | Como usuario de WhatsApp, quiero reportar por chat con el mismo resultado que en la PWA | F9 | H1, X1, X2 |
| H11 | Como revisor, quiero una sugerencia de consistencia (reglas ± IA) sin que sea decisión final | F8 | H6, X6 |
| H12 | Como colegio, quiero un reconocimiento básico por participar | F10 | H1 |
| H13 | Como operador, quiero abrir una solicitud **preliminar** de intervención | F8 | H7 |
| H14 | Como C.R.A., quiero filtrar por canal, estado y presencia/ausencia de match geo | F6 | H4 |

### P2

| ID | Historia | Fase | Depende |
|----|----------|------|---------|
| H15 | Organizaciones con tablero propio | post | H1 |
| H16 | Realtime push en dashboard | F6+ | H4 |
| H17 | Moderación antispam avanzada | post | H6 |
| H18 | App nativa | fuera MVP | — |
| H19 | Multi-corporación / multi-región | post | — |

---

## 3. Dependencias externas críticas

| Dependencia | Historias afectadas | Estado |
|-------------|---------------------|--------|
| Archivo KMZ C.R.A. accesible para ingest | H3–H5 | Disponible en host; ingest `PENDING` |
| Proyecto Supabase + PostGIS | F2–F8 | `PENDING` |
| Cuenta Vercel | Deploy demo | `PENDING` |
| Código bot + vendor WhatsApp | H10 | `PENDING` |
| Proveedor IA | H11 | `PENDING` / opcional P1 |

---

## 4. Definición de “hecho” por prioridad

### P0 hecho
Demo en vivo: captura → aparece en dashboard con resultado geo (o “sin cobertura”) → export → explicación de validación (estados + alerta explícita).

### P1 hecho
Al menos un canal WhatsApp real **o** spike documentado bloqueado por `PENDING` sin fingir; más mecánica de retención visible.

### P2
No bloquea la hackatón.

---

## 5. Seguimiento

Al completar una historia:

1. PR de código + prueba mínima si aplica.
2. Actualizar esta tabla (nota `IMPLEMENTED` + fecha/PR).
3. Ajustar INTEGRATIONS/README si el usuario final lo percibe.
