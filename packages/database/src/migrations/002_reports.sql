-- Guardianes del Manglar — reports & evidence domain
-- Separates reporter references from environmental report data.
-- Categories are configurable; official CRA catalog is supplied externally.

CREATE TABLE IF NOT EXISTS report_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  source text NOT NULL CHECK (source IN ('system_placeholder', 'local_config', 'cra_official')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporter_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_handle_hash text,
  optional_contact_encrypted text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text NOT NULL UNIQUE,
  tracking_secret_hash text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('pwa', 'whatsapp')),
  status text NOT NULL,
  category_id uuid REFERENCES report_categories (id),
  description text,
  location_longitude double precision NOT NULL,
  location_latitude double precision NOT NULL,
  location_accuracy_meters double precision,
  location_source text NOT NULL,
  observed_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  client_report_id uuid,
  reporter_reference_id uuid REFERENCES reporter_references (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  geom geometry(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(location_longitude, location_latitude), 4326)
  ) STORED
);

CREATE INDEX IF NOT EXISTS reports_geom_gix ON reports USING GIST (geom);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
CREATE INDEX IF NOT EXISTS reports_tracking_code_idx ON reports (tracking_code);

CREATE TABLE IF NOT EXISTS evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  media_kind text NOT NULL CHECK (media_kind IN ('photo', 'video', 'other')),
  mime_type text NOT NULL,
  byte_length integer NOT NULL CHECK (byte_length > 0),
  sha256 text NOT NULL CHECK (char_length(sha256) = 64),
  storage_key text NOT NULL,
  shared_longitude double precision,
  shared_latitude double precision,
  exif jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evidences_report_id_idx ON evidences (report_id);
CREATE INDEX IF NOT EXISTS evidences_sha256_idx ON evidences (sha256);

CREATE TABLE IF NOT EXISTS evidence_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid NOT NULL REFERENCES evidences (id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  kind text NOT NULL,
  result text NOT NULL CHECK (result IN ('pass', 'fail', 'inconclusive', 'not_applicable')),
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('automated_consistency', 'institutional_review')),
  result text NOT NULL CHECK (result IN ('pass', 'fail', 'inconclusive', 'not_applicable')),
  summary text NOT NULL,
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('system', 'cra_reviewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_events_report_id_idx ON report_events (report_id);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('preliminary', 'active', 'dismissed', 'closed')),
  title text NOT NULL,
  rationale text NOT NULL,
  created_by text NOT NULL CHECK (created_by IN ('system_rule', 'cra_reviewer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alerts_report_id_idx ON alerts (report_id);

-- Seed only a non-official placeholder. Official CRA categories arrive later.
INSERT INTO report_categories (code, label, description, active, source)
VALUES (
  'uncategorized',
  'Sin categoría asignada',
  'Placeholder interno hasta catálogo oficial C.R.A. No es categoría oficial.',
  true,
  'system_placeholder'
)
ON CONFLICT (code) DO NOTHING;
