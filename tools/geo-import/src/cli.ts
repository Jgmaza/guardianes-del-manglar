#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeKml } from './normalize';
import { queryBBoxInProcessedFeatures, queryPointInProcessedFeatures } from './local-query';
import {
  DATA_INSPECTION,
  DATA_PROCESSED,
  KML_PATH,
  KMZ_PATH,
  KMZ_SHA_PATH,
  REPO_ROOT,
} from './paths';

const rawArgs = process.argv.slice(2).filter((arg) => arg !== '--');
const command = rawArgs[0] ?? 'help';
const args = rawArgs.slice(1);

async function main(): Promise<void> {
  if (command === 'inspect') {
    const script = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../scripts/inspect_kml.py',
    );
    const result = spawnSync('python3', [script], { stdio: 'inherit', cwd: REPO_ROOT });
    process.exit(result.status ?? 1);
  }

  if (command === 'normalize') {
    console.warn('Normalizing KML → data/processed (preserving raw)...');
    const manifest = await normalizeKml({
      kmlPath: KML_PATH,
      kmzPath: KMZ_PATH,
      kmzSha256Path: KMZ_SHA_PATH,
      outDir: DATA_PROCESSED,
    });
    console.warn(
      JSON.stringify(
        {
          feature_count: manifest.feature_count,
          valid_geometry: manifest.feature_count_valid_geometry,
          errors: manifest.error_count,
          warnings: manifest.warning_count,
          out: DATA_PROCESSED,
          inspection: DATA_INSPECTION,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'query-point') {
    const lon = Number(args[0]);
    const lat = Number(args[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      console.error('Usage: geo-import query-point <longitude> <latitude>');
      process.exit(1);
    }
    const result = await queryPointInProcessedFeatures({
      featuresPath: path.join(DATA_PROCESSED, 'features.ndjson'),
      indexPath: path.join(DATA_PROCESSED, 'spatial_index.ndjson'),
      longitude: lon,
      latitude: lat,
    });
    console.warn(JSON.stringify(result, null, 2));
    return;
  }

  if (command === 'query-bbox') {
    const minLon = Number(args[0]);
    const minLat = Number(args[1]);
    const maxLon = Number(args[2]);
    const maxLat = Number(args[3]);
    if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) {
      console.error('Usage: geo-import query-bbox <minLon> <minLat> <maxLon> <maxLat>');
      process.exit(1);
    }
    const hits = await queryBBoxInProcessedFeatures({
      featuresPath: path.join(DATA_PROCESSED, 'features.ndjson'),
      minLongitude: minLon,
      minLatitude: minLat,
      maxLongitude: maxLon,
      maxLatitude: maxLat,
    });
    console.warn(JSON.stringify({ matchCount: hits.length, features: hits.slice(0, 20) }, null, 2));
    return;
  }

  console.error(`Commands:
  inspect
  normalize
  query-point <lon> <lat>
  query-bbox <minLon> <minLat> <maxLon> <maxLat>`);
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
