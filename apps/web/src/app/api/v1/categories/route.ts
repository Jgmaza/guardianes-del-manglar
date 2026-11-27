import { NextResponse } from 'next/server';
import { getReportService } from '@/server/report-service';

export const runtime = 'nodejs';

/** GET /api/v1/categories — configurable catalog (not inventing CRA official list) */
export async function GET() {
  const categories = getReportService().listCategories();
  return NextResponse.json({
    data: categories,
    meta: {
      note: 'Official CRA categories are PENDING external supply. system_placeholder/local_config are not official.',
    },
  });
}
