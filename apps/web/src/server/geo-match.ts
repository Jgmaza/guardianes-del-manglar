import type { ReportGeoMatch } from '@guardianes/contracts';
import {
  createSupabaseServiceClient,
  isSupabaseGeoConfigured,
} from '@guardianes/database';
import { summarizeGeoMatch, type GeoMatchRawPayload } from '@guardianes/geo-engine';

/**
 * Point-in-polygon against CRA priorities + INVEMAR zonificación via PostGIS RPC.
 * Returns null when Supabase service role is not configured.
 */
export async function matchReportLocation(options: {
  longitude: number;
  latitude: number;
}): Promise<ReportGeoMatch | null> {
  if (!isSupabaseGeoConfigured()) {
    return null;
  }

  try {
    const client = createSupabaseServiceClient();
    const { data, error } = await client.rpc('geo_match_report_location', {
      p_longitude: options.longitude,
      p_latitude: options.latitude,
    });

    if (error) {
      console.error('[geo-match] rpc failed', error.message);
      return null;
    }

    const raw = (data ?? { cra: [], invemar: [] }) as GeoMatchRawPayload;
    return summarizeGeoMatch({
      longitude: options.longitude,
      latitude: options.latitude,
      raw,
    });
  } catch (err) {
    console.error('[geo-match] unavailable', err);
    return null;
  }
}
