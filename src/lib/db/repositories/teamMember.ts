import { query, queryOne, execute, transaction } from "../pool";
import { generateId, buildSet } from "../helpers";
import type { TeamMember } from "../types";

export async function findMany(where?: {
  active?: boolean;
  featured?: boolean;
}, orderBy?: { field: string; dir: "ASC" | "DESC" }): Promise<TeamMember[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.active !== undefined) {
    conditions.push("`active` = ?");
    params.push(where.active);
  }
  if (where?.featured !== undefined) {
    conditions.push("`featured` = ?");
    params.push(where.featured);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = orderBy ? `ORDER BY \`${orderBy.field}\` ${orderBy.dir}` : "";
  return query<TeamMember>(`SELECT * FROM \`team_members\` ${whereClause} ${order}`, params);
}

export async function findUnique(id: string): Promise<TeamMember | null> {
  return queryOne<TeamMember>("SELECT * FROM `team_members` WHERE `id` = ?", [id]);
}

export async function create(data: Record<string, unknown>): Promise<TeamMember> {
  const id = generateId();
  const entries = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`team_members\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findUnique(id))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<TeamMember> {
  const { sql, params } = buildSet(data, true);
  await execute(`UPDATE \`team_members\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique(id))!;
}

export async function remove(id: string): Promise<void> {
  await execute("DELETE FROM `team_members` WHERE `id` = ?", [id]);
}

export async function aggregateMaxOrder(): Promise<number> {
  const rows = await query<{ max_order: number | null }>(
    "SELECT MAX(`order`) as max_order FROM `team_members`",
  );
  return rows[0]?.max_order ?? 0;
}

export async function updateManyDecrement(orderGt: number): Promise<void> {
  await execute(
    "UPDATE `team_members` SET `order` = `order` - 1, `updatedAt` = NOW() WHERE `order` > ?",
    [orderGt],
  );
}

export async function reorder(ids: string[]): Promise<void> {
  await transaction(async (conn) => {
    for (let i = 0; i < ids.length; i++) {
      await conn.query(
        "UPDATE `team_members` SET `order` = ?, `updatedAt` = NOW() WHERE `id` = ?",
        [i, ids[i]],
      );
    }
  });
}
