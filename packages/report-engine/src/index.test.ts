import { describe, expect, it } from 'vitest';
import { ReportService } from './service';
import { canTransition } from './status';
import { assertNoPiiFields, toSanitizedExport } from './anonymity';

function baseLocation() {
  return {
    longitude: -74.85,
    latitude: 10.98,
    accuracyMeters: 12,
    source: 'device_gps' as const,
  };
}

describe('@guardianes/report-engine domain', () => {
  it('creates a report with tracking credentials and no required account', () => {
    const service = ReportService.create();
    const result = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
      description: 'Tala observada cerca del manglar',
    });

    expect(result.trackingCode.startsWith('GDM-')).toBe(true);
    expect(result.trackingSecret.length).toBeGreaterThan(20);
    expect(result.report.status).toBe('submitted');
    expect(result.report.reporterReferenceId).toBeNull();
    expect(result.report.trackingSecretHash).not.toBe(result.trackingSecret);
  });

  it('associates configurable category without inventing CRA official taxonomy', () => {
    const service = ReportService.create();
    const category = service.registerCategory({
      code: 'pending_cra_example_slot',
      label: 'Slot local (no oficial C.R.A.)',
      active: true,
      source: 'local_config',
    });
    expect(category.source).toBe('local_config');

    const created = service.createReport({
      channel: 'whatsapp',
      location: { ...baseLocation(), source: 'whatsapp_shared_location' },
      categoryCode: category.code,
    });
    expect(created.category?.code).toBe(category.code);
    expect(created.category?.source).not.toBe('cra_official');
  });

  it('attaches evidence with hash and records verification history', async () => {
    const service = ReportService.create();
    const created = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
    });
    const { evidence, verifications } = await service.addEvidence(created.report.id, {
      bytes: Buffer.from('fake-image-bytes'),
      mimeType: 'image/jpeg',
      sharedLocation: { longitude: -74.8501, latitude: 10.9801 },
    });

    expect(evidence.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(verifications.length).toBeGreaterThanOrEqual(2);
    const events = service.listEvents(created.report.id);
    expect(events.some((e) => e.type === 'evidence_added')).toBe(true);
    expect(events.some((e) => e.type === 'verification_recorded')).toBe(true);
  });

  it('validates tracking credentials and hides reporter data', () => {
    const service = ReportService.create();
    const created = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
      reporterHandle: 'whatsapp:+570000000000',
    });
    expect(created.reporterReference?.channelHandleHash).toBeTruthy();
    expect(created.report.reporterReferenceId).toBeTruthy();

    const view = service.track({
      trackingCode: created.trackingCode,
      trackingSecret: created.trackingSecret,
    });
    expect(view.trackingCode).toBe(created.trackingCode);
    expect(JSON.stringify(view)).not.toContain('whatsapp:+57');
    expect(JSON.stringify(view)).not.toContain(created.trackingSecret);

    const dashboard = service.dashboardView(created.report.id);
    expect('reporterReferenceId' in dashboard).toBe(false);
    expect('trackingSecretHash' in dashboard).toBe(false);

    expect(() =>
      service.track({
        trackingCode: created.trackingCode,
        trackingSecret: 'wrong-secret-value-0000000000',
      }),
    ).toThrow(/Invalid tracking/);
  });

  it('enforces status transitions and can create preliminary alerts', () => {
    expect(canTransition('submitted', 'under_review')).toBe(true);
    expect(canTransition('rejected', 'accepted')).toBe(false);

    const service = ReportService.create();
    const created = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
    });
    service.transitionStatus(created.report.id, 'under_review');
    service.transitionStatus(created.report.id, 'accepted');
    const alert = service.createPreliminaryAlert({
      reportId: created.report.id,
      title: 'Alerta preliminar de prueba',
      rationale: 'Consistencia automática + revisión inicial',
      createdBy: 'system_rule',
    });
    expect(alert.status).toBe('preliminary');
    expect(service.getStore().reports.get(created.report.id)?.status).toBe('alerted');
  });

  it('applies geo match and exposes CRA/INVEMAR fields on dashboard rows', () => {
    const service = ReportService.create();
    const created = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
      description: 'Near Mallorquín',
    });
    service.applyGeoMatch(created.report.id, {
      matchedAt: '2026-11-27T00:00:00.000Z',
      longitude: created.report.location.longitude,
      latitude: created.report.location.latitude,
      cra: {
        hasCoverage: true,
        matchCount: 1,
        priority: 'Alto',
        zoneHydro: 'Bajo Magdalena',
        subzoneHydro: 'Cienaga Mallorquin',
        unitHydro: 'Cienaga Mayorquin',
        action: 'Preservación',
        scenario: 'Escenario I',
      },
      invemar: {
        hasCoverage: true,
        matchCount: 1,
        dominantSpecies: 'A. germinans',
        composition: 'A. germinans',
        structure: 'Bosque',
        managementZone: 'Recuperación Tipo I',
        locality: 'Ciénaga Mallorquín',
      },
    });

    expect(service.getStore().reports.get(created.report.id)?.status).toBe('geo_processed');
    const row = service.listReportsForDashboard()[0];
    expect(row?.priorityHint).toBe('Alto');
    expect(row?.dominantSpecies).toBe('A. germinans');
    expect(row?.managementZone).toBe('Recuperación Tipo I');
    expect(row?.zoneHydro).toBe('Bajo Magdalena');
    expect(service.listEvents(created.report.id).some((e) => e.type === 'geo_matched')).toBe(
      true,
    );
  });

  it('lists sanitized dashboard rows without secrets or invented priority', () => {
    const service = ReportService.create();
    const first = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
      description: 'Primero',
      reporterHandle: 'whatsapp:+570000000001',
    });
    const second = service.createReport({
      channel: 'whatsapp',
      location: { ...baseLocation(), latitude: 10.5 },
      description: 'Segundo',
    });
    service.createPreliminaryAlert({
      reportId: second.report.id,
      title: 'Preliminar',
      rationale: 'Revisión inicial',
      createdBy: 'cra_reviewer',
    });

    const list = service.listReportsForDashboard();
    expect(list).toHaveLength(2);
    const byId = Object.fromEntries(list.map((row) => [row.id, row]));
    expect(byId[second.report.id]?.hasPreliminaryAlert).toBe(true);
    expect(byId[first.report.id]?.hasPreliminaryAlert).toBe(false);
    expect(list.every((row) => row.priorityHint === null)).toBe(true);
    expect(list.every((row) => row.geoMatch === null)).toBe(true);
    expect(JSON.stringify(list)).not.toContain(first.trackingSecret);
    expect(JSON.stringify(list)).not.toContain('whatsapp:+57');
    expect(JSON.stringify(list)).not.toContain('trackingSecretHash');
  });

  it('keeps exports free of personal data and secrets', () => {
    const service = ReportService.create();
    const created = service.createReport({
      channel: 'pwa',
      location: baseLocation(),
      reporterHandle: 'citizen-temp-handle',
    });
    const exported = service.exportSanitized(created.report.id);
    expect(exported.trackingCode).toBe(created.trackingCode);
    expect(JSON.stringify(exported)).not.toContain('citizen-temp-handle');
    expect(JSON.stringify(exported)).not.toContain(created.trackingSecret);
    expect(JSON.stringify(exported)).not.toContain(created.report.trackingSecretHash);

    expect(() => assertNoPiiFields({ email: 'a@b.c' })).toThrow();
    expect(() =>
      toSanitizedExport({
        report: created.report,
        category: null,
        evidenceCount: 0,
      }),
    ).not.toThrow();
  });
});
