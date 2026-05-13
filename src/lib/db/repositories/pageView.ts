import { query, queryOne, execute } from "../pool";
import type { PageView } from "../types";

export async function create(data: { path: string; referrer: string | null; country: string | null }): Promise<{ id: number }> {
  const { insertId } = await execute(
    "INSERT INTO `page_views` (`path`, `referrer`, `country`, `createdAt`) VALUES (?, ?, ?, NOW())",
    [data.path, data.referrer, data.country],
  );
  return { id: insertId };
}

export async function update(id: number, data: { duration: number }): Promise<void> {
  await execute("UPDATE `page_views` SET `duration` = ? WHERE `id` = ?", [data.duration, id]);
}

export async function count(where?: { createdAt?: { gte?: Date } }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.createdAt?.gte) {
    conditions.push("`createdAt` >= ?");
    params.push(where.createdAt.gte);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`page_views\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

export async function findMany(where?: {
  createdAt?: { gte?: Date; lte?: Date };
}): Promise<PageView[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.createdAt?.gte) {
    conditions.push("`createdAt` >= ?");
    params.push(where.createdAt.gte);
  }
  if (where?.createdAt?.lte) {
    conditions.push("`createdAt` <= ?");
    params.push(where.createdAt.lte);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  return query<PageView>(`SELECT * FROM \`page_views\` ${whereClause}`, params);
}

export async function aggregateAvgDuration(where?: {
  createdAt?: { gte?: Date; lte?: Date };
}): Promise<number | null> {
  const conditions: string[] = ["`duration` IS NOT NULL"];
  const params: unknown[] = [];
  if (where?.createdAt?.gte) {
    conditions.push("`createdAt` >= ?");
    params.push(where.createdAt.gte);
  }
  if (where?.createdAt?.lte) {
    conditions.push("`createdAt` <= ?");
    params.push(where.createdAt.lte);
  }
  const whereClause = "WHERE " + conditions.join(" AND ");
  const rows = await query<{ avg_dur: number | null }>(
    `SELECT AVG(\`duration\`) as avg_dur FROM \`page_views\` ${whereClause}`,
    params,
  );
  return rows[0]?.avg_dur ?? null;
}
