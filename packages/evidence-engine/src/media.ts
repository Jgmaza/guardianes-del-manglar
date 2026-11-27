export const ALLOWED_EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export type AllowedEvidenceMimeType = (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number];

export function isAllowedEvidenceMimeType(mime: string): mime is AllowedEvidenceMimeType {
  return (ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(mime);
}

export const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;

export function isWithinEvidenceSizeLimit(byteLength: number): boolean {
  return byteLength > 0 && byteLength <= MAX_EVIDENCE_BYTES;
}

export function inferMediaKind(
  mimeType: string,
): 'photo' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
}
