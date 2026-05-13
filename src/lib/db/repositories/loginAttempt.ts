import { query, execute } from "../pool";

export async function count(where: {
  ip: string;
  success: boolean;
  createdAt: { gte: Date };
}): Promise<number> {
  const rows = await query<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM `login_attempts` WHERE `ip` = ? AND `success` = ? AND `createdAt` >= ?",
    [where.ip, where.success, where.createdAt.gte],
  );
  return rows[0]?.cnt ?? 0;
}

export async function create(data: {
  ip: string;
  username: string | null;
  success: boolean;
}): Promise<void> {
  await execute(
    "INSERT INTO `login_attempts` (`ip`, `username`, `success`, `createdAt`) VALUES (?, ?, ?, NOW())",
    [data.ip, data.username, data.success],
  );
}
