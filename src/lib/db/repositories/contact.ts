import { query, queryOne, execute } from "../pool";
import { generateId } from "../helpers";
import type { Contact } from "../types";

export async function create(data: Record<string, unknown>): Promise<Contact> {
  const id = generateId();
  const entries = { id, ...data, submittedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`contacts\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await queryOne<Contact>("SELECT * FROM `contacts` WHERE `id` = ?", [id]))!;
}

export async function findMany(opts?: {
  where?: {
    email?: string;
    name?: string;
    projectType?: string;
    service?: string;
    projectServices?: string;
    submittedAt?: { gte?: Date; lte?: Date; lt?: Date };
    companyContactId?: { in?: string[] };
  };
  orderBy?: { field: string; dir: "ASC" | "DESC" };
  includeCompanyContact?: boolean;
}): Promise<(Contact & { companyContact?: { id: string; score: number | null; comments: string | null } | null })[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const w = opts?.where;
  if (w?.email) {
    conditions.push("c.`email` LIKE ?");
    params.push("%" + w.email + "%");
  }
  if (w?.name) {
    conditions.push("c.`name` LIKE ?");
    params.push("%" + w.name + "%");
  }
  if (w?.projectType) {
    conditions.push("c.`projectType` = ?");
    params.push(w.projectType);
  }
  if (w?.service) {
    conditions.push("c.`service` = ?");
    params.push(w.service);
  }
  if (w?.projectServices) {
    conditions.push("c.`projectServices` LIKE ?");
    params.push("%" + w.projectServices + "%");
  }
  if (w?.submittedAt?.gte) {
    conditions.push("c.`submittedAt` >= ?");
    params.push(w.submittedAt.gte);
  }
  if (w?.submittedAt?.lte) {
    conditions.push("c.`submittedAt` <= ?");
    params.push(w.submittedAt.lte);
  }
  if (w?.submittedAt?.lt) {
    conditions.push("c.`submittedAt` < ?");
    params.push(w.submittedAt.lt);
  }
  if (w?.companyContactId?.in && w.companyContactId.in.length > 0) {
    conditions.push(`c.\`companyContactId\` IN (${w.companyContactId.in.map(() => "?").join(", ")})`);
    params.push(...w.companyContactId.in);
  }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = opts?.orderBy ? `ORDER BY c.\`${opts.orderBy.field}\` ${opts.orderBy.dir}` : "";

  if (opts?.includeCompanyContact) {
    const rows = await query<Contact & { cc_id: string | null; cc_score: number | null; cc_comments: string | null }>(
      `SELECT c.*, cc.\`id\` as cc_id, cc.\`score\` as cc_score, cc.\`comments\` as cc_comments
       FROM \`contacts\` c
       LEFT JOIN \`company_contacts\` cc ON c.\`companyContactId\` = cc.\`id\`
       ${whereClause} ${order}`,
      params,
    );
    return rows.map((r) => ({
      ...r,
      companyContact: r.cc_id ? { id: r.cc_id, score: r.cc_score, comments: r.cc_comments } : null,
    }));
  }

  return query<Contact>(`SELECT c.* FROM \`contacts\` c ${whereClause} ${order}`, params);
}

export async function count(where?: { submittedAt?: { lt?: Date } }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.submittedAt?.lt) {
    conditions.push("`submittedAt` < ?");
    params.push(where.submittedAt.lt);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`contacts\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

/** Find distinct companyContactIds from contacts matching conditions. */
export async function findDistinctCompanyContactIds(where: {
  submittedAt?: { gte?: Date };
  companyContactId?: { not?: null };
}): Promise<string[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where.submittedAt?.gte) {
    conditions.push("`submittedAt` >= ?");
    params.push(where.submittedAt.gte);
  }
  if (where.companyContactId?.not === null) {
    conditions.push("`companyContactId` IS NOT NULL");
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ companyContactId: string }>(
    `SELECT DISTINCT \`companyContactId\` FROM \`contacts\` ${whereClause}`,
    params,
  );
  return rows.map((r) => r.companyContactId);
}

export async function deleteMany(where: { id: { in: string[] } }): Promise<void> {
  if (where.id.in.length === 0) return;
  await execute(
    `DELETE FROM \`contacts\` WHERE \`id\` IN (${where.id.in.map(() => "?").join(", ")})`,
    where.id.in,
  );
}
