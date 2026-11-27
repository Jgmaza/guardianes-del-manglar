import { describe, expect, it } from 'vitest';
import {
  categoryFromRow,
  categoryToRow,
  eventFromRow,
  eventToRow,
  reportFromRow,
  reportToRow,
} from './reports-repository';

describe('reports-repository mappers', () => {
  it('round-trips a report row', () => {
    const report = {
      id: '11111111-1111-1111-1111-111111111111',
      trackingCode: 'GDM-ABCDEF',
      trackingSecretHash: 'abc',
      channel: 'whatsapp' as const,
      status: 'submitted' as const,
      categoryId: null,
      description: 'Tipo: TALA',
      location: {
        longitude: -74.7813,
        latitude: 10.9685,
        source: 'unknown' as const,
      },
      observedAt: '2026-11-27T20:00:00.000Z',
      receivedAt: '2026-11-27T20:00:01.000Z',
      clientReportId: null,
      reporterReferenceId: null,
      createdAt: '2026-11-27T20:00:01.000Z',
      updatedAt: '2026-11-27T20:00:01.000Z',
    };

    expect(reportFromRow(reportToRow(report) as never)).toEqual(report);
  });

  it('round-trips category and event rows', () => {
    const category = {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'tala',
      label: 'Tala',
      description: 'local',
      active: true,
      source: 'local_config' as const,
      createdAt: '2026-11-27T20:00:00.000Z',
    };
    expect(categoryFromRow(categoryToRow(category) as never)).toEqual(category);

    const event = {
      id: '33333333-3333-3333-3333-333333333333',
      reportId: '11111111-1111-1111-1111-111111111111',
      type: 'created' as const,
      payload: { triage: { tipo: 'TALA' } },
      createdAt: '2026-11-27T20:00:00.000Z',
    };
    expect(eventFromRow(eventToRow(event) as never)).toEqual(event);
  });
});
