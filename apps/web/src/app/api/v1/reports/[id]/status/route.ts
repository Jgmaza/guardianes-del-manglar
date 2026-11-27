import type { ReportStatus } from '@guardianes/contracts';
import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/v1/reports/:id/status */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { toStatus?: ReportStatus; reason?: string };
    if (!body.toStatus) {
      return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
    }
    const report = await getReportService().transitionStatus(id, body.toStatus, body.reason);
    return NextResponse.json({
      data: await getReportService().dashboardView(report.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status transition failed' },
      { status: 400 },
    );
  }
}
