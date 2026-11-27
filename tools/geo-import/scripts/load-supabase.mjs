#!/usr/bin/env node
/**
 * Load data/processed/*.ndjson into Supabase PostGIS.
 *
 *   node tools/geo-import/scripts/load-supabase.mjs
 *   node tools/geo-import/scripts/load-supabase.mjs --limit 100
 *
 * Reads DATABASE_URL or SUPABASE_PROJECT_REF + DATABASE_PASSWORD
 * from env / .supabase-project.env
 */
import { createReadStream, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const PROCESSED = path.join(ROOT, "data/processed");
const BATCH = 25;

function parseArgs(argv) {
  const out = { limit: 0, batchSize: BATCH, envFile: path.join(ROOT, ".supabase-project.env") };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") out.limit = Number(argv[++i] || 0);
    else if (argv[i] === "--batch-size") out.batchSize = Number(argv[++i] || BATCH);
    else if (argv[i] === "--env-file") out.envFile = argv[++i];
  }
  return out;
}

function loadEnvFile(filePath) {
  try {
    const text = readFileSync(filePath, "utf8");
    const env = {};
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

function databaseUrl(fileEnv) {
  // Prefer explicit URLs. Pooler (IPv4) first — direct db.* is often IPv6-only.
  if (process.env.DATABASE_POOLER_URL) return process.env.DATABASE_POOLER_URL;
  if (fileEnv.DATABASE_POOLER_URL) return fileEnv.DATABASE_POOLER_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (fileEnv.DATABASE_URL) return fileEnv.DATABASE_URL;
  const ref = process.env.SUPABASE_PROJECT_REF || fileEnv.SUPABASE_PROJECT_REF;
  const password = process.env.DATABASE_PASSWORD || fileEnv.DATABASE_PASSWORD;
  const region = process.env.SUPABASE_REGION || fileEnv.SUPABASE_REGION || "us-east-1";
  if (!ref || !password) {
    throw new Error("Need DATABASE_URL/DATABASE_POOLER_URL or SUPABASE_PROJECT_REF + DATABASE_PASSWORD");
  }
  // Session mode (5432) on pooler — better for multi-statement bulk load than transaction 6543
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-2-${region}.pooler.supabase.com:5432/postgres`;
}

async function flush(client, layerId, batch) {
  if (!batch.length) return { ok: 0, skipped: 0 };
  let ok = 0;
  let skipped = 0;

  const values2 = [];
  const params2 = [];
  let n = 1;
  for (const row of batch) {
    const bboxParam = n + 9;
    values2.push(`(
      $${n}::uuid, $${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5}::jsonb,
      ST_Multi(ST_CollectionExtract(
        ST_MakeValid(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($${n + 6}), 4326))), 3
      ))::geometry(MultiPolygon, 4326),
      $${n + 7}, $${n + 8}::jsonb,
      CASE WHEN $${bboxParam}::float8[] IS NULL THEN NULL
           ELSE ST_MakeEnvelope(
             ($${bboxParam})[1], ($${bboxParam})[2],
             ($${bboxParam})[3], ($${bboxParam})[4], 4326
           ) END
    )`);
    params2.push(
      layerId,
      row.source_placemark_id,
      row.source_fid,
      row.name,
      row.style_url,
      JSON.stringify(row.properties_original),
      row.geom_geojson,
      row.geom_valid,
      JSON.stringify(row.validation_issues),
      row.bbox,
    );
    n += 10;
  }

  const sql = `
    INSERT INTO geographic_features (
      layer_id, source_placemark_id, source_fid, name, style_url,
      properties_original, geom, geom_valid, validation_issues, bbox
    ) VALUES ${values2.join(",\n")}
    ON CONFLICT (layer_id, source_placemark_id) DO NOTHING
  `;

  try {
    const res = await client.query(sql, params2);
    ok = res.rowCount ?? batch.length;
  } catch (err) {
    console.warn(`  batch failed (${err.message.slice(0, 120)}); row-by-row…`);
    for (const row of batch) {
      try {
        await client.query(
          `INSERT INTO geographic_features (
             layer_id, source_placemark_id, source_fid, name, style_url,
             properties_original, geom, geom_valid, validation_issues, bbox
           ) VALUES (
             $1::uuid, $2, $3, $4, $5, $6::jsonb,
             ST_Multi(ST_CollectionExtract(
               ST_MakeValid(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326))), 3
             ))::geometry(MultiPolygon, 4326),
             $8, $9::jsonb,
             CASE WHEN $10::float8[] IS NULL THEN NULL
                  ELSE ST_MakeEnvelope($10[1], $10[2], $10[3], $10[4], 4326) END
           )
           ON CONFLICT (layer_id, source_placemark_id) DO NOTHING`,
          [
            layerId,
            row.source_placemark_id,
            row.source_fid,
            row.name,
            row.style_url,
            JSON.stringify(row.properties_original),
            row.geom_geojson,
            row.geom_valid,
            JSON.stringify(row.validation_issues),
            row.bbox,
          ],
        );
        ok += 1;
      } catch (rowErr) {
        skipped += 1;
        await client.query(
          `INSERT INTO geographic_import_errors
             (layer_id, source_placemark_id, stage, severity, message, payload)
           VALUES ($1::uuid, $2, 'load_supabase', 'error', $3, $4::jsonb)`,
          [
            layerId,
            row.source_placemark_id,
            String(rowErr.message).slice(0, 500),
            JSON.stringify({ error: String(rowErr.message).slice(0, 1000) }),
          ],
        );
      }
    }
  }

  return { ok, skipped };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fileEnv = loadEnvFile(args.envFile);
  const dsn = databaseUrl(fileEnv);
  const manifest = JSON.parse(await readFile(path.join(PROCESSED, "layer_manifest.json"), "utf8"));

  console.log(`Layer: ${manifest.code}`);
  const hostHint = (dsn.match(/@([^:/]+)/) || [])[1] || "supabase";
  console.log(`Connecting via ${hostHint} …`);

  const client = new pg.Client({
    connectionString: dsn,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 0,
  });
  await client.connect();
  await client.query("SET statement_timeout = 0");

  const t0 = Date.now();
  try {
    const layerRes = await client.query(
      `INSERT INTO geographic_layers (
         code, name, description, source_filename, source_sha256,
         crs_epsg, feature_count, bbox, raw_metadata
       ) VALUES (
         $1, $2, $3, $4, $5, 4326, 0,
         CASE WHEN $6::float8[] IS NULL THEN NULL
              ELSE ST_MakeEnvelope($6[1], $6[2], $6[3], $6[4], 4326) END,
         $7::jsonb
       )
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         source_filename = EXCLUDED.source_filename,
         source_sha256 = EXCLUDED.source_sha256,
         bbox = EXCLUDED.bbox,
         raw_metadata = EXCLUDED.raw_metadata
       RETURNING id`,
      [
        manifest.code,
        manifest.name,
        manifest.description ?? null,
        manifest.source_filename,
        manifest.source_sha256,
        manifest.bbox ?? null,
        JSON.stringify({
          attribute_keys_observed: manifest.attribute_keys_observed ?? [],
          notes: manifest.notes ?? [],
          created_at_source: manifest.created_at,
        }),
      ],
    );
    const layerId = layerRes.rows[0].id;
    console.log(`Layer id: ${layerId}`);

    const del = await client.query(
      `DELETE FROM geographic_features WHERE layer_id = $1::uuid`,
      [layerId],
    );
    console.log(`Cleared previous features: ${del.rowCount}`);

    const rl = readline.createInterface({
      input: createReadStream(path.join(PROCESSED, "features.ndjson")),
      crlfDelay: Infinity,
    });

    let batch = [];
    let inserted = 0;
    let skipped = 0;
    let i = 0;

    for await (const line of rl) {
      if (args.limit && i >= args.limit) break;
      const feat = JSON.parse(line);
      const props = feat.properties_original || {};
      if (!feat.geometry) {
        skipped += 1;
        i += 1;
        continue;
      }
      batch.push({
        source_placemark_id: feat.source_placemark_id || `row_${i}`,
        source_fid: props.FID != null ? String(props.FID) : null,
        name: feat.name ?? null,
        style_url: feat.style_url ?? null,
        properties_original: props,
        geom_geojson: JSON.stringify(feat.geometry),
        geom_valid: feat.geom_valid !== false,
        validation_issues: feat.validation_issues || [],
        bbox: feat.bbox ?? null,
      });
      i += 1;

      if (batch.length >= args.batchSize) {
        const r = await flush(client, layerId, batch);
        inserted += r.ok;
        skipped += r.skipped;
        batch = [];
        if (inserted % 500 < args.batchSize) {
          const elapsed = (Date.now() - t0) / 1000;
          const rate = inserted / (elapsed || 1);
          console.log(`  … ${inserted} inserted, ${skipped} skipped (${rate.toFixed(0)}/s)`);
        }
      }
    }
    if (batch.length) {
      const r = await flush(client, layerId, batch);
      inserted += r.ok;
      skipped += r.skipped;
    }

    const countRes = await client.query(
      `SELECT count(*)::int AS n FROM geographic_features WHERE layer_id = $1::uuid`,
      [layerId],
    );
    const count = countRes.rows[0].n;
    await client.query(
      `UPDATE geographic_layers SET feature_count = $1 WHERE id = $2::uuid`,
      [count, layerId],
    );

    const hit = await client.query(
      `SELECT count(*)::int AS n FROM geo_features_at_point($1::uuid, -74.91043248871381, 10.259016321844786)`,
      [layerId],
    );
    const miss = await client.query(
      `SELECT count(*)::int AS n FROM geo_features_at_point($1::uuid, -70, 5)`,
      [layerId],
    );

    const elapsed = (Date.now() - t0) / 1000;
    console.log(
      `Done in ${elapsed.toFixed(1)}s — stream_ok≈${inserted}, db_count=${count}, skipped=${skipped}`,
    );
    console.log(`PIP smoke: known point hits=${hit.rows[0].n}, outside hits=${miss.rows[0].n}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
