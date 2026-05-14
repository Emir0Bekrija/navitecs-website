import "server-only";
import mariadb from "mariadb";

function createPool() {
  return mariadb.createPool({
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? "root",
    password: process.env.DATABASE_PASSWORD ?? "",
    database: process.env.DATABASE_NAME ?? "navitecs",
    connectionLimit: 10,
    timezone: "auto",
    // Return dates as Date objects, bigint as number
    bigIntAsNumber: true,
    insertIdAsNumber: true,
    // Convert TINYINT(1) to boolean (MariaDB stores booleans as 0/1)
    typeCast: function (column, next) {
      if (column.type === "TINY" && column.columnLength === 1) {
        const val = next();
        return val === null ? null : val === 1;
      }
      return next();
    } as mariadb.TypeCastFunction,
  });
}

const globalForPool = globalThis as unknown as { __dbPool: mariadb.Pool };

export const pool = globalForPool.__dbPool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForPool.__dbPool = pool;

/** Run a single parameterized query. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = await pool.query(sql, params);
  // mariadb returns rows + a meta object; spread to plain array
  return Array.isArray(rows) ? [...rows] : rows;
}

/** Run a single query and return the first row or null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Execute an INSERT and return the insertId. */
export async function execute(
  sql: string,
  params?: unknown[],
): Promise<{ insertId: number; affectedRows: number }> {
  const result = await pool.query(sql, params);
  return { insertId: Number(result.insertId), affectedRows: Number(result.affectedRows) };
}

/** Run multiple queries in a transaction. */
export async function transaction<T>(
  fn: (conn: mariadb.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
