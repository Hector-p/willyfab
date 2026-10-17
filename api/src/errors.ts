import type { Context } from 'hono';
import type { z } from 'zod';

export interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(detail);
  }
}

export class RequestValidationError extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super('Request validation failed');
  }
}

export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  data: unknown,
  source: 'body' | 'query' | 'path' = 'body',
): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data as z.output<S>;
  throw new RequestValidationError(
    result.error.issues.map((issue) => ({
      loc: [source, ...issue.path.map((part) => (typeof part === 'number' ? part : String(part)))],
      msg: issue.message,
      type: issue.code,
    })),
  );
}

export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new RequestValidationError([{ loc: ['body'], msg: 'JSON decode error', type: 'json_invalid' }]);
  }
}

export function parseIntParam(value: string): number {
  const parsed = Number(value);
  if (value.trim() === '' || !Number.isInteger(parsed)) {
    throw new RequestValidationError([
      { loc: ['path', 'id'], msg: 'Input should be a valid integer', type: 'int_parsing' },
    ]);
  }
  return parsed;
}
