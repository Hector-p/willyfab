import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { adminRoutes } from './routes/admin.ts';
import { authRoutes } from './routes/auth.ts';
import { publicRoutes } from './routes/public.ts';
import { withDb } from './db.ts';
import { HttpError, RequestValidationError } from './errors.ts';
import { loadConfig, type AppEnv } from './env.ts';

const app = new Hono<AppEnv>();

app.use(
  '*',
  cors({
    origin: (origin: string, c: Context<AppEnv>) =>
      loadConfig(c.env).corsOrigins.includes(origin) ? origin : null,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'X-CSRF-Token'],
    credentials: true,
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/ready', async (c) => {
  try {
    await withDb(c.env, (db) => db.query('SELECT 1'));
  } catch {
    throw new HttpError(503, 'Database is unavailable');
  }
  return c.json({ status: 'ready', database: 'connected' });
});

app.route('/api/v1', publicRoutes);
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/admin', adminRoutes);

app.notFound((c) => c.json({ detail: 'Not Found' }, 404));

app.onError((error, c) => {
  if (error instanceof HttpError) {
    return c.json({ detail: error.detail }, error.status as 400, error.headers);
  }
  if (error instanceof RequestValidationError) {
    return c.json({ detail: error.issues }, 422);
  }
  console.error(error);
  return c.json({ detail: 'Internal Server Error' }, 500);
});

export default app;
