import { describe, expect, it } from 'vitest';
import type { ReportChannel, ReportStatus } from './index';

describe('@guardianes/contracts', () => {
  it('exposes expected channel and status literals', () => {
    const channels: ReportChannel[] = ['pwa', 'whatsapp'];
    const statuses: ReportStatus[] = ['draft', 'submitted', 'accepted', 'alerted'];
    expect(channels).toContain('whatsapp');
    expect(statuses).toContain('alerted');
  });
});
