import sharp from "sharp";
import { TEMPLATE_H, TEMPLATE_W } from "./template.js";

export interface RuleFinding {
  severity: "block" | "warn";
  rule: string;
  detail: string;
}

/**
 * Daftar kata yang hampir pasti merek/IP. Bukan pengganti cek AI — ini jaring pengaman murah
 * yang menangkap kasus paling jelas sebelum token dibelanjakan. Tambah sesuai kebutuhan.
 */
const BLOCKED_TERMS = [
  "nike", "adidas", "gucci", "supreme", "balenciaga", "louis vuitton", "chanel", "prada", "dior",
  "off-white", "bape", "yeezy", "north face", "stussy", "versace",
  "disney", "marvel", "pokemon", "naruto", "one piece", "hello kitty", "sanrio", "spongebob", "minecraft",
  "fortnite", "real madrid", "juventus",
];

// Kata yang sering dipakai untuk memancing pencarian/spam atau melanggar kebijakan Marketplace.
const SPAM_TERMS = ["free robux", "robux gratis", "giveaway", "follow me", "discord.gg", "http://", "https://"];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BRAND_RE = BLOCKED_TERMS.map((term) => [term, new RegExp(`\\b${escape(term)}\\b`, "i")] as const);

function scan(text: string, label: string): RuleFinding[] {
  const t = text.toLowerCase();
  const out: RuleFinding[] = [];
  for (const [term, re] of BRAND_RE) {
    if (re.test(t)) out.push({ severity: "block", rule: "brand", detail: `${label} menyebut "${term}"` });
  }
  for (const term of SPAM_TERMS) {
    if (t.includes(term)) out.push({ severity: "block", rule: "spam", detail: `${label} berisi "${term}"` });
  }
  return out;
}

export function checkListingText(item: {
  name: string;
  marketplace_description: string;
  tags: string[];
  price_robux: number;
  prompts?: (string | null | undefined)[];
}): RuleFinding[] {
  const f: RuleFinding[] = [];
  if (item.name.length > 40) f.push({ severity: "block", rule: "name_length", detail: `Nama ${item.name.length} karakter (maks 40)` });
  if (item.marketplace_description.length > 200)
    f.push({ severity: "block", rule: "desc_length", detail: `Deskripsi ${item.marketplace_description.length} karakter (maks 200)` });
  if (item.tags.length !== 5) f.push({ severity: "warn", rule: "tag_count", detail: `${item.tags.length} tag (diminta 5)` });
  if (item.price_robux < 5) f.push({ severity: "warn", rule: "price", detail: `Harga ${item.price_robux} Robux di bawah minimum umum` });

  f.push(...scan(item.name, "Nama"), ...scan(item.marketplace_description, "Deskripsi"), ...scan(item.tags.join(" "), "Tag"));
  for (const p of item.prompts ?? []) if (p) f.push(...scan(p, "Prompt gambar"));
  return f;
}

export async function checkClassicShirtPng(png: Buffer): Promise<RuleFinding[]> {
  const f: RuleFinding[] = [];
  const meta = await sharp(png).metadata();
  if (meta.format !== "png") f.push({ severity: "block", rule: "format", detail: `Format ${meta.format}, harus PNG` });
  if (meta.width !== TEMPLATE_W || meta.height !== TEMPLATE_H)
    f.push({ severity: "block", rule: "dimensions", detail: `Ukuran ${meta.width}x${meta.height}, harus ${TEMPLATE_W}x${TEMPLATE_H}` });
  if (png.length > 4 * 1024 * 1024) f.push({ severity: "warn", rule: "file_size", detail: `File ${(png.length / 1e6).toFixed(1)} MB` });
  return f;
}

export const hasBlocker = (f: { severity: string }[]) => f.some((x) => x.severity === "block");
