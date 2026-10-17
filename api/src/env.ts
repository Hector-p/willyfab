import type { Hyperdrive, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  HYPERDRIVE: Hyperdrive;
  MEDIA?: R2Bucket;
  CORS_ORIGINS?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
  ADMIN_TOKEN_TTL_MINUTES?: string;
  MAX_UPLOAD_BYTES?: string;
  R2_PUBLIC_BASE_URL?: string;
}

export interface AdminPrincipal {
  subject: string;
  expiresAt: number;
}

export type AppEnv = {
  Bindings: Env;
  Variables: { admin: AdminPrincipal };
};

export interface Config {
  corsOrigins: string[];
  adminEmail?: string;
  passwordHash?: string;
  sessionSecret?: string;
  tokenTtlMinutes: number;
  maxUploadBytes: number;
  r2PublicBaseUrl?: string;
}

const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function loadConfig(env: Env): Config {
  const corsOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_CORS_ORIGINS;
  return {
    corsOrigins,
    adminEmail: env.ADMIN_EMAIL || undefined,
    passwordHash: env.ADMIN_PASSWORD_HASH || undefined,
    sessionSecret: env.SESSION_SECRET || undefined,
    tokenTtlMinutes: positiveNumber(env.ADMIN_TOKEN_TTL_MINUTES, 720),
    maxUploadBytes: positiveNumber(env.MAX_UPLOAD_BYTES, 5 * 1024 * 1024),
    r2PublicBaseUrl: env.R2_PUBLIC_BASE_URL || undefined,
  };
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
