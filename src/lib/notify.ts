import { config } from "../config.js";

/** Kirim pesan ke Discord (error, siklus selesai, item butuh review). Gagal kirim tidak boleh menjatuhkan pipeline. */
export async function notify(message: string) {
  console.log(`[notify] ${message}`);
  if (!config.discordWebhook) return;
  try {
    await fetch(config.discordWebhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: message.slice(0, 1900) }),
    });
  } catch (err) {
    console.error("Gagal kirim notifikasi Discord:", err);
  }
}
