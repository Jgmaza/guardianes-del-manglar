# PROJECT_CONTEXT — Guardianes del Manglar

**Estado del documento:** `IMPLEMENTED` (fundación)  
**Última alineación:** coherente con README, PRODUCT_SCOPE, ARCHITECTURE, DECISIONS

---

## 1. Contexto completo del reto

Hackatón de conservación de manglares en el Atlántico colombiano (enfoque Barranquilla / C.R.A.).

El reto (“Manglar en vivo”) pide una herramienta de ciencia ciudadana usable por cualquier persona, colegio o turista, **con o sin conexión**, que:

- Monitoree el estado del manglar del Atlántico.
- Geolocalice cada observación dentro de las **unidades hidrográficas priorizadas por la C.R.A.**
- Entregue **alertas tempranas** y **evidencia verificable** a la autoridad ambiental.

Preguntas mínimas que el prototipo debe responder:

1. ¿Dónde ocurre una amenaza/cambio **ahora** y con qué **nivel de prioridad de conservación** coincide?
2. ¿Cómo se valida que el dato ciudadano es **confiable** antes de expediente/alerta oficial?
3. ¿Cómo se **sostiene** la participación de colegios y turistas en el tiempo?

Entregables de evaluación (referencia del reto):

- Prototipo funcional con captura geolocalizada (≥1 tipo de observación).
- Demo de ubicación del reporte en zonificación de prioridad C.R.A.
- Vista/boceto de dashboard C.R.A.
- Muestra de exportación en formato abierto.
- Pitch ≤ 7 min con demostración.
- Repo + ficha técnica 1 página (stack, libs, terceros, IA).

Fuente del enunciado del reto: material del equipo (carpeta padre `ManglarHack/docs/RETO.md`, fuera de este Git). `CONFIRMED` como contexto de producto; **no** versionado aquí para no mezclar notas personales con el repo.

---

## 2. Objetivos

### Objetivo de producto
Habilitar reportes ciudadanos multi-canal que la C.R.A. pueda revisar, cruzar con su zonificación y convertir (cuando corresponda) en alertas e insumos de decisión.

### Objetivos de la hackatón
- Demostrar el flujo extremo a extremo mínimo: captura → geo-prioridad → revisión → export.
- Responder las tres preguntas de la C.R.A. en el pitch.
- Dejar un repo claro y una ficha técnica honesta (sin fingir integraciones).

### Objetivos técnicos
- Monorepo mantenible, deployable en Vercel donde aplique.
- Un solo dominio de “Reporte” para PWA y WhatsApp.
- Conservar datos originales C.R.A.; no inventar atributos oficiales.

---

## 3. Alcance del MVP

Ver detalle en [`PRODUCT_SCOPE.md`](PRODUCT_SCOPE.md).

Resumen `PROPOSED`:

- PWA con captura geolocalizada + evidencia.
- Offline básico (cola de envío).
- Join espacial reporte ↔ capa prioridades C.R.A.
- Panel C.R.A. para listar/revisar reportes y ver prioridad.
- Export abierto (GeoJSON y/o CSV).
- Código de seguimiento; anonimato básico.
- WhatsApp: integrado si el bot/proveedor están listos; si no, documentado como `PENDING` y demo vía PWA.

Fuera de MVP: microservicios, autorización legal de permisos, IA como juez oficial, inventario de manglar inventado.

---

## 4. Actores del sistema

| Actor | Rol en el sistema | Estado |
|-------|-------------------|--------|
| Ciudadano / turista | Crea reportes (anónimo u opcionalmente identificado) | `PROPOSED` |
| Guardián / voluntario | Reporta + participación sostenida | `PROPOSED` |
| Organización | Agrupa actividad / acompañamiento | `PROPOSED` (simplificado en MVP) |
| Administrador C.R.A. | Revisa, clasifica, genera alertas, exporta | `PROPOSED` |
| Sistema (API/geo) | Normaliza canales, calcula cruce espacial, aplica reglas | `PROPOSED` |
| Proveedor WhatsApp | Transporte de mensajes/medios | `PENDING` |
| Servicio de IA | Sugerencias no vinculantes | `PENDING` |

---

## 5. Flujos principales

### F1 — Alta de reporte (PWA) `PROPOSED`
1. Usuario captura tipo de observación + foto + geolocalización (o punto en mapa).
2. Si offline → cola local; si online → API.
3. API persiste reporte + evidencias; separa identidad si aplica.
4. Backend ejecuta análisis geográfico vs capa C.R.A.
5. Devuelve código de seguimiento.

### F2 — Alta de reporte (WhatsApp) `PROPOSED` / integración `PENDING`
1. Usuario conversa con el bot; adjunta ubicación/foto.
2. Bot adapta el mensaje al **mismo** contrato de creación de reporte.
3. Continúa igual que F1 desde el API.

### F3 — Revisión C.R.A. `PROPOSED`
1. Dashboard lista reportes con estado, prioridad C.R.A. (si hay match), evidencias.
2. Revisor valida consistencia / clasifica amenaza oficialmente.
3. Opcionalmente crea **alerta institucional** (entidad distinta).
4. Exporta subset en formato abierto.

### F4 — Solicitud preliminar de intervención `PROPOSED` (simplificado)
1. Desde un reporte/alerta se abre solicitud preliminar.
2. El sistema deja claro que **no** es permiso ni autorización.

### F5 — Participación `PROPOSED` (simplificado)
1. Actividad de colegios/turistas genera reconocimiento básico (puntos/insignias).
2. No bloquea el flujo de evidencia oficial.

---

## 6. Decisiones conocidas

Resumen; detalle en [`DECISIONS.md`](DECISIONS.md).

| Decisión | Estado |
|----------|--------|
| Repo Git = carpeta `ManglarHack/apps/` | `CONFIRMED` |
| Docs personales del host quedan fuera de este Git | `CONFIRMED` |
| React + TypeScript para la app web | `CONFIRMED` |
| PWA + WhatsApp como canales al mismo sistema de reportes | `CONFIRMED` |
| PostgreSQL + PostGIS; Supabase como candidato | `CONFIRMED` (Supabase `PROPOSED` como plataforma) |
| Leaflet para mapas cliente | `CONFIRMED` |
| pnpm workspaces; Turborepo opcional/orquestación | `PROPOSED` |
| Compatibilidad Vercel | `CONFIRMED` |
| Reutilizar chatbot JS existente (no reescribir sin necesidad) | `CONFIRMED` (ubicación del código `PENDING`) |
| Geo en backend; conservar originales C.R.A. | `CONFIRMED` |
| IA no valida institucionalmente | `CONFIRMED` |

---

## 7. Supuestos

1. El archivo KMZ entregado por la C.R.A. es la fuente de zonificación de prioridad a usar en la demo. `CONFIRMED` (existencia del archivo en entorno del equipo).
2. Los atributos oficiales son solo los presentes en el KML tras inspección; no se inventan. `CONFIRMED`
3. Habrá al menos un tipo de observación/amenaza acordado para el MVP. Catálogo exacto `PENDING`.
4. Un “match” geográfico puede ser vacío (punto fuera de polígonos); el sistema debe manejarlo. `PROPOSED`
5. La demo de hackatón puede usar un subset espacial o geometrías simplificadas sin alterar el raw. `PROPOSED`
6. Roles en una sola PWA (rutas/permisos), no cuatro frontends. `PROPOSED`

---

## 8. Incertidumbres pendientes

| ID | Incertidumbre | Impacto | Estado |
|----|---------------|---------|--------|
| U1 | Path exacto del chatbot JS a reutilizar | Canal WhatsApp | `PENDING` |
| U2 | Proveedor WhatsApp y modelo de webhook | Integración | `PENDING` |
| U3 | API: Edge Functions vs Node en Vercel vs otro | Arquitectura runtime | `PENDING` |
| U4 | Extensión PostGIS y límites en el proyecto Supabase real | Geo PIP | `PENDING` |
| U5 | Catálogo oficial/aceptable de tipos de amenaza | Dominio | `PENDING` |
| U6 | Licencia/uso público del KMZ en demo/repo | Legal/datos | `PENDING` |
| U7 | Proveedor(es) de IA y qué tareas exactas | Ficha técnica / ética | `PENDING` |
| U8 | Versión Node/pnpm y plantilla Vite vs Next | Tooling | `PENDING` |
| U9 | Política exacta de retención de PII / anonimato | Cumplimiento | `PENDING` |
| U10 | Nombre público del paquete npm / org GitHub | Publicación | `PENDING` |

Cuando se resuelva una incertidumbre, actualizar este archivo y `DECISIONS.md` en el mismo PR.
