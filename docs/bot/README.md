# Bot — decisión y clasificación

Árbol de decisión y taxonomía de alertas del WhatsApp bot.

## Contenido

1. [Árbol de decisión](./arbol-decision.md) (flujo + prioridades + referencias)
2. Código vivo: `apps/whatsapp-bot/data.js` (matriz) y `engine.js` (triage)
3. Demo web: `apps/whatsapp-bot/` (`pnpm web`)

## Clasificación de alertas

| ID | Nombre | Prioridad | Criterio ciudadano |
|----|--------|-----------|--------------------|
| `ROJO` | Alerta roja | P0 | Está pasando YA o hay peligro |
| `AMARILLO` | Alerta amarilla | P1 | Ya pasó o se repite |
| `VERDE` | Alerta verde | P2 | Limpieza, poda o prevención |

## Privacidad

| Modo | Comportamiento |
|------|----------------|
| `ANONIMO` | Orientación sin pedir nombre |
| `IDENTIFICADO` | Sugiere dejar datos al radicar (seguimiento) |

## Referencias citadas

Ver sección Referencias en [arbol-decision.md](./arbol-decision.md).
