import { beforeEach, describe, expect, it } from 'vitest';
import { makeEnv, resetRateLimits, resetTables, send } from './helpers.ts';

beforeEach(async () => {
  await resetTables();
  resetRateLimits();
});

describe('health', () => {
  it('reports that the API is up', async () => {
    const res = await send(makeEnv(), 'GET', '/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('reports the database as connected', async () => {
    const res = await send(makeEnv(), 'GET', '/ready');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ready', database: 'connected' });
  });

  it('returns 503 when the database cannot be reached', async () => {
    const env = makeEnv({ HYPERDRIVE: { connectionString: 'postgres://u:p@127.0.0.1:1/willyfab_test' } as never });
    const res = await send(env, 'GET', '/ready');
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ detail: 'Database is unavailable' });
  });

  it('serves health only at the root path', async () => {
    const res = await send(makeEnv(), 'GET', '/api/v1/health');
    expect(res.status).toBe(404);
  });
});
