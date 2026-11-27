# WhatsApp bot — Guardianes del Manglar

**Estado:** `PENDING` — espacio reservado para el chatbot del equipo.

## Objetivo

Reutilizar el chatbot existente en JavaScript/TypeScript y adaptarlo para que cree
**el mismo reporte canónico** que la PWA, vía `POST /api/v1/reports` (+ evidencias).

## Contrato

Ver `docs/REPORTS_API.md`.

- Canal: `whatsapp`
- Ubicación: `location.source = "whatsapp_shared_location"` cuando aplique
- No asumir que WhatsApp conserva EXIF
- No mezclar identidad del denunciante en el payload ambiental (usar `reporterHandle` opaco si hace falta)

## Cómo integrar

1. Coloca aquí el código del bot (o un adapter fino sobre el repo existente).
2. Configura el proveedor WhatsApp con variables de entorno locales (nunca en Git).
3. Traduce mensajes/medios → contrato de reportes.
4. Devuelve al ciudadano el `trackingCode` + `trackingSecret` generados por la API.
