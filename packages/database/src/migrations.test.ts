import { describe, expect, it } from 'vitest';
import {
  GEOGRAPHIC_MIGRATION_FILES,
  REPORTS_MIGRATION_FILES,
  readGeographicMigrationSql,
  readReportsMigrationSql,
} from './migrations';

describe('migrations', () => {
  it('ships PostGIS geographic SQL with GiST indexes', () => {
    expect(GEOGRAPHIC_MIGRATION_FILES).toContain('001_geographic.sql');
    const sql = readGeographicMigrationSql();
    expect(sql).toContain('geographic_layers');
    expect(sql).toContain('geographic_features');
    expect(sql).toContain('USING GIST');
    expect(sql).toContain('geo_features_at_point');
  });

  it('ships reports domain SQL with separated reporter references', () => {
    expect(REPORTS_MIGRATION_FILES).toContain('002_reports.sql');
    const sql = readReportsMigrationSql();
    expect(sql).toContain('reports');
    expect(sql).toContain('evidences');
    expect(sql).toContain('reporter_references');
    expect(sql).toContain('evidence_verifications');
    expect(sql).toContain('report_events');
    expect(sql).toContain('alerts');
    expect(sql).toContain('system_placeholder');
  });
});
