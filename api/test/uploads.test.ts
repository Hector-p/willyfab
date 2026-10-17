import { beforeEach, describe, expect, it } from 'vitest';
import {
  FakeBucket,
  PNG_BYTES,
  imageForm,
  loginAsAdmin,
  makeEnv,
  resetRateLimits,
  resetTables,
  send,
} from './helpers.ts';

beforeEach(async () => {
  await resetTables();
  resetRateLimits();
});

describe('image uploads', () => {
  it('stores a PNG and returns its public URL with cache metadata', async () => {
    const media = new FakeBucket();
    const env = makeEnv({}, media);
    const token = await loginAsAdmin(env);
    const res = await send(env, 'POST', '/api/v1/admin/uploads', { token, form: imageForm() });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^https:\/\/media\.example\.com\/[0-9a-f]{32}\.png$/);
    const key = body.filename as string;
    expect(media.objects.get(key)?.contentType).toBe('image/png');
    expect(media.objects.get(key)?.cacheControl).toBeTruthy();
  });

  it('rejects a file whose contents are not an image', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const res = await send(env, 'POST', '/api/v1/admin/uploads', {
      token,
      form: imageForm(new TextEncoder().encode('hello world'), 'notes.png', 'image/png'),
    });
    expect(res.status).toBe(422);
  });

  it('rejects an empty file', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const res = await send(env, 'POST', '/api/v1/admin/uploads', { token, form: imageForm(new Uint8Array()) });
    expect(res.status).toBe(422);
  });

  it('rejects a file over 5 MB', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PNG_BYTES, 0);
    const res = await send(env, 'POST', '/api/v1/admin/uploads', { token, form: imageForm(big) });
    expect(res.status).toBe(422);
  });

  it('returns 422 pointing at the file field when none is sent', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const res = await send(env, 'POST', '/api/v1/admin/uploads', { token, form: new FormData() });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.detail[0].loc).toEqual(['body', 'file']);
  });

  it('returns 503 when no media bucket is bound', async () => {
    const env = makeEnv({}, null);
    const token = await loginAsAdmin(env);
    const res = await send(env, 'POST', '/api/v1/admin/uploads', { token, form: imageForm() });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ detail: 'Image storage is not configured' });
  });

  it('requires an admin token', async () => {
    const res = await send(makeEnv(), 'POST', '/api/v1/admin/uploads', { form: imageForm() });
    expect(res.status).toBe(401);
  });
});
