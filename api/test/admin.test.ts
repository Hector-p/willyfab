import { beforeEach, describe, expect, it } from 'vitest';
import {
  FakeBucket,
  MEDIA_BASE_URL,
  boardInput,
  galleryInput,
  loginAsAdmin,
  makeEnv,
  projectInput,
  resetRateLimits,
  resetTables,
  send,
  serviceInput,
} from './helpers.ts';

beforeEach(async () => {
  await resetTables();
  resetRateLimits();
});

describe('admin access', () => {
  it('requires a bearer token', async () => {
    const res = await send(makeEnv(), 'GET', '/api/v1/admin/services');
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Bearer');
    expect(await res.json()).toEqual({ detail: 'Sign in to continue' });
  });

  it('returns 503 when administration is not configured', async () => {
    const res = await send(makeEnv({ ADMIN_EMAIL: undefined }), 'GET', '/api/v1/admin/services');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ detail: 'Administration is not configured' });
  });
});

describe('admin service CRUD', () => {
  it('creates, updates, and deletes a service', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);

    const created = await send(env, 'POST', '/api/v1/admin/services', { token, json: serviceInput() });
    expect(created.status).toBe(201);
    const service = await created.json();

    const updated = await send(env, 'PUT', `/api/v1/admin/services/${service.id}`, {
      token,
      json: serviceInput({ title: 'Structural Steel Works' }),
    });
    expect(updated.status).toBe(200);
    expect((await updated.json()).title).toBe('Structural Steel Works');

    const deleted = await send(env, 'DELETE', `/api/v1/admin/services/${service.id}`, { token });
    expect(deleted.status).toBe(204);

    const list = await (await send(env, 'GET', '/api/v1/admin/services', { token })).json();
    expect(list.total).toBe(0);
  });

  it('includes unpublished services in the admin list', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await send(env, 'POST', '/api/v1/admin/services', { token, json: serviceInput({ is_published: false }) });
    const list = await (await send(env, 'GET', '/api/v1/admin/services', { token })).json();
    expect(list.total).toBe(1);
  });

  it('returns 409 when a slug is already taken', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await send(env, 'POST', '/api/v1/admin/services', { token, json: serviceInput() });
    const dup = await send(env, 'POST', '/api/v1/admin/services', { token, json: serviceInput() });
    expect(dup.status).toBe(409);
  });

  it('returns 404 when updating or deleting a missing service', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const put = await send(env, 'PUT', '/api/v1/admin/services/9999', { token, json: serviceInput() });
    expect(put.status).toBe(404);
    expect(await put.json()).toEqual({ detail: 'Service not found' });

    const del = await send(env, 'DELETE', '/api/v1/admin/services/9999', { token });
    expect(del.status).toBe(404);
  });

  it('returns 422 for an unknown field in the body', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const res = await send(env, 'POST', '/api/v1/admin/services', {
      token,
      json: serviceInput({ surprise: true }),
    });
    expect(res.status).toBe(422);
  });
});

describe('admin project and board CRUD', () => {
  it('creates, updates, and deletes a project', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const created = await send(env, 'POST', '/api/v1/admin/projects', { token, json: projectInput() });
    expect(created.status).toBe(201);
    const project = await created.json();

    const updated = await send(env, 'PUT', `/api/v1/admin/projects/${project.id}`, {
      token,
      json: projectInput({ featured: true }),
    });
    expect((await updated.json()).featured).toBe(true);

    const dup = await send(env, 'POST', '/api/v1/admin/projects', { token, json: projectInput() });
    expect(dup.status).toBe(409);

    const deleted = await send(env, 'DELETE', `/api/v1/admin/projects/${project.id}`, { token });
    expect(deleted.status).toBe(204);
  });

  it('creates, updates, and deletes a board member', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const created = await send(env, 'POST', '/api/v1/admin/board-members', { token, json: boardInput() });
    expect(created.status).toBe(201);
    const member = await created.json();

    const updated = await send(env, 'PUT', `/api/v1/admin/board-members/${member.id}`, {
      token,
      json: boardInput({ position: 'Secretary' }),
    });
    expect((await updated.json()).position).toBe('Secretary');

    const deleted = await send(env, 'DELETE', `/api/v1/admin/board-members/${member.id}`, { token });
    expect(deleted.status).toBe(204);
  });
});

describe('admin gallery', () => {
  it('reorders gallery images by the submitted sequence', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const a = await (await send(env, 'POST', '/api/v1/admin/gallery', { token, json: galleryInput({ title: 'Alpha image' }) })).json();
    const b = await (await send(env, 'POST', '/api/v1/admin/gallery', { token, json: galleryInput({ title: 'Bravo image' }) })).json();
    expect(a.id).toBeTypeOf('number');
    expect(b.id).toBeTypeOf('number');

    const res = await send(env, 'POST', '/api/v1/admin/gallery/reorder', {
      token,
      json: { ids: [b.id, a.id] },
    });
    const reorderBody = await res.json();
    expect(res.status, JSON.stringify(reorderBody)).toBe(200);

    const list = await (await send(env, 'GET', '/api/v1/admin/gallery', { token })).json();
    expect(list.items.map((item: { title: string }) => item.title)).toEqual(['Bravo image', 'Alpha image']);
    expect(list.items.map((item: { sort_order: number }) => item.sort_order)).toEqual([0, 10]);
  });

  it('returns 422 for duplicate ids in a reorder', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const a = await (await send(env, 'POST', '/api/v1/admin/gallery', { token, json: galleryInput() })).json();
    const res = await send(env, 'POST', '/api/v1/admin/gallery/reorder', {
      token,
      json: { ids: [a.id, a.id] },
    });
    expect(res.status).toBe(422);
  });

  it('returns 404 when a reorder references unknown ids', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const a = await (await send(env, 'POST', '/api/v1/admin/gallery', { token, json: galleryInput() })).json();
    const res = await send(env, 'POST', '/api/v1/admin/gallery/reorder', {
      token,
      json: { ids: [a.id, 9999] },
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ detail: 'Some gallery images were not found' });
  });

  it('removes an uploaded image from storage when its last reference is deleted', async () => {
    const media = new FakeBucket();
    const env = makeEnv({}, media);
    const token = await loginAsAdmin(env);
    const key = 'abc123.png';
    media.objects.set(key, {});
    const image = await (
      await send(env, 'POST', '/api/v1/admin/gallery', {
        token,
        json: galleryInput({ image_url: `${MEDIA_BASE_URL}/${key}` }),
      })
    ).json();

    const res = await send(env, 'DELETE', `/api/v1/admin/gallery/${image.id}`, { token });
    expect(res.status).toBe(204);
    expect(media.objects.has(key)).toBe(false);
  });

  it('keeps a shared upload in storage while another record still uses it', async () => {
    const media = new FakeBucket();
    const env = makeEnv({}, media);
    const token = await loginAsAdmin(env);
    const key = 'shared.png';
    media.objects.set(key, {});
    const url = `${MEDIA_BASE_URL}/${key}`;
    const first = await (
      await send(env, 'POST', '/api/v1/admin/gallery', { token, json: galleryInput({ image_url: url }) })
    ).json();
    await send(env, 'POST', '/api/v1/admin/gallery', { token, json: galleryInput({ image_url: url, title: 'Copy' }) });

    await send(env, 'DELETE', `/api/v1/admin/gallery/${first.id}`, { token });
    expect(media.objects.has(key)).toBe(true);
  });

  it('removes the old upload when an image is replaced', async () => {
    const media = new FakeBucket();
    const env = makeEnv({}, media);
    const token = await loginAsAdmin(env);
    media.objects.set('old.png', {});
    const image = await (
      await send(env, 'POST', '/api/v1/admin/gallery', {
        token,
        json: galleryInput({ image_url: `${MEDIA_BASE_URL}/old.png` }),
      })
    ).json();

    const res = await send(env, 'PUT', `/api/v1/admin/gallery/${image.id}`, {
      token,
      json: galleryInput({ image_url: '/images/hero-01.jpg' }),
    });
    expect(res.status).toBe(200);
    expect(media.objects.has('old.png')).toBe(false);
  });
});
