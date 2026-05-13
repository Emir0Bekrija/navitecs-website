import { query, queryOne, execute } from "../pool";
import { generateId } from "../helpers";
import type { AdminSession } from "../types";

export type SessionWithUser = AdminSession & {
  user: { id: number; username: string; role: string };
};

export async function findUniqueWithUser(tokenHash: string): Promise<SessionWithUser | null> {
  const row = await queryOne<AdminSession & { user_id: number; user_username: string; user_role: string }>(
    `SELECT s.*, u.id as user_id, u.username as user_username, u.role as user_role
     FROM \`admin_sessions\` s
     LEFT JOIN \`admin_users\` u ON s.userId = u.id
     WHERE s.tokenHash = ?`,
    [tokenHash],
  );
  if (!row) return null;
  return {
    ...row,
    user: { id: row.user_id, username: row.user_username, role: row.user_role },
  };
}

export async function findMany(where?: {
  expiresAt?: { gt?: Date };
}, orderBy?: { field: string; dir: "ASC" | "DESC" }): Promise<SessionWithUser[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.expiresAt?.gt) {
    conditions.push("s.`expiresAt` > ?");
    params.push(where.expiresAt.gt);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = orderBy ? `ORDER BY s.\`${orderBy.field}\` ${orderBy.dir}` : "";
  const rows = await query<AdminSession & { user_id: number; user_username: string; user_role: string }>(
    `SELECT s.*, u.id as user_id, u.username as user_username, u.role as user_role
     FROM \`admin_sessions\` s
     LEFT JOIN \`admin_users\` u ON s.userId = u.id
     ${whereClause} ${order}`,
    params,
  );
  return rows.map((row) => ({
    ...row,
    user: { id: row.user_id, username: row.user_username, role: row.user_role },
  }));
}

export async function create(data: {
  userId: number;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}): Promise<void> {
  const id = generateId();
  await execute(
    `INSERT INTO \`admin_sessions\` (\`id\`, \`userId\`, \`tokenHash\`, \`ip\`, \`userAgent\`, \`expiresAt\`, \`absoluteExpiresAt\`, \`createdAt\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [id, data.userId, data.tokenHash, data.ip, data.userAgent, data.expiresAt, data.absoluteExpiresAt],
  );
}

export async function update(tokenHash: string, data: { expiresAt: Date }): Promise<void> {
  await execute(
    "UPDATE `admin_sessions` SET `expiresAt` = ? WHERE `tokenHash` = ?",
    [data.expiresAt, tokenHash],
  );
}

export async function remove(tokenHash: string): Promise<void> {
  await execute("DELETE FROM `admin_sessions` WHERE `tokenHash` = ?", [tokenHash]);
}

export async function removeById(id: string): Promise<void> {
  await execute("DELETE FROM `admin_sessions` WHERE `id` = ?", [id]);
}

export async function removeByUserId(userId: number): Promise<void> {
  await execute("DELETE FROM `admin_sessions` WHERE `userId` = ?", [userId]);
}

export async function removeAllExcept(exceptId: string): Promise<void> {
  await execute("DELETE FROM `admin_sessions` WHERE `id` != ?", [exceptId]);
}
