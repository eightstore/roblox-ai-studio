import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Pertama kali dijalankan (mis. dari VS Code tanpa mulai.bat): buat .env dari contoh supaya pengaturan bawaan langsung terpakai.
if (!fs.existsSync(".env") && fs.existsSync(".env.example")) {
  fs.copyFileSync(".env.example", ".env");
  console.log("File .env dibuat dari .env.example");
}
dotenv.config({ quiet: true });

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Env ${name} belum diisi (lihat .env.example)`);
  return v;
}

export const config = {
  model: env("CLAUDE_MODEL", "claude-opus-5-5"),
  // Mode demo: agent memakai contoh output (gratis). Otomatis aktif kalau ANTHROPIC_API_KEY kosong.
  demoMode: env("DEMO_MODE", "") === "true" || (!process.env.ANTHROPIC_API_KEY && env("DEMO_MODE", "") !== "false"),
  databaseUrl: env("DATABASE_URL", ""),
  groupName: env("GROUP_NAME", "Studio Roblox"),
  cycleCron: env("CYCLE_CRON", "0 2 * * *"),
  tz: env("TZ_NAME", "Asia/Jakarta"),
  adminToken: env("ADMIN_TOKEN", ""),
  port: Number(env("PORT", "3000")),
  publicBaseUrl: env("PUBLIC_BASE_URL", "http://localhost:3000"),
  geminiApiKey: env("GEMINI_API_KEY", ""),
  geminiImageModels: env("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image,gemini-3.1-flash-image-preview")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  imageApiUrl: env("IMAGE_API_URL", ""),
  imageApiKey: env("IMAGE_API_KEY", ""),
  robloxApiKey: env("ROBLOX_API_KEY", ""),
  robloxGroupId: env("ROBLOX_GROUP_ID", ""),
  robloxAutoUpload: env("ROBLOX_AUTO_UPLOAD", "false") === "true",
  discordWebhook: env("DISCORD_WEBHOOK_URL", ""),
  storageDir: path.resolve(env("STORAGE_DIR", "storage")),
};
