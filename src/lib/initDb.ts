import { closeDb, ensureSchema } from "./db.js";

await ensureSchema();
console.log("Skema database siap.");
await closeDb();
