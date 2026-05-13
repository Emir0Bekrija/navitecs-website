import { query, queryOne, execute } from "../pool";
import { generateId, buildSet } from "../helpers";
import type { Applicant } from "../types";

export async function findUnique(where: { id?: string; email?: string }): Promise<Applicant | null> {
  if (where.id) {
    return queryOne<Applicant>("SELECT * FROM `applicants` WHERE `id` = ?", [where.id]);
  }
  if (where.email) {
    return queryOne<Applicant>("SELECT * FROM `applicants` WHERE `email` = ?", [where.email]);
  }
  return null;
}

export async function upsert(
  email: string,
  updateData: Record<string, unknown>,
  createData: Record<string, unknown>,
): Promise<Applicant> {
  const existing = await findUnique({ email });
  if (existing) {
    const { sql, params } = buildSet(updateData, true);
    await execute(`UPDATE \`applicants\` SET ${sql} WHERE \`id\` = ?`, [...params, existing.id]);
    return (await findUnique({ id: existing.id }))!;
  }
  const id = generateId();
  const entries = { id, email, ...createData, createdAt: new Date(), updatedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`applicants\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findUnique({ id }))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<Applicant> {
  const { sql, params } = buildSet(data, true);
  await execute(`UPDATE \`applicants\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique({ id }))!;
}

export async function remove(id: string): Promise<void> {
  await execute("DELETE FROM `applicants` WHERE `id` = ?", [id]);
}

export async function count(where?: Record<string, unknown>): Promise<number> {
  if (!where || Object.keys(where).length === 0) {
    const rows = await query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM `applicants`");
    return rows[0]?.cnt ?? 0;
  }
  // For complex where conditions, build dynamically
  const conditions: string[] = [];
  const params: unknown[] = [];
  // Simple field conditions
  for (const [k, v] of Object.entries(where)) {
    if (v === null) {
      conditions.push(`\`${k}\` IS NULL`);
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const ops = v as Record<string, unknown>;
      if ("notIn" in ops) {
        const arr = ops.notIn as unknown[];
        if (arr.length > 0) {
          conditions.push(`\`${k}\` NOT IN (${arr.map(() => "?").join(", ")})`);
          params.push(...arr);
        }
      }
    } else {
      conditions.push(`\`${k}\` = ?`);
      params.push(v);
    }
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`applicants\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

/**
 * Count applicants that have at least one application matching conditions.
 * Used by stale-count endpoint.
 */
export async function countWithApplicationCondition(
  applicantWhere: { notInIds?: string[] },
  applicationWhere: { submittedAt?: { lt?: Date } },
): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (applicantWhere.notInIds && applicantWhere.notInIds.length > 0) {
    conditions.push(`a.\`id\` NOT IN (${applicantWhere.notInIds.map(() => "?").join(", ")})`);
    params.push(...applicantWhere.notInIds);
  }

  const appConditions: string[] = [];
  if (applicationWhere.submittedAt?.lt) {
    appConditions.push("`submittedAt` < ?");
    params.push(applicationWhere.submittedAt.lt);
  }

  const appWhere = appConditions.length ? "WHERE " + appConditions.join(" AND ") : "";
  conditions.push(`EXISTS (SELECT 1 FROM \`applications\` WHERE \`applicantId\` = a.\`id\` ${appWhere ? "AND " + appConditions.join(" AND ") : ""})`);

  // Re-add appConditions params were already added above, need to remove the duplicate
  // Actually let me rebuild this cleanly
  const finalConditions: string[] = [];
  const finalParams: unknown[] = [];

  if (applicantWhere.notInIds && applicantWhere.notInIds.length > 0) {
    finalConditions.push(`a.\`id\` NOT IN (${applicantWhere.notInIds.map(() => "?").join(", ")})`);
    finalParams.push(...applicantWhere.notInIds);
  }

  const existsConditions: string[] = ["`applicantId` = a.`id`"];
  if (applicationWhere.submittedAt?.lt) {
    existsConditions.push("`submittedAt` < ?");
    finalParams.push(applicationWhere.submittedAt.lt);
  }
  finalConditions.push(`EXISTS (SELECT 1 FROM \`applications\` WHERE ${existsConditions.join(" AND ")})`);

  const whereClause = "WHERE " + finalConditions.join(" AND ");
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM \`applicants\` a ${whereClause}`,
    finalParams,
  );
  return rows[0]?.cnt ?? 0;
}

/** Find applicants with application count and nested applications+jobs. */
export async function findManyWithApplications(opts: {
  where?: {
    minScore?: number;
    fitsRoles?: string;
    createdAt?: { gte?: Date; lte?: Date };
  };
  orderBy?: { field: string; dir: "ASC" | "DESC" };
  skip?: number;
  take?: number;
}): Promise<{
  total: number;
  applicants: (Applicant & {
    _count: { applications: number };
    applications: (Record<string, unknown> & { job: { id: string; title: string } | null })[];
  })[];
}> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.where?.minScore) {
    conditions.push("`score` >= ?");
    params.push(opts.where.minScore);
  }
  if (opts.where?.fitsRoles) {
    conditions.push("`fitsRoles` LIKE ?");
    params.push("%" + opts.where.fitsRoles + "%");
  }
  if (opts.where?.createdAt?.gte) {
    conditions.push("`createdAt` >= ?");
    params.push(opts.where.createdAt.gte);
  }
  if (opts.where?.createdAt?.lte) {
    conditions.push("`createdAt` <= ?");
    params.push(opts.where.createdAt.lte);
  }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  // Count
  const countParams = [...params];
  const countRows = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM \`applicants\` ${whereClause}`,
    countParams,
  );
  const total = countRows[0]?.cnt ?? 0;

  // Fetch applicants
  const order = opts.orderBy ? `ORDER BY \`${opts.orderBy.field}\` ${opts.orderBy.dir}` : "";
  const paginationParts: string[] = [];
  const fetchParams = [...params];
  if (opts.take != null) {
    paginationParts.push("LIMIT ?");
    fetchParams.push(opts.take);
  }
  if (opts.skip) {
    paginationParts.push("OFFSET ?");
    fetchParams.push(opts.skip);
  }
  const pagination = paginationParts.join(" ");

  const applicants = await query<Applicant>(
    `SELECT * FROM \`applicants\` ${whereClause} ${order} ${pagination}`,
    fetchParams,
  );

  if (applicants.length === 0) return { total, applicants: [] };

  const applicantIds = applicants.map((a) => a.id);

  // Fetch application counts
  const countByApplicant = await query<{ applicantId: string; cnt: number }>(
    `SELECT \`applicantId\`, COUNT(*) as cnt FROM \`applications\` WHERE \`applicantId\` IN (${applicantIds.map(() => "?").join(", ")}) GROUP BY \`applicantId\``,
    applicantIds,
  );
  const countMap = new Map(countByApplicant.map((r) => [r.applicantId, r.cnt]));

  // Fetch applications with job info
  const apps = await query<Record<string, unknown>>(
    `SELECT app.*, j.id as job_id, j.title as job_title
     FROM \`applications\` app
     LEFT JOIN \`jobs\` j ON app.jobId = j.id
     WHERE app.\`applicantId\` IN (${applicantIds.map(() => "?").join(", ")})
     ORDER BY app.\`submittedAt\` DESC`,
    applicantIds,
  );

  const appsByApplicant = new Map<string, (Record<string, unknown> & { job: { id: string; title: string } | null })[]>();
  for (const app of apps) {
    const aid = app.applicantId as string;
    if (!appsByApplicant.has(aid)) appsByApplicant.set(aid, []);
    appsByApplicant.get(aid)!.push({
      ...app,
      job: app.job_id ? { id: app.job_id as string, title: app.job_title as string } : null,
    });
  }

  const result = applicants.map((a) => ({
    ...a,
    _count: { applications: countMap.get(a.id) ?? 0 },
    applications: appsByApplicant.get(a.id) ?? [],
  }));

  return { total, applicants: result };
}

/** Find applicant IDs with distinct applicantId from applications. */
export async function findDistinctApplicantIds(where: {
  submittedAt?: { gte?: Date };
  applicantId?: { not?: null };
}): Promise<string[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where.submittedAt?.gte) {
    conditions.push("`submittedAt` >= ?");
    params.push(where.submittedAt.gte);
  }
  if (where.applicantId?.not === null) {
    conditions.push("`applicantId` IS NOT NULL");
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ applicantId: string }>(
    `SELECT DISTINCT \`applicantId\` FROM \`applications\` ${whereClause}`,
    params,
  );
  return rows.map((r) => r.applicantId);
}

export async function findMany(opts?: {
  where?: { id?: { in?: string[] } };
  orderBy?: { field: string; dir: "ASC" | "DESC" };
}): Promise<Applicant[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (opts?.where?.id?.in && opts.where.id.in.length > 0) {
    conditions.push(`\`id\` IN (${opts.where.id.in.map(() => "?").join(", ")})`);
    params.push(...opts.where.id.in);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = opts?.orderBy ? `ORDER BY \`${opts.orderBy.field}\` ${opts.orderBy.dir}` : "";
  return query<Applicant>(`SELECT * FROM \`applicants\` ${whereClause} ${order}`, params);
}

export async function deleteMany(where: { id: { in: string[] } }): Promise<void> {
  if (where.id.in.length === 0) return;
  await execute(
    `DELETE FROM \`applicants\` WHERE \`id\` IN (${where.id.in.map(() => "?").join(", ")})`,
    where.id.in,
  );
}
