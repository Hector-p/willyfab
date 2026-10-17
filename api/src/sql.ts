export interface Filter {
  sql: string;
  value: unknown;
}

export interface Where {
  sql: string;
  params: unknown[];
}

/** Builds a WHERE clause from fixed conditions plus `?` placeholders bound to values, numbered for pg. */
export function buildWhere(base: string[], filters: Filter[]): Where {
  const params: unknown[] = [];
  const clauses = [...base];
  for (const filter of filters) {
    params.push(filter.value);
    clauses.push(filter.sql.replace('?', `$${params.length}`));
  }
  return { sql: clauses.join(' AND '), params };
}
