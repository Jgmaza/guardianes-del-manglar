import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import {
  computeBBox,
  extractPolygonsAsMulti,
  iteratePlacemarks,
  parseHtmlAttributeTable,
} from './parse-kml';
import type {
  ImportErrorRecord,
  LayerManifest,
  NormalizedFeature,
  ValidationIssue,
} from './types';

export type NormalizePaths = {
  kmlPath: string;
  kmzPath: string;
  kmzSha256Path: string;
  outDir: string;
};

function expandBBox(
  current: [number, number, number, number] | null,
  next: [number, number, number, number] | null,
): [number, number, number, number] | null {
  if (!next) return current;
  if (!current) return next;
  return [
    Math.min(current[0], next[0]),
    Math.min(current[1], next[1]),
    Math.max(current[2], next[2]),
    Math.max(current[3], next[3]),
  ];
}

export async function normalizeKml(paths: NormalizePaths): Promise<LayerManifest> {
  await mkdir(paths.outDir, { recursive: true });

  const kmlBuffer = await readFile(paths.kmlPath);
  const kmlText = kmlBuffer.toString('utf8');
  const sourceSha =
    (await readFile(paths.kmzSha256Path, 'utf8')).trim().split(/\s+/)[0] ??
    createHash('sha256').update(await readFile(paths.kmzPath)).digest('hex');

  const folderDescMatch = kmlText.match(
    /<Folder[^>]*>\s*<name>[^<]*<\/name>\s*<Snippet><\/Snippet>\s*<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/,
  );
  const docNameMatch = kmlText.match(/<Document[^>]*>\s*<name>([^<]*)<\/name>/);

  const featuresPath = path.join(paths.outDir, 'features.ndjson');
  const errorsPath = path.join(paths.outDir, 'import_errors.ndjson');
  const indexPath = path.join(paths.outDir, 'spatial_index.ndjson');
  const manifestPath = path.join(paths.outDir, 'layer_manifest.json');

  const featuresOut = createWriteStream(featuresPath, { encoding: 'utf8' });
  const errorsOut = createWriteStream(errorsPath, { encoding: 'utf8' });
  const indexOut = createWriteStream(indexPath, { encoding: 'utf8' });

  const writeLine = (stream: NodeJS.WritableStream, value: unknown) =>
    new Promise<void>((resolve, reject) => {
      stream.write(`${JSON.stringify(value)}\n`, (err) => (err ? reject(err) : resolve()));
    });

  let featureCount = 0;
  let validGeom = 0;
  let errorCount = 0;
  let warningCount = 0;
  let layerBBox: [number, number, number, number] | null = null;
  const attributeKeys = new Set<string>();

  const pushError = async (record: ImportErrorRecord) => {
    if (record.severity === 'error') errorCount += 1;
    else warningCount += 1;
    await writeLine(errorsOut, record);
  };

  for (const raw of iteratePlacemarks(kmlText)) {
    const issues: ValidationIssue[] = [];
    const sourceId = raw.id ?? `GENERATED_${featureCount}`;
    if (!raw.id) {
      issues.push({
        code: 'MISSING_PLACEMARK_ID',
        message: 'Placemark missing id attribute; generated fallback id',
        severity: 'warning',
      });
    }

    const properties = raw.descriptionHtml
      ? parseHtmlAttributeTable(raw.descriptionHtml)
      : {};
    if (!raw.descriptionHtml) {
      issues.push({
        code: 'MISSING_DESCRIPTION',
        message: 'Placemark has no description CDATA attributes',
        severity: 'warning',
      });
    }
    for (const key of Object.keys(properties)) attributeKeys.add(key);

    const extracted = extractPolygonsAsMulti(raw.body, issues);
    let feature: NormalizedFeature;

    if (!extracted) {
      feature = {
        source_placemark_id: sourceId,
        name: raw.name,
        style_url: raw.styleUrl,
        geometry_type_original: 'none',
        properties_original: properties,
        geometry: null,
        bbox: null,
        geom_valid: false,
        validation_issues: issues,
      };
      for (const issue of issues.filter((i) => i.severity === 'error')) {
        await pushError({
          source_placemark_id: sourceId,
          stage: 'normalize_geometry',
          severity: 'error',
          message: issue.message,
          payload: { code: issue.code },
        });
      }
    } else {
      const bbox = computeBBox(extracted.coordinates);
      const hasError = issues.some((i) => i.severity === 'error');
      feature = {
        source_placemark_id: sourceId,
        name: raw.name,
        style_url: raw.styleUrl,
        geometry_type_original: extracted.geometryTypeOriginal,
        properties_original: properties,
        geometry: {
          type: 'MultiPolygon',
          coordinates: extracted.coordinates,
        },
        bbox,
        geom_valid: !hasError,
        validation_issues: issues,
      };
      if (!hasError) validGeom += 1;
      layerBBox = expandBBox(layerBBox, bbox);
      for (const issue of issues) {
        await pushError({
          source_placemark_id: sourceId,
          stage: 'normalize_geometry',
          severity: issue.severity,
          message: issue.message,
          payload: { code: issue.code },
        });
      }
    }

    await writeLine(featuresOut, feature);
    if (feature.bbox) {
      await writeLine(indexOut, {
        source_placemark_id: feature.source_placemark_id,
        bbox: feature.bbox,
        geom_valid: feature.geom_valid,
      });
    }
    featureCount += 1;
  }

  await Promise.all([
    new Promise<void>((resolve) => featuresOut.end(resolve)),
    new Promise<void>((resolve) => errorsOut.end(resolve)),
    new Promise<void>((resolve) => indexOut.end(resolve)),
  ]);

  const manifest: LayerManifest = {
    code: 'cra_prioridades_conservacion',
    name: docNameMatch?.[1] ?? 'Prioridades de conservación',
    description: folderDescMatch?.[1]?.trim() ?? null,
    source_filename: path.basename(paths.kmzPath),
    source_sha256: sourceSha,
    crs_epsg: 4326,
    feature_count: featureCount,
    feature_count_valid_geometry: validGeom,
    error_count: errorCount,
    warning_count: warningCount,
    bbox: layerBBox,
    attribute_keys_observed: [...attributeKeys].sort(),
    created_at: new Date().toISOString(),
    notes: [
      'Derived from CRA KMZ; properties_original preserves HTML-table fields as strings.',
      'Geometry normalized to MultiPolygon EPSG:4326.',
      'Polygons are not assumed to be individual mangroves.',
    ],
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export async function* readFeaturesNdjson(
  featuresPath: string,
): AsyncGenerator<NormalizedFeature> {
  const rl = createInterface({ input: createReadStream(featuresPath, { encoding: 'utf8' }) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    yield JSON.parse(line) as NormalizedFeature;
  }
}
