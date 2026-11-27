#!/usr/bin/env node
/**
 * Download INVEMAR SIGMA "Zonificación Atlántico" and normalize to
 * data/processed/invemar_zonificacion_atlantico/ for Supabase load.
 *
 * Source (public ArcGIS Feature/MapServer):
 *   https://gis.invemar.org.co/ArcGIS/rest/services/SIGMA/ZONIFICACION/MapServer/0
 *
 * Does NOT invent attributes. Preserves all source fields in properties_original.
 *
 *   node tools/geo-import/scripts/import-invemar-zonificacion.mjs
 *   node tools/geo-import/scripts/import-invemar-zonificacion.mjs --skip-download
 */
import { createHash } from 'node:crypto';
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const LAYER_CODE = 'invemar_zonificacion_atlantico';
const SOURCE_URL =
  'https://gis.invemar.org.co/ArcGIS/rest/services/SIGMA/ZONIFICACION/MapServer/0';
const RAW_DIR = path.join(ROOT, 'data/raw/invemar-zonificacion-atlantico');
const OUT_DIR = path.join(ROOT, 'data/processed/invemar_zonificacion_atlantico');
const PAGE_SIZE = 100;

function parseArgs(argv) {
  return { skipDownload: argv.includes('--skip-download') };
}

function expandBBox(current, next) {
  if (!next) return current;
  if (!current) return next;
  return [
    Math.min(current[0], next[0]),
    Math.min(current[1], next[1]),
    Math.max(current[2], next[2]),
    Math.max(current[3], next[3]),
  ];
}

function bboxOfGeometry(geometry) {
  if (!geometry?.coordinates) return null;
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      minLon = Math.min(minLon, node[0]);
      minLat = Math.min(minLat, node[1]);
      maxLon = Math.max(maxLon, node[0]);
      maxLat = Math.max(maxLat, node[1]);
      return;
    }
    for (const child of node) walk(child);
  };
  walk(geometry.coordinates);
  if (!Number.isFinite(minLon)) return null;
  return [minLon, minLat, maxLon, maxLat];
}

/** ArcGIS may return Polygon; PostGIS loader expects MultiPolygon GeoJSON. */
function asMultiPolygon(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'MultiPolygon') return geometry;
  if (geometry.type === 'Polygon') {
    return { type: 'MultiPolygon', coordinates: [geometry.coordinates] };
  }
  return null;
}

async function fetchPage(offset) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'geojson',
    outSR: '4326',
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
  });
  const url = `${SOURCE_URL}/query?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`INVEMAR query failed ${res.status}: ${url}`);
  }
  return res.json();
}

async function downloadAll() {
  mkdirSync(RAW_DIR, { recursive: true });
  const features = [];
  let offset = 0;
  let exceeded = true;
  while (exceeded || features.length === 0) {
    const page = await fetchPage(offset);
    const batch = page.features ?? [];
    features.push(...batch);
    console.log(`  downloaded ${features.length} features (offset ${offset})`);
    exceeded = Boolean(page.exceededTransferLimit) && batch.length > 0;
    if (!exceeded && batch.length < PAGE_SIZE) break;
    if (batch.length === 0) break;
    offset += batch.length;
    if (offset > 5000) throw new Error('Safety stop: unexpected large layer');
  }

  const collection = {
    type: 'FeatureCollection',
    name: 'invemar_zonificacion_atlantico',
    source: SOURCE_URL,
    fetched_at: new Date().toISOString(),
    features,
  };
  const rawPath = path.join(RAW_DIR, 'zonificacion-atlantico.geojson');
  const rawText = `${JSON.stringify(collection)}\n`;
  writeFileSync(rawPath, rawText);
  const sha = createHash('sha256').update(rawText).digest('hex');
  writeFileSync(path.join(RAW_DIR, 'zonificacion-atlantico.geojson.sha256'), `${sha}\n`);
  writeFileSync(
    path.join(RAW_DIR, 'SOURCE.txt'),
    [
      'INVEMAR — SIGMA / Zonificación Atlántico',
      SOURCE_URL,
      'Attribution: Instituto de Investigaciones Marinas y Costeras (INVEMAR)',
      'Layer documents mangrove zonification / structure / dominant species for Atlántico.',
      'Do not invent attributes. Preserve properties_original as downloaded.',
      `Fetched: ${collection.fetched_at}`,
      `Feature count: ${features.length}`,
      `SHA256: ${sha}`,
      '',
    ].join('\n'),
  );
  console.log(`Raw saved: ${rawPath} (${features.length} features, sha ${sha.slice(0, 12)}…)`);
  return { collection, sha, rawPath };
}

function normalize(collection, sha, sourceFilename) {
  mkdirSync(OUT_DIR, { recursive: true });
  const featuresPath = path.join(OUT_DIR, 'features.ndjson');
  const errorsPath = path.join(OUT_DIR, 'import_errors.ndjson');
  const indexPath = path.join(OUT_DIR, 'spatial_index.ndjson');
  const featuresOut = createWriteStream(featuresPath, { encoding: 'utf8' });
  const errorsOut = createWriteStream(errorsPath, { encoding: 'utf8' });
  const indexOut = createWriteStream(indexPath, { encoding: 'utf8' });

  const attributeKeys = new Set();
  let layerBBox = null;
  let featureCount = 0;
  let validGeom = 0;
  let errorCount = 0;
  let warningCount = 0;

  for (const feature of collection.features ?? []) {
    const props = { ...(feature.properties ?? {}) };
    for (const key of Object.keys(props)) attributeKeys.add(key);

    const objectId = props.OBJECTID ?? props.FID ?? featureCount;
    const sourceId = `INVEMAR_ZONIF_${objectId}`;
    const multi = asMultiPolygon(feature.geometry);
    const issues = [];

    if (!multi) {
      errorCount += 1;
      errorsOut.write(
        `${JSON.stringify({
          source_placemark_id: sourceId,
          stage: 'normalize_invemar',
          severity: 'error',
          message: `Unsupported or missing geometry type: ${feature.geometry?.type ?? 'null'}`,
          payload: { objectId },
        })}\n`,
      );
      continue;
    }

    const bbox = bboxOfGeometry(multi);
    if (!bbox) {
      issues.push({ code: 'empty_bbox', message: 'Could not compute bbox' });
      warningCount += 1;
    }
    layerBBox = expandBBox(layerBBox, bbox);

    const name =
      props.LOCALIDAD ||
      props.ZONIF ||
      props.ZONIFICACI ||
      props.COBERTURA ||
      sourceId;

    const row = {
      source_placemark_id: sourceId,
      name,
      style_url: null,
      properties_original: props,
      geometry: multi,
      geom_valid: true,
      validation_issues: issues,
      bbox,
    };

    featuresOut.write(`${JSON.stringify(row)}\n`);
    indexOut.write(
      `${JSON.stringify({ source_placemark_id: sourceId, bbox, name })}\n`,
    );
    featureCount += 1;
    validGeom += 1;
  }

  featuresOut.end();
  errorsOut.end();
  indexOut.end();

  const manifest = {
    code: LAYER_CODE,
    name: 'Zonificación de manglares — Atlántico (INVEMAR SIGMA)',
    description:
      'Zonificación ecológica/manejo de manglares del Atlántico (INVEMAR SIGMA). Incluye especie dominante, composición, estructura y categoría de zonificación. No sustituye la capa de prioridades C.R.A.',
    source_filename: sourceFilename,
    source_sha256: sha,
    source_url: SOURCE_URL,
    crs_epsg: 4326,
    feature_count: featureCount,
    feature_count_valid_geometry: validGeom,
    error_count: errorCount,
    warning_count: warningCount,
    bbox: layerBBox,
    attribute_keys_observed: [...attributeKeys].sort(),
    created_at: new Date().toISOString(),
    notes: [
      'Downloaded from INVEMAR public ArcGIS MapServer; attributes preserved as-is.',
      'Useful fields: COB_SPDOM (dominant species), COB_CMPSCI (composition), COB_ESTRCT (structure/height), ZONIF / ZONIFICACI (management zone), LOCALIDAD.',
      'Historical zonification study layer — cite INVEMAR; do not present as live CRA operational layer.',
      'Polygons are mangrove management/structure units, not invented species maps.',
    ],
  };

  writeFileSync(path.join(OUT_DIR, 'layer_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Normalized → ${OUT_DIR} (features=${featureCount}, errors=${errorCount}, warnings=${warningCount})`,
  );
  return manifest;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let collection;
  let sha;
  let sourceFilename = 'zonificacion-atlantico.geojson';

  if (args.skipDownload) {
    const rawPath = path.join(RAW_DIR, sourceFilename);
    console.log(`Reading existing raw: ${rawPath}`);
    collection = JSON.parse(readFileSync(rawPath, 'utf8'));
    sha =
      readFileSync(path.join(RAW_DIR, `${sourceFilename}.sha256`), 'utf8')
        .trim()
        .split(/\s+/)[0] ?? createHash('sha256').update(JSON.stringify(collection)).digest('hex');
  } else {
    console.log(`Fetching INVEMAR layer: ${SOURCE_URL}`);
    const downloaded = await downloadAll();
    collection = downloaded.collection;
    sha = downloaded.sha;
  }

  const manifest = normalize(collection, sha, sourceFilename);
  console.log(`Manifest code: ${manifest.code}`);
  console.log('Next: pnpm geo:load-supabase -- --processed-dir data/processed/invemar_zonificacion_atlantico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
