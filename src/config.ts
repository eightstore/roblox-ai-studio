import "dotenv/config";
import path from "node:path";

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Env ${name} belum diisi (lihat .env.example)`);
  return v;
}

export const config = {
  model: env("CLAUDE_MODEL", "claude-opus-5-5"),
  databaseUrl: env("DATABASE_URL", ""),
  groupName: env("GROUP_NAME", "Studio Roblox"),
  cycleCron: env("CYCLE_CRON", "0 2 * * *"),
  tz: env("TZ_NAME", "Asia/Jakarta"),
  adminToken: env("ADMIN_TOKEN", ""),
  port: Number(env("PORT", "3000")),
  publicBaseUrl: env("PUBLIC_BASE_URL", "http://localhost:3000"),
  imageApiUrl: env("IMAGE_API_URL", ""),
  imageApiKey: env("IMAGE_API_KEY", ""),
  robloxApiKey: env("ROBLOX_API_KEY", ""),
  robloxGroupId: env("ROBLOX_GROUP_ID", ""),
  robloxAutoUpload: env("ROBLOX_AUTO_UPLOAD", "false") === "true",
  discordWebhook: env("DISCORD_WEBHOOK_URL", ""),
  storageDir: path.resolve(env("STORAGE_DIR", "storage")),
};
