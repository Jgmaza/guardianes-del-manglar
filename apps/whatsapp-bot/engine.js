import {
  FALLBACK,
  MENSAJES,
  NIVEL_META,
  NOTA_MARCO,
  PALABRAS_PELIGRO,
  REGLAS,
  TIPOS_ALTO_RIESGO,
} from "./data.js";

export const STEPS = {
  IDLE: "idle",
  PELIGRO: "peligro",
  TIPO: "tipo",
  NIVEL: "nivel",
  ZONA: "zona",
  PRIVACIDAD: "privacidad",
  DONE: "done",
};

export function emptySession() {
  return {
    step: STEPS.IDLE,
    peligro: null,
    tipo: null,
    nivel: null,
    zona: null,
    privacidad: null,
    forcedRojo: false,
  };
}

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function formatOptions(opciones) {
  return opciones.map((op, i) => `${i + 1}) ${op.label}`).join("\n");
}

export function matchOption(opciones, raw) {
  const text = normalize(raw);
  if (!text) return null;

  const byNumber = Number.parseInt(text, 10);
  if (!Number.isNaN(byNumber) && byNumber >= 1 && byNumber <= opciones.length) {
    return opciones[byNumber - 1];
  }

  const exact = opciones.find((op) => {
    const label = normalize(op.label);
    return label === text || op.id.toLowerCase() === text;
  });
  if (exact) return exact;

  return (
    opciones.find((op) => {
      const label = normalize(op.label);
      return label.includes(text) || text.includes(label.slice(0, 10));
    }) || null
  );
}

function isRestart(text) {
  const t = normalize(text);
  return [
    "hola",
    "hi",
    "menu",
    "menú",
    "inicio",
    "reiniciar",
    "reset",
    "empezar",
    "reportar",
    "ayuda",
  ].includes(t);
}

/** Regla de seguridad: solo puede SUBIR a Rojo, nunca bajar. */
export function detectDangerRaise(text) {
  const t = normalize(text);
  return PALABRAS_PELIGRO.some((word) => t.includes(normalize(word)));
}

export function raiseNivel(current, candidate) {
  const rank = { VERDE: 1, AMARILLO: 2, ROJO: 3 };
  if (!current) return candidate;
  return rank[candidate] > rank[current] ? candidate : current;
}

export function labelOf(pasoKey, id) {
  const paso = MENSAJES[pasoKey];
  if (!paso) return id;
  return paso.opciones.find((o) => o.id === id)?.label ?? id;
}

export function buildResult(session) {
  const { zona, tipo, nivel, privacidad } = session;
  const decision = REGLAS[tipo][nivel][zona];
  const meta = NIVEL_META[nivel];
  const anonimo = privacidad === "ANONIMO";

  return {
    decision,
    meta,
    anonimo,
    prioridad: meta.prioridad,
    titulo: meta.titulo,
    tono: meta.tono,
    evidencia: meta.evidencia,
    privacidadLabel: labelOf("paso_privacidad", privacidad),
    zonaLabel: labelOf("paso_zona", zona),
    tipoLabel: labelOf("paso_tipo", tipo),
    nivelLabel: labelOf("paso_nivel", nivel),
    fallback: FALLBACK,
    nota: NOTA_MARCO,
  };
}

export function formatResultText(result) {
  const lines = [
    `*${result.titulo}* (${result.prioridad})`,
    result.tono,
    "",
    `*Entidad:* ${result.decision.entidad}`,
    `*Contacto:* ${result.decision.contacto}`,
    `*Qué hacer:* ${result.decision.accion}`,
    "",
    `*Evidencia útil:* ${result.evidencia}`,
    `*Privacidad:* ${result.privacidadLabel}`,
  ];

  if (result.anonimo) {
    lines.push(
      "_Modo anónimo: no pedimos tu nombre. En WhatsApp el canal puede ver el número; en la web puedes reportar sin identificarte._",
    );
  } else {
    lines.push(
      "_Modo con datos: cuando radiques, deja nombre y teléfono solo si quieres seguimiento._",
    );
  }

  if (result.meta.prioridad === "P0") {
    lines.push("", `⚠️ ${result.fallback}`);
  } else {
    lines.push("", result.fallback);
  }

  lines.push("", "_Escribe menu para otro reporte._");
  return lines.join("\n");
}

function askPeligroText() {
  const paso = MENSAJES.paso_peligro;
  return [
    "Hola, soy *Manglar Alerta*.",
    "Te oriento a quién reportar un daño ambiental (triage tipo alerta institucional).",
    "",
    paso.texto,
    formatOptions(paso.opciones),
    "",
    "_Responde con el número. Escribe *menu* para reiniciar. Si escribes *peligro*, subimos a alerta roja._",
  ].join("\n");
}

function promptPaso(pasoKey, preface = "") {
  const paso = MENSAJES[pasoKey];
  const head = preface ? `${preface}\n\n` : "";
  return `${head}${paso.texto}\n${formatOptions(paso.opciones)}`;
}

/**
 * Procesa un mensaje y devuelve { session, reply }.
 */
export function handleIncoming(session, rawText) {
  const text = String(rawText || "").trim();
  let next = session ? { ...session } : emptySession();

  if (!text) {
    return { session: next, reply: "No entendí. Escribe *menu* para empezar." };
  }

  // Atajo global: peligro solo SUBE a rojo
  if (detectDangerRaise(text) && !isRestart(text) && next.step !== STEPS.PELIGRO) {
    const onlyDanger =
      normalize(text) === "peligro" ||
      normalize(text) === "emergencia" ||
      normalize(text) === "urgencia";

    if (next.step === STEPS.IDLE || next.step === STEPS.DONE || !next.tipo) {
      next = emptySession();
      next.forcedRojo = true;
      next.nivel = "ROJO";
      next.peligro = "SI";
      next.step = STEPS.TIPO;
      return {
        session: next,
        reply: [
          "Entendido: lo trato como *alerta roja*.",
          "Si puedes, aléjate y prepárate a llamar al 123 o 119.",
          "",
          MENSAJES.paso_tipo.texto,
          formatOptions(MENSAJES.paso_tipo.opciones),
        ].join("\n"),
      };
    }

    next.forcedRojo = true;
    next.nivel = raiseNivel(next.nivel, "ROJO");

    // Si solo escribió la palabra de peligro, confirma y repite el paso actual
    if (onlyDanger) {
      const pasoKey =
        next.step === STEPS.TIPO
          ? "paso_tipo"
          : next.step === STEPS.NIVEL
            ? "paso_nivel"
            : next.step === STEPS.ZONA
              ? "paso_zona"
              : next.step === STEPS.PRIVACIDAD
                ? "paso_privacidad"
                : null;

      if (pasoKey) {
        // Si ya es rojo, saltar la pregunta de nivel
        if (next.step === STEPS.NIVEL) {
          next.step = STEPS.ZONA;
          return {
            session: next,
            reply: promptPaso(
              "paso_zona",
              "Subí el caso a *alerta roja*. ¿Dónde ocurre?",
            ),
          };
        }
        return {
          session: next,
          reply: promptPaso(pasoKey, "Subí el caso a *alerta roja*."),
        };
      }
    }
  }

  if (isRestart(text) || next.step === STEPS.IDLE || next.step === STEPS.DONE) {
    next = emptySession();
    next.step = STEPS.PELIGRO;
    return { session: next, reply: askPeligroText() };
  }

  if (next.step === STEPS.PELIGRO) {
    const op = matchOption(MENSAJES.paso_peligro.opciones, text);
    if (!op) {
      return {
        session: next,
        reply: `Elige una opción válida:\n${formatOptions(MENSAJES.paso_peligro.opciones)}`,
      };
    }
    next.peligro = op.id;
    if (op.id === "SI") {
      next.forcedRojo = true;
      next.nivel = "ROJO";
    }
    next.step = STEPS.TIPO;
    const preface =
      op.id === "SI"
        ? "Ok: *peligro ahora*. Prioridad máxima."
        : `Ok: *${op.label}*`;
    return { session: next, reply: promptPaso("paso_tipo", preface) };
  }

  if (next.step === STEPS.TIPO) {
    const op = matchOption(MENSAJES.paso_tipo.opciones, text);
    if (!op) {
      return {
        session: next,
        reply: `Elige una opción válida:\n${formatOptions(MENSAJES.paso_tipo.opciones)}`,
      };
    }
    next.tipo = op.id;

    // Solo subir: incendio eleva a rojo
    if (TIPOS_ALTO_RIESGO.includes(op.id)) {
      next.nivel = raiseNivel(next.nivel, "ROJO");
      next.forcedRojo = true;
    }

    if (next.forcedRojo || next.nivel === "ROJO") {
      next.nivel = "ROJO";
      next.step = STEPS.ZONA;
      return {
        session: next,
        reply: promptPaso(
          "paso_zona",
          `Ok: *${op.label}*\nAlerta *roja* (no bajamos la urgencia). ¿Dónde ocurre?`,
        ),
      };
    }

    next.step = STEPS.NIVEL;
    return {
      session: next,
      reply: promptPaso("paso_nivel", `Ok: *${op.label}*`),
    };
  }

  if (next.step === STEPS.NIVEL) {
    const op = matchOption(MENSAJES.paso_nivel.opciones, text);
    if (!op) {
      return {
        session: next,
        reply: `Elige una opción válida:\n${formatOptions(MENSAJES.paso_nivel.opciones)}`,
      };
    }
    // Si ya venía forzado rojo, no permitir bajar
    next.nivel = next.forcedRojo ? "ROJO" : raiseNivel(next.nivel, op.id);
    next.step = STEPS.ZONA;
    const note =
      next.forcedRojo && op.id !== "ROJO"
        ? "Mantengo *alerta roja* por seguridad (las reglas solo suben la urgencia)."
        : `Ok: *${op.label}*`;
    return { session: next, reply: promptPaso("paso_zona", note) };
  }

  if (next.step === STEPS.ZONA) {
    const op = matchOption(MENSAJES.paso_zona.opciones, text);
    if (!op) {
      return {
        session: next,
        reply: `Elige una opción válida:\n${formatOptions(MENSAJES.paso_zona.opciones)}`,
      };
    }
    next.zona = op.id;
    next.step = STEPS.PRIVACIDAD;
    return {
      session: next,
      reply: promptPaso("paso_privacidad", `Ok: *${op.label}*`),
    };
  }

  if (next.step === STEPS.PRIVACIDAD) {
    const op = matchOption(MENSAJES.paso_privacidad.opciones, text);
    if (!op) {
      return {
        session: next,
        reply: `Elige una opción válida:\n${formatOptions(MENSAJES.paso_privacidad.opciones)}`,
      };
    }
    next.privacidad = op.id;
    next.step = STEPS.DONE;
    const result = buildResult(next);
    return {
      session: next,
      reply: `Ok: *${op.label}*\n\n${formatResultText(result)}`,
    };
  }

  next = emptySession();
  next.step = STEPS.PELIGRO;
  return { session: next, reply: askPeligroText() };
}
