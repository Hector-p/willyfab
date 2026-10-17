import pg from 'pg';
import type { Env } from './env.ts';

// Keep DATE columns as "YYYY-MM-DD" strings, matching the Python API output.
pg.types.setTypeParser(1082, (value: string) => value);

export type Db = pg.Client;

export async function withDb<T>(env: Env, work: (db: Db) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
