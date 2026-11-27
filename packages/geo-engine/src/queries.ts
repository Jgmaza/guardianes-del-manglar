/**
 * Authoritative spatial queries are intended for PostGIS (see database migrations).
 * SQL builders never invent CRA attributes — they return stored properties_original.
 */

export type PointQueryParams = {
  layerId: string;
  longitude: number;
  latitude: number;
};

export type BBoxQueryParams = {
  layerId: string;
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
};

export function assertWgs84Point(longitude: number, latitude: number): void {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error('Coordinates must be finite numbers');
  }
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error('Coordinates out of WGS84 range');
  }
}

/** Uses GiST via ST_Intersects on geographic_features.geom */
export function sqlFeaturesAtPoint(params: PointQueryParams): { sql: string; args: unknown[] } {
  assertWgs84Point(params.longitude, params.latitude);
  return {
    sql: `SELECT * FROM geo_features_at_point($1::uuid, $2::float8, $3::float8)`,
    args: [params.layerId, params.longitude, params.latitude],
  };
}

export function sqlFeaturesInBBox(params: BBoxQueryParams): { sql: string; args: unknown[] } {
  assertWgs84Point(params.minLongitude, params.minLatitude);
  assertWgs84Point(params.maxLongitude, params.maxLatitude);
  return {
    sql: `SELECT * FROM geo_features_in_bbox($1::uuid, $2::float8, $3::float8, $4::float8, $5::float8)`,
    args: [
      params.layerId,
      params.minLongitude,
      params.minLatitude,
      params.maxLongitude,
      params.maxLatitude,
    ],
  };
}

export function sqlPointHasCoverage(params: PointQueryParams): { sql: string; args: unknown[] } {
  assertWgs84Point(params.longitude, params.latitude);
  return {
    sql: `SELECT geo_point_has_coverage($1::uuid, $2::float8, $3::float8) AS has_coverage`,
    args: [params.layerId, params.longitude, params.latitude],
  };
}

export type FeatureHit = {
  source_placemark_id: string;
  name: string | null;
  properties_original: Record<string, string>;
  geom_valid: boolean;
};

export type PointQueryResult = {
  longitude: number;
  latitude: number;
  matchCount: number;
  hasCoverage: boolean;
  multipleIntersections: boolean;
  features: FeatureHit[];
};
