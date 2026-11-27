import { describe, expect, it } from 'vitest';
import { pointInMultiPolygon } from './pip';
import { sqlFeaturesAtPoint } from './queries';

describe('pip + sql builders', () => {
  const square = [
    [
      [
        [-74.9, 10.8],
        [-74.7, 10.8],
        [-74.7, 11.0],
        [-74.9, 11.0],
        [-74.9, 10.8],
      ],
    ],
  ];

  it('detects point inside multipolygon', () => {
    expect(pointInMultiPolygon({ longitude: -74.8, latitude: 10.9 }, square)).toBe(true);
    expect(pointInMultiPolygon({ longitude: -75.5, latitude: 10.9 }, square)).toBe(false);
  });

  it('builds point SQL for PostGIS function', () => {
    const q = sqlFeaturesAtPoint({
      layerId: '00000000-0000-0000-0000-000000000001',
      longitude: -74.8,
      latitude: 10.9,
    });
    expect(q.sql).toContain('geo_features_at_point');
    expect(q.args[1]).toBe(-74.8);
  });
});
