import { beforeEach, describe, expect, it } from 'vitest';
import {
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

async function adminCreate(env: ReturnType<typeof makeEnv>, token: string, path: string, body: unknown) {
  const res = await send(env, 'POST', `/api/v1/admin/${path}`, { token, json: body });
  expect(res.status).toBe(201);
  return res.json();
}

describe('public content', () => {
  it('lists only published services in sort order', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await adminCreate(env, token, 'services', serviceInput({ slug: 'second-one', sort_order: 2 }));
    await adminCreate(env, token, 'services', serviceInput({ slug: 'first-one', sort_order: 1 }));
    await adminCreate(env, token, 'services', serviceInput({ slug: 'hidden-one', sort_order: 0, is_published: false }));

    const body = await (await send(env, 'GET', '/api/v1/services')).json();
    expect(body.total).toBe(2);
    expect(body.items.map((item: { slug: string }) => item.slug)).toEqual(['first-one', 'second-one']);
    expect(body.items[0]).not.toHaveProperty('is_published');
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
  });

  it('filters services by category and pages results', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await adminCreate(env, token, 'services', serviceInput({ slug: 'alpha-one', sort_order: 1 }));
    await adminCreate(env, token, 'services', serviceInput({ slug: 'beta-two', sort_order: 2, category: 'Design' }));

    const filtered = await (await send(env, 'GET', '/api/v1/services?category=Design')).json();
    expect(filtered.items.map((item: { slug: string }) => item.slug)).toEqual(['beta-two']);

    const paged = await (await send(env, 'GET', '/api/v1/services?limit=1&offset=1')).json();
    expect(paged.items.map((item: { slug: string }) => item.slug)).toEqual(['beta-two']);
    expect(paged.total).toBe(2);
  });

  it('returns a published service by slug and 404 for an unpublished one', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await adminCreate(env, token, 'services', serviceInput({ slug: 'public-one' }));
    await adminCreate(env, token, 'services', serviceInput({ slug: 'draft-one', is_published: false }));

    const found = await send(env, 'GET', '/api/v1/services/public-one');
    expect(found.status).toBe(200);
    expect((await found.json()).slug).toBe('public-one');

    const missing = await send(env, 'GET', '/api/v1/services/draft-one');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ detail: 'Service not found' });
  });

  it('filters projects by featured flag and hides unpublished projects', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await adminCreate(env, token, 'projects', projectInput({ slug: 'featured-one', featured: true }));
    await adminCreate(env, token, 'projects', projectInput({ slug: 'plain-one', featured: false }));
    await adminCreate(env, token, 'projects', projectInput({ slug: 'draft-two', featured: true, is_published: false }));

    const featured = await (await send(env, 'GET', '/api/v1/projects?featured=true')).json();
    expect(featured.items.map((item: { slug: string }) => item.slug)).toEqual(['featured-one']);

    const draft = await send(env, 'GET', '/api/v1/projects/draft-two');
    expect(draft.status).toBe(404);
    expect(await draft.json()).toEqual({ detail: 'Project not found' });
  });

  it('lists published board members in sort order', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await adminCreate(env, token, 'board-members', boardInput({ name: 'Second Member', sort_order: 2 }));
    await adminCreate(env, token, 'board-members', boardInput({ name: 'First Member', sort_order: 1 }));
    await adminCreate(env, token, 'board-members', boardInput({ name: 'Hidden Member', sort_order: 0, is_published: false }));

    const body = await (await send(env, 'GET', '/api/v1/board-members')).json();
    expect(body.items.map((item: { name: string }) => item.name)).toEqual(['First Member', 'Second Member']);
    expect(body.total).toBe(2);
  });

  it('lists only published gallery images and honours the limit', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    await adminCreate(env, token, 'gallery', galleryInput({ title: 'Image one', sort_order: 0 }));
    await adminCreate(env, token, 'gallery', galleryInput({ title: 'Image two', sort_order: 10 }));
    await adminCreate(env, token, 'gallery', galleryInput({ title: 'Hidden image', sort_order: 20, is_published: false }));

    const body = await (await send(env, 'GET', '/api/v1/gallery')).json();
    expect(body.items.map((item: { title: string }) => item.title)).toEqual(['Image one', 'Image two']);
    expect(body.total).toBe(2);

    const limited = await (await send(env, 'GET', '/api/v1/gallery?limit=1')).json();
    expect(limited.items).toHaveLength(1);
  });

  it('returns 422 for an out-of-range page size', async () => {
    const res = await send(makeEnv(), 'GET', '/api/v1/services?limit=500');
    expect(res.status).toBe(422);
  });
});
