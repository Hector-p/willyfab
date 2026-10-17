import { createMiddleware } from 'hono/factory';
import { HttpError } from './errors.ts';
import { loadConfig, type AppEnv } from './env.ts';
import { readAdminToken } from './security.ts';

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const config = loadConfig(c.env);
  if (!config.adminEmail || !config.sessionSecret) {
    throw new HttpError(503, 'Administration is not configured');
  }

  const header = c.req.header('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  const principal = match ? readAdminToken(match[1], config.sessionSecret) : null;
  if (!principal || principal.subject !== config.adminEmail) {
    throw new HttpError(401, 'Sign in to continue', { 'WWW-Authenticate': 'Bearer' });
  }

  c.set('admin', principal);
  await next();
});
