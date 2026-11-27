-- Point-in-polygon match for citizen reports against CRA + INVEMAR layers.
-- Returns only stored attributes — does not invent taxonomy.

CREATE OR REPLACE FUNCTION geo_match_report_location(
  p_longitude double precision,
  p_latitude double precision
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH pt AS (
    SELECT ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326) AS geom
  ),
  cra AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'source_placemark_id', f.source_placemark_id,
        'name', f.name,
        'properties_original', f.properties_original
      )
      ORDER BY f.source_placemark_id
    ) AS hits
    FROM geographic_layers l
    JOIN geographic_features f ON f.layer_id = l.id
    CROSS JOIN pt
    WHERE l.code = 'cra_prioridades_conservacion'
      AND ST_Intersects(f.geom, pt.geom)
  ),
  invemar AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'source_placemark_id', f.source_placemark_id,
        'name', f.name,
        'properties_original', f.properties_original
      )
      ORDER BY f.source_placemark_id
    ) AS hits
    FROM geographic_layers l
    JOIN geographic_features f ON f.layer_id = l.id
    CROSS JOIN pt
    WHERE l.code = 'invemar_zonificacion_atlantico'
      AND ST_Intersects(f.geom, pt.geom)
  )
  SELECT jsonb_build_object(
    'cra', COALESCE((SELECT hits FROM cra), '[]'::jsonb),
    'invemar', COALESCE((SELECT hits FROM invemar), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION geo_match_report_location(double precision, double precision)
  TO anon, authenticated, service_role;
