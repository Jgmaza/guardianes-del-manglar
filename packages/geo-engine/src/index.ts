import type { GeoPoint } from '@guardianes/contracts';
import { geoPointSchema } from '@guardianes/validation';

/**
 * Geo helpers + PostGIS query builders.
 * Authoritative CRA joins: PostGIS (GiST). Local PIP is for offline verification only.
 */

export type BoundingBox = {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
};

/** Approximate Atlántico coastal working extent from inspection bbox (informational). */
export const ATLANTICO_WORKING_BBOX: BoundingBox = {
  minLongitude: -75.25,
  minLatitude: 10.26,
  maxLongitude: -74.72,
  maxLatitude: 11.07,
};

export function parseGeoPoint(input: unknown): GeoPoint {
  return geoPointSchema.parse(input);
}

export function isInsideBoundingBox(point: GeoPoint, box: BoundingBox): boolean {
  return (
    point.longitude >= box.minLongitude &&
    point.longitude <= box.maxLongitude &&
    point.latitude >= box.minLatitude &&
    point.latitude <= box.maxLatitude
  );
}

export function formatCoordinates(point: GeoPoint, digits = 5): string {
  return `${point.latitude.toFixed(digits)}, ${point.longitude.toFixed(digits)}`;
}

export {
  assertWgs84Point,
  sqlFeaturesAtPoint,
  sqlFeaturesInBBox,
  sqlPointHasCoverage,
  type BBoxQueryParams,
  type FeatureHit,
  type PointQueryParams,
  type PointQueryResult,
} from './queries';

export {
  bboxContains,
  bboxesIntersect,
  pointInMultiPolygon,
  type LonLat,
} from './pip';

export {
  summarizeGeoMatch,
  type GeoMatchHit,
  type GeoMatchRawPayload,
} from './match';
