import { NextResponse } from 'next/server';
import { fetchOfficialImpactZones } from '@/server/impact-zones';

export const runtime = 'nodejs';

/**
 * GET /api/v1/geo/impact-zones
 * Official INVEMAR locality impact + CRA priority counts (PostGIS layers).
 */
export async function GET() {
  const data = await fetchOfficialImpactZones();
  if (!data) {
    return NextResponse.json(
      {
        error: 'Capas INVEMAR/C.R.A. no disponibles (falta Supabase service role o RPC).',
      },
      { status: 503 },
    );
  }
  return NextResponse.json({
    data,
    meta: {
      zoneCount: data.zones.length,
      source: data.source,
    },
  });
}
