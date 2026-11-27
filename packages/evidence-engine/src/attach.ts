import type { Evidence, GeoPoint } from '@guardianes/contracts';
import { extractExifIfPresent, type ExifrLike } from './exif';
import { sha256Hex } from './hash';
import { newId } from './ids';
import {
  inferMediaKind,
  isAllowedEvidenceMimeType,
  isWithinEvidenceSizeLimit,
} from './media';

export type AttachEvidenceInput = {
  reportId: string;
  bytes: Uint8Array | Buffer;
  mimeType: string;
  sharedLocation?: GeoPoint;
  storageKey?: string;
  receivedAt?: string;
  mediaKind?: 'photo' | 'video' | 'other';
  exifr?: ExifrLike;
};

export async function createEvidenceFromBytes(
  input: AttachEvidenceInput,
): Promise<Evidence> {
  if (!isAllowedEvidenceMimeType(input.mimeType)) {
    throw new Error(`Unsupported evidence mime type: ${input.mimeType}`);
  }
  if (!isWithinEvidenceSizeLimit(input.bytes.byteLength)) {
    throw new Error('Evidence exceeds allowed size');
  }

  const sha256 = sha256Hex(input.bytes);
  const exif = await extractExifIfPresent(input.bytes, input.exifr);
  const id = newId();
  const receivedAt = input.receivedAt ?? new Date().toISOString();

  return {
    id,
    reportId: input.reportId,
    mediaKind: input.mediaKind ?? inferMediaKind(input.mimeType),
    mimeType: input.mimeType,
    byteLength: input.bytes.byteLength,
    sha256,
    storageKey: input.storageKey ?? `evidence/${input.reportId}/${id}`,
    sharedLocation: input.sharedLocation,
    exif,
    receivedAt,
    createdAt: receivedAt,
  };
}
