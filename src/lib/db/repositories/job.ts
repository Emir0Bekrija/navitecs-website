import { query, queryOne, execute, transaction } from "../pool";
import { generateId, buildSet, jsonSerialize } from "../helpers";
import type { Job } from "../types";

const JSON_FIELDS = new Set(["requirements"]);

function deserializeRow<T>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const out = { ...row } as Record<string, unknown>;
  for (const field of JSON_FIELDS) {
    if (field in out && typeof out[field] === "string") {
      try { out[field] = JSON.parse(out[field] as string); } catch { /* leave as-is */ }
    }
  }
  return out as T;
}

export async function findMany(where?: {
  active?: boolean;
  isGeneral?: boolean;
}, orderBy?: { field: string; dir: "ASC" | "DESC" }, select?: string[]): Promise<Job[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.active !== undefined) {
    conditions.push("`active` = ?");
    params.push(where.active);
  }
  if (where?.isGeneral !== undefined) {
    conditions.push("`isGeneral` = ?");
    params.push(where.isGeneral);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const cols = select ? select.map((c) => `\`${c}\``).join(", ") : "*";
  const order = orderBy ? `ORDER BY \`${orderBy.field}\` ${orderBy.dir}` : "";
  const rows = await query<Job>(`SELECT ${cols} FROM \`jobs\` ${whereClause} ${order}`, params);
  return rows.map(deserializeRow);
}

export async function findFirst(where: {
  isGeneral?: boolean;
  active?: boolean;
}): Promise<Job | null> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where.isGeneral !== undefined) {
    conditions.push("`isGeneral` = ?");
    params.push(where.isGeneral);
  }
  if (where.active !== undefined) {
    conditions.push("`active` = ?");
    params.push(where.active);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const row = await queryOne<Job>(`SELECT * FROM \`jobs\` ${whereClause} LIMIT 1`, params);
  return row ? deserializeRow(row) : null;
}

export async function findUnique(id: string, select?: string[]): Promise<Job | null> {
  const cols = select ? select.map((c) => `\`${c}\``).join(", ") : "*";
  const row = await queryOne<Job>(`SELECT ${cols} FROM \`jobs\` WHERE \`id\` = ?`, [id]);
  return row ? deserializeRow(row) : null;
}

export async function create(data: Record<string, unknown>): Promise<Job> {
  const id = data.id as string | undefined || generateId();
  const serialized = { ...data, id };
  if ("requirements" in serialized) {
    serialized.requirements = jsonSerialize(serialized.requirements);
  }
  const entries = { ...serialized, createdAt: new Date(), updatedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`jobs\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findUnique(id))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<Job> {
  const serialized = { ...data };
  if ("requirements" in serialized) {
    serialized.requirements = jsonSerialize(serialized.requirements);
  }
  const { sql, params } = buildSet(serialized, true);
  await execute(`UPDATE \`jobs\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique(id))!;
}

export async function remove(id: string): Promise<void> {
  await execute("DELETE FROM `jobs` WHERE `id` = ?", [id]);
}

export async function count(where?: { active?: boolean }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.active !== undefined) {
    conditions.push("`active` = ?");
    params.push(where.active);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`jobs\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

export async function aggregateMaxOrder(): Promise<number> {
  const rows = await query<{ max_order: number | null }>(
    "SELECT MAX(`order`) as max_order FROM `jobs`",
  );
  return rows[0]?.max_order ?? 0;
}

export async function updateManyDecrement(orderGt: number): Promise<void> {
  await execute(
    "UPDATE `jobs` SET `order` = `order` - 1, `updatedAt` = NOW() WHERE `order` > ?",
    [orderGt],
  );
}

export async function reorder(ids: string[]): Promise<void> {
  await transaction(async (conn) => {
    for (let i = 0; i < ids.length; i++) {
      await conn.query(
        "UPDATE `jobs` SET `order` = ?, `updatedAt` = NOW() WHERE `id` = ?",
        [i, ids[i]],
      );
    }
  });
}
