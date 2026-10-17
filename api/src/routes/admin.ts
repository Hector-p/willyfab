import { Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin } from '../auth.ts';
import {
  BOARD_ADMIN,
  GALLERY_ADMIN,
  INQUIRY_ADMIN,
  PROJECT_ADMIN,
  SERVICE_ADMIN,
} from '../columns.ts';
import { withDb, isUniqueViolation, type Db } from '../db.ts';
import { HttpError, parseIntParam, parseOrThrow, readJson, RequestValidationError } from '../errors.ts';
import { loadConfig, type AppEnv, type Env } from '../env.ts';
import {
  boardMemberWriteSchema,
  galleryReorderSchema,
  galleryWriteSchema,
  inquiryStatusQuery,
  inquiryStatusUpdateSchema,
  intQuery,
  offsetQuery,
  projectWriteSchema,
  serviceWriteSchema,
} from '../schemas.ts';
import { deleteStoredObject, storageKeyForUrl, storeImage, UploadRejected } from '../storage.ts';
import { buildWhere, type Filter } from '../sql.ts';
import { pagedList } from './public.ts';

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use('*', requireAdmin);

interface CrudResource {
  path: string;
  table: string;
  label: string;
  columns: string;
  schema: z.ZodType;
  order: string;
  slugConflict?: string;
  /** Gallery images own their stored upload, so updates and deletes may remove it. */
  ownsUpload?: boolean;
}

const crudResources: CrudResource[] = [
  {
    path: 'services',
    table: 'services',
    label: 'Service',
    columns: SERVICE_ADMIN,
    schema: serviceWriteSchema,
    order: 'sort_order, id',
    slugConflict: 'A service with this slug already exists',
  },
  {
    path: 'projects',
    table: 'projects',
    label: 'Project',
    columns: PROJECT_ADMIN,
    schema: projectWriteSchema,
    order: 'sort_order, id',
    slugConflict: 'A project with this slug already exists',
  },
  {
    path: 'board-members',
    table: 'board_members',
    label: 'Board member',
    columns: BOARD_ADMIN,
    schema: boardMemberWriteSchema,
    order: 'sort_order, id',
  },
  {
    path: 'gallery',
    table: 'gallery_images',
    label: 'Gallery image',
    columns: GALLERY_ADMIN,
    schema: galleryWriteSchema,
    order: 'sort_order, id',
    ownsUpload: true,
  },
];

for (const resource of crudResources) {
  registerCrud(resource);
}

function registerCrud(resource: CrudResource): void {
  const base = `/${resource.path}`;

  adminRoutes.get(base, async (c) => {
    const result = await withDb(c.env, (db) =>
      db.query(`SELECT ${resource.columns} FROM ${resource.table} ORDER BY ${resource.order}`),
    );
    return c.json({ items: result.rows, total: result.rowCount ?? result.rows.length });
  });

  adminRoutes.post(base, async (c) => {
    const data = parseOrThrow(resource.schema, await readJson(c)) as Record<string, unknown>;
    const row = await withDb(c.env, (db) => insertRow(db, resource, data)).catch(conflictOr(resource));
    return c.json(row, 201);
  });

  adminRoutes.put(`${base}/:id`, async (c) => {
    const id = parseIntParam(c.req.param('id'));
    const data = parseOrThrow(resource.schema, await readJson(c)) as Record<string, unknown>;
    const row = await withDb(c.env, (db) => updateRow(c.env, db, resource, id, data)).catch(conflictOr(resource));
    return c.json(row);
  });

  adminRoutes.delete(`${base}/:id`, async (c) => {
    const id = parseIntParam(c.req.param('id'));
    await withDb(c.env, (db) => deleteRow(c.env, db, resource, id));
    return c.body(null, 204);
  });
}

function conflictOr(resource: CrudResource) {
  return (error: unknown): never => {
    if (resource.slugConflict && isUniqueViolation(error)) {
      throw new HttpError(409, resource.slugConflict);
    }
    throw error;
  };
}

async function insertRow(db: Db, resource: CrudResource, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const result = await db.query(
    `INSERT INTO ${resource.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${resource.columns}`,
    keys.map((key) => data[key]),
  );
  return result.rows[0];
}

async function updateRow(
  env: Env,
  db: Db,
  resource: CrudResource,
  id: number,
  data: Record<string, unknown>,
) {
  const previous = resource.ownsUpload
    ? await db.query<{ image_url: string | null }>(`SELECT image_url FROM ${resource.table} WHERE id = $1`, [id])
    : null;
  if (previous && !previous.rows[0]) throw new HttpError(404, `${resource.label} not found`);
  const previousUrl = previous?.rows[0].image_url ?? null;

  const keys = Object.keys(data);
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
  const result = await db.query(
    `UPDATE ${resource.table} SET ${assignments.join(', ')}, updated_at = now()
     WHERE id = $${keys.length + 1} RETURNING ${resource.columns}`,
    [...keys.map((key) => data[key]), id],
  );
  if (!result.rows[0]) throw new HttpError(404, `${resource.label} not found`);

  if (resource.ownsUpload && previousUrl !== result.rows[0].image_url) {
    await removeUnreferencedUpload(env, db, previousUrl);
  }
  return result.rows[0];
}

async function deleteRow(env: Env, db: Db, resource: CrudResource, id: number): Promise<void> {
  const returning = resource.ownsUpload ? 'image_url' : 'id';
  const result = await db.query<{ image_url?: string | null }>(
    `DELETE FROM ${resource.table} WHERE id = $1 RETURNING ${returning}`,
    [id],
  );
  if (!result.rows[0]) throw new HttpError(404, `${resource.label} not found`);
  if (resource.ownsUpload) {
    await removeUnreferencedUpload(env, db, result.rows[0].image_url ?? null);
  }
}

/** Deletes a stored upload once no project, board member or gallery image still uses its URL. */
async function removeUnreferencedUpload(env: Env, db: Db, url: string | null): Promise<void> {
  if (!url) return;
  const key = storageKeyForUrl(url, loadConfig(env).r2PublicBaseUrl);
  if (key === null) return;

  for (const table of ['projects', 'board_members', 'gallery_images']) {
    const reference = await db.query(`SELECT 1 FROM ${table} WHERE image_url = $1 LIMIT 1`, [url]);
    if (reference.rowCount) return;
  }
  try {
    await deleteStoredObject(env.MEDIA, key);
  } catch (error) {
    console.warn(`Could not remove stored image ${key}`, error);
  }
}

adminRoutes.post('/gallery/reorder', async (c) => {
  const body = parseOrThrow(galleryReorderSchema, await readJson(c));
  const items = await withDb(c.env, async (db) => {
    const found = await db.query('SELECT id FROM gallery_images WHERE id = ANY($1::int[])', [body.ids]);
    if (found.rowCount !== body.ids.length) {
      throw new HttpError(404, 'Some gallery images were not found');
    }
    await db.query(
      `UPDATE gallery_images AS g
       SET sort_order = (o.pos - 1) * 10, updated_at = now()
       FROM unnest($1::int[]) WITH ORDINALITY AS o(id, pos)
       WHERE g.id = o.id`,
      [body.ids],
    );
    const result = await db.query(
      `SELECT ${GALLERY_ADMIN} FROM gallery_images ORDER BY sort_order, id`,
    );
    return result.rows;
  });
  return c.json({ items, total: items.length });
});

adminRoutes.get('/inquiries', async (c) => {
  const query = parseOrThrow(
    z.object({
      limit: intQuery(1, 100, 25),
      offset: offsetQuery(),
      status: inquiryStatusQuery(),
    }),
    c.req.query(),
    'query',
  );
  const filters: Filter[] = [];
  if (query.status) filters.push({ sql: 'status = ?', value: query.status });
  const where = buildWhere(['true'], filters);
  return withDb(c.env, async (db) =>
    c.json(await pagedList(db, 'inquiries', INQUIRY_ADMIN, where, 'created_at DESC, id DESC', query.limit, query.offset)),
  );
});

adminRoutes.patch('/inquiries/:id', async (c) => {
  const id = parseIntParam(c.req.param('id'));
  const body = parseOrThrow(inquiryStatusUpdateSchema, await readJson(c));
  const row = await withDb(c.env, async (db) => {
    const result = await db.query(
      `UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING ${INQUIRY_ADMIN}`,
      [body.status, id],
    );
    return result.rows[0];
  });
  if (!row) throw new HttpError(404, 'Inquiry not found');
  return c.json(row);
});

adminRoutes.post('/uploads', async (c) => {
  const form: Record<string, unknown> = await c.req.parseBody().catch(() => ({}));
  const file = form['file'];
  if (!(file instanceof File)) {
    throw new RequestValidationError([{ loc: ['body', 'file'], msg: 'Field required', type: 'missing' }]);
  }

  const config = loadConfig(c.env);
  if (!c.env.MEDIA || !config.r2PublicBaseUrl) {
    throw new HttpError(503, 'Image storage is not configured');
  }
  try {
    const stored = await storeImage(file, c.env.MEDIA, config.r2PublicBaseUrl, config.maxUploadBytes);
    return c.json(stored, 201);
  } catch (error) {
    if (error instanceof UploadRejected) throw new HttpError(422, error.message);
    throw error;
  }
});
