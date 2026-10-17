import pg from "pg";
import { config } from "../config.js";

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Supabase membutuhkan SSL; Postgres lokal biasanya tidak.
  ssl: /supabase\.(co|com)/.test(config.databaseUrl) ? { rejectUnauthorized: false } : undefined,
});

export async function q<T extends pg.QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query<T>(sql, params);
  return res.rows;
}

export async function logActivity(actor: string, message: string, itemId?: number, isPublic = true) {
  await q("insert into activity_log (actor, message, item_id, public) values ($1,$2,$3,$4)", [
    actor,
    message,
    itemId ?? null,
    isPublic,
  ]);
}
