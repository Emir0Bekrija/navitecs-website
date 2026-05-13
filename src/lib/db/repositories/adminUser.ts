import { query, queryOne, execute } from "../pool";
import type { AdminUser } from "../types";

export async function findMany(select?: string[], orderBy?: { field: string; dir: "ASC" | "DESC" }): Promise<AdminUser[]> {
  const cols = select ? select.map((c) => `\`${c}\``).join(", ") : "*";
  const order = orderBy ? `ORDER BY \`${orderBy.field}\` ${orderBy.dir}` : "";
  return query<AdminUser>(`SELECT ${cols} FROM \`admin_users\` ${order}`);
}

export async function findUnique(where: { id?: number; username?: string }): Promise<AdminUser | null> {
  if (where.id !== undefined) {
    return queryOne<AdminUser>("SELECT * FROM `admin_users` WHERE `id` = ?", [where.id]);
  }
  if (where.username !== undefined) {
    return queryOne<AdminUser>("SELECT * FROM `admin_users` WHERE `username` = ?", [where.username]);
  }
  return null;
}

export async function create(data: {
  username: string;
  password: string;
  role: string;
}, select?: string[]): Promise<AdminUser> {
  await execute(
    "INSERT INTO `admin_users` (`username`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, NOW(), NOW())",
    [data.username, data.password, data.role],
  );
  const user = await findUnique({ username: data.username });
  if (!user) throw new Error("Failed to create user");
  // When select is provided, the caller only uses specific fields
  // but we return the full user from DB regardless (SQL SELECT is handled in findUnique)
  return user;
}

export async function update(id: number, data: Record<string, unknown>): Promise<AdminUser> {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      sets.push(`\`${k}\` = ?`);
      params.push(v);
    }
  }
  sets.push("`updatedAt` = NOW()");
  await execute(`UPDATE \`admin_users\` SET ${sets.join(", ")} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique({ id }))!;
}

export async function remove(id: number): Promise<void> {
  await execute("DELETE FROM `admin_users` WHERE `id` = ?", [id]);
}

export async function count(where?: { role?: string }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.role) {
    conditions.push("`role` = ?");
    params.push(where.role);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`admin_users\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}
