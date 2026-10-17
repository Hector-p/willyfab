import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAsAdmin, makeEnv, resetRateLimits, resetTables, send } from './helpers.ts';

beforeEach(async () => {
  await resetTables();
  resetRateLimits();
});

const login = (env: ReturnType<typeof makeEnv>, email: string, password: string, ip?: string) =>
  send(env, 'POST', '/api/v1/auth/login', {
    json: { email, password },
    headers: ip ? { 'cf-connecting-ip': ip } : {},
  });

describe('auth', () => {
  it('signs in the configured admin and returns a bearer token', async () => {
    const res = await login(makeEnv(), ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token_type).toBe('bearer');
    expect(typeof body.access_token).toBe('string');
    expect(typeof body.expires_at).toBe('number');
  });

  it('matches the email ignoring case and surrounding spaces', async () => {
    const res = await login(makeEnv(), `  ${ADMIN_EMAIL.toUpperCase()} `, ADMIN_PASSWORD);
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password', async () => {
    const res = await login(makeEnv(), ADMIN_EMAIL, 'not-the-password');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: 'Email or password is incorrect' });
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await login(makeEnv(), 'someone@example.com', ADMIN_PASSWORD);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: 'Email or password is incorrect' });
  });

  it('returns 503 when administration is not configured', async () => {
    const env = makeEnv({ ADMIN_EMAIL: undefined });
    const res = await login(env, ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ detail: 'Administration is not configured' });
  });

  it('rate limits sign-in attempts per client after ten tries', async () => {
    const env = makeEnv();
    for (let i = 0; i < 10; i += 1) {
      expect((await login(env, ADMIN_EMAIL, 'wrong-password-value', '198.51.100.7')).status).toBe(401);
    }
    const blocked = await login(env, ADMIN_EMAIL, ADMIN_PASSWORD, '198.51.100.7');
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ detail: 'Too many sign-in attempts. Try again later.' });
  });

  it('returns 422 for a malformed login body', async () => {
    const res = await send(makeEnv(), 'POST', '/api/v1/auth/login', { json: { email: ADMIN_EMAIL } });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(Array.isArray(body.detail)).toBe(true);
    expect(body.detail[0].loc).toEqual(['body', 'password']);
  });

  it('returns the signed-in admin from /auth/me', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const res = await send(env, 'GET', '/api/v1/auth/me', { token });
    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe(ADMIN_EMAIL);
  });

  it('requires a bearer token for /auth/me', async () => {
    const res = await send(makeEnv(), 'GET', '/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Bearer');
    expect(await res.json()).toEqual({ detail: 'Sign in to continue' });
  });

  it('rejects a tampered token', async () => {
    const env = makeEnv();
    const token = await loginAsAdmin(env);
    const tampered = `${token.slice(0, -2)}xx`;
    const res = await send(env, 'GET', '/api/v1/auth/me', { token: tampered });
    expect(res.status).toBe(401);
  });

  it('returns 204 on logout', async () => {
    const res = await send(makeEnv(), 'POST', '/api/v1/auth/logout');
    expect(res.status).toBe(204);
  });
});
