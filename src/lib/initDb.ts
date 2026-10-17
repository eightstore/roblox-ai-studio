import fs from "node:fs";
import { pool } from "./db.js";

const sql = fs.readFileSync("db/schema.sql", "utf8");
await pool.query(sql);
console.log("Skema database siap.");
await pool.end();
