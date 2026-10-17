import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AdminPrincipal } from './env.ts';

// Admin password hashes use HMAC-SHA256 keyed by a random salt. This is one HMAC per check,
// which fits the Workers free plan's 10 ms CPU limit. Use a long, random admin password.
const PASSWORD_HASH_SCHEME = 'hmac-sha256';
const DIGEST_BYTES = 32;

export function hashPassword(password: string, salt: Buffer = randomBytes(16)): string {
  const digest = createHmac('sha256', salt).update(password, 'utf8').digest();
  return [PASSWORD_HASH_SCHEME, salt.toString('base64url'), digest.toString('base64url')].join('$');
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== PASSWORD_HASH_SCHEME) return false;
  const salt = Buffer.from(parts[1], 'base64url');
  const expected = Buffer.from(parts[2], 'base64url');
  if (salt.length === 0 || expected.length !== DIGEST_BYTES) return false;
  const actual = createHmac('sha256', salt).update(password, 'utf8').digest();
  return timingSafeEqual(actual, expected);
}

export function sameText(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left.trim().toLowerCase(), 'utf8').digest();
  const rightDigest = createHash('sha256').update(right.trim().toLowerCase(), 'utf8').digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'ascii').digest('base64url');
}

export function createAdminToken(
  subject: string,
  secret: string,
  ttlMinutes: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): { token: string; expiresAt: number } {
  const expiresAt = nowSeconds + ttlMinutes * 60;
  const body = Buffer.from(JSON.stringify({ sub: subject, exp: expiresAt })).toString('base64url');
  return { token: `${body}.${sign(body, secret)}`, expiresAt };
}

export function readAdminToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): AdminPrincipal | null {
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const signature = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(body, secret));
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null) return null;
  const { sub, exp } = payload as { sub?: unknown; exp?: unknown };
  if (typeof sub !== 'string' || typeof exp !== 'number' || !Number.isInteger(exp)) return null;
  if (exp <= nowSeconds) return null;
  return { subject: sub, expiresAt: exp };
}
