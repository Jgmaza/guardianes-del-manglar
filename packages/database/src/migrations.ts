import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to SQL migration files shipped with this package. */
export function getMigrationsDir(): string {
  return path.join(here, 'migrations');
}

export function readGeographicMigrationSql(): string {
  return readFileSync(path.join(getMigrationsDir(), '001_geographic.sql'), 'utf8');
}

export const GEOGRAPHIC_MIGRATION_FILES = [
  '001_geographic.sql',
  '003_geo_match.sql',
  '005_geo_impact_zones.sql',
] as const;

export const REPORTS_MIGRATION_FILES = ['002_reports.sql'] as const;

export function readReportsMigrationSql(): string {
  return readFileSync(path.join(getMigrationsDir(), '002_reports.sql'), 'utf8');
}

export function readGeoMatchMigrationSql(): string {
  return readFileSync(path.join(getMigrationsDir(), '003_geo_match.sql'), 'utf8');
}

export const MIGRATION_FILES = [
  ...GEOGRAPHIC_MIGRATION_FILES,
  ...REPORTS_MIGRATION_FILES,
] as const;
