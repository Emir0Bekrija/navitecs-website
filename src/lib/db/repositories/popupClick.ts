import { query, execute } from "../pool";
import type { PopupClick } from "../types";

export async function create(data: { linkUrl: string; linkTitle: string | null }): Promise<void> {
  await execute(
    "INSERT INTO `popup_clicks` (`linkUrl`, `linkTitle`, `createdAt`) VALUES (?, ?, NOW())",
    [data.linkUrl, data.linkTitle],
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
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`popup_clicks\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

export async function findMany(where?: { createdAt?: { gte?: Date; lte?: Date } }): Promise<PopupClick[]> {
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
  return query<PopupClick>(`SELECT * FROM \`popup_clicks\` ${whereClause}`, params);
}
