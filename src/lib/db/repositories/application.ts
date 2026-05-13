import { query, queryOne, execute } from "../pool";
import { generateId } from "../helpers";
import type { Application } from "../types";

export async function findUnique(id: string, select?: string[]): Promise<Partial<Application> | null> {
  const cols = select ? select.map((c) => `\`${c}\``).join(", ") : "*";
  return queryOne<Partial<Application>>(`SELECT ${cols} FROM \`applications\` WHERE \`id\` = ?`, [id]);
}

export async function create(data: Record<string, unknown>): Promise<Application> {
  const id = (data.id as string | undefined) || generateId();
  const { id: _discard, ...rest } = data;
  const entries: Record<string, unknown> = { id, ...rest, submittedAt: new Date() };
  const cols = Object.keys(entries);
  const vals = Object.values(entries);
  await execute(
    `INSERT INTO \`applications\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findUnique(id)) as Application;
}

export async function update(id: string, data: Record<string, unknown>): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      sets.push(`\`${k}\` = ?`);
      params.push(v === null ? null : v);
    }
  }
  if (sets.length === 0) return;
  await execute(`UPDATE \`applications\` SET ${sets.join(", ")} WHERE \`id\` = ?`, [...params, id]);
}

export async function remove(id: string): Promise<void> {
  await execute("DELETE FROM `applications` WHERE `id` = ?", [id]);
}

export async function deleteMany(where: { id: { in: string[] } }): Promise<void> {
  if (where.id.in.length === 0) return;
  await execute(
    `DELETE FROM \`applications\` WHERE \`id\` IN (${where.id.in.map(() => "?").join(", ")})`,
    where.id.in,
  );
}

export async function count(where?: { submittedAt?: { lt?: Date; gte?: Date; lte?: Date } }): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.submittedAt?.lt) {
    conditions.push("`submittedAt` < ?");
    params.push(where.submittedAt.lt);
  }
  if (where?.submittedAt?.gte) {
    conditions.push("`submittedAt` >= ?");
    params.push(where.submittedAt.gte);
  }
  if (where?.submittedAt?.lte) {
    conditions.push("`submittedAt` <= ?");
    params.push(where.submittedAt.lte);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM \`applications\` ${whereClause}`, params);
  return rows[0]?.cnt ?? 0;
}

/** Find applications with job relation. Used by dashboard stats and export. */
export async function findManyWithJob(where?: {
  submittedAt?: { gte?: Date; lte?: Date; lt?: Date };
}, orderBy?: { field: string; dir: "ASC" | "DESC" }): Promise<(Application & { job: { title: string } | null })[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (where?.submittedAt?.gte) {
    conditions.push("app.`submittedAt` >= ?");
    params.push(where.submittedAt.gte);
  }
  if (where?.submittedAt?.lte) {
    conditions.push("app.`submittedAt` <= ?");
    params.push(where.submittedAt.lte);
  }
  if (where?.submittedAt?.lt) {
    conditions.push("app.`submittedAt` < ?");
    params.push(where.submittedAt.lt);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const order = orderBy ? `ORDER BY app.\`${orderBy.field}\` ${orderBy.dir}` : "";
  const rows = await query<Application & { job_title: string | null }>(
    `SELECT app.*, j.title as job_title
     FROM \`applications\` app
     LEFT JOIN \`jobs\` j ON app.jobId = j.id
     ${whereClause} ${order}`,
    params,
  );
  return rows.map((r) => ({
    ...r,
    job: r.job_title ? { title: r.job_title } : null,
  }));
}

/** Find applications with cvDeletable and cvPath for bulk CV operations. */
export async function findDeletableCvs(): Promise<{ id: string; cvPath: string }[]> {
  return query<{ id: string; cvPath: string }>(
    "SELECT `id`, `cvPath` FROM `applications` WHERE `cvDeletable` = 1 AND `cvPath` IS NOT NULL",
  );
}

/** Clear CV data for multiple applications. */
export async function clearCvMany(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await execute(
    `UPDATE \`applications\` SET \`cvPath\` = NULL, \`cvFileName\` = NULL, \`cvDeletable\` = 0 WHERE \`id\` IN (${ids.map(() => "?").join(", ")})`,
    ids,
  );
}

/** Find distinct applicantIds from applications matching conditions. */
export async function findDistinctApplicantIds(where: {
  submittedAt?: { gte?: Date };
  applicantId?: { not?: null; in?: string[] };
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
  if (where.applicantId?.in && where.applicantId.in.length > 0) {
    conditions.push(`\`applicantId\` IN (${where.applicantId.in.map(() => "?").join(", ")})`);
    params.push(...where.applicantId.in);
  }
  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await query<{ applicantId: string }>(
    `SELECT DISTINCT \`applicantId\` FROM \`applications\` ${whereClause}`,
    params,
  );
  return rows.map((r) => r.applicantId);
}

/**
 * Complex query for admin applications page.
 * Returns applicant IDs ordered by most recent application submission.
 */
export async function findApplicantIdsByApplications(opts: {
  conditions: { sql: string; params: unknown[] };
  skip: number;
  take: number;
}): Promise<{ total: number; ids: string[] }> {
  const { conditions, skip, take } = opts;
  const whereClause = conditions.sql ? `WHERE ${conditions.sql}` : "";

  const [countRows, idRows] = await Promise.all([
    query<{ total: number }>(
      `SELECT COUNT(DISTINCT a.id) AS total
       FROM \`applicants\` a
       INNER JOIN \`applications\` app ON app.applicantId = a.id
       ${whereClause}`,
      conditions.params,
    ),
    query<{ id: string }>(
      `SELECT a.id
       FROM \`applicants\` a
       INNER JOIN \`applications\` app ON app.applicantId = a.id
       ${whereClause}
       GROUP BY a.id
       ORDER BY MAX(app.submittedAt) DESC
       LIMIT ? OFFSET ?`,
      [...conditions.params, take, skip],
    ),
  ]);

  return {
    total: Number(countRows[0]?.total ?? 0),
    ids: idRows.map((r) => r.id),
  };
}

/**
 * Fetch full applicant data with filtered applications for admin applications page.
 */
export async function findApplicantsWithFilteredApplications(
  applicantIds: string[],
  applicationWhere: { sql: string; params: unknown[] },
): Promise<Record<string, unknown>[]> {
  if (applicantIds.length === 0) return [];

  const idPlaceholders = applicantIds.map(() => "?").join(", ");

  // Fetch applicants
  const applicants = await query<Record<string, unknown>>(
    `SELECT \`id\`, \`firstName\`, \`lastName\`, \`email\`, \`phone\`, \`score\`, \`comments\`, \`fitsRoles\`, \`doesNotFit\`
     FROM \`applicants\`
     WHERE \`id\` IN (${idPlaceholders})`,
    applicantIds,
  );

  // Fetch applications with job info
  const appConditions = [`app.\`applicantId\` IN (${idPlaceholders})`];
  const appParams: unknown[] = [...applicantIds];
  if (applicationWhere.sql) {
    appConditions.push(applicationWhere.sql);
    appParams.push(...applicationWhere.params);
  }

  const apps = await query<Record<string, unknown>>(
    `SELECT app.\`id\`, app.\`role\`, app.\`submittedAt\`, app.\`cvFileName\`, app.\`cvDeletable\`,
            app.\`message\`, app.\`phone\`, app.\`linkedin\`, app.\`portfolio\`,
            app.\`currentlyEmployed\`, app.\`noticePeriod\`, app.\`yearsOfExperience\`,
            app.\`location\`, app.\`bimSoftware\`, app.\`applicantId\`,
            j.\`id\` as job_id, j.\`title\` as job_title
     FROM \`applications\` app
     LEFT JOIN \`jobs\` j ON app.\`jobId\` = j.\`id\`
     WHERE ${appConditions.join(" AND ")}
     ORDER BY app.\`submittedAt\` DESC`,
    appParams,
  );

  // Group applications by applicant
  const appsByApplicant = new Map<string, Record<string, unknown>[]>();
  for (const app of apps) {
    const aid = app.applicantId as string;
    if (!appsByApplicant.has(aid)) appsByApplicant.set(aid, []);
    appsByApplicant.get(aid)!.push({
      id: app.id,
      role: app.role,
      submittedAt: app.submittedAt,
      cvFileName: app.cvFileName,
      cvDeletable: app.cvDeletable,
      message: app.message,
      phone: app.phone,
      linkedin: app.linkedin,
      portfolio: app.portfolio,
      currentlyEmployed: app.currentlyEmployed,
      noticePeriod: app.noticePeriod,
      yearsOfExperience: app.yearsOfExperience,
      location: app.location,
      bimSoftware: app.bimSoftware,
      job: app.job_id ? { id: app.job_id, title: app.job_title } : null,
    });
  }

  return applicants.map((a) => ({
    ...a,
    applications: appsByApplicant.get(a.id as string) ?? [],
  }));
}
