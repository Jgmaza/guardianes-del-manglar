import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, unknown>();

vi.mock('./db', () => {
  return {
    listUnsyncedReports: async () =>
      [...memory.values()].filter(
        (r) =>
          typeof r === 'object' &&
          r !== null &&
          'status' in r &&
          ((r as { status: string }).status === 'pending' ||
            (r as { status: string }).status === 'error'),
      ),
    getPendingReport: async (id: string) => memory.get(id),
    putPendingReport: async (record: { clientReportId: string }) => {
      memory.set(record.clientReportId, record);
    },
    updatePendingReport: async (id: string, patch: Record<string, unknown>) => {
      const current = memory.get(id) as Record<string, unknown>;
      const next = { ...current, ...patch };
      memory.set(id, next);
      return next;
    },
  };
});

import { enqueueReport, syncPendingReports } from './sync';

describe('offline sync queue', () => {
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: {
            id: 'server-1',
            trackingCode: 'GDM-TEST1234',
            trackingSecret: 'secret-value-for-tests-0001',
          },
        }),
      })),
    );
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });
  });

  it('protects against duplicate clientReportId enqueue', async () => {
    const a = await enqueueReport({
      clientReportId: '11111111-1111-4111-8111-111111111111',
      channel: 'pwa',
      location: {
        longitude: -74.8,
        latitude: 10.9,
        source: 'device_gps',
      },
    });
    const b = await enqueueReport({
      clientReportId: '11111111-1111-4111-8111-111111111111',
      channel: 'pwa',
      location: {
        longitude: -74.8,
        latitude: 10.9,
        source: 'device_gps',
      },
    });
    expect(a.clientReportId).toBe(b.clientReportId);
    expect(memory.size).toBe(1);
  });

  it('marks synced only after successful server response', async () => {
    await enqueueReport({
      clientReportId: '22222222-2222-4222-8222-222222222222',
      channel: 'pwa',
      location: {
        longitude: -74.8,
        latitude: 10.9,
        source: 'map_pin',
      },
      description: 'offline draft',
    });

    const result = await syncPendingReports();
    expect(result.synced).toBe(1);
    const stored = memory.get('22222222-2222-4222-8222-222222222222') as {
      status: string;
      trackingCode?: string;
    };
    expect(stored.status).toBe('synced');
    expect(stored.trackingCode).toBe('GDM-TEST1234');
  });

  it('does not claim sync when offline', async () => {
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    });
    await enqueueReport({
      clientReportId: '33333333-3333-4333-8333-333333333333',
      channel: 'pwa',
      location: { longitude: -74.8, latitude: 10.9, source: 'device_gps' },
    });
    const result = await syncPendingReports();
    expect(result.processed).toBe(0);
    const stored = memory.get('33333333-3333-4333-8333-333333333333') as { status: string };
    expect(stored.status).toBe('pending');
  });
});
