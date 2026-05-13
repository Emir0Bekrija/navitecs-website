import { query, execute } from "../pool";
import { jsonSerialize } from "../helpers";
import type { AuditLog } from "../types";

export async function create(data: {
  action: string;
  userId: number | null;
  username: string | null;
  ip: string | null;
  metadata?: unknown;
}): Promise<void> {
  await execute(
    "INSERT INTO `audit_logs` (`action`, `userId`, `username`, `ip`, `metadata`, `createdAt`) VALUES (?, ?, ?, ?, ?, NOW())",
    [data.action, data.userId, data.username, data.ip, jsonSerialize(data.metadata ?? null)],
  );
}

export async function findMany(opts: {
  where?: { action?: string };
  orderBy?: { field: string; dir: "ASC" | "DESC" };
  skip?: number;
  take?: number;
}): Promise<AuditLog[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (opts.where?.action) {
    conditions.push("`action` LIKE ?");
    params.push("%" + opts.where.action + "%");
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = opts.orderBy ? `ORDER BY \`${opts.orderBy.field}\` ${opts.orderBy.dir}` : "";
  let pagination = "";
  if (opts.take != null) {
    pagination = opts.skip ? `LIMIT ? OFFSET ?` : `LIMIT ?`;
    params.push(opts.take);
    if (opts.skip) params.push(opts.skip);
  }
  return query<AuditLog>(
    `SELECT \`id\`, \`action\`, \`ip\`, \`username\`, \`userId\`, \`metadata\`, \`createdAt\` FROM \`audit_logs\` ${whereClause} ${order} ${pagination}`,
    params,
  );
}

export async function count(where?: { action?: string }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.action) {
    conditions.push("`action` LIKE ?");
    params.push("%" + where.action + "%");
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`audit_logs\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}
