import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "baileys";
import { Boom } from "@hapi/boom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { handleIncoming } from "../engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "auth_info");
const LOCK_FILE = path.join(__dirname, ".bot.lock");

/** @type {Map<string, { step: string, zona: string|null, tipo: string|null, nivel: string|null }>} */
const sessions = new Map();

let reconnectTimer = null;
let connecting = false;
let sock = null;
let lastQr = "";

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const raw = fs.readFileSync(LOCK_FILE, "utf8").trim();
    const oldPid = Number.parseInt(raw, 10);
    if (oldPid && isPidAlive(oldPid) && oldPid !== process.pid) {
      console.error("\nYa hay OTRO bot corriendo (PID " + oldPid + ").");
      console.error("Cierra esa terminal con Ctrl+C, o mata el proceso, y vuelve a intentar.");
      console.error("Solo debe haber UNA ventana con: npm run bot\n");
      process.exit(1);
    }
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid), "utf8");
}

function releaseLock() {
  try {
    if (!fs.existsSync(LOCK_FILE)) return;
    const raw = fs.readFileSync(LOCK_FILE, "utf8").trim();
    if (Number.parseInt(raw, 10) === process.pid) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch {
    // ignore
  }
}

function scheduleReconnect(delayMs = 2500) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot().catch((err) => {
      console.error("Error al reconectar:", err);
      scheduleReconnect(5000);
    });
  }, delayMs);
}

function printQr(qr) {
  if (qr === lastQr) return;
  lastQr = qr;

  // Limpia la terminal para que solo se vea UN QR (el actual)
  console.clear();
  console.log("========================================");
  console.log(" Manglar Alerta — WhatsApp");
  console.log(" Escanea ESTE QR (solo el de abajo)");
  console.log(" WhatsApp > Dispositivos vinculados");
  console.log("         > Vincular un dispositivo");
  console.log("========================================\n");
  qrcode.generate(qr, { small: true });
  console.log("\nSi aparece otro QR después, ignora el anterior.");
  console.log("Escanea siempre el último.\n");
}

function getTextFromMessage(msg) {
  const message = msg.message;
  if (!message) return "";

  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.buttonsResponseMessage?.selectedDisplayText) {
    return message.buttonsResponseMessage.selectedDisplayText;
  }
  if (message.listResponseMessage?.title) return message.listResponseMessage.title;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;

  if (
    message.imageMessage ||
    message.audioMessage ||
    message.videoMessage ||
    message.documentMessage ||
    message.stickerMessage
  ) {
    return "hola";
  }

  return "";
}

async function startBot() {
  if (connecting) return;
  connecting = true;

  try {
    if (sock) {
      try {
        sock.ev.removeAllListeners("connection.update");
        sock.ev.removeAllListeners("creds.update");
        sock.ev.removeAllListeners("messages.upsert");
        sock.end?.(undefined);
      } catch {
        // ignore cleanup errors
      }
      sock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async () => undefined,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        printQr(qr);
      }

      if (connection === "open") {
        lastQr = "";
        console.clear();
        console.log("========================================");
        console.log(" Bot conectado a WhatsApp");
        console.log("========================================");
        console.log("Desde OTRO celular escribe Hola a este número.");
        console.log("Para reiniciar un chat: menu");
        console.log("Deja esta terminal abierta durante la demo.\n");
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output?.statusCode
            : undefined;

        // Tras escanear el QR, WhatsApp pide reinicio: es normal (515)
        if (statusCode === DisconnectReason.restartRequired) {
          console.log("Reiniciando sesión después del QR...");
          scheduleReconnect(800);
          return;
        }

        // Otra instancia tomó la sesión (440): no pelear en bucle
        if (statusCode === DisconnectReason.connectionReplaced) {
          console.error("\nSe detectó OTRA conexión del mismo WhatsApp.");
          console.error("Cierra las demás terminales del bot y deja solo esta.");
          console.error("Luego vuelve a correr: npm run bot\n");
          releaseLock();
          process.exit(1);
          return;
        }

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("Sesión cerrada en el celular.");
          console.log("Borra bot/auth_info y vuelve a escanear el QR.");
          releaseLock();
          process.exit(1);
          return;
        }

        console.log(`Conexión cerrada (${statusCode ?? "?"}). Reconectando...`);
        scheduleReconnect(2500);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        try {
          if (!msg.message) continue;
          if (msg.key.fromMe) continue;

          const jid = msg.key.remoteJid;
          if (!jid || jid.endsWith("@g.us") || jid === "status@broadcast") continue;

          const text = getTextFromMessage(msg);
          const current = sessions.get(jid);
          const { session, reply } = handleIncoming(current, text);
          sessions.set(jid, session);

          await sock.sendMessage(jid, { text: reply });
        } catch (err) {
          console.error("Error al procesar mensaje:", err);
        }
      }
    });
  } finally {
    connecting = false;
  }
}

acquireLock();
process.on("exit", releaseLock);
process.on("SIGINT", () => {
  releaseLock();
  process.exit(0);
});
process.on("SIGTERM", () => {
  releaseLock();
  process.exit(0);
});

startBot().catch((err) => {
  console.error("No se pudo iniciar el bot:", err);
  releaseLock();
  process.exit(1);
});
