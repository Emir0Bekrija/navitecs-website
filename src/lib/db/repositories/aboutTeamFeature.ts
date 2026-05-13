import { queryOne, execute } from "../pool";
import { generateId, buildSet } from "../helpers";
import type { AboutTeamFeature } from "../types";

export async function findFirst(where?: { enabled?: boolean }): Promise<AboutTeamFeature | null> {
  if (where?.enabled !== undefined) {
    return queryOne<AboutTeamFeature>(
      "SELECT * FROM `about_team_feature` WHERE `enabled` = ? LIMIT 1",
      [where.enabled],
    );
  }
  return queryOne<AboutTeamFeature>("SELECT * FROM `about_team_feature` LIMIT 1");
}

export async function create(data: Record<string, unknown>): Promise<AboutTeamFeature> {
  const id = generateId();
  const cols = ["id", ...Object.keys(data), "createdAt", "updatedAt"];
  const vals = [id, ...Object.values(data), new Date(), new Date()];
  await execute(
    `INSERT INTO \`about_team_feature\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals,
  );
  return (await findById(id))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<AboutTeamFeature> {
  const { sql, params } = buildSet(data, true);
  await execute(`UPDATE \`about_team_feature\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findById(id))!;
}

async function findById(id: string): Promise<AboutTeamFeature | null> {
  return queryOne<AboutTeamFeature>("SELECT * FROM `about_team_feature` WHERE `id` = ?", [id]);
}
