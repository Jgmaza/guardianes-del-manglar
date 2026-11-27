import { createHash, randomBytes, randomUUID } from 'node:crypto';

const TRACKING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newId(): string {
  return randomUUID();
}

/** Public opaque tracking code — not a credential by itself. */
export function createTrackingCode(random: () => number = Math.random): string {
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    const index = Math.floor(random() * TRACKING_ALPHABET.length);
    suffix += TRACKING_ALPHABET[index] ?? 'X';
  }
  return `GDM-${suffix}`;
}

/** High-entropy secret shown once to the citizen. */
export function createTrackingSecret(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function hashReporterHandle(handle: string): string {
  return createHash('sha256').update(`reporter:${handle}`, 'utf8').digest('hex');
}
