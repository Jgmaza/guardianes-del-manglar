import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

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
        },
        meta: {
          persistence: service.persistenceEnabled ? 'supabase' : 'memory',
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
