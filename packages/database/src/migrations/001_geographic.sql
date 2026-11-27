-- Guardianes del Manglar — geographic foundation
-- EPSG:4326 / WGS84. Requires PostGIS.
-- Does not invent CRA attributes; properties_original stores source fields as-is.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS geographic_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  source_filename text NOT NULL,
  source_sha256 text NOT NULL,
  crs_epsg integer NOT NULL DEFAULT 4326 CHECK (crs_epsg = 4326),
  feature_count integer,
  bbox geometry(Polygon, 4326),
  raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS geographic_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id uuid NOT NULL REFERENCES geographic_layers (id) ON DELETE CASCADE,
  source_placemark_id text NOT NULL,
  source_fid text,
  name text,
  style_url text,
  properties_original jsonb NOT NULL DEFAULT '{}'::jsonb,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  geom_valid boolean NOT NULL DEFAULT true,
  validation_issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  bbox geometry(Polygon, 4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (layer_id, source_placemark_id)
);

CREATE TABLE IF NOT EXISTS geographic_import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id uuid REFERENCES geographic_layers (id) ON DELETE SET NULL,
  source_placemark_id text,
  stage text NOT NULL,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning')),
  message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Spatial indexes (GiST) — required for point / bbox queries
CREATE INDEX IF NOT EXISTS geographic_features_geom_gix
  ON geographic_features USING GIST (geom);

CREATE INDEX IF NOT EXISTS geographic_features_bbox_gix
  ON geographic_features USING GIST (bbox);

CREATE INDEX IF NOT EXISTS geographic_layers_bbox_gix
  ON geographic_layers USING GIST (bbox);

CREATE INDEX IF NOT EXISTS geographic_features_props_gin
  ON geographic_features USING GIN (properties_original);

CREATE INDEX IF NOT EXISTS geographic_features_layer_id_idx
  ON geographic_features (layer_id);

CREATE INDEX IF NOT EXISTS geographic_import_errors_layer_id_idx
  ON geographic_import_errors (layer_id);

-- Point query: polygons containing a WGS84 point
CREATE OR REPLACE FUNCTION geo_features_at_point(
  p_layer_id uuid,
  p_longitude double precision,
  p_latitude double precision
)
RETURNS SETOF geographic_features
LANGUAGE sql
STABLE
AS $$
  SELECT f.*
  FROM geographic_features f
  WHERE f.layer_id = p_layer_id
    AND ST_Intersects(
      f.geom,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
    );
$$;

-- BBox query
CREATE OR REPLACE FUNCTION geo_features_in_bbox(
  p_layer_id uuid,
  p_min_lon double precision,
  p_min_lat double precision,
  p_max_lon double precision,
  p_max_lat double precision
)
RETURNS SETOF geographic_features
LANGUAGE sql
STABLE
AS $$
  SELECT f.*
  FROM geographic_features f
  WHERE f.layer_id = p_layer_id
    AND f.geom && ST_MakeEnvelope(p_min_lon, p_min_lat, p_max_lon, p_max_lat, 4326)
    AND ST_Intersects(
      f.geom,
      ST_MakeEnvelope(p_min_lon, p_min_lat, p_max_lon, p_max_lat, 4326)
    );
$$;

-- Coverage helper: true if at least one feature contains the point
CREATE OR REPLACE FUNCTION geo_point_has_coverage(
  p_layer_id uuid,
  p_longitude double precision,
  p_latitude double precision
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM geo_features_at_point(p_layer_id, p_longitude, p_latitude)
  );
$$;
