import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { config } from "../config.js";

/**
 * Dua mode database:
 * - DATABASE_URL diisi  -> Postgres sungguhan (Supabase, Docker, VPS).
 * - DATABASE_URL kosong -> PGlite: Postgres bawaan yang disimpan di storage/database. Tanpa instal apa pun,
 *   cocok untuk uji coba di laptop. Satu proses saja; jangan dipakai untuk produksi.
 */
interface Db {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
  exec(sql: string): Promise<unknown>;
  end(): Promise<void>;
}

let db: Db | undefined;

async function open(): Promise<Db> {
  if (config.databaseUrl) {
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      // Supabase membutuhkan SSL; Postgres lokal biasanya tidak.
      ssl: /supabase\.(co|com)/.test(config.databaseUrl) ? { rejectUnauthorized: false } : undefined,
    });
    return { query: (s, p) => pool.query(s, p), exec: (s) => pool.query(s), end: () => pool.end() };
  }
  const dir = path.join(config.storageDir, "database");
  fs.mkdirSync(dir, { recursive: true });
  const lite = await PGlite.create(dir);
  return { query: (s, p) => lite.query(s, p), exec: (s) => lite.exec(s), end: () => lite.close() };
}

let opening: Promise<Db> | undefined;
async function getDb() {
  if (db) return db;
  opening ??= open().then((d) => (db = d));
  return opening;
}

/** Buat tabel kalau belum ada. Aman dipanggil berkali-kali. */
export async function ensureSchema() {
  const sql = fs.readFileSync(path.resolve("db/schema.sql"), "utf8");
  await (await getDb()).exec(sql);
}

export async function closeDb() {
  await db?.end();
  db = undefined;
  opening = undefined;
}

export async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await (await getDb()).query(sql, params);
  return res.rows as T[];
}

export async function logActivity(actor: string, message: string, itemId?: number, isPublic = true) {
  await q("insert into activity_log (actor, message, item_id, public) values ($1,$2,$3,$4)", [
    actor,
    message,
    itemId ?? null,
    isPublic,
  ]);
}
