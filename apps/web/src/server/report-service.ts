import { ReportService } from '@guardianes/report-engine';

declare global {
  var __guardianesReportService: ReportService | undefined;
}

/**
 * Process-local in-memory domain service for foundation/demo.
 * Replace with Supabase-backed repository when DATABASE_URL is configured.
 */
export function getReportService(): ReportService {
  if (!globalThis.__guardianesReportService) {
    globalThis.__guardianesReportService = ReportService.create();
  }
  return globalThis.__guardianesReportService;
}
