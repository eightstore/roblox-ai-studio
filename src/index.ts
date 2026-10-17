import cron from "node-cron";
import { config } from "./config.js";
import { pool } from "./lib/db.js";
import { notify } from "./lib/notify.js";
import { runCycle } from "./pipeline.js";
import { buildServer } from "./server.js";

if (process.argv.includes("--once")) {
  // Jalankan satu siklus lalu keluar (untuk uji coba atau cron eksternal seperti Railway Cron).
  await runCycle();
  await pool.end();
} else {
  const app = buildServer();
  await app.listen({ port: config.port, host: "0.0.0.0" });

  cron.schedule(config.cycleCron, () => void runCycle(), { timezone: config.tz });
  console.log(`Siklus terjadwal: "${config.cycleCron}" (${config.tz})`);

  process.on("unhandledRejection", (err) => void notify(`❌ Unhandled: ${(err as Error)?.message ?? err}`));
}
