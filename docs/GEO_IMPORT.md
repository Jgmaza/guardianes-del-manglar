# GEO_IMPORT — pipeline reproducible

**Estado:** `IMPLEMENTED` (inspección + normalización + schema/consultas + carga Supabase)  
**Carga PostGIS en Supabase (`guardianes-del-manglar`):** `IMPLEMENTED` (14 732 features)

---

## 1. Principios

1. Conservar el KMZ original (`data/raw/`) + checksum.
2. No inventar atributos ni etiquetar manglares sin soporte en el archivo.
3. Preservar `source_placemark_id` y `properties_original` completos.
4. Normalizar geometrías a `MultiPolygon` EPSG:4326.
5. Registrar errores/avisos en `import_errors.ndjson` / tabla `geographic_import_errors`.
6. Consultas autoritativas vía PostGIS + GiST; consulta local NDJSON solo para verificación offline.

---

## 2. Layout de datos

```text
data/raw/
  prioridades-conservacion.kmz
  prioridades-conservacion.kmz.sha256
  kmz_extract/doc.kml
data/inspection/inspection_report.json
data/processed/
  layer_manifest.json
  features.ndjson
  import_errors.ndjson
  spatial_index.ndjson
```

---

## 3. Comandos

```bash
# Inspección (Fase A)
pnpm geo:inspect

# Normalización (Fase B) — escribe data/processed/*
pnpm geo:normalize

# Consulta local de verificación (punto WGS84)
# Ejemplo con cobertura (centroide aproximado de ID_00000):
pnpm geo:query-point -- -74.91043248871381 10.259016321844786

# Sin cobertura:
pnpm geo:query-point -- -70 5

# BBox
pnpm geo:query-bbox -- -74.92 10.25 -74.90 10.26
```


Script de inspección: `tools/geo-import/scripts/inspect_kml.py`  
Normalizador TS: `tools/geo-import/src/normalize.ts`

---

## 4. Persistencia PostGIS (Fase C)

Migración: `packages/database/src/migrations/001_geographic.sql`

Tablas:

- `geographic_layers`
- `geographic_features`
- `geographic_import_errors`

Índices GiST en `geom` y `bbox`.

Aplicar cuando exista base con PostGIS (Supabase):

```bash
# Ejemplo — NO ejecutar con secretos en el repo
psql "$DATABASE_URL" -f packages/database/src/migrations/001_geographic.sql
```

Carga masiva (idempotente por `layer.code`):

```bash
# Requiere .supabase-project.env con DATABASE_POOLER_URL o
# SUPABASE_PROJECT_REF + DATABASE_PASSWORD (no commitear)
pnpm geo:load-supabase
# smoke: node tools/geo-import/scripts/load-supabase.mjs --limit 100
```

Script: `tools/geo-import/scripts/load-supabase.mjs`  
Usa pooler IPv4 (`aws-2-<region>.pooler.supabase.com:5432`, session mode) porque el host `db.*` suele ser solo IPv6. Aplica `ST_Force2D` + `ST_MakeValid` al insertar.

Lectura del SQL desde código:

```ts
import { readGeographicMigrationSql } from '@guardianes/database';
```

---

## 5. Consultas (Fase D)

### PostGIS (autoritativo)

Builders en `@guardianes/geo-engine`:

- `sqlFeaturesAtPoint` → `geo_features_at_point`
- `sqlFeaturesInBBox` → `geo_features_in_bbox`
- `sqlPointHasCoverage` → `geo_point_has_coverage`

Devuelven filas con `properties_original` (atributos de origen).

Comportamientos cubiertos:

- polígonos por coordenada
- polígonos por bbox
- atributos de elementos encontrados
- intersecciones múltiples (`matchCount > 1`)
- puntos sin cobertura (`hasCoverage = false`)

### Offline (verificación)

`queryPointInProcessedFeatures` / `queryBBoxInProcessedFeatures` sobre NDJSON + índice bbox.

---

## 6. Discrepancias conocidas

Ver `GEO_INSPECTION_REPORT.md`:

- Atributos en HTML, no ExtendedData.
- Decimales con coma en atributos tabulares.
- MultiGeometry en el 100 % de placemarks.
- Capa de prioridades hidrográficas, no inventario de manglar etiquetado.

---

## 7. Criterios de aceptación — estado

| Criterio | Estado |
|----------|--------|
| Se conoce qué representa la capa según atributos/descripción | `IMPLEMENTED` (docs) |
| Cantidad conocida (14.732 placemarks) | `IMPLEMENTED` (inspección) |
| Discrepancias documentadas | `IMPLEMENTED` |
| Originales preservados | `IMPLEMENTED` (`data/raw`) |
| Coordenada de prueba consulta polígonos | `IMPLEMENTED` vía NDJSON local; PostGIS live `PENDING` |
| Consultas con índices espaciales | SQL GiST `IMPLEMENTED`; uso en DB real `PENDING` |
