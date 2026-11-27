/** Número destino del botón WhatsApp (solo dígitos, con código país). Cámbialo por el tuyo. */
export const WHATSAPP_NUMBER = "573001112233";

/**
 * Árbol de decisión — Manglar Alerta
 * Docs: docs/bot/arbol-decision.md + docs/bot/arbol-decision.json
 *
 * Orden: peligro → tipo → nivel? → zona → privacidad → ruta (REGLAS)
 * Seguridad: peligro / keywords / INCENDIO solo SUBEN a ROJO, nunca bajan.
 */

// ---------------------------------------------------------------------------
// 1) Preguntas del triage (nodos del árbol)
// ---------------------------------------------------------------------------
export const MENSAJES = {
  paso_peligro: {
    texto: "¿Hay peligro ahora mismo? (fuego, caza en curso, gente en riesgo)",
    opciones: [
      { id: "SI", label: "Sí, hay peligro ahora" },
      { id: "NO", label: "No, puedo seguir con calma" },
    ],
  },
  paso_tipo: {
    texto: "¿Qué estás viendo?",
    opciones: [
      { id: "TALA", label: "Cortan árboles" },
      { id: "INCENDIO", label: "Fuego o humo" },
      { id: "RESIDUOS", label: "Basura o escombros" },
      { id: "FAUNA", label: "Animales silvestres / caza" },
      { id: "INVASION", label: "Invasión de terreno o manglar" },
    ],
  },
  paso_nivel: {
    texto: "Nivel de alerta (estilo gestión del riesgo):",
    opciones: [
      {
        id: "ROJO",
        label: "Rojo — está pasando YA o hay peligro",
        detalle: "Evento en curso o inminente",
      },
      {
        id: "AMARILLO",
        label: "Amarillo — ya pasó o se repite",
        detalle: "Informar, vigilar y radicar",
      },
      {
        id: "VERDE",
        label: "Verde — limpieza, poda o prevención",
        detalle: "Trámite o prevención",
      },
    ],
  },
  paso_zona: {
    texto: "¿En dónde está pasando?",
    opciones: [
      { id: "BQ", label: "Barranquilla" },
      { id: "MUN", label: "Otro municipio del Atlántico" },
      { id: "COSTA", label: "Playa, manglar o zona costera" },
    ],
  },
  paso_privacidad: {
    texto: "¿Cómo quieres reportar? (la denuncia puede ser anónima)",
    opciones: [
      {
        id: "ANONIMO",
        label: "Anónimo — sin mis datos",
        detalle: "Orientación sin pedir nombre",
      },
      {
        id: "IDENTIFICADO",
        label: "Con mis datos — para seguimiento",
        detalle: "Útil si quieres radicar o que te contacten",
      },
    ],
  },
};

/** Tipos que por sí solos elevan / fuerzan Rojo (saltan paso nivel). */
export const TIPOS_ALTO_RIESGO = ["INCENDIO"];

/** Palabras que solo pueden SUBIR la urgencia a Rojo */
export const PALABRAS_PELIGRO = [
  "peligro",
  "emergencia",
  "urgencia",
  "ahora",
  "ya",
  "fuego",
  "incendio",
  "humo",
  "caza",
  "herido",
  "arma",
  "violencia",
  "amenaza",
  "derrame",
  "quimico",
  "químico",
];

// ---------------------------------------------------------------------------
// 2) Metadatos de alerta (prioridad ciudadana P0 / P1 / P2)
// ---------------------------------------------------------------------------
export const NIVEL_META = {
  ROJO: {
    titulo: "Alerta roja — actuar ahora",
    prioridad: "P0",
    tono: "Prioridad máxima. Si hay riesgo para personas o daño en curso, llama de inmediato.",
    evidencia: "Si puedes sin acercarte: punto de referencia visible. No te expongas.",
  },
  AMARILLO: {
    titulo: "Alerta amarilla — denunciar con evidencia",
    prioridad: "P1",
    tono: "Prioridad media. Radica con fotos, fecha y ubicación para que verifiquen.",
    evidencia: "Fotos o video, dirección o punto de referencia, fecha y hora aproximada.",
  },
  VERDE: {
    titulo: "Alerta verde — trámite o prevención",
    prioridad: "P2",
    tono: "No es emergencia. Usa el canal administrativo en horario hábil.",
    evidencia: "Describe el lugar y qué necesitas (limpieza, poda, permiso, inspección).",
  },
};

// ---------------------------------------------------------------------------
// 3) Matriz de ruta: REGLAS[tipo][nivel][zona] → { entidad, contacto, accion }
//    5 tipos × 3 niveles × 3 zonas = 45 celdas (completa)
// ---------------------------------------------------------------------------
export const REGLAS = {
  TALA: {
    ROJO: {
      BQ: {
        entidad: "Policía Nacional + Barranquilla Verde (Patrulla 24/7)",
        contacto: "Llama al 123 | WhatsApp B/quilla Verde: 317 368 2850",
        accion: "Reporta que están talando en este momento. No te acerques ni discutas.",
      },
      MUN: {
        entidad: "Policía Nacional + Policía Ambiental (DEATA)",
        contacto: "Llama al 123 | Policía Ambiental: 304 206 0366",
        accion: "Pide una patrulla por tala en curso y da un punto de referencia claro.",
      },
      COSTA: {
        entidad: "Policía Nacional + Autoridad Ambiental + DIMAR",
        contacto:
          "Llama al 123 | B/quilla Verde: 317 368 2850 o CRA: 01 8000 931075 | DIMAR: 01 8000 416870",
        accion: "Indica que están afectando manglar o zona costera en este momento.",
      },
    },
    AMARILLO: {
      BQ: {
        entidad: "Barranquilla Verde (+ Fiscalía si fue tala grande)",
        contacto: "(605) 311 2470 Ext. 107 | Fiscalía: 122",
        accion: "Toma fotos del lugar y radica la denuncia con dirección exacta.",
      },
      MUN: {
        entidad: "CRA (+ Fiscalía si fue tala grande)",
        contacto: "01 8000 931075 | peticiones@crautonoma.gov.co | Fiscalía: 122",
        accion: "Envía fotos y ubicación del municipio donde ocurrió la tala.",
      },
      COSTA: {
        entidad: "CRA / Barranquilla Verde + Fiscalía",
        contacto: "CRA: 01 8000 931075 | B/quilla Verde: (605) 311 2470 | Fiscalía: 122",
        accion: "Denuncia con fotos indicando que afecta zona de manglar o costa.",
      },
    },
    VERDE: {
      BQ: {
        entidad: "Barranquilla Verde",
        contacto: "barranquillaverde.gov.co | (605) 311 2470",
        accion: "Solicita una visita técnica o permiso de poda.",
      },
      MUN: {
        entidad: "CRA",
        contacto: "01 8000 931075 | crautonoma.gov.co",
        accion: "Pide inspección técnica o permiso forestal.",
      },
      COSTA: {
        entidad: "CRA / Barranquilla Verde",
        contacto: "CRA: 01 8000 931075 | B/quilla Verde: (605) 311 2470",
        accion: "Solicita revisión preventiva del árbol.",
      },
    },
  },
  INCENDIO: {
    ROJO: {
      BQ: {
        entidad: "Bomberos de Barranquilla + Policía",
        contacto: "Llama al 119 y al 123 | Est. Central: 320 830 4460",
        accion: "Aléjate del humo y llama de inmediato.",
      },
      MUN: {
        entidad: "Bomberos + Policía",
        contacto: "Llama al 119 y al 123 | Soledad: 301 757 5080 | Galapa: 301 500 5462",
        accion: "Reporta el fuego activo dando el municipio y una referencia visible.",
      },
      COSTA: {
        entidad: "Bomberos + Policía + Autoridad Ambiental",
        contacto: "Llama al 119 y al 123",
        accion: "Avisa que hay fuego activo en zona de manglar, playa o humedal.",
      },
    },
    AMARILLO: {
      BQ: {
        entidad: "Policía + Barranquilla Verde + Fiscalía",
        contacto: "123 | WhatsApp B/quilla Verde: 317 368 2850 | Fiscalía: 122",
        accion: "Reporta quemas repetitivas de basura o monte con evidencia.",
      },
      MUN: {
        entidad: "Policía + CRA + Fiscalía",
        contacto: "123 | CRA: 01 8000 931075 | Fiscalía: 122",
        accion: "Denuncia las quemas constantes que afectan a los vecinos.",
      },
      COSTA: {
        entidad: "Policía + CRA / Barranquilla Verde",
        contacto: "123 | CRA: 01 8000 931075 | B/quilla Verde: 317 368 2850",
        accion: "Reporta quemas recurrentes cerca del manglar o humedal.",
      },
    },
    VERDE: {
      BQ: {
        entidad: "Alcaldía de Barranquilla (Gestión del Riesgo)",
        contacto: "Línea 195",
        accion: "Avisa sobre acumulación de maleza seca con riesgo de incendio.",
      },
      MUN: {
        entidad: "Alcaldía Municipal (Gestión del Riesgo)",
        contacto: "Acude o llama a tu Alcaldía local (en emergencia: 119)",
        accion: "Solicita limpieza preventiva de lotes con monte seco.",
      },
      COSTA: {
        entidad: "Gestión del Riesgo local + CRA / B/quilla Verde",
        contacto: "B/quilla: 195 | CRA: 01 8000 931075",
        accion: "Reporta material inflamable acumulado en zona natural.",
      },
    },
  },
  RESIDUOS: {
    ROJO: {
      BQ: {
        entidad: "Policía + Barranquilla Verde + Fiscalía",
        contacto: "123 | WhatsApp B/quilla Verde: 317 368 2850 | Fiscalía: 122",
        accion:
          "Reporta ya si están tirando químicos o basura directo a un arroyo o ciénaga.",
      },
      MUN: {
        entidad: "Policía + CRA + Fiscalía",
        contacto: "123 | CRA: 01 8000 931075 | Fiscalía: 122",
        accion: "Reporta el vertimiento peligroso en curso con ubicación exacta.",
      },
      COSTA: {
        entidad: "Policía + DIMAR + CRA / Barranquilla Verde",
        contacto: "123 | DIMAR: 01 8000 416870 | CRA: 01 8000 931075",
        accion: "Reporta contaminación activa en playa, mar o manglar.",
      },
    },
    AMARILLO: {
      BQ: {
        entidad: "Policía + Barranquilla Verde",
        contacto: "123 | WhatsApp B/quilla Verde: 317 368 2850",
        accion: "Denuncia botaderos ilegales o personas arrojando escombros.",
      },
      MUN: {
        entidad: "Policía + CRA",
        contacto: "123 | CRA: 01 8000 931075",
        accion: "Reporta el basurero ilegal con fotos y dirección.",
      },
      COSTA: {
        entidad: "Policía + CRA / B/quilla Verde + DIMAR",
        contacto: "123 | CRA: 01 8000 931075 | DIMAR: 01 8000 416870",
        accion: "Denuncia acumulación ilegal de escombros o basura en zona costera.",
      },
    },
    VERDE: {
      BQ: {
        entidad: "Triple A",
        contacto: "Línea 116 | (605) 385 0376",
        accion: "Reporta si no pasó el camión o pide recolección de escombros.",
      },
      MUN: {
        entidad: "Triple A o empresa de aseo municipal",
        contacto: "Triple A: 116 (si opera en tu municipio) o empresa local de aseo",
        accion: "Solicita recolección domiciliaria o de residuos voluminosos.",
      },
      COSTA: {
        entidad: "Alcaldía local / Empresa de aseo",
        contacto: "Barranquilla: 195 / Triple A: 116",
        accion: "Solicita jornada de limpieza en la playa o zona cercana.",
      },
    },
  },
  FAUNA: {
    ROJO: {
      BQ: {
        entidad: "Policía + Barranquilla Verde",
        contacto: "123 | WhatsApp B/quilla Verde: 317 368 2850",
        accion:
          "Llama ya si están cazando/maltratando o si el animal está herido. No intentes agarrarlo.",
      },
      MUN: {
        entidad: "Policía + Policía Ambiental DEATA + CRA",
        contacto: "123 | Policía Ambiental: 304 206 0366 | CRA: 01 8000 931075",
        accion: "Reporta caza en flagrancia o animal silvestre herido.",
      },
      COSTA: {
        entidad: "Policía + Policía Ambiental / Barranquilla Verde / CRA",
        contacto: "123 | B/quilla Verde: 317 368 2850 | DEATA: 304 206 0366",
        accion: "Avisa de inmediato si cazan fauna en manglares o playas.",
      },
    },
    AMARILLO: {
      BQ: {
        entidad: "Fiscalía + Barranquilla Verde",
        contacto: "Fiscalía: 122 | B/quilla Verde: (605) 311 2470 Ext. 107",
        accion: "Denuncia si alguien tiene animales silvestres encerrados o los vende.",
      },
      MUN: {
        entidad: "Fiscalía + CRA + Policía Ambiental",
        contacto: "Fiscalía: 122 | CRA: 01 8000 931075 | DEATA: 304 206 0366",
        accion: "Reporta venta ilegal, trampas o tenencia de fauna silvestre.",
      },
      COSTA: {
        entidad: "Fiscalía + CRA / Barranquilla Verde",
        contacto: "Fiscalía: 122 | CRA: 01 8000 931075 | B/quilla Verde: 317 368 2850",
        accion: "Denuncia tráfico o trampas instaladas en manglares o humedales.",
      },
    },
    VERDE: {
      BQ: {
        entidad: "Barranquilla Verde",
        contacto: "WhatsApp: 317 368 2850",
        accion: "Mantén distancia y avisa para que rescaten al animal sano y lo reubiquen.",
      },
      MUN: {
        entidad: "CRA",
        contacto: "01 8000 931075",
        accion: "Avisa del avistamiento para que lo devuelvan a su hábitat sin lastimarlo.",
      },
      COSTA: {
        entidad: "Barranquilla Verde / CRA",
        contacto: "B/quilla Verde: 317 368 2850 | CRA: 01 8000 931075",
        accion: "No lo alimentes ni lo toques; reporta su ubicación.",
      },
    },
  },
  INVASION: {
    ROJO: {
      BQ: {
        entidad: "Policía + Sec. Control Urbano + Barranquilla Verde",
        contacto: "123 | Alcaldía: 195 | B/quilla Verde: 317 368 2850",
        accion: "Llama ya si están armando cambuches o rellenando un terreno o manglar.",
      },
      MUN: {
        entidad: "Policía + Inspección de Policía + CRA",
        contacto: "123 | CRA: 01 8000 931075",
        accion: "Reporta la ocupación o relleno ilegal mientras ocurre.",
      },
      COSTA: {
        entidad: "Policía + DIMAR + CRA / Barranquilla Verde",
        contacto: "123 | DIMAR: 01 8000 416870 | CRA: 01 8000 931075",
        accion: "Reporta de inmediato invasión o relleno en playas o manglares.",
      },
    },
    AMARILLO: {
      BQ: {
        entidad: "Fiscalía + Barranquilla Verde + Personería",
        contacto: "Fiscalía: 122 | B/quilla Verde: (605) 311 2470",
        accion:
          "Denuncia si ya llevan tiempo invadiendo un humedal, manglar o zona protegida.",
      },
      MUN: {
        entidad: "Fiscalía + CRA + Personería municipal",
        contacto: "Fiscalía: 122 | CRA: 01 8000 931075",
        accion: "Envía fotos y ubicación de la invasión en zona ambiental.",
      },
      COSTA: {
        entidad: "Fiscalía + DIMAR + CRA / Barranquilla Verde",
        contacto: "Fiscalía: 122 | DIMAR: 01 8000 416870 | CRA: 01 8000 931075",
        accion: "Denuncia ocupaciones ya instaladas en playas o bajamar.",
      },
    },
    VERDE: {
      BQ: {
        entidad: "Alcaldía de Barranquilla (Control Urbano y Espacio Público)",
        contacto: "Línea 195 | (605) 401 0205",
        accion: "Reporta ocupación de andenes, calles o construcciones sin permiso.",
      },
      MUN: {
        entidad: "Alcaldía Municipal (Sec. de Gobierno / Inspección de Policía)",
        contacto: "Canal de atención de tu Alcaldía municipal",
        accion: "Solicita inspección por ocupación indebida de espacio público.",
      },
      COSTA: {
        entidad: "Alcaldía local + DIMAR",
        contacto: "DIMAR: 01 8000 416870 | B/quilla: 195",
        accion: "Reporta cerramientos o estructuras menores indebidas en playa.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 4) Pie de mensaje / marco institucional
// ---------------------------------------------------------------------------
export const FALLBACK =
  "Si no te contestan rápido y hay peligro o delito en curso, llama siempre al 123 (Policía) o al 119 (Bomberos).";

export const NOTA_MARCO =
  "Triage inspirado en niveles de alerta de gestión del riesgo (UNGRD) y denuncia ambiental (ANLA / Ley 1333). El bot orienta; la autoridad competente verifica.";
