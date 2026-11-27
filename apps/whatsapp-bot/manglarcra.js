/**
 * Snapshot operativo del visor C.R.A.
 * Fuente: https://manglarcra.netlify.app/workflow  (data/core.json)
 * Actualización de referencia: monitoreo Sentinel 2015–2026 / workflow trimestral.
 *
 * Coordenadas de capas locales (aprox. UTM 18N → WGS84):
 * - Caja Mallorquín/detalle: ~11.01–11.06 N, 74.90–74.85 W
 * Sectores del AOI costero Atlántico (4 zonas del workflow).
 */

export const MANGLARCRA_URL = "https://manglarcra.netlify.app/workflow";
export const MANGLARCRA_PLATFORM_URL = "https://manglarcra.netlify.app/maqueta";

/** Municipios del departamento presentes en el visor. */
export const MANGLARCRA_MUNICIPIOS = [
  "Barranquilla",
  "Puerto Colombia",
  "Galapa",
  "Soledad",
  "Tubará",
  "Malambo",
  "Baranoa",
  "Juan de Acosta",
  "Polonuevo",
  "Sabanagrande",
  "Piojó",
  "Usiacurí",
  "Santo Tomás",
  "Palmar de Varela",
  "Ponedera",
  "Sabanalarga",
  "Luruaco",
  "Repelón",
  "Manatí",
  "Candelaria",
  "Campo de la Cruz",
  "Santa Lucía",
  "Suan",
];

/**
 * Sectores costeros reales del workflow.
 * `ruta` = celda en REGLAS (BQ | MUN | COSTA) para no romper la matriz 5×3×3.
 */
export const MANGLARCRA_SECTORES = {
  Z1: {
    id: "Z1",
    label: "Mallorquín / Bocas de Ceniza",
    short: "Mallorquín",
    ruta: "BQ",
    municipioHint: "Barranquilla",
    referencia_ha: 347.6,
    segura_ha: 261.7,
    perdida_ha: 36.4,
    altura_mediana_m: 11.4,
    carbono_tC: 70659,
    bboxApprox: { south: 11.0, west: -74.92, north: 11.1, east: -74.78 },
  },
  Z2: {
    id: "Z2",
    label: "Pto. Colombia / Balboa / Velero",
    short: "Puerto Colombia",
    ruta: "COSTA",
    municipioHint: "Puerto Colombia",
    referencia_ha: 91.4,
    segura_ha: 59.7,
    perdida_ha: 0,
    altura_mediana_m: 11.1,
    carbono_tC: 16119,
    bboxApprox: { south: 10.95, west: -75.05, north: 11.08, east: -74.9 },
  },
  Z3: {
    id: "Z3",
    label: "Tubará / Juan de Acosta",
    short: "Tubará–Acosta",
    ruta: "COSTA",
    municipioHint: "Tubará",
    referencia_ha: 45.4,
    segura_ha: 26.9,
    perdida_ha: 0.2,
    altura_mediana_m: 11.0,
    carbono_tC: 7263,
    bboxApprox: { south: 10.85, west: -75.15, north: 11.0, east: -74.95 },
  },
  Z4: {
    id: "Z4",
    label: "Totumo / Astilleros / Galerazamba",
    short: "Totumo–Galerazamba",
    ruta: "COSTA",
    municipioHint: "Juan de Acosta / Luruaco",
    referencia_ha: 290.5,
    segura_ha: 116.4,
    perdida_ha: 0,
    altura_mediana_m: 9.8,
    carbono_tC: 31428,
    bboxApprox: { south: 10.7, west: -75.25, north: 10.95, east: -75.0 },
  },
  MUN: {
    id: "MUN",
    label: "Otro municipio del Atlántico",
    short: "Otro municipio",
    ruta: "MUN",
    municipioHint: null,
    referencia_ha: null,
    segura_ha: null,
    perdida_ha: null,
    altura_mediana_m: null,
    carbono_tC: null,
    bboxApprox: null,
  },
};

/** Totales del workflow (core.json → resumen + t_area). */
export const MANGLARCRA_TOTALES = {
  manglar_probable_ha: 774.8,
  ha_por_revisar: 828,
  dosel_mas_seco_2026_ha: 144.6,
  perdida_confirmada_ha: 36.6,
  reserva_carbono_tC: 125000,
  anios: "2015–2026",
  fuente: "C.R.A. · manglarcra.netlify.app/workflow",
};

export function sectorOf(zonaId) {
  return MANGLARCRA_SECTORES[zonaId] || null;
}

export function rutaZona(zonaId) {
  return sectorOf(zonaId)?.ruta || zonaId;
}

export function contextoSectorLine(zonaId) {
  const s = sectorOf(zonaId);
  if (!s || s.referencia_ha == null) return null;
  const perdida =
    s.perdida_ha > 0 ? ` · pérdida conf. ${s.perdida_ha} ha` : "";
  return `${s.short}: ${s.referencia_ha} ha ref.${perdida}`;
}
