import type { ReportGeoMatch } from '@guardianes/contracts';

export type GeoMatchHit = {
  source_placemark_id?: string;
  name?: string | null;
  properties_original?: Record<string, unknown> | null;
};

export type GeoMatchRawPayload = {
  cra?: GeoMatchHit[] | null;
  invemar?: GeoMatchHit[] | null;
};

function asString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function propsOf(hit: GeoMatchHit | undefined): Record<string, unknown> {
  return (hit?.properties_original ?? {}) as Record<string, unknown>;
}

/**
 * Summarize PostGIS `geo_match_report_location` hits into a dashboard-safe object.
 * Only reads attributes present on the source layers — never invents species/priority.
 */
export function summarizeGeoMatch(options: {
  longitude: number;
  latitude: number;
  raw: GeoMatchRawPayload;
  matchedAt?: string;
}): ReportGeoMatch {
  const craHits = options.raw.cra ?? [];
  const invHits = options.raw.invemar ?? [];
  const craProps = propsOf(craHits[0]);
  const invProps = propsOf(invHits[0]);

  return {
    matchedAt: options.matchedAt ?? new Date().toISOString(),
    longitude: options.longitude,
    latitude: options.latitude,
    cra: {
      hasCoverage: craHits.length > 0,
      matchCount: craHits.length,
      priority: asString(craProps.Val_Priori),
      zoneHydro: asString(craProps.NOMZH),
      subzoneHydro: asString(craProps.NOMSZH),
      unitHydro: asString(craProps.NOMUH),
      action: asString(craProps.AccionGen),
      scenario: asString(craProps.Escenarios),
    },
    invemar: {
      hasCoverage: invHits.length > 0,
      matchCount: invHits.length,
      dominantSpecies: asString(invProps.COB_SPDOM),
      composition: asString(invProps.COB_CMPSCI),
      structure: asString(invProps.COB_ESTRCT),
      managementZone: asString(invProps.ZONIF) ?? asString(invProps.ZONIFICACI),
      locality: asString(invProps.LOCALIDAD),
    },
  };
}
