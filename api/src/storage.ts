import type { R2Bucket } from '@cloudflare/workers-types';

export const CACHE_CONTROL = 'public, max-age=31536000, immutable';

export class UploadRejected extends Error {}
export class StorageNotConfigured extends Error {}

const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWithBytes(data: Uint8Array, bytes: number[]): boolean {
  return bytes.every((byte, index) => data[index] === byte);
}

function asciiAt(data: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...data.subarray(start, end));
}

export function detectImageType(head: Uint8Array): string | null {
  if (startsWithBytes(head, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWithBytes(head, PNG_SIGNATURE)) return 'image/png';
  if (head.length >= 12 && asciiAt(head, 0, 4) === 'RIFF' && asciiAt(head, 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export async function storeImage(
  file: File,
  media: R2Bucket,
  publicBaseUrl: string,
  maxBytes: number,
): Promise<{ filename: string; url: string }> {
  if (file.size === 0) throw new UploadRejected('The uploaded file is empty.');
  if (file.size > maxBytes) {
    throw new UploadRejected(`Images must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller.`);
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const contentType = detectImageType(data.subarray(0, 12));
  if (contentType === null) throw new UploadRejected('Upload a JPEG, PNG or WebP image.');

  const filename = `${crypto.randomUUID().replaceAll('-', '')}${ALLOWED_EXTENSIONS[contentType]}`;
  await media.put(filename, data, { httpMetadata: { contentType, cacheControl: CACHE_CONTROL } });
  return { filename, url: `${publicBaseUrl.replace(/\/$/, '')}/${filename}` };
}

/** Returns the bucket key for a URL served from our own public media base, otherwise null. */
export function storageKeyForUrl(url: string, publicBaseUrl: string | undefined): string | null {
  if (!publicBaseUrl) return null;
  const prefix = `${publicBaseUrl.replace(/\/$/, '')}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  if (!key || key.includes('/') || key.includes('?')) return null;
  return key;
}

export async function deleteStoredObject(media: R2Bucket | undefined, key: string): Promise<void> {
  if (!media) throw new StorageNotConfigured('MEDIA bucket binding is missing');
  await media.delete(key);
}
