# Bot — decisión y clasificación

Árbol de decisión y taxonomía de alertas del WhatsApp / demo web **Manglar Alerta**.

## Índice

| Doc | Contenido |
|-----|-----------|
| [arbol-decision.md](./arbol-decision.md) | Flujo, reglas, prioridades, matriz 5×3×3 |
| [arbol-decision.json](./arbol-decision.json) | Mismo árbol en JSON (pasos + opciones) |
| [referencias.md](./referencias.md) | Fuentes UNGRD / ANLA / Ley 1333 / contactos |
| [reports-mapping.md](./reports-mapping.md) | Mapeo triage → `POST /api/v1/reports` |

## Código vivo

| Archivo | Rol |
|---------|-----|
| `apps/whatsapp-bot/data.js` | `MENSAJES` (nodos) + `REGLAS` (45 rutas) + `NIVEL_META` |
| `apps/whatsapp-bot/engine.js` | Máquina de estados del chat |
| `apps/whatsapp-bot/bot/twilio-server.js` | WhatsApp Twilio + POST API |
| `apps/whatsapp-bot/app.js` | Demo web |

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
| `IDENTIFICADO` | Sugiere seguimiento con código de la API |

## Completitud

Matriz **tipo × nivel × zona** = **45/45** celdas definidas (sin huecos).
