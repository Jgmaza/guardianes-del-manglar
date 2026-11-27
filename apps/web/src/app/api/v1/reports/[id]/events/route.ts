import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/v1/reports/:id/events — audit trail without reporter PII payloads */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    // ensure report exists / dashboard-safe access path
    await getReportService().dashboardView(id);
    const events = await getReportService().listEvents(id);
    return NextResponse.json({ data: events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Events lookup failed' },
      { status: 404 },
    );
  }
}
