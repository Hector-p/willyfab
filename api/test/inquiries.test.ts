import { beforeEach, describe, expect, it } from 'vitest';
import {
  inquiryInput,
  loginAsAdmin,
  makeEnv,
  resetRateLimits,
  resetTables,
  send,
  withTestDb,
} from './helpers.ts';

beforeEach(async () => {
  await resetTables();
  resetRateLimits();
});

const submit = (env: ReturnType<typeof makeEnv>, body: unknown, ip = '203.0.113.5') =>
  send(env, 'POST', '/api/v1/inquiries', { json: body, headers: { 'cf-connecting-ip': ip } });

const countInquiries = () =>
  withTestDb(async (client) => Number((await client.query('SELECT count(*) FROM inquiries')).rows[0].count));

describe('inquiries', () => {
  it('stores a new enquiry and returns 201', async () => {
    const env = makeEnv();
    const res = await submit(env, inquiryInput());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ status: 'received' });
    expect(await countInquiries()).toBe(1);
  });

  it('accepts but silently drops submissions that fill the honeypot', async () => {
    const res = await submit(makeEnv(), inquiryInput({ website: 'https://spam.example' }));
    expect(res.status).toBe(201);
    expect(await countInquiries()).toBe(0);
  });

  it('returns 422 for an invalid enquiry', async () => {
    const res = await submit(makeEnv(), inquiryInput({ message: 'too short' }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.detail.some((issue: { loc: string[] }) => issue.loc.includes('message'))).toBe(true);
  });

  it('limits enquiries to five per client in the window', async () => {
    const env = makeEnv();
    for (let i = 0; i < 5; i += 1) {
      expect((await submit(env, inquiryInput({ name: `Visitor ${i}` }))).status).toBe(201);
    }
    const blocked = await submit(env, inquiryInput());
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).detail).toContain('Too many enquiries');
  });

  it('lists enquiries newest first for an admin', async () => {
    const env = makeEnv();
    await submit(env, inquiryInput({ name: 'First Person' }), '203.0.113.10');
    await submit(env, inquiryInput({ name: 'Second Person' }), '203.0.113.11');
    const token = await loginAsAdmin(env);
    const res = await send(env, 'GET', '/api/v1/admin/inquiries', { token });
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.items.map((item: { name: string }) => item.name)).toEqual(['Second Person', 'First Person']);
  });

  it('filters enquiries by status and updates their status', async () => {
    const env = makeEnv();
    await submit(env, inquiryInput());
    const token = await loginAsAdmin(env);
    const list = await (await send(env, 'GET', '/api/v1/admin/inquiries', { token })).json();
    const id = list.items[0].id;

    const patched = await send(env, 'PATCH', `/api/v1/admin/inquiries/${id}`, {
      token,
      json: { status: 'contacted' },
    });
    expect(patched.status).toBe(200);
    expect((await patched.json()).status).toBe('contacted');

    const filtered = await (await send(env, 'GET', '/api/v1/admin/inquiries?status=new', { token })).json();
    expect(filtered.total).toBe(0);
  });

  it('returns 404 when updating the status of a missing enquiry', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const res = await send(env, 'PATCH', '/api/v1/admin/inquiries/9999', { token, json: { status: 'archived' } });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ detail: 'Inquiry not found' });
  });

  it('rejects an unknown status value', async () => {
    const env = makeEnv();
    await submit(env, inquiryInput());
    const token = await loginAsAdmin(env);
    const list = await (await send(env, 'GET', '/api/v1/admin/inquiries', { token })).json();
    const res = await send(env, 'PATCH', `/api/v1/admin/inquiries/${list.items[0].id}`, {
      token,
      json: { status: 'deleted' },
    });
    expect(res.status).toBe(422);
  });
});
