export type Position = [number, number] | [number, number, number];

export type PolygonCoords = Position[][]; // rings: outer + holes
export type MultiPolygonCoords = PolygonCoords[];

export type NormalizedGeometry = {
  type: 'MultiPolygon';
  coordinates: MultiPolygonCoords;
};

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type NormalizedFeature = {
  source_placemark_id: string;
  name: string | null;
  style_url: string | null;
  geometry_type_original: string;
  properties_original: Record<string, string>;
  geometry: NormalizedGeometry | null;
  bbox: [number, number, number, number] | null;
  geom_valid: boolean;
  validation_issues: ValidationIssue[];
};

export type ImportErrorRecord = {
  source_placemark_id: string | null;
  stage: string;
  severity: 'error' | 'warning';
  message: string;
  payload?: Record<string, unknown>;
};

export type LayerManifest = {
  code: string;
  name: string;
  description: string | null;
  source_filename: string;
  source_sha256: string;
  crs_epsg: 4326;
  feature_count: number;
  feature_count_valid_geometry: number;
  error_count: number;
  warning_count: number;
  bbox: [number, number, number, number] | null;
  attribute_keys_observed: string[];
  created_at: string;
  notes: string[];
};
