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
    btn.className = "choice-btn";
    btn.innerHTML = opcion.detalle
      ? `<span class="choice-title">${opcion.label}</span><span class="choice-detail">${opcion.detalle}</span>`
      : opcion.label;
    btn.addEventListener("click", () => onPick(opcion));
    grid.appendChild(btn);
  });

  choicesEl.appendChild(grid);
}

function renderBotReply(reply) {
  // En web mostramos la primera parte como burbuja; el resultado final va en tarjeta
  const lines = reply.split("\n");
  const isResult = reply.includes("Alerta roja") || reply.includes("Alerta amarilla") || reply.includes("Alerta verde");

  if (isResult && session.step === STEPS.DONE) {
    const preface = lines.slice(0, 1).join("\n");
    if (preface.startsWith("Ok:")) addBubble(preface);
    showResultCard();
    return;
  }

  // Prefacio "Ok: ..." + pregunta: separar en burbujas cortas
  const chunks = reply.split("\n\n");
  chunks.forEach((chunk) => {
    const clean = chunk
      .replace(/\*/g, "")
      .replace(/^_/gm, "")
      .replace(/_$/gm, "")
      .trim();
    if (!clean) return;
    // No mostrar listados numerados en burbuja; van en botones
    if (/^\d\)/m.test(clean) && clean.includes("\n")) {
      const question = clean.split("\n")[0];
      if (question && !/^\d\)/.test(question)) addBubble(question);
      return;
    }
    if (/^\d\)/.test(clean)) return;
    addBubble(clean);
  });
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
  card.innerHTML = `
    <div class="result-top">
      <p class="result-kicker">${result.titulo}</p>
      <span class="prio-pill">${result.prioridad}</span>
    </div>
    <p class="result-tone">${result.tono}</p>
    <h2>${result.decision.entidad}</h2>
    <p class="result-block"><span>Contacto</span>${result.decision.contacto}</p>
    <p class="result-block"><span>Qué hacer</span>${result.decision.accion}</p>
    <p class="result-block"><span>Evidencia útil</span>${result.evidencia}</p>
    <p class="result-block"><span>Privacidad</span>${result.privacidadLabel}</p>
    <p class="result-note">${result.fallback}</p>
    <p class="result-frame">${result.nota}</p>
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
  wa.textContent = "Abrir en WhatsApp";

  const again = document.createElement("button");
  again.type = "button";
  again.className = "ghost-btn solid";
  again.textContent = "Hacer otro reporte";
  again.addEventListener("click", startOver);

  actions.append(wa, again);
  choicesEl.appendChild(actions);
  messagesEl.scrollTop = messagesEl.scrollHeight;
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
