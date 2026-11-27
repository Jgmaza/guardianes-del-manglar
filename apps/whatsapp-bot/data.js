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
    texto: "¿Hay peligro ahora?",
    opciones: [
      { id: "SI", label: "Sí, peligro ahora" },
      { id: "NO", label: "No, con calma" },
    ],
  },
  paso_tipo: {
    texto: "¿Qué ves?",
    opciones: [
      { id: "TALA", label: "Cortan árboles" },
      { id: "INCENDIO", label: "Fuego o humo" },
      { id: "RESIDUOS", label: "Basura / escombros" },
      { id: "FAUNA", label: "Fauna / caza" },
      { id: "INVASION", label: "Invasión / manglar" },
    ],
  },
  paso_nivel: {
    texto: "¿Qué tan urgente?",
    opciones: [
      { id: "ROJO", label: "Rojo — pasa YA" },
      { id: "AMARILLO", label: "Amarillo — ya pasó" },
      { id: "VERDE", label: "Verde — trámite" },
    ],
  },
  paso_zona: {
    texto: "¿En qué sector?",
    opciones: [
      { id: "Z1", label: "Mallorquín / Bocas de Ceniza" },
      { id: "Z2", label: "Pto. Colombia / Balboa / Velero" },
      { id: "Z3", label: "Tubará / Juan de Acosta" },
      { id: "Z4", label: "Totumo / Astilleros / Galerazamba" },
      { id: "MUN", label: "Otro municipio" },
    ],
  },
  paso_privacidad: {
    texto: "¿Cómo reportas?",
    opciones: [
      { id: "ANONIMO", label: "Anónimo" },
      { id: "IDENTIFICADO", label: "Con mis datos" },
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
    titulo: "Alerta roja",
    prioridad: "P0",
    tono: "Actúa ya. No te expongas.",
    evidencia: "Punto de referencia, sin acercarte.",
  },
  AMARILLO: {
    titulo: "Alerta amarilla",
    prioridad: "P1",
    tono: "Denuncia con fotos y lugar.",
    evidencia: "Fotos + dirección + hora.",
  },
  VERDE: {
    titulo: "Alerta verde",
    prioridad: "P2",
    tono: "Trámite en horario hábil.",
    evidencia: "Describe el lugar y lo que pides.",
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
export const FALLBACK = "Si no contestan y hay peligro: 123 o 119.";

export const NOTA_MARCO =
  "El bot orienta; la autoridad verifica.";
