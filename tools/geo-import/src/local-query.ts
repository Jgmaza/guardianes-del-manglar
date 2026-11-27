import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import {
  bboxContains,
  bboxesIntersect,
  pointInMultiPolygon,
  type FeatureHit,
  type PointQueryResult,
} from '@guardianes/geo-engine';
import type { NormalizedFeature } from './types';

/**
 * Offline verification query against normalized NDJSON.
 * Not a substitute for PostGIS GiST in production.
 */
export async function queryPointInProcessedFeatures(options: {
  featuresPath: string;
  longitude: number;
  latitude: number;
  indexPath?: string;
}): Promise<PointQueryResult> {
  const point = { longitude: options.longitude, latitude: options.latitude };
  const candidateIds = new Set<string>();

  if (options.indexPath) {
    const indexRl = createInterface({
      input: createReadStream(options.indexPath, { encoding: 'utf8' }),
    });
    for await (const line of indexRl) {
      if (!line.trim()) continue;
      const row = JSON.parse(line) as {
        source_placemark_id: string;
        bbox: [number, number, number, number];
      };
      if (bboxContains(row.bbox, point)) {
        candidateIds.add(row.source_placemark_id);
      }
    }
  }

  const hits: FeatureHit[] = [];
  const featuresRl = createInterface({
    input: createReadStream(options.featuresPath, { encoding: 'utf8' }),
  });

  for await (const line of featuresRl) {
    if (!line.trim()) continue;
    const feature = JSON.parse(line) as NormalizedFeature;
    if (!feature.geometry || !feature.bbox || !feature.geom_valid) continue;
    if (candidateIds.size > 0 && !candidateIds.has(feature.source_placemark_id)) continue;
    if (!bboxContains(feature.bbox, point)) continue;
    if (!pointInMultiPolygon(point, feature.geometry.coordinates)) continue;
    hits.push({
      source_placemark_id: feature.source_placemark_id,
      name: feature.name,
      properties_original: feature.properties_original,
      geom_valid: feature.geom_valid,
    });
  }

  return {
    longitude: options.longitude,
    latitude: options.latitude,
    matchCount: hits.length,
    hasCoverage: hits.length > 0,
    multipleIntersections: hits.length > 1,
    features: hits,
  };
}

export async function queryBBoxInProcessedFeatures(options: {
  featuresPath: string;
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
}): Promise<FeatureHit[]> {
  const box: [number, number, number, number] = [
    options.minLongitude,
    options.minLatitude,
    options.maxLongitude,
    options.maxLatitude,
  ];
  const hits: FeatureHit[] = [];
  const rl = createInterface({
    input: createReadStream(options.featuresPath, { encoding: 'utf8' }),
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const feature = JSON.parse(line) as NormalizedFeature;
    if (!feature.bbox || !feature.geom_valid) continue;
    if (!bboxesIntersect(feature.bbox, box)) continue;
    hits.push({
      source_placemark_id: feature.source_placemark_id,
      name: feature.name,
      properties_original: feature.properties_original,
      geom_valid: feature.geom_valid,
    });
  }
  return hits;
}
