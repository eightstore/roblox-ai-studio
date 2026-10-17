import cron from "node-cron";
import { config } from "./config.js";
import { closeDb, ensureSchema } from "./lib/db.js";
import { notify } from "./lib/notify.js";
import { runCycle } from "./pipeline.js";
import { buildServer } from "./server.js";

if (config.demoMode) console.log("⚠️  MODE DEMO: agent memakai contoh output (tanpa Claude API, tanpa biaya).");

await ensureSchema();

if (process.argv.includes("--once")) {
  // Jalankan satu siklus lalu keluar (untuk uji coba atau cron eksternal seperti Railway Cron).
  await runCycle();
  await closeDb();
} else {
  const app = buildServer();
  await app.listen({ port: config.port, host: "0.0.0.0" });

  cron.schedule(config.cycleCron, () => void runCycle(), { timezone: config.tz });
  console.log(`Siklus terjadwal: "${config.cycleCron}" (${config.tz})`);
  console.log(`\n✅ Siap! Buka di browser:\n   Website komunitas : http://localhost:${config.port}\n   Dashboard admin   : http://localhost:${config.port}/admin.html  (token: lihat ADMIN_TOKEN di file .env)\n`);

  process.on("unhandledRejection", (err) => void notify(`❌ Unhandled: ${(err as Error)?.message ?? err}`));
}
