import { describe, expect, it } from 'vitest';
import { ReportService } from './service';
import {
  createTriageCategoryCatalog,
  triageTipoToCategoryCode,
} from './triage-categories';

describe('triage categories', () => {
  it('maps bot tipos to local category codes', () => {
    expect(triageTipoToCategoryCode('TALA')).toBe('tala');
    expect(triageTipoToCategoryCode('incendio')).toBe('incendio');
    expect(triageTipoToCategoryCode('x')).toBe('uncategorized');
  });

  it('seeds local categories and stores triage on created event', () => {
    const service = ReportService.create(createTriageCategoryCatalog());
    const created = service.createReport({
      channel: 'whatsapp',
      location: {
        latitude: 10.9685,
        longitude: -74.7813,
        source: 'unknown',
      },
      categoryCode: 'tala',
      triage: {
        tipo: 'TALA',
        nivel: 'AMARILLO',
        zona: 'BQ',
        privacidad: 'ANONIMO',
        prioridad: 'P1',
      },
    });

    expect(created.category?.code).toBe('tala');
    expect(created.category?.source).toBe('local_config');
    const createdEvent = service.listEvents(created.report.id).find((e) => e.type === 'created');
    expect(createdEvent?.payload.triage).toEqual({
      tipo: 'TALA',
      nivel: 'AMARILLO',
      zona: 'BQ',
      privacidad: 'ANONIMO',
      prioridad: 'P1',
    });
  });
});
