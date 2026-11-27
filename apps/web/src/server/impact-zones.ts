import {
  createSupabaseServiceClient,
  isSupabaseGeoConfigured,
} from '@guardianes/database';

export type OfficialImpactZone = {
  locality: string;
  hectares: number;
  polygonCount: number;
  dominantSpecies: string | null;
  managementZone: string | null;
  intervention: string | null;
  degradation: string | null;
  currentUse: string | null;
  landConflict: string | null;
  faunaPressure: string | null;
  impactScore: number;
};

export type ImpactZonesSummary = {
  source: { invemar: string; cra: string };
  craPriorityCounts: Array<{ priority: string; count: number }>;
  zones: OfficialImpactZone[];
};

export async function fetchOfficialImpactZones(): Promise<ImpactZonesSummary | null> {
  if (!isSupabaseGeoConfigured()) {
    return null;
  }

  try {
    const client = createSupabaseServiceClient();
    const { data, error } = await client.rpc('geo_impact_zones_summary');
    if (error) {
      console.error('[impact-zones] rpc failed', error.message);
      return null;
    }
    return (data ?? null) as ImpactZonesSummary | null;
  } catch (err) {
    console.error('[impact-zones] unavailable', err);
    return null;
  }
}
