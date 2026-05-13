import { queryOne, execute } from "../pool";
import type { SiteSettings } from "../types";

export async function findUnique(): Promise<SiteSettings | null> {
  return queryOne<SiteSettings>("SELECT * FROM `site_settings` WHERE `id` = 1");
}

export async function upsert(data: Partial<Omit<SiteSettings, "id" | "updatedAt">>): Promise<SiteSettings> {
  const existing = await findUnique();
  if (existing) {
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        sets.push(`\`${k}\` = ?`);
        params.push(v);
      }
    }
    sets.push("`updatedAt` = NOW()");
    await execute(`UPDATE \`site_settings\` SET ${sets.join(", ")} WHERE \`id\` = 1`, params);
  } else {
    const cols = ["id", ...Object.keys(data), "updatedAt"];
    const vals = [1, ...Object.values(data), new Date()];
    await execute(
      `INSERT INTO \`site_settings\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      vals,
    );
  }
  return (await findUnique())!;
}
