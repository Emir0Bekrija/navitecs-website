import { queryOne, execute } from "../pool";
import type { PopupConfig } from "../types";

export async function findUnique(): Promise<PopupConfig | null> {
  return queryOne<PopupConfig>("SELECT * FROM `popup_config` WHERE `id` = 1");
}

export async function upsert(data: Partial<Omit<PopupConfig, "id" | "updatedAt">>): Promise<PopupConfig> {
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
    await execute(`UPDATE \`popup_config\` SET ${sets.join(", ")} WHERE \`id\` = 1`, params);
  } else {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    const cols = ["id", ...entries.map(([k]) => k), "updatedAt"];
    const vals = [1, ...entries.map(([, v]) => v), new Date()];
    await execute(
      `INSERT INTO \`popup_config\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      vals,
    );
  }
  return (await findUnique())!;
}
