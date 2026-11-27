-- Aggregated INVEMAR locality impact + CRA priority counts for the CRA dashboard.
CREATE OR REPLACE FUNCTION public.geo_impact_zones_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $function$
  WITH inv AS (
    SELECT
      COALESCE(f.properties_original->>'LOCALIDAD', 'Sin localidad') AS locality,
      COALESCE(f.properties_original->>'ZONIF', f.properties_original->>'ZONIFICACI', 'Sin zonificación') AS management_zone,
      f.properties_original->>'COB_SPDOM' AS dominant_species,
      f.properties_original->>'C4_INTRV_1' AS intervention,
      f.properties_original->>'C1_GRADO_1' AS degradation,
      f.properties_original->>'USOACTUAL' AS current_use,
      f.properties_original->>'C10_CONFLI' AS land_conflict,
      f.properties_original->>'C8_FAUNA' AS fauna_pressure,
      COALESCE(NULLIF(f.properties_original->>'Area_lambert_ha','')::numeric, 0) AS ha,
      CASE
        WHEN f.properties_original->>'C4_INTRV_1' ILIKE '%Alta%' THEN 3
        WHEN f.properties_original->>'C4_INTRV_1' ILIKE '%Media%' THEN 2
        WHEN f.properties_original->>'C4_INTRV_1' ILIKE '%Baja%' THEN 1
        ELSE 0
      END AS intervention_score,
      CASE
        WHEN f.properties_original->>'C1_GRADO_1' ILIKE 'Alto%' THEN 3
        WHEN f.properties_original->>'C1_GRADO_1' ILIKE 'Medio%' THEN 2
        WHEN f.properties_original->>'C1_GRADO_1' ILIKE 'Bajo%' THEN 1
        ELSE 0
      END AS degradation_score
    FROM geographic_features f
    JOIN geographic_layers l ON l.id = f.layer_id
    WHERE l.code = 'invemar_zonificacion_atlantico'
  ),
  by_locality AS (
    SELECT
      locality,
      ROUND(SUM(ha), 2) AS hectares,
      COUNT(*)::int AS polygon_count,
      (ARRAY_AGG(dominant_species ORDER BY ha DESC) FILTER (WHERE dominant_species IS NOT NULL))[1] AS dominant_species,
      (ARRAY_AGG(management_zone ORDER BY ha DESC))[1] AS management_zone,
      (ARRAY_AGG(intervention ORDER BY intervention_score DESC NULLS LAST, ha DESC))[1] AS intervention,
      (ARRAY_AGG(degradation ORDER BY degradation_score DESC NULLS LAST, ha DESC))[1] AS degradation,
      (ARRAY_AGG(current_use ORDER BY ha DESC) FILTER (WHERE current_use IS NOT NULL))[1] AS current_use,
      (ARRAY_AGG(land_conflict ORDER BY ha DESC) FILTER (WHERE land_conflict IS NOT NULL))[1] AS land_conflict,
      (ARRAY_AGG(fauna_pressure ORDER BY ha DESC) FILTER (WHERE fauna_pressure IS NOT NULL))[1] AS fauna_pressure,
      ROUND((AVG(intervention_score) + AVG(degradation_score))::numeric / 2, 2) AS impact_score
    FROM inv
    GROUP BY locality
  ),
  cra AS (
    SELECT
      COALESCE(f.properties_original->>'Val_Priori', 'Sin prioridad') AS priority,
      COUNT(*)::int AS feature_count
    FROM geographic_features f
    JOIN geographic_layers l ON l.id = f.layer_id
    WHERE l.code = 'cra_prioridades_conservacion'
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'source', jsonb_build_object(
      'invemar', 'INVEMAR SIGMA · Zonificación Atlántico',
      'cra', 'C.R.A. · Prioridades de conservación'
    ),
    'craPriorityCounts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('priority', priority, 'count', feature_count) ORDER BY
        CASE priority WHEN 'Alto' THEN 0 WHEN 'Medio' THEN 1 WHEN 'Bajo' THEN 2 ELSE 3 END)
      FROM cra
    ), '[]'::jsonb),
    'zones', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'locality', locality,
          'hectares', hectares,
          'polygonCount', polygon_count,
          'dominantSpecies', dominant_species,
          'managementZone', management_zone,
          'intervention', intervention,
          'degradation', degradation,
          'currentUse', current_use,
          'landConflict', land_conflict,
          'faunaPressure', fauna_pressure,
          'impactScore', impact_score
        )
        ORDER BY impact_score DESC, hectares DESC
      )
      FROM by_locality
    ), '[]'::jsonb)
  );
$function$;

GRANT EXECUTE ON FUNCTION public.geo_impact_zones_summary() TO anon, authenticated, service_role;
