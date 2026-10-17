import type { Hyperdrive, R2Bucket } from '@cloudflare/workers-types';
import pg from 'pg';
import app from '../src/index.ts';
import type { Env } from '../src/env.ts';
import { inquiryLimiter, loginLimiter } from '../src/rate-limit.ts';
import { hashPassword } from '../src/security.ts';

export const ADMIN_EMAIL = 'admin@example.com';
export const ADMIN_PASSWORD = 'correct-horse-battery-staple';
export const MEDIA_BASE_URL = 'https://media.example.com';
const SESSION_SECRET = 'test-session-secret-that-is-long-enough';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Set TEST_DATABASE_URL to a local database whose name ends with _test.');
}
if (!new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL must point at a database whose name ends with _test.');
}

export class FakeBucket {
  readonly objects = new Map<string, { contentType?: string; cacheControl?: string }>();

  async put(
    key: string,
    _body: unknown,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<void> {
    this.objects.set(key, {
      contentType: options?.httpMetadata?.contentType,
      cacheControl: options?.httpMetadata?.cacheControl,
    });
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

export function makeEnv(overrides: Partial<Env> = {}, media: FakeBucket | null = new FakeBucket()): Env {
  return {
    HYPERDRIVE: { connectionString: databaseUrl } as Hyperdrive,
    MEDIA: (media ?? undefined) as unknown as R2Bucket | undefined,
    CORS_ORIGINS: 'http://localhost:5173',
    ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: hashPassword(ADMIN_PASSWORD),
    SESSION_SECRET,
    R2_PUBLIC_BASE_URL: MEDIA_BASE_URL,
    ...overrides,
  };
}

interface SendOptions {
  json?: unknown;
  form?: FormData;
  token?: string;
  headers?: Record<string, string>;
}

export interface TestResponse extends Response {
  json(): Promise<any>;
}

export async function send(env: Env, method: string, path: string, options: SendOptions = {}): Promise<TestResponse> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.json);
  }
  if (options.form) body = options.form;
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  return (await app.fetch(new Request(`http://api.test${path}`, { method, headers, body }), env)) as TestResponse;
}

export async function loginAsAdmin(env: Env): Promise<string> {
  const res = await send(env, 'POST', '/api/v1/auth/login', {
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (res.status !== 200) throw new Error(`Admin login failed with ${res.status}`);
  return (await res.json()).access_token as string;
}

export async function withTestDb<T>(work: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

export async function resetTables(): Promise<void> {
  await withTestDb((client) =>
    client.query('TRUNCATE services, projects, board_members, gallery_images, inquiries RESTART IDENTITY'),
  );
}

export function resetRateLimits(): void {
  loginLimiter.reset();
  inquiryLimiter.reset();
}

export const serviceInput = (overrides: Record<string, unknown> = {}) => ({
  slug: 'structural-steel',
  number: '01',
  title: 'Structural Steel',
  category: 'Fabrication',
  capacity: null,
  summary: 'Custom structural steel fabrication for buildings.',
  description: 'Full description of the structural steel service.',
  sort_order: 1,
  is_published: true,
  ...overrides,
});

export const projectInput = (overrides: Record<string, unknown> = {}) => ({
  slug: 'hangar-frame',
  number: '01',
  title: 'Hangar Frame',
  category: 'Industrial',
  image_url: null,
  image_alt: null,
  short_description: 'Steel frame for an aircraft hangar.',
  brief: 'The client needed a large clear-span frame.',
  scope: 'Design, fabrication and installation.',
  client: null,
  location: null,
  start_date: null,
  completion_date: null,
  featured: false,
  sort_order: 1,
  is_published: true,
  ...overrides,
});

export const boardInput = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ada Obi',
  position: 'Chairman',
  image_url: null,
  image_alt: null,
  sort_order: 1,
  is_published: true,
  ...overrides,
});

export const galleryInput = (overrides: Record<string, unknown> = {}) => ({
  title: 'Workshop floor',
  category: 'Workshop',
  image_url: '/images/hero-01.jpg',
  image_alt: 'Workshop floor view',
  caption: null,
  featured: false,
  sort_order: 0,
  is_published: true,
  ...overrides,
});

export const inquiryInput = (overrides: Record<string, unknown> = {}) => ({
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+234 803 000 0000',
  company: null,
  service_interest: null,
  message: 'We need a quote for structural steel work.',
  website: null,
  ...overrides,
});

export const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

export function imageForm(bytes: Uint8Array = PNG_BYTES, name = 'photo.png', type = 'image/png'): FormData {
  const form = new FormData();
  form.append('file', new File([bytes], name, { type }));
  return form;
}
