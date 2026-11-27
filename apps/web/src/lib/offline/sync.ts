import {
  getPendingReport,
  listUnsyncedReports,
  putPendingReport,
  updatePendingReport,
  type PendingReportRecord,
} from './db';

export type SyncResult = {
  processed: number;
  synced: number;
  failed: number;
  details: Array<{ clientReportId: string; ok: boolean; message: string }>;
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { data?: unknown; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json;
}

/**
 * Flush local queue to the API.
 * Only after a successful response may we claim the CRA/system received the report.
 */
export async function syncPendingReports(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, synced: 0, failed: 0, details: [] };
  }

  const queue = await listUnsyncedReports();
  const result: SyncResult = { processed: 0, synced: 0, failed: 0, details: [] };

  for (const item of queue) {
    result.processed += 1;
    // Idempotency: if already synced, skip
    if (item.status === 'synced' && item.serverReportId) {
      result.details.push({
        clientReportId: item.clientReportId,
        ok: true,
        message: 'Already synced',
      });
      continue;
    }

    await updatePendingReport(item.clientReportId, {
      status: 'syncing',
      attempts: item.attempts + 1,
    });

    try {
      const created = await postJson('/api/v1/reports', {
        channel: item.channel,
        location: item.location,
        description: item.description,
        categoryCode: item.categoryCode ?? 'uncategorized',
        clientReportId: item.clientReportId,
        observedAt: item.observedAt,
      });

      const data = created.data as {
        id: string;
        trackingCode: string;
        trackingSecret: string;
      };

      if (item.photo) {
        await postJson(`/api/v1/reports/${data.id}/evidences`, {
          mimeType: item.photo.mimeType,
          contentBase64: item.photo.base64,
          sharedLocation: {
            longitude: item.location.longitude,
            latitude: item.location.latitude,
          },
          mediaKind: 'photo',
        });
      }

      await updatePendingReport(item.clientReportId, {
        status: 'synced',
        serverReportId: data.id,
        trackingCode: data.trackingCode,
        trackingSecret: data.trackingSecret,
        syncedAt: new Date().toISOString(),
        lastError: undefined,
      });

      result.synced += 1;
      result.details.push({
        clientReportId: item.clientReportId,
        ok: true,
        message: 'Synced with server',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await updatePendingReport(item.clientReportId, {
        status: 'error',
        lastError: message,
      });
      result.failed += 1;
      result.details.push({ clientReportId: item.clientReportId, ok: false, message });
    }
  }

  return result;
}

export async function enqueueReport(
  input: Omit<PendingReportRecord, 'status' | 'attempts' | 'createdAt'> & {
    createdAt?: string;
  },
): Promise<PendingReportRecord> {
  const existing = await getPendingReport(input.clientReportId);
  if (existing) {
    // Duplicate protection: same clientReportId is not re-queued as a new send
    return existing;
  }

  const record: PendingReportRecord = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  };
  await putPendingReport(record);
  return record;
}
