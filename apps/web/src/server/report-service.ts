import {
  createReportsPersistenceClient,
  isReportsPersistenceConfigured,
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
 * - Without Supabase public config → in-memory only (demo).
 * - With NEXT_PUBLIC_SUPABASE_* (+ optional SERVICE_ROLE) → write-through to Postgres.
 * Override with REPORTS_PERSISTENCE=memory to force memory mode.
 */
export function getReportService(): PersistingReportService {
  if (!globalThis.__guardianesReportService) {
    const categories = createTriageCategoryCatalog();
    const inner = ReportService.create(categories);

    let repo: SupabaseReportsRepository | null = null;
    if (isReportsPersistenceConfigured()) {
      try {
        const client = createReportsPersistenceClient();
        repo = new SupabaseReportsRepository(client);
        // Best-effort sequential seed (reuse DB ids by code; avoid parallel races).
        void (async () => {
          for (const category of categories) {
            await repo!.upsertCategory(category);
          }
        })().catch((err) => {
          console.error('Failed to seed report_categories in Supabase', err);
        });
        console.info(
          `[reports] persistence=supabase (${isSupabaseServiceConfigured() ? 'service_role' : 'anon'})`,
        );
      } catch (err) {
        console.error('[reports] Supabase client unavailable — using memory', err);
        repo = null;
      }
    } else {
      console.info('[reports] persistence=memory');
    }

    globalThis.__guardianesReportService = new PersistingReportService(inner, repo);
  }
  return globalThis.__guardianesReportService;
}
