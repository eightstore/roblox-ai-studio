import sharp from "sharp";
import { config } from "../config.js";

const STYLE_SUFFIX = "Flat square texture, evenly lit, no text, no letters, no logos, no watermark.";

/**
 * Generator gambar, urutan prioritas:
 * 1. GEMINI_API_KEY  -> Gemini API (Google AI Studio)
 * 2. IMAGE_API_URL   -> endpoint HTTP apa pun yang menerima POST {prompt,width,height} dan mengembalikan PNG
 *                       (langsung, atau JSON {image_base64})
 * 3. tidak ada       -> tekstur placeholder garis-garis dari palet (gratis, untuk uji alur)
 */
export async function generateImage(prompt: string, size: number, palette: string[]): Promise<Buffer> {
  if (config.geminiApiKey) return normalize(await generateWithGemini(`${prompt}. ${STYLE_SUFFIX}`), size);
  if (config.imageApiUrl) return normalize(await generateWithHttp(`${prompt}. ${STYLE_SUFFIX}`, size), size);
  return placeholderTexture(size, palette);
}

export function imageMode() {
  if (config.geminiApiKey) return `Gemini (${config.geminiImageModels.join(" → ")})`;
  if (config.imageApiUrl) return config.imageApiUrl;
  return "placeholder garis-garis (isi GEMINI_API_KEY untuk gambar sungguhan)";
}

// Gemini bisa mengembalikan JPEG atau ukuran lain; samakan jadi PNG persegi sesuai permintaan.
async function normalize(img: Buffer, size: number) {
  return sharp(img).resize(size, size, { fit: "cover" }).png().toBuffer();
}

// Setelah kena 429, permintaan berikutnya langsung gagal selama 10 menit supaya tidak membanjiri API.
let quotaBlockedUntil = 0;
let quotaMessage = "";

/** Model dicoba berurutan; kalau satu tidak tersedia (404), lanjut ke model berikutnya di GEMINI_IMAGE_MODEL. */
async function generateWithGemini(prompt: string): Promise<Buffer> {
  if (Date.now() < quotaBlockedUntil) throw new Error(quotaMessage);
  let lastError = "";
  for (const model of config.geminiImageModels) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": config.geminiApiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
      }),
      signal: AbortSignal.timeout(180_000),
    });

    if (res.status === 404) {
      lastError = `model ${model} tidak ditemukan`;
      continue;
    }
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error?.message ?? res.statusText;
      if (res.status === 400 && /api key/i.test(msg)) throw new Error("GEMINI_API_KEY tidak valid. Cek lagi key di Google AI Studio.");
      if (res.status === 429) {
        // "limit: 0" berarti model ini tidak tersedia di tingkat gratis sama sekali: billing wajib.
        quotaMessage = /limit: 0/.test(msg)
          ? "Gemini menolak: model gambar butuh billing aktif (kuota gratis = 0). Aktifkan billing di Google AI Studio."
          : `Kuota Gemini habis / terlalu banyak permintaan (429). Coba lagi nanti. Detail: ${msg.split("\n")[0]}`;
        quotaBlockedUntil = Date.now() + 10 * 60_000;
        throw new Error(quotaMessage);
      }
      throw new Error(`Gemini ${res.status}: ${msg}`);
    }

    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    const image = parts.find((p) => p.inlineData?.data);
    if (image) return Buffer.from(image.inlineData.data, "base64");

    const reason = json?.promptFeedback?.blockReason ?? json?.candidates?.[0]?.finishReason ?? "tanpa gambar";
    throw new Error(`Gemini tidak mengembalikan gambar (${reason}). Coba revisi prompt-nya.`);
  }
  throw new Error(`Tidak ada model gambar Gemini yang tersedia (${lastError}). Ubah GEMINI_IMAGE_MODEL di .env.`);
}

async function generateWithHttp(prompt: string, size: number): Promise<Buffer> {
  const res = await fetch(config.imageApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.imageApiKey ? { authorization: `Bearer ${config.imageApiKey}` } : {}),
    },
    body: JSON.stringify({ prompt, width: size, height: size }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Image API ${res.status}: ${await res.text()}`);

  if (res.headers.get("content-type")?.includes("application/json")) {
    const json = (await res.json()) as { image_base64?: string };
    if (!json.image_base64) throw new Error("Image API tidak mengembalikan image_base64");
    return Buffer.from(json.image_base64, "base64");
  }
  return Buffer.from(await res.arrayBuffer());
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0x888888;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Garis-garis diagonal dari palet. Cukup untuk menguji template & alur upload tanpa biaya. */
export async function placeholderTexture(size: number, palette: string[]): Promise<Buffer> {
  const colors = (palette.length ? palette : ["#444444", "#bbbbbb"]).map(hexToRgb);
  const raw = Buffer.alloc(size * size * 4);
  const band = Math.max(8, Math.floor(size / 16));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = colors[Math.floor((x + y) / band) % colors.length];
      const o = (y * size + x) * 4;
      raw[o] = c.r;
      raw[o + 1] = c.g;
      raw[o + 2] = c.b;
      raw[o + 3] = 255;
    }
  }
  return sharp(raw, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
}
