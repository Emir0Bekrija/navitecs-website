import { query, queryOne, execute, transaction } from "../pool";
import { buildSet, jsonSerialize } from "../helpers";
import type { Project } from "../types";

export async function findMany(where?: {
  status?: string;
}, orderBy?: { field: string; dir: "ASC" | "DESC" }, select?: string[]): Promise<Project[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.status) {
    conditions.push("`status` = ?");
    params.push(where.status);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const cols = select ? select.map((c) => `\`${c}\``).join(", ") : "*";
  const order = orderBy ? `ORDER BY \`${orderBy.field}\` ${orderBy.dir}` : "";
  const rows = await query<Project>(`SELECT ${cols} FROM \`projects\` ${whereClause} ${order}`, params);
  return rows.map(deserializeRow);
}

export async function findUnique(id: string, select?: string[]): Promise<Project | null> {
  const cols = select ? select.map((c) => `\`${c}\``).join(", ") : "*";
  const row = await queryOne<Project>(`SELECT ${cols} FROM \`projects\` WHERE \`id\` = ?`, [id]);
  return row ? deserializeRow(row) : null;
}

export async function count(where?: { id?: { startsWith?: string } }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.id?.startsWith) {
    conditions.push("`id` LIKE ?");
    params.push(where.id.startsWith + "%");
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`projects\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

const JSON_FIELDS = new Set(["scopeOfWork", "toolsAndTech", "results", "valueDelivered", "media", "contentBlocks"]);

/** Parse JSON string fields that the mariadb driver may return as raw strings. */
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

function serializeData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = JSON_FIELDS.has(k) ? jsonSerialize(v) : v;
  }
  return out;
}

export async function create(data: Record<string, unknown>): Promise<Project> {
  const serialized = serializeData(data);
  const entries = { ...serialized, createdAt: new Date(), updatedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`projects\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findUnique(data.id as string))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<Project> {
  const serialized = serializeData(data);
  const { sql, params } = buildSet(serialized, true);
  await execute(`UPDATE \`projects\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique(id))!;
}

export async function remove(id: string): Promise<void> {
  await execute("DELETE FROM `projects` WHERE `id` = ?", [id]);
}

export async function aggregateMaxOrder(): Promise<number> {
  const rows = await query<{ max_order: number | null }>(
    "SELECT MAX(`order`) as max_order FROM `projects`",
  );
  return rows[0]?.max_order ?? 0;
}

export async function updateManyDecrement(orderGt: number): Promise<void> {
  await execute(
    "UPDATE `projects` SET `order` = `order` - 1, `updatedAt` = NOW() WHERE `order` > ?",
    [orderGt],
  );
}

export async function reorder(ids: string[]): Promise<void> {
  await transaction(async (conn) => {
    for (let i = 0; i < ids.length; i++) {
      await conn.query(
        "UPDATE `projects` SET `order` = ?, `updatedAt` = NOW() WHERE `id` = ?",
        [i, ids[i]],
      );
    }
  });
}
