import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleIncoming } from "../engine.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM,
  PORT = "3001",
  TWILIO_VALIDATE_SIGNATURE = "false",
} = process.env;

const required = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("\nFaltan variables en .env:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("\nCopia .env.example a .env y completa los datos del sandbox Twilio.\n");
  process.exit(1);
}

/** @type {Map<string, object>} */
const sessions = new Map();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const MessagingResponse = twilio.twiml.MessagingResponse;

function splitWhatsAppText(text, maxLen = 1500) {
  const raw = String(text || "").trim();
  if (raw.length <= maxLen) return [raw];

  const parts = [];
  let rest = raw;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf("\n", maxLen);
    if (cut < maxLen * 0.5) cut = maxLen;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

app.get("/", (_req, res) => {
  res.type("text").send(
    "Manglar Alerta · Twilio WhatsApp OK\nWebhook: POST /whatsapp\nHealth: GET /health\n",
  );
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    channel: "twilio-whatsapp",
    from: TWILIO_WHATSAPP_FROM,
    sessions: sessions.size,
  });
});

app.post("/whatsapp", (req, res) => {
  try {
    if (TWILIO_VALIDATE_SIGNATURE === "true") {
      const signature = req.headers["x-twilio-signature"];
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const valid = twilio.validateRequest(
        TWILIO_AUTH_TOKEN,
        signature || "",
        url,
        req.body,
      );
      if (!valid) {
        console.warn("Firma Twilio inválida");
        return res.status(403).type("text").send("Forbidden");
      }
    }

    const from = req.body.From || "";
    const body = (req.body.Body || "").trim();

    if (!from) {
      return res.status(400).type("text").send("Missing From");
    }

    console.log(`← ${from}: ${body || "(vacío)"}`);

    const current = sessions.get(from);
    const { session, reply } = handleIncoming(current, body || "hola");
    sessions.set(from, session);

    const twiml = new MessagingResponse();
    for (const part of splitWhatsAppText(reply)) {
      twiml.message(part);
    }

    console.log(`→ respondido (${session.step})`);
    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error en /whatsapp:", err);
    const twiml = new MessagingResponse();
    twiml.message(
      "Hubo un error procesando tu mensaje. Escribe *menu* para reiniciar.",
    );
    res.type("text/xml").send(twiml.toString());
  }
});

app.listen(Number(PORT), () => {
  console.log("========================================");
  console.log(" Manglar Alerta · WhatsApp vía Twilio");
  console.log("========================================");
  console.log(`Local:    http://localhost:${PORT}`);
  console.log(`Webhook:  http://localhost:${PORT}/whatsapp`);
  console.log(`From:     ${TWILIO_WHATSAPP_FROM}`);
  console.log("");
  console.log("1) Expón el puerto con un túnel, por ejemplo:");
  console.log(`   npx --yes cloudflared tunnel --url http://localhost:${PORT}`);
  console.log("2) En Twilio Sandbox → When a message comes in:");
  console.log("   https://TU-URL-PUBLICA/whatsapp   (método POST)");
  console.log("3) Únete al sandbox enviando el código join a WhatsApp.");
  console.log("4) Escribe Hola al número sandbox.\n");
  console.log(`Credenciales cargadas desde: ${path.resolve(__dirname, "..", ".env")}`);
  console.log("Tu WhatsApp personal NO se vincula (no hay QR).\n");
});
