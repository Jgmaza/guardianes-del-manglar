import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

/**
 * POST /api/v1/reports/track
 * Body: { trackingCode, trackingSecret }
 * Public status view — no PII / no reporter reference.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const view = getReportService().track(body);
    return NextResponse.json({ data: view });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tracking failed' },
      { status: 401 },
    );
  }
}
