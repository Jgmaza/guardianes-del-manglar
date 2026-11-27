# Entregas — Luis (@turriago)

## Bot WhatsApp + triage

- Código: `apps/whatsapp-bot/`
- Árbol / clasificación: `docs/bot/`
- Canal recomendado: **Twilio WhatsApp Sandbox** (no usa WhatsApp personal)
- Fallback demo: web en `apps/whatsapp-bot/` (`pnpm web`)
- Opcional: Baileys QR (`pnpm bot:qr`) solo con número temporal

## Cómo probar

```bash
cd apps/whatsapp-bot
cp .env.example .env
# completar TWILIO_*
pnpm install
pnpm bot
pnpm tunnel
```

Webhook legacy: https://www.twilio.com/console/sms/whatsapp/sandbox  
Campo: **When a message comes in** → `https://TU-TUNEL/whatsapp` (POST)
