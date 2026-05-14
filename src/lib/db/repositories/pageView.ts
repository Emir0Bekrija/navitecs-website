import { query, execute } from "../pool";
import type { PageView } from "../types";

export async function create(data: { path: string; referrer: string | null }): Promise<void> {
  await execute(
    "INSERT INTO `page_views` (`path`, `referrer`, `createdAt`) VALUES (?, ?, NOW())",
    [data.path, data.referrer],
  );
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
