import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export type PendingReportRecord = {
  clientReportId: string;
  channel: 'pwa' | 'whatsapp';
  description?: string;
  categoryCode?: string;
  location: {
    longitude: number;
    latitude: number;
    accuracyMeters?: number;
    source: 'device_gps' | 'map_pin' | 'whatsapp_shared_location' | 'unknown';
  };
  observedAt?: string;
  photo?: {
    mimeType: string;
    base64: string;
    byteLength: number;
  };
  createdAt: string;
  status: SyncStatus;
  attempts: number;
  lastError?: string;
  /** Set only after server acknowledges creation */
  serverReportId?: string;
  trackingCode?: string;
  trackingSecret?: string;
  syncedAt?: string;
};

interface GuardianesDB extends DBSchema {
  pendingReports: {
    key: string;
    value: PendingReportRecord;
    indexes: { byStatus: SyncStatus };
  };
}

const DB_NAME = 'guardianes-del-manglar';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GuardianesDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<GuardianesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('pendingReports', { keyPath: 'clientReportId' });
        store.createIndex('byStatus', 'status');
      },
    });
  }
  return dbPromise;
}

export async function putPendingReport(record: PendingReportRecord): Promise<void> {
  const db = await getDb();
  await db.put('pendingReports', record);
}

export async function getPendingReport(clientReportId: string) {
  const db = await getDb();
  return db.get('pendingReports', clientReportId);
}

export async function listPendingReports(): Promise<PendingReportRecord[]> {
  const db = await getDb();
  return db.getAll('pendingReports');
}

export async function listUnsyncedReports(): Promise<PendingReportRecord[]> {
  const all = await listPendingReports();
  return all.filter((r) => r.status === 'pending' || r.status === 'error');
}

export async function updatePendingReport(
  clientReportId: string,
  patch: Partial<PendingReportRecord>,
): Promise<PendingReportRecord | undefined> {
  const db = await getDb();
  const current = await db.get('pendingReports', clientReportId);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  await db.put('pendingReports', next);
  return next;
}
