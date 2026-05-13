/**
 * SQL builder utilities for parameterized queries.
 * All outputs use `?` placeholders — never interpolates user values.
 */

export type WhereCondition = {
  field: string;
  op: "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE" | "IS NULL" | "IS NOT NULL" | "IN" | "NOT IN";
  value?: unknown;
};

/** Build a WHERE clause from conditions. Returns { sql, params }. */
export function buildWhere(conditions: WhereCondition[]): { sql: string; params: unknown[] } {
  if (conditions.length === 0) return { sql: "", params: [] };

  const parts: string[] = [];
  const params: unknown[] = [];

  for (const c of conditions) {
    if (c.op === "IS NULL") {
      parts.push(`\`${c.field}\` IS NULL`);
    } else if (c.op === "IS NOT NULL") {
      parts.push(`\`${c.field}\` IS NOT NULL`);
    } else if (c.op === "IN" || c.op === "NOT IN") {
      const arr = c.value as unknown[];
      if (arr.length === 0) {
        // IN with empty array: always false; NOT IN with empty: always true
        parts.push(c.op === "IN" ? "0 = 1" : "1 = 1");
      } else {
        parts.push(`\`${c.field}\` ${c.op} (${arr.map(() => "?").join(", ")})`);
        params.push(...arr);
      }
    } else if (c.op === "LIKE") {
      parts.push(`\`${c.field}\` LIKE ?`);
      params.push(c.value);
    } else {
      parts.push(`\`${c.field}\` ${c.op} ?`);
      params.push(c.value);
    }
  }

  return { sql: "WHERE " + parts.join(" AND "), params };
}

/** Build ORDER BY clause. */
export function buildOrderBy(
  orders: { field: string; dir: "ASC" | "DESC" }[],
): string {
  if (orders.length === 0) return "";
  return "ORDER BY " + orders.map((o) => `\`${o.field}\` ${o.dir}`).join(", ");
}

/** Build LIMIT/OFFSET clause. Returns { sql, params }. */
export function buildPagination(
  skip?: number,
  take?: number,
): { sql: string; params: unknown[] } {
  if (take == null) return { sql: "", params: [] };
  if (skip) {
    return { sql: "LIMIT ? OFFSET ?", params: [take, skip] };
  }
  return { sql: "LIMIT ?", params: [take] };
}

/** Generate a CUID-like ID using crypto.randomUUID(). Fits VarChar(36). */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Build SET clause for UPDATE from a data object. Auto-adds updatedAt if hasUpdatedAt is true. */
export function buildSet(
  data: Record<string, unknown>,
  hasUpdatedAt: boolean,
): { sql: string; params: unknown[] } {
  const entries = Object.entries(data);
  const parts: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of entries) {
    if (value !== undefined) {
      parts.push(`\`${key}\` = ?`);
      params.push(value === null ? null : value);
    }
  }

  if (hasUpdatedAt && !data.updatedAt) {
    parts.push("`updatedAt` = NOW()");
  }

  return { sql: parts.join(", "), params };
}

/** Build INSERT columns and VALUES placeholders from a data object. */
export function buildInsert(
  data: Record<string, unknown>,
): { columns: string; placeholders: string; params: unknown[] } {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const columns = entries.map(([k]) => `\`${k}\``).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  const params = entries.map(([, v]) => (v === null ? null : v));
  return { columns, placeholders, params };
}

/** Serialize a value for JSON columns (arrays/objects). */
export function jsonSerialize(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}
