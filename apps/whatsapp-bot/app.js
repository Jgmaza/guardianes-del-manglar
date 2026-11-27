import { MENSAJES, WHATSAPP_NUMBER } from "./data.js";
import {
  buildResult,
  emptySession,
  handleIncoming,
  STEPS,
} from "./engine.js";

const messagesEl = document.getElementById("messages");
const choicesEl = document.getElementById("choices");
const resetBtn = document.getElementById("btn-reset");

let session = emptySession();

const STEP_TO_PASO = {
  [STEPS.PELIGRO]: "paso_peligro",
  [STEPS.TIPO]: "paso_tipo",
  [STEPS.NIVEL]: "paso_nivel",
  [STEPS.ZONA]: "paso_zona",
  [STEPS.PRIVACIDAD]: "paso_privacidad",
};

function addBubble(text, who = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `bubble bubble-${who}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function clearChoices() {
  choicesEl.innerHTML = "";
}

function showChoices(opciones, onPick) {
  clearChoices();
  const grid = document.createElement("div");
  grid.className = "choice-grid";

  opciones.forEach((opcion) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const nivelClass =
      opcion.id === "ROJO" || opcion.id === "AMARILLO" || opcion.id === "VERDE"
        ? ` choice-${opcion.id.toLowerCase()}`
        : opcion.id === "SI"
          ? " choice-rojo"
          : "";
    btn.className = `choice-btn${nivelClass}`;
    btn.textContent = opcion.label;
    btn.addEventListener("click", () => onPick(opcion));
    grid.appendChild(btn);
  });

  choicesEl.appendChild(grid);
}

function renderBotReply(reply) {
  const isResult =
    session.step === STEPS.DONE &&
    (reply.includes("Alerta roja") ||
      reply.includes("Alerta amarilla") ||
      reply.includes("Alerta verde"));

  if (isResult) {
    showResultCard();
    return;
  }

  // Una sola burbuja corta: pregunta (sin listados; van en botones)
  const clean = reply
    .replace(/\*/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^\d\)/.test(l) && !/^_/i.test(l))
    .join(" · ");

  if (clean) addBubble(clean);
}

function showStepChoices() {
  const pasoKey = STEP_TO_PASO[session.step];
  if (!pasoKey || session.step === STEPS.DONE) {
    clearChoices();
    return;
  }

  const opciones = MENSAJES[pasoKey].opciones;
  showChoices(opciones, (opcion) => {
    addBubble(opcion.label, "user");
    resetBtn.hidden = false;
    clearChoices();
    window.setTimeout(() => applyTurn(opcion.label), 220);
  });
}

function showResultCard() {
  const result = buildResult(session);
  const card = document.createElement("article");
  card.className = `result-card nivel-${session.nivel.toLowerCase()}`;
  const showFallback = result.meta.prioridad === "P0";
  const sectorLine = result.sectorContexto
    ? `<p class="result-sector"><strong>${result.zonaLabel}</strong> · ${result.sectorContexto.replace(/^[^:]+:\s*/, "")}</p>`
    : `<p class="result-sector"><strong>${result.zonaLabel}</strong></p>`;

  card.innerHTML = `
    <div class="result-top">
      <p class="result-kicker">${result.titulo}</p>
      <span class="prio-pill">${result.prioridad}</span>
    </div>
    <p class="result-tone">${result.tono}</p>
    ${sectorLine}
    <h2>${result.decision.entidad}</h2>
    <a class="result-contact" href="${telOrWaHref(result.decision.contacto)}">${result.decision.contacto}</a>
    <p class="result-action">${result.decision.accion}</p>
    <a class="result-map" href="${result.mapaUrl}" target="_blank" rel="noopener noreferrer">Ver sector en mapa C.R.A.</a>
    ${showFallback ? `<p class="result-note">${result.fallback}</p>` : ""}
  `;
  messagesEl.appendChild(card);

  clearChoices();
  const actions = document.createElement("div");
  actions.className = "result-actions";

  const wa = document.createElement("a");
  wa.className = "wa-btn";
  wa.href = buildWhatsAppUrl(result);
  wa.target = "_blank";
  wa.rel = "noopener noreferrer";
  wa.textContent = "Enviar por WhatsApp";

  const again = document.createElement("button");
  again.type = "button";
  again.className = "ghost-btn solid";
  again.textContent = "Otro reporte";
  again.addEventListener("click", startOver);

  actions.append(wa, again);
  choicesEl.appendChild(actions);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/** Extrae el primer teléfono visible para tel:; si no, # */
function telOrWaHref(contacto) {
  const digits = String(contacto).match(/(?:\+?\d[\d\s-]{6,}\d)/);
  if (!digits) return "#";
  const clean = digits[0].replace(/\D/g, "");
  return clean ? `tel:${clean}` : "#";
}

function buildWhatsAppUrl(result) {
  const texto = [
    "Hola, reporte ambiental vía Manglar Alerta:",
    "",
    `Privacidad: ${result.privacidadLabel}`,
    `Zona: ${result.zonaLabel}`,
    `Qué vi: ${result.tipoLabel}`,
    `Alerta: ${result.nivelLabel}`,
    `Prioridad: ${result.prioridad}`,
    "",
    `Entidad: ${result.decision.entidad}`,
    `Contacto: ${result.decision.contacto}`,
    `Qué hacer: ${result.decision.accion}`,
    `Evidencia: ${result.evidencia}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

function applyTurn(userText) {
  const { session: next, reply } = handleIncoming(session, userText);
  session = next;
  renderBotReply(reply);
  showStepChoices();
}

function startOver() {
  session = emptySession();
  messagesEl.innerHTML = "";
  clearChoices();
  resetBtn.hidden = true;
  applyTurn("hola");
}

resetBtn.addEventListener("click", startOver);
startOver();
