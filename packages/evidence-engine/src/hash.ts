import { createHash, timingSafeEqual } from 'node:crypto';

/** SHA-256 of file bytes. Proves bit integrity of the stored object, not provenance/origin. */
export function sha256Hex(bytes: Uint8Array | Buffer | ArrayBuffer): string {
  const buf =
    bytes instanceof ArrayBuffer
      ? Buffer.from(bytes)
      : Buffer.isBuffer(bytes)
        ? bytes
        : Buffer.from(bytes);
  return createHash('sha256').update(buf).digest('hex');
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
