# WhatsApp bot — Guardianes del Manglar

**Estado:** `READY` (demo triage) — canal Twilio recomendado; Baileys QR opcional.

Bot de orientación ciudadana: peligro → tipo → alerta → zona → privacidad → ruta de contacto  
(Barranquilla / Atlántico / costa). Motor en `engine.js` + reglas en `data.js`.

## Objetivo del monorepo

Reutilizar este bot para crear **el mismo reporte canónico** que la PWA vía  
`POST /api/v1/reports` (ver `docs/REPORTS_API.md`). El triage y la ruta de entidades  
ya están listos; el adapter a la API de reportes es el siguiente paso.

## Arranque rápido

```bash
cd apps/whatsapp-bot
pnpm install   # o npm install
cp .env.example .env
# completa TWILIO_* en .env
pnpm bot       # webhook Twilio en :3001
pnpm tunnel    # URL pública para el sandbox
pnpm web       # demo HTML en :3000
```

### Twilio (recomendado)

No vincula tu WhatsApp personal. Usa el sandbox:

1. Account SID + Auth Token en `.env`
2. `TWILIO_WHATSAPP_FROM=whatsapp:+1...` (número sandbox)
3. Webhook: `https://TU-TUNEL/whatsapp` (POST) en Sandbox settings
4. Desde el celular: `join ...` y luego `Hola`

Consola legacy del webhook:  
https://www.twilio.com/console/sms/whatsapp/sandbox

### Baileys QR (opcional)

```bash
pnpm bot:qr
```

Solo con número temporal / prestado. Riesgo de límites si usas tu cuenta personal.

## Archivos

| Ruta | Rol |
|------|-----|
| `engine.js` | Máquina de estados del chat |
| `data.js` | Mensajes + matriz tipo×alerta×zona |
| `bot/twilio-server.js` | Webhook Express + Twilio |
| `bot/index.js` | Bot QR (Baileys) |
| `index.html` + `app.js` | Demo interactiva en navegador |

Árbol de decisión y referencias: `docs/bot/`.
