import sharp from "sharp";
import { config } from "../config.js";

/**
 * Generator gambar. Penyedia apa pun bisa dipakai selama ada endpoint HTTP yang menerima
 * POST {prompt, width, height} dan mengembalikan PNG (langsung, atau JSON {image_base64}).
 * Tanpa IMAGE_API_URL, dibuat tekstur placeholder dari palet supaya pipeline tetap bisa diuji gratis.
 */
export async function generateImage(prompt: string, size: number, palette: string[]): Promise<Buffer> {
  if (!config.imageApiUrl) return placeholderTexture(size, palette);

  const res = await fetch(config.imageApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.imageApiKey ? { authorization: `Bearer ${config.imageApiKey}` } : {}),
    },
    body: JSON.stringify({
      prompt: `${prompt}. Flat square texture, no text, no letters, no logos, no watermark.`,
      width: size,
      height: size,
    }),
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
