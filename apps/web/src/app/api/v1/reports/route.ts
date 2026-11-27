import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

/**
 * GET /api/v1/reports
 * Sanitized CRA dashboard list (no secrets, no reporter references).
 * In-memory store — empty until reports are created via POST / PWA / WhatsApp.
 */
export async function GET() {
  const service = getReportService();
  const data = await service.listReportsForDashboardHydrated();
  return NextResponse.json({
    data,
    meta: {
      count: data.length,
      persistence: service.persistenceEnabled ? 'supabase' : 'memory',
      env: {
        hasUrl: Boolean(process.env['SUPABASE_URL'] || process.env['NEXT_PUBLIC_SUPABASE_URL']),
        hasAnon: Boolean(process.env['SUPABASE_ANON_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']),
        enable: process.env['NEXT_PUBLIC_ENABLE_SUPABASE'] ?? null,
        hasService: Boolean(process.env['SUPABASE_SERVICE_ROLE_KEY']),
        reportsPersistence: process.env['REPORTS_PERSISTENCE'] ?? null,
      },
      note: 'Geo fields (priorityHint, zone, species) filled when PostGIS match runs at create time.',
    },
  });
}

/**
 * POST /api/v1/reports
 * Creates a channel-agnostic report (PWA or WhatsApp adapter uses the same contract).
 * Returns trackingCode + trackingSecret once. No account required.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const service = getReportService();
    const result = await service.createReport(body);
    const geoMatch = service.getStore().geoMatches.get(result.report.id) ?? null;
    return NextResponse.json(
      {
        data: {
          id: result.report.id,
          trackingCode: result.trackingCode,
          trackingSecret: result.trackingSecret,
          status: result.report.status,
          category: result.category
            ? {
                id: result.category.id,
                code: result.category.code,
                label: result.category.label,
                source: result.category.source,
              }
            : null,
          observedAt: result.report.observedAt,
          receivedAt: result.report.receivedAt,
          geoMatch,
        },
        meta: {
          persistence: service.persistenceEnabled ? 'supabase' : 'memory',
          geoMatched: Boolean(geoMatch),
          warning:
            'Store trackingSecret securely. It is not returned again and is never shown on CRA dashboards.',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid report payload' },
      { status: 400 },
    );
  }
}
