import { describe, expect, it } from 'vitest';
import {
  ATLANTICO_WORKING_BBOX,
  formatCoordinates,
  isInsideBoundingBox,
  parseGeoPoint,
} from './index';

describe('@guardianes/geo-engine', () => {
  it('parses a valid point', () => {
    const point = parseGeoPoint({ longitude: -74.8, latitude: 10.95 });
    expect(point.latitude).toBe(10.95);
  });

  it('detects points inside the working bbox', () => {
    expect(
      isInsideBoundingBox({ longitude: -74.8, latitude: 10.95 }, ATLANTICO_WORKING_BBOX),
    ).toBe(true);
    expect(
      isInsideBoundingBox({ longitude: -70, latitude: 10.95 }, ATLANTICO_WORKING_BBOX),
    ).toBe(false);
  });

  it('formats coordinates', () => {
    expect(formatCoordinates({ longitude: -74.8, latitude: 10.9 }, 1)).toBe('10.9, -74.8');
  });
});
