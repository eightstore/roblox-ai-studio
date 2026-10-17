import fs from "node:fs";
import { q } from "../lib/db.js";

/**
 * Sumber data mentah untuk Trend Scout. Tiap sumber boleh gagal; yang gagal dicatat lalu dilewati
 * supaya satu API yang down tidak menghentikan siklus 24 jam.
 *
 * Endpoint Roblox di bawah adalah endpoint web publik (bukan Open Cloud) dan parameternya bisa
 * berubah sewaktu-waktu — override lewat env bila perlu.
 */
const CATALOG_URLS = (
  process.env.ROBLOX_CATALOG_URLS ??
  [
    "https://catalog.roblox.com/v2/search/items/details?Category=3&Subcategory=56&SortType=2&SortAggregation=1&Limit=30", // classic shirt terlaris minggu ini
    "https://catalog.roblox.com/v2/search/items/details?Category=3&Subcategory=57&SortType=2&SortAggregation=1&Limit=30", // classic pants
    "https://catalog.roblox.com/v2/search/items/details?Category=3&Subcategory=3&SortType=2&SortAggregation=1&Limit=30", // layered clothing
  ].join(",")
).split(",");

export interface RawTrendData {
  roblox_marketplace: unknown[];
  fashion_seeds: unknown[];
  game_seeds: unknown[];
  member_votes: unknown[];
  source_errors: string[];
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function readSeeds(file: string): unknown[] {
  // Isi manual / hasil scraper Pinterest & TikTok. Format bebas; Scout yang merangkum.
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export async function collectTrendData(): Promise<RawTrendData> {
  const errors: string[] = [];
  const marketplace: unknown[] = [];

  for (const url of CATALOG_URLS) {
    try {
      const json = await fetchJson(url);
      for (const it of json.data ?? []) {
        // Cukup nama + deskripsi pendek; data lain hanya menambah token.
        marketplace.push({
          name: it.name,
          description: String(it.description ?? "").slice(0, 160),
          price: it.price ?? it.lowestPrice,
          favorites: it.favoriteCount,
          type: it.assetType ?? it.itemType,
        });
      }
    } catch (err) {
      errors.push(`catalog ${url}: ${(err as Error).message}`);
    }
  }

  let memberVotes: unknown[] = [];
  try {
    // Feedback voting 30 hari terakhir -> sinyal untuk siklus berikutnya.
    memberVotes = await q(
      `select i.name, i.kind, i.data->>'trend' as trend,
              coalesce(sum(v.value),0)::int as score, count(v.*)::int as votes
         from items i left join votes v on v.item_id = i.id
        where i.status = 'published' and i.published_at > now() - interval '30 days'
        group by i.id order by score desc limit 30`,
    );
  } catch (err) {
    errors.push(`votes: ${(err as Error).message}`);
  }

  return {
    roblox_marketplace: marketplace,
    fashion_seeds: readSeeds("data/fashion-seeds.json"),
    game_seeds: readSeeds("data/game-seeds.json"),
    member_votes: memberVotes,
    source_errors: errors,
  };
}
