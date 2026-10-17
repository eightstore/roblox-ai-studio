import { runAgent } from "../lib/claude.js";
import * as P from "./prompts.js";
import * as S from "./schemas.js";
import type { RawTrendData } from "../trends/sources.js";

// Tiap agent menerima konteks lewat pesan user; system prompt tetap statis (bisa di-cache).
const asJson = (label: string, v: unknown) => `<${label}>\n${JSON.stringify(v, null, 2)}\n</${label}>`;

export function trendScout(raw: RawTrendData) {
  return runAgent({
    agent: "scout",
    system: P.SCOUT,
    input: `${asJson("data_tren_mentah", raw)}\n\nBuat laporan tren untuk siklus ini.`,
    schema: S.TrendReport,
    effort: "medium",
  });
}

export function kobbie(trends: S.TrendReport, revision?: Revision) {
  return runAgent({
    agent: "kobbie",
    system: P.KOBBIE,
    input: withRevision(asJson("trend_data", trends.fashion_trends), revision),
    schema: S.KobbieOutput,
  });
}

export function bruno(trends: S.TrendReport, revision?: Revision) {
  return runAgent({
    agent: "bruno",
    system: P.BRUNO,
    input: withRevision(asJson("trend_data", trends.fashion_trends), revision),
    schema: S.BrunoOutput,
  });
}

export function sesko(trends: S.TrendReport, brunoItems: unknown[], revision?: Revision) {
  // Ringkas item Bruno: Sesko cukup tahu nama, kategori, siluet, dan palet untuk mencocokkan set.
  const brief = brunoItems.map((b: any) => ({ name: b.name, category: b.category, target: b.target, shape_3d: b.shape_3d, trend: b.trend }));
  return runAgent({
    agent: "sesko",
    system: P.SESKO,
    input: withRevision(`${asJson("trend_data", trends.fashion_trends)}\n${asJson("bruno_items", brief)}`, revision),
    schema: S.SeskoOutput,
  });
}

export function dalot(trends: S.TrendReport, revision?: Revision) {
  return runAgent({
    agent: "dalot",
    system: P.DALOT,
    input: withRevision(asJson("game_trend_data", trends.game_trends), revision),
    schema: S.DalotOutput,
    effort: "xhigh",
    maxTokens: 64000,
  });
}

export function qualityCheck(kind: string, data: unknown, ruleFindings: unknown[]) {
  return runAgent({
    agent: "qa",
    system: P.QA,
    input: `Jenis karya: ${kind}\n${asJson("karya", data)}\n${asJson("temuan_cek_otomatis", ruleFindings)}\n\nPeriksa karya ini.`,
    schema: S.QaResult,
    effort: "high",
  });
}

export interface Revision {
  previous: unknown;
  adminNote: string;
}

function withRevision(input: string, revision?: Revision) {
  if (!revision) return input;
  return `${input}
${asJson("karya_sebelumnya", revision.previous)}
<catatan_admin>${revision.adminNote}</catatan_admin>

Ini permintaan REVISI. Perbaiki karya sebelumnya sesuai catatan admin dan kembalikan tepat 1 karya
(untuk output berbentuk items, isi items dengan 1 elemen). Pertahankan bagian yang tidak dikomentari.`;
}
