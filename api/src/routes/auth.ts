import { Hono } from 'hono';
import { requireAdmin } from '../auth.ts';
import { HttpError, parseOrThrow, readJson } from '../errors.ts';
import { loadConfig, type AppEnv } from '../env.ts';
import { clientIp, loginLimiter } from '../rate-limit.ts';
import { loginSchema } from '../schemas.ts';
import { createAdminToken, sameText, verifyPassword } from '../security.ts';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/login', async (c) => {
  const body = parseOrThrow(loginSchema, await readJson(c));
  const config = loadConfig(c.env);
  if (!config.adminEmail || !config.sessionSecret) {
    throw new HttpError(503, 'Administration is not configured');
  }
  if (!loginLimiter.allow(clientIp(c))) {
    throw new HttpError(429, 'Too many sign-in attempts. Try again later.');
  }

  const emailMatches = sameText(body.email, config.adminEmail);
  const passwordMatches = verifyPassword(body.password, config.passwordHash);
  if (!emailMatches || !passwordMatches) {
    throw new HttpError(401, 'Email or password is incorrect');
  }

  const { token, expiresAt } = createAdminToken(
    config.adminEmail,
    config.sessionSecret,
    config.tokenTtlMinutes,
  );
  return c.json({ access_token: token, token_type: 'bearer', expires_at: expiresAt });
});

authRoutes.get('/me', requireAdmin, (c) => {
  const admin = c.get('admin');
  return c.json({ email: admin.subject, expires_at: admin.expiresAt });
});

authRoutes.post('/logout', (c) => c.body(null, 204));
