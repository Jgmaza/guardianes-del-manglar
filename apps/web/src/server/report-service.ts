import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured,
  SupabaseReportsRepository,
} from '@guardianes/database';
import {
  ReportService,
  createTriageCategoryCatalog,
} from '@guardianes/report-engine';
import { PersistingReportService } from './persisting-report-service';

declare global {
  var __guardianesReportService: PersistingReportService | undefined;
}

/**
 * Process-local report service.
 * - Without Supabase service role → in-memory only (demo).
 * - With NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY → write-through to Postgres.
 * Override with REPORTS_PERSISTENCE=memory to force memory mode.
 */
export function getReportService(): PersistingReportService {
  if (!globalThis.__guardianesReportService) {
    const categories = createTriageCategoryCatalog();
    const inner = ReportService.create(categories);

    let repo: SupabaseReportsRepository | null = null;
    if (isSupabaseServiceConfigured()) {
      try {
        const client = createSupabaseServiceClient();
        repo = new SupabaseReportsRepository(client);
        // Best-effort seed of local triage categories (non-blocking for first request).
        void Promise.all(categories.map((c) => repo!.upsertCategory(c))).catch((err) => {
          console.error('Failed to seed report_categories in Supabase', err);
        });
        console.info('[reports] persistence=supabase');
      } catch (err) {
        console.error('[reports] Supabase service client unavailable — using memory', err);
        repo = null;
      }
    } else {
      console.info('[reports] persistence=memory');
    }

    globalThis.__guardianesReportService = new PersistingReportService(inner, repo);
  }
  return globalThis.__guardianesReportService;
}
