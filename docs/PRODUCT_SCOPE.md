# PRODUCT_SCOPE — MVP y límites

**Estado del documento:** `IMPLEMENTED` (fundación)  
**Alineado con:** PROJECT_CONTEXT, ROADMAP, DOMAIN_MODEL

---

## 1. Funcionalidades incluidas en el MVP `PROPOSED`

| ID | Funcionalidad | Notas |
|----|---------------|-------|
| M1 | Captura geolocalizada de ≥1 tipo de observación | PWA; GPS o pin en mapa |
| M2 | Evidencia fotográfica + metadatos básicos | Timestamp, geo, canal |
| M3 | Código de seguimiento del reporte | Sin exponer PII |
| M4 | Anonimato del denunciante (opción / default ciudadano) | Identidad separada |
| M5 | Persistencia de reporte canónico multi-canal | Mismo modelo aunque WhatsApp llegue después |
| M6 | Análisis geográfico backend vs capa C.R.A. | Prioridad / UH si hay match; sin inventar atributos |
| M7 | Vista dashboard C.R.A. (lista + detalle + mapa) | Puede ser funcional mínimo |
| M8 | Estados de reporte (enviado → en revisión → …) | Ver DOMAIN_MODEL |
| M9 | Validación de consistencia asistida | Reglas simples ± sugerencia IA si hay proveedor |
| M10 | Creación de alerta institucional desde reporte revisado | Entidad distinta al reporte |
| M11 | Export abierto (GeoJSON y/o CSV) | Muestra descargable |
| M12 | Offline PWA básico | Cola de reportes pendientes de sync |
| M13 | Auth para rol C.R.A. (y opcional guardianes) | Ciudadano puede reportar sin cuenta |
| M14 | Ficha técnica 1 pág. + README honestos | Entregable hackatón |

---

## 2. Funcionalidades simplificadas en el MVP `PROPOSED`

| ID | Funcionalidad | Simplificación |
|----|---------------|----------------|
| S1 | WhatsApp | Adapter + bot reutilizado; si vendor/`PENDING`, demo principal por PWA |
| S2 | Roles organización | Organización ≈ etiqueta/perfil ligero, no ERP |
| S3 | Gamificación | Puntos/insignias mínimas o mock de mecánica |
| S4 | Solicitud de intervención | Formulario/estado preliminar; sin workflow legal completo |
| S5 | Clasificación de amenazas | Catálogo corto acordado; “oficial” solo tras revisión C.R.A. |
| S6 | Tiempo real | Near real-time (refresh / poll / realtime Supabase si alcanza) |
| S7 | Capa mapa C.R.A. | Capa simplificada o filtrada para UI; raw intacto |
| S8 | IA | Opcional; solo sugerencias etiquetadas como no vinculantes |

---

## 3. Fuera del MVP `CONFIRMED` (no construir ahora)

- Microservicios por dominio.
- Autorización legal de permisos / licencias ambientales.
- Inventario oficial de manglares inventado o presentado como dato C.R.A. si no está en la fuente.
- App nativa iOS/Android (la PWA cubre el entregable).
- Moderación ML completa antispam/fraude a escala.
- Integraciones CAD/GIS institucionales complejas (ArcGIS Enterprise, etc.) salvo lectura de la capa entregada.
- Multi-país / multi-corporación.
- Billing, marketplace, o features no ligadas al reto.

---

## 4. Criterios de éxito de la hackatón `CONFIRMED`

El equipo considera exitoso el MVP si en el pitch (≤7 min) se demuestra:

1. **Captura real** de una observación geolocalizada en el prototipo (no solo mockup).
2. **Ubicación del reporte** respecto a la zonificación de prioridad C.R.A. (match o “sin cobertura” explícito).
3. **Dashboard C.R.A.** usable o boceto navegable con el reporte visible.
4. **Export** de muestra en formato abierto.
5. Respuesta clara a las **3 preguntas** de la C.R.A. (dónde+prioridad, confianza/validación, sostenibilidad participación).
6. **Repo público** + ficha técnica 1 página con terceros e IA declarados con honestidad de estado (`IMPLEMENTED` vs `PENDING`).

### Anti-criterios (no contar como éxito)
- Simular proveedores como productivos sin existir.
- Presentar atributos geográficos no presentes en la fuente C.R.A. como oficiales.
- Confundir reporte ciudadano con alerta institucional validada.

---

## 5. Trazabilidad a preguntas C.R.A.

| Pregunta C.R.A. | Cubierta por |
|-----------------|--------------|
| ¿Dónde + prioridad ahora? | M1, M6, M7 |
| ¿Cómo se valida confianza? | M8, M9, M10 + DOMAIN_MODEL |
| ¿Cómo se sostiene participación? | S3 + historias P1 en ROADMAP |

---

## 6. Estado de implementación

Todas las filas M*/S* están **`PROPOSED` / no `IMPLEMENTED`** hasta que el código y las demos existan. Este documento no implica software listo.
