import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/reports/:id/alerts
 * Creates a PRELIMINARY alert explicitly. Reports do not auto-become alerts.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const alert = await getReportService().createPreliminaryAlert({
      ...body,
      reportId: id,
    });
    return NextResponse.json(
      {
        data: alert,
        meta: {
          note: 'Alert status=preliminary is operational only and is not a legal authorization.',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Alert creation failed' },
      { status: 400 },
    );
  }
}
