import { isSupabaseConfigured } from '@guardianes/database';
import { createTrackingCode } from '@guardianes/report-engine';

export function getFoundationSnapshot() {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Guardianes del Manglar',
    supabaseReady: isSupabaseConfigured(),
    sampleTrackingCode: createTrackingCode(() => 0.42),
  };
}
