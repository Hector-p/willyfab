import { Hono } from 'hono';
import { z } from 'zod';
import {
  BOARD_PUBLIC,
  GALLERY_PUBLIC,
  PROJECT_PUBLIC,
  SERVICE_PUBLIC,
} from '../columns.ts';
import { withDb, type Db } from '../db.ts';
import { HttpError, parseOrThrow, readJson } from '../errors.ts';
import type { AppEnv } from '../env.ts';
import { boolQuery, inquiryCreateSchema, intQuery, offsetQuery, optionalTextQuery } from '../schemas.ts';
import { clientIp, inquiryLimiter } from '../rate-limit.ts';
import { buildWhere, type Filter, type Where } from '../sql.ts';

const ENQUIRY_RATE_LIMIT_MESSAGE =
  'Too many enquiries were sent from this connection. Please try again later or contact us by phone or email.';

export const publicRoutes = new Hono<AppEnv>();

publicRoutes.get('/site-status', async (c) => {
  const row = await withDb(c.env, async (db) => {
    const result = await db.query(
      'SELECT maintenance_mode, maintenance_message FROM site_settings WHERE id = 1',
    );
    return result.rows[0];
  });
  return c.json({
    maintenance_mode: row?.maintenance_mode ?? false,
    maintenance_message: row?.maintenance_message ?? null,
  });
});

publicRoutes.get('/services', async (c) => {
  const query = parseOrThrow(
    z.object({ limit: intQuery(1, 100, 50), offset: offsetQuery(), category: optionalTextQuery() }),
    c.req.query(),
    'query',
  );
  const filters: Filter[] = [];
  if (query.category) filters.push({ sql: 'category = ?', value: query.category });
  const where = buildWhere(['is_published = true'], filters);
  return withDb(c.env, async (db) => {
    const page = await pagedList(db, 'services', SERVICE_PUBLIC, where, 'sort_order, id', query.limit, query.offset);
    return c.json(page);
  });
});

publicRoutes.get('/services/:slug', async (c) => {
  const row = await withDb(c.env, async (db) => {
    const result = await db.query(
      `SELECT ${SERVICE_PUBLIC} FROM services WHERE slug = $1 AND is_published = true`,
      [c.req.param('slug')],
    );
    return result.rows[0];
  });
  if (!row) throw new HttpError(404, 'Service not found');
  return c.json(row);
});

publicRoutes.get('/projects', async (c) => {
  const query = parseOrThrow(
    z.object({
      limit: intQuery(1, 100, 24),
      offset: offsetQuery(),
      category: optionalTextQuery(),
      featured: boolQuery(),
    }),
    c.req.query(),
    'query',
  );
  const filters: Filter[] = [];
  if (query.category) filters.push({ sql: 'category = ?', value: query.category });
  if (query.featured !== undefined) filters.push({ sql: 'featured = ?', value: query.featured });
  const where = buildWhere(['is_published = true'], filters);
  return withDb(c.env, async (db) => {
    const page = await pagedList(db, 'projects', PROJECT_PUBLIC, where, 'sort_order, id', query.limit, query.offset);
    return c.json(page);
  });
});

publicRoutes.get('/projects/:slug', async (c) => {
  const row = await withDb(c.env, async (db) => {
    const result = await db.query(
      `SELECT ${PROJECT_PUBLIC} FROM projects WHERE slug = $1 AND is_published = true`,
      [c.req.param('slug')],
    );
    return result.rows[0];
  });
  if (!row) throw new HttpError(404, 'Project not found');
  return c.json(row);
});

publicRoutes.get('/board-members', async (c) => {
  const items = await withDb(c.env, async (db) => {
    const result = await db.query(
      `SELECT ${BOARD_PUBLIC} FROM board_members WHERE is_published = true ORDER BY sort_order, id`,
    );
    return result.rows;
  });
  return c.json({ items, total: items.length });
});

publicRoutes.get('/gallery', async (c) => {
  const query = parseOrThrow(
    z.object({
      category: optionalTextQuery(),
      featured: boolQuery(),
      limit: intQuery(1, 200, 60),
    }),
    c.req.query(),
    'query',
  );
  const filters: Filter[] = [];
  if (query.category) filters.push({ sql: 'category = ?', value: query.category });
  if (query.featured !== undefined) filters.push({ sql: 'featured = ?', value: query.featured });
  const where = buildWhere(['is_published = true'], filters);
  const items = await withDb(c.env, async (db) => {
    const result = await db.query(
      `SELECT ${GALLERY_PUBLIC} FROM gallery_images WHERE ${where.sql} ORDER BY sort_order, id LIMIT $${where.params.length + 1}`,
      [...where.params, query.limit],
    );
    return result.rows;
  });
  return c.json({ items, total: items.length });
});

publicRoutes.post('/inquiries', async (c) => {
  const body = parseOrThrow(inquiryCreateSchema, await readJson(c));
  // Bots that fill the honeypot get a success response and nothing is stored.
  if (body.website) return c.json({ status: 'received' }, 201);
  if (!inquiryLimiter.allow(clientIp(c))) throw new HttpError(429, ENQUIRY_RATE_LIMIT_MESSAGE);

  await withDb(c.env, (db) =>
    db.query(
      `INSERT INTO inquiries (name, email, phone, company, service_interest, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [body.name, body.email, body.phone, body.company, body.service_interest, body.message],
    ),
  );
  return c.json({ status: 'received' }, 201);
});

export async function pagedList(
  db: Db,
  table: string,
  columns: string,
  where: Where,
  order: string,
  limit: number,
  offset: number,
) {
  const count = await db.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM ${table} WHERE ${where.sql}`,
    where.params,
  );
  const items = await db.query(
    `SELECT ${columns} FROM ${table} WHERE ${where.sql} ORDER BY ${order}
     LIMIT $${where.params.length + 1} OFFSET $${where.params.length + 2}`,
    [...where.params, limit, offset],
  );
  return { items: items.rows, total: count.rows[0].total, limit, offset };
}
