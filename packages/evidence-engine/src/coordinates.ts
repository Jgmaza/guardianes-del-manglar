import type { GeoPoint } from '@guardianes/contracts';

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type CoordinateComparison = {
  distanceMeters: number;
  withinTolerance: boolean;
  toleranceMeters: number;
};

export function compareCoordinates(
  left: GeoPoint,
  right: GeoPoint,
  toleranceMeters = 250,
): CoordinateComparison {
  const distance = distanceMeters(left, right);
  return {
    distanceMeters: distance,
    withinTolerance: distance <= toleranceMeters,
    toleranceMeters,
  };
}
