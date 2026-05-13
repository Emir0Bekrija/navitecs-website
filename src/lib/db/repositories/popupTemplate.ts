import { query, queryOne, execute } from "../pool";
import { buildSet } from "../helpers";
import type { PopupTemplate } from "../types";

export async function findMany(orderBy?: { field: string; dir: "ASC" | "DESC" }): Promise<PopupTemplate[]> {
  const order = orderBy ? `ORDER BY \`${orderBy.field}\` ${orderBy.dir}` : "";
  return query<PopupTemplate>(`SELECT * FROM \`popup_templates\` ${order}`);
}

export async function findUnique(id: number): Promise<PopupTemplate | null> {
  return queryOne<PopupTemplate>("SELECT * FROM `popup_templates` WHERE `id` = ?", [id]);
}

export async function create(data: Omit<PopupTemplate, "id" | "createdAt" | "updatedAt">): Promise<PopupTemplate> {
  const { insertId } = await execute(
    `INSERT INTO \`popup_templates\` (\`name\`, \`badge\`, \`category\`, \`title\`, \`description\`, \`buttonText\`, \`linkUrl\`, \`linkType\`, \`openInNewTab\`, \`createdAt\`, \`updatedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [data.name, data.badge, data.category, data.title, data.description, data.buttonText, data.linkUrl, data.linkType, data.openInNewTab],
  );
  return (await findUnique(insertId))!;
}

export async function update(id: number, data: Record<string, unknown>): Promise<PopupTemplate> {
  const { sql, params } = buildSet(data, true);
  await execute(`UPDATE \`popup_templates\` SET ${sql} WHERE \`id\` = ?`, [...params, id]);
  return (await findUnique(id))!;
}

export async function remove(id: number): Promise<void> {
  await execute("DELETE FROM `popup_templates` WHERE `id` = ?", [id]);
}
