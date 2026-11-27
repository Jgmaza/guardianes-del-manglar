# WhatsApp bot — Guardianes del Manglar

**Estado:** `READY` (demo triage) — canal Twilio recomendado; Baileys QR opcional.

Bot de orientación ciudadana: peligro → tipo → alerta → zona → privacidad → ruta de contacto  
(Barranquilla / Atlántico / costa). Motor en `engine.js` + reglas en `data.js`.

## Objetivo del monorepo

Al cerrar el triage el bot hace `POST /api/v1/reports` (`REPORTS_API_URL`).  
La API persiste en **Supabase** si el web tiene service role; si no, memoria.  
El bot **no** habla con la DB directo (ver `docs/bot/reports-mapping.md`).

## Arranque rápido

```bash
cd apps/whatsapp-bot
pnpm install   # o npm install
cp .env.example .env
# completa TWILIO_* en .env
pnpm bot       # webhook Twilio en :3001
pnpm tunnel    # URL pública para el sandbox
pnpm web       # demo HTML en :3002
```

Para guardar en DB: levanta `pnpm --filter @guardianes/web dev` con Supabase
configurado (`apps/web/.env.local`) y migraciones `001`+`002` aplicadas.

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
