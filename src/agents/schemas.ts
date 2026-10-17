import { z } from "zod";

// Batas panjang (nama 40, deskripsi 200, 5 tag) dicek di rules.ts, bukan di skema,
// supaya pelanggaran tampil sebagai temuan yang bisa direvisi alih-alih error parsing.

const target = z.enum(["pria", "wanita", "unisex"]);

export const TrendReport = z.object({
  fashion_trends: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      sources: z.array(z.string()),
      keywords: z.array(z.string()),
      palette_hex: z.array(z.string()),
      target,
      kind: z.enum(["atasan", "bawahan", "keduanya"]),
      score: z.number().describe("0-100, seberapa kuat dan cocok untuk avatar Roblox"),
    }),
  ),
  game_trends: z.array(
    z.object({
      name: z.string(),
      genre: z.string(),
      why_popular: z.string(),
      mechanics: z.array(z.string()),
    }),
  ),
  member_feedback_summary: z.string(),
  notes: z.string(),
});
export type TrendReport = z.infer<typeof TrendReport>;

export const ClassicShirt = z.object({
  name: z.string(),
  target,
  trend: z.string(),
  style_description: z.string(),
  palette_hex: z.array(z.string()),
  pattern_details: z.string(),
  texture_prompt: z
    .string()
    .describe("Prompt tekstur kain seamless/tileable persegi untuk torso & lengan. Tanpa teks, tanpa logo."),
  front_graphic_prompt: z
    .string()
    .nullable()
    .describe("Prompt grafis persegi untuk torso depan (128x128 di template), atau null jika polos."),
  back_graphic_prompt: z.string().nullable(),
  sleeve_style: z.enum(["panjang", "pendek", "tanpa_lengan"]),
  marketplace_description: z.string(),
  tags: z.array(z.string()),
  price_robux: z.number().int(),
});
export const KobbieOutput = z.object({ items: z.array(ClassicShirt) });

const ugcBase = {
  name: z.string(),
  target,
  trend: z.string(),
  shape_3d: z.object({
    silhouette: z.string(),
    length: z.string(),
    cut: z.string(),
    accessories: z.array(z.string()),
  }),
  pbr_textures: z.object({
    color_prompt: z.string(),
    normal_prompt: z.string(),
    roughness_prompt: z.string(),
    resolution: z.literal("1024x1024"),
  }),
  blender_brief: z.object({
    triangle_budget: z.number().int(),
    cage_notes: z.string().describe("Kebutuhan inner cage & outer cage"),
    attachment_points: z.array(z.string()),
    uv_notes: z.string(),
    steps: z.array(z.string()),
  }),
  marketplace_description: z.string(),
  tags: z.array(z.string()),
  price_robux: z.number().int(),
  manual_checks: z.array(z.string()).describe("Bagian yang WAJIB dicek manual oleh manusia"),
};

export const UgcShirt = z.object({
  ...ugcBase,
  category: z.enum(["Shirt", "Jacket", "Sweater", "T-Shirt"]),
});
export const BrunoOutput = z.object({ items: z.array(UgcShirt) });

export const UgcPants = z.object({
  ...ugcBase,
  category: z.enum(["Pants", "Shorts", "Skirt"]),
  pairs_with: z.array(z.string()).describe("Nama item Bruno yang cocok dipadukan"),
  bundle_name: z.string().nullable(),
});
export const SeskoOutput = z.object({ items: z.array(UgcPants) });

export const GameConcept = z.object({
  title: z.string(),
  genre: z.string(),
  core_loop: z.string(),
  retention_reasons: z.array(z.string()),
  folder_structure: z.string().describe("Pohon folder ServerScriptService, ReplicatedStorage, StarterGui, dll"),
  files: z.array(
    z.object({
      path: z.string().describe("Path relatif, mis. ServerScriptService/Combat.server.luau"),
      runs_on: z.enum(["server", "client", "shared"]),
      purpose: z.string(),
      content: z.string(),
    }),
  ),
  security_measures: z.array(z.string()),
  monetization: z.array(
    z.object({
      type: z.enum(["gamepass", "developer_product", "cosmetic", "vip_server"]),
      name: z.string(),
      price_robux: z.number().int(),
      description: z.string(),
      fairness_note: z.string(),
    }),
  ),
  studio_steps: z.array(z.string()).describe("Langkah yang harus dilakukan manusia di Roblox Studio"),
  design_doc_markdown: z.string(),
});
export const DalotOutput = z.object({ game: GameConcept });

export const QaResult = z.object({
  verdict: z.enum(["pass", "fail", "needs_human"]),
  quality_score: z.number().int().describe("1-10"),
  issues: z.array(
    z.object({
      severity: z.enum(["block", "warn", "info"]),
      category: z.enum(["copyright", "policy", "quality", "technical", "monetization", "child_safety"]),
      detail: z.string(),
    }),
  ),
  summary: z.string(),
});
export type QaResult = z.infer<typeof QaResult>;
