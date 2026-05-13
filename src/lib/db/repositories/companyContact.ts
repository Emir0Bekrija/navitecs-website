import { query, queryOne, execute } from "../pool";
import { generateId, buildSet } from "../helpers";
import type { CompanyContact } from "../types";

export async function findUnique(where: { id?: string; email?: string }): Promise<CompanyContact | null> {
  if (where.id) {
    return queryOne<CompanyContact>("SELECT * FROM `company_contacts` WHERE `id` = ?", [where.id]);
  }
  if (where.email) {
    return queryOne<CompanyContact>("SELECT * FROM `company_contacts` WHERE `email` = ?", [where.email]);
  }
  return null;
}

export async function upsert(
  email: string,
  updateData: Record<string, unknown>,
  createData: Record<string, unknown>,
): Promise<CompanyContact> {
  const existing = await findUnique({ email });
  if (existing) {
    const { sql, params } = buildSet(updateData, true);
    await execute(`UPDATE \`company_contacts\` SET ${sql} WHERE \`id\` = ?`, [...params, existing.id]);
    return (await findUnique({ id: existing.id }))!;
  }
  const id = generateId();
  const entries = { id, email, ...createData, createdAt: new Date(), updatedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`company_contacts\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findUnique({ id }))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<CompanyContact> {
  const { sql, params } = buildSet(data, true);
  await execute(`UPDATE \`company_contacts\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique({ id }))!;
}

export async function remove(id: string): Promise<void> {
  await execute("DELETE FROM `company_contacts` WHERE `id` = ?", [id]);
}

export async function count(where?: Record<string, unknown>): Promise<number> {
  if (!where || Object.keys(where).length === 0) {
    const rows = await query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM `company_contacts`");
    return rows[0]?.cnt ?? 0;
  }
  const conditions: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(where)) {
    if (v === null) {
      conditions.push(`\`${k}\` IS NULL`);
    } else {
      conditions.push(`\`${k}\` = ?`);
      params.push(v);
    }
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`company_contacts\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

/** Find company contacts with nested contacts, paginated. */
export async function findManyWithContacts(opts: {
  where?: {
    name?: string;
    email?: string;
    minScore?: number;
    hasScore?: string;
  };
  orderBy?: { field: string; dir: "ASC" | "DESC" };
  skip?: number;
  take?: number;
}): Promise<{ total: number; companyContacts: Record<string, unknown>[] }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (opts.where?.name) {
    conditions.push("cc.`name` LIKE ?");
    params.push("%" + opts.where.name + "%");
  }
  if (opts.where?.email) {
    conditions.push("cc.`email` LIKE ?");
    params.push("%" + opts.where.email + "%");
  }
  if (opts.where?.minScore) {
    conditions.push("cc.`score` >= ?");
    params.push(opts.where.minScore);
  }
  if (opts.where?.hasScore === "yes") {
    conditions.push("cc.`score` IS NOT NULL");
  }
  if (opts.where?.hasScore === "no") {
    conditions.push("cc.`score` IS NULL");
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  // Count
  const countRows = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM \`company_contacts\` cc ${whereClause}`,
    [...params],
  );
  const total = countRows[0]?.cnt ?? 0;

  // Fetch
  const order = opts.orderBy ? `ORDER BY cc.\`${opts.orderBy.field}\` ${opts.orderBy.dir}` : "";
  const fetchParams = [...params];
  let pagination = "";
  if (opts.take != null) {
    pagination = "LIMIT ?";
    fetchParams.push(opts.take);
    if (opts.skip) {
      pagination += " OFFSET ?";
      fetchParams.push(opts.skip);
    }
  }

  const companyContacts = await query<CompanyContact>(
    `SELECT cc.* FROM \`company_contacts\` cc ${whereClause} ${order} ${pagination}`,
    fetchParams,
  );

  if (companyContacts.length === 0) return { total, companyContacts: [] };

  const ccIds = companyContacts.map((cc) => cc.id);
  const contacts = await query<Record<string, unknown>>(
    `SELECT \`id\`, \`projectType\`, \`service\`, \`projectServices\`, \`message\`, \`submittedAt\`, \`companyContactId\`
     FROM \`contacts\`
     WHERE \`companyContactId\` IN (${ccIds.map(() => "?").join(", ")})
     ORDER BY \`submittedAt\` DESC`,
    ccIds,
  );

  const contactsByCc = new Map<string, Record<string, unknown>[]>();
  for (const c of contacts) {
    const ccId = c.companyContactId as string;
    if (!contactsByCc.has(ccId)) contactsByCc.set(ccId, []);
    contactsByCc.get(ccId)!.push(c);
  }

  return {
    total,
    companyContacts: companyContacts.map((cc) => ({
      ...cc,
      contacts: contactsByCc.get(cc.id) ?? [],
    })),
  };
}

/** Count company contacts that have stale contacts (used by stale-count). */
export async function countWithContactCondition(
  notInIds: string[],
  contactWhere: { submittedAt?: { lt?: Date } },
): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (notInIds.length > 0) {
    conditions.push(`cc.\`id\` NOT IN (${notInIds.map(() => "?").join(", ")})`);
    params.push(...notInIds);
  }

  const existsConditions: string[] = ["`companyContactId` = cc.`id`"];
  if (contactWhere.submittedAt?.lt) {
    existsConditions.push("`submittedAt` < ?");
    params.push(contactWhere.submittedAt.lt);
  }
  conditions.push(`EXISTS (SELECT 1 FROM \`contacts\` WHERE ${existsConditions.join(" AND ")})`);

  const whereClause = "WHERE " + conditions.join(" AND ");
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM \`company_contacts\` cc ${whereClause}`,
    params,
  );
  return rows[0]?.cnt ?? 0;
}

export async function findMany(opts?: {
  where?: { id?: { in?: string[] } };
  orderBy?: { field: string; dir: "ASC" | "DESC" };
}): Promise<CompanyContact[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (opts?.where?.id?.in && opts.where.id.in.length > 0) {
    conditions.push(`\`id\` IN (${opts.where.id.in.map(() => "?").join(", ")})`);
    params.push(...opts.where.id.in);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = opts?.orderBy ? `ORDER BY \`${opts.orderBy.field}\` ${opts.orderBy.dir}` : "";
  return query<CompanyContact>(`SELECT * FROM \`company_contacts\` ${whereClause} ${order}`, params);
}

export async function deleteMany(where: { id: { in: string[] } }): Promise<void> {
  if (where.id.in.length === 0) return;
  await execute(
    `DELETE FROM \`company_contacts\` WHERE \`id\` IN (${where.id.in.map(() => "?").join(", ")})`,
    where.id.in,
  );
}
