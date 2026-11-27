import { z } from 'zod';

export const geoPointSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

export const reportChannelSchema = z.enum(['pwa', 'whatsapp']);

export const reportStatusSchema = z.enum([
  'draft',
  'queued_offline',
  'submitted',
  'geo_processed',
  'under_review',
  'needs_info',
  'accepted',
  'rejected',
  'alerted',
]);

export const locationSourceSchema = z.enum([
  'device_gps',
  'map_pin',
  'whatsapp_shared_location',
  'unknown',
]);

export const reportLocationSchema = geoPointSchema.extend({
  accuracyMeters: z.number().positive().max(50_000).optional(),
  source: locationSourceSchema,
});

export const trackingCodeSchema = z
  .string()
  .regex(/^GDM-[A-Z0-9]{6,12}$/, 'Invalid tracking code format');

export const trackingSecretSchema = z.string().min(20).max(128);

/** Create report — no PII fields allowed on this contract */
export const createReportSchema = z
  .object({
    channel: reportChannelSchema,
    location: reportLocationSchema,
    observedAt: z.string().datetime({ offset: true }).optional(),
    description: z.string().max(2000).optional(),
    categoryId: z.string().uuid().optional(),
    categoryCode: z.string().min(1).max(64).optional(),
    clientReportId: z.string().uuid().optional(),
    /** Optional opaque reporter handle (will be hashed + stored separately) */
    reporterHandle: z.string().min(3).max(256).optional(),
  })
  .strict();

export const createReportDraftSchema = createReportSchema;

export const trackReportSchema = z
  .object({
    trackingCode: trackingCodeSchema,
    trackingSecret: trackingSecretSchema,
  })
  .strict();

export const attachEvidenceMetaSchema = z
  .object({
    reportId: z.string().uuid(),
    mimeType: z.string().min(3).max(128),
    byteLength: z.number().int().positive(),
    mediaKind: z.enum(['photo', 'video', 'other']).optional(),
    sharedLocation: geoPointSchema.optional(),
    storageKey: z.string().min(1).max(512).optional(),
  })
  .strict();

export const createPreliminaryAlertSchema = z
  .object({
    reportId: z.string().uuid(),
    title: z.string().min(3).max(160),
    rationale: z.string().min(3).max(2000),
    createdBy: z.enum(['system_rule', 'cra_reviewer']).default('system_rule'),
  })
  .strict();

export const transitionReportStatusSchema = z
  .object({
    reportId: z.string().uuid(),
    toStatus: reportStatusSchema,
    reason: z.string().max(500).optional(),
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type CreateReportDraftInput = CreateReportInput;
export type TrackReportInput = z.infer<typeof trackReportSchema>;
export type AttachEvidenceMetaInput = z.infer<typeof attachEvidenceMetaSchema>;
export type CreatePreliminaryAlertInput = z.infer<typeof createPreliminaryAlertSchema>;
export type GeoPointInput = z.infer<typeof geoPointSchema>;

export { z };
