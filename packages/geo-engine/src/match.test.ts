import { describe, expect, it } from 'vitest';
import { summarizeGeoMatch } from './match';

describe('summarizeGeoMatch', () => {
  it('maps CRA + INVEMAR attributes without inventing values', () => {
    const match = summarizeGeoMatch({
      longitude: -74.84,
      latitude: 11.05,
      matchedAt: '2026-11-27T00:00:00.000Z',
      raw: {
        cra: [
          {
            source_placemark_id: 'ID_1',
            properties_original: {
              Val_Priori: 'Alto',
              NOMZH: 'Bajo Magdalena',
              NOMSZH: 'Cienaga Mallorquin',
              NOMUH: 'Cienaga Mayorquin',
              AccionGen: 'Preservación',
              Escenarios: 'Escenario I',
            },
          },
        ],
        invemar: [
          {
            source_placemark_id: 'INVEMAR_1',
            properties_original: {
              COB_SPDOM: 'A. germinans',
              COB_CMPSCI: 'A. germinans, R. mangle',
              ZONIF: 'Recuperación Tipo I',
              LOCALIDAD: 'Ciénaga Mallorquín',
            },
          },
        ],
      },
    });

    expect(match.cra.priority).toBe('Alto');
    expect(match.cra.unitHydro).toBe('Cienaga Mayorquin');
    expect(match.invemar.dominantSpecies).toBe('A. germinans');
    expect(match.invemar.managementZone).toBe('Recuperación Tipo I');
    expect(match.cra.hasCoverage).toBe(true);
    expect(match.invemar.hasCoverage).toBe(true);
  });

  it('returns null fields and no coverage when outside both layers', () => {
    const match = summarizeGeoMatch({
      longitude: -70,
      latitude: 5,
      raw: { cra: [], invemar: [] },
    });
    expect(match.cra.hasCoverage).toBe(false);
    expect(match.invemar.hasCoverage).toBe(false);
    expect(match.cra.priority).toBeNull();
    expect(match.invemar.dominantSpecies).toBeNull();
  });
});
