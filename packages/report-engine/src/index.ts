export {
  assertNoPiiFields,
  stripReporterFromDashboardReport,
  toPublicTrackingView,
  toSanitizedExport,
} from './anonymity';
export {
  createDefaultCategoryCatalog,
  resolveCategory,
  upsertCategory,
} from './categories';
export {
  createTrackingCode,
  createTrackingSecret,
  hashReporterHandle,
  hashSecret,
  newId,
} from './ids';
export { ReportService, type CreateReportResult } from './service';
export {
  assertTransition,
  canTransition,
  listAllowedTransitions,
} from './status';
export {
  createInMemoryStore,
  getReportEvidences,
  type ReportDomainStore,
} from './store';

/** @deprecated legacy draft helper — prefer ReportService.createReport */
export { createReportSchema as parseReportDraftSchema } from '@guardianes/validation';
import { createReportSchema } from '@guardianes/validation';
import type { ReportChannel } from '@guardianes/contracts';

export function parseReportDraft(input: unknown) {
  return createReportSchema.parse(input);
}

export function assertSupportedChannel(channel: ReportChannel): void {
  if (channel !== 'pwa' && channel !== 'whatsapp') {
    throw new Error(`Unsupported channel: ${String(channel)}`);
  }
}
