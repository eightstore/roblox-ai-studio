// Contoh output agent untuk MODE DEMO (tanpa API key, tanpa biaya).
// Dipakai supaya alur Scout → agent → QA → dashboard → publish bisa dicoba di laptop.

const trendReport = {
  fashion_trends: [
    { name: "Y2K Pastel", description: "Baby tee pastel dengan aksen bintang kecil", sources: ["demo"], keywords: ["y2k", "pastel"], palette_hex: ["#f7c6d9", "#bde0fe", "#ffffff"], target: "wanita", kind: "atasan", score: 82 },
    { name: "Gorpcore Earth Tone", description: "Jaket outdoor warna tanah dengan panel kontras", sources: ["demo"], keywords: ["gorpcore", "outdoor"], palette_hex: ["#6b705c", "#a5a58d", "#cb997e"], target: "unisex", kind: "keduanya", score: 77 },
    { name: "Retro Stripe", description: "Garis diagonal retro tiga warna", sources: ["demo"], keywords: ["retro", "stripe"], palette_hex: ["#1e3a5f", "#f2e8cf", "#e07a5f"], target: "pria", kind: "atasan", score: 70 },
  ],
  game_trends: [{ name: "Obby kooperatif", genre: "obby", why_popular: "Main bareng teman, mudah dipahami", mechanics: ["checkpoint", "rintangan berpasangan"] }],
  member_feedback_summary: "Mode demo: belum ada vote member.",
  notes: "Data contoh mode demo.",
};

const shirt = (name: string, trend: string, palette: string[], sleeve: "panjang" | "pendek" | "tanpa_lengan", graphic: boolean) => ({
  name, target: "unisex", trend,
  style_description: `Classic shirt bergaya ${trend}`,
  palette_hex: palette,
  pattern_details: "Pola diagonal berulang",
  texture_prompt: `seamless fabric pattern, ${trend}, colors ${palette.join(" ")}`,
  front_graphic_prompt: graphic ? "small minimalist star emblem" : null,
  back_graphic_prompt: null,
  sleeve_style: sleeve,
  marketplace_description: `Classic shirt ${trend.toLowerCase()} yang nyaman untuk avatar kamu.`,
  tags: ["casual", "trendy", "aesthetic", "unisex", "daily"],
  price_robux: 10,
});

const ugc = (name: string, category: string, extra: object = {}) => ({
  name, target: "unisex", trend: "Gorpcore Earth Tone", category,
  shape_3d: { silhouette: "longgar", length: "reguler", cut: "boxy", accessories: ["tali penarik"] },
  pbr_textures: { color_prompt: "earth tone ripstop fabric", normal_prompt: "fine ripstop weave", roughness_prompt: "matte fabric", resolution: "1024x1024" },
  blender_brief: {
    triangle_budget: 3500,
    cage_notes: "Gunakan inner/outer cage dari template mannequin resmi, jangan ubah UV cage",
    attachment_points: ["BodyFrontAttachment"],
    uv_notes: "Satu UV set, texel density merata",
    steps: ["Blocking di atas mannequin", "Retopo di bawah budget", "Fit outer cage", "Skin ke rig", "Uji di Accessory Fitting Tool"],
  },
  marketplace_description: `${category} gaya outdoor untuk layered clothing.`,
  tags: ["gorpcore", "outdoor", "layered", "3d", "earth"],
  price_robux: 75,
  manual_checks: ["Cek clipping di body type ramping & besar", "Cek jumlah triangle final"],
  ...extra,
});

const game = {
  title: "Duo Obby",
  genre: "obby kooperatif",
  core_loop: "Dua pemain saling membuka jalan → capai checkpoint → buka kosmetik",
  retention_reasons: ["Main bareng teman", "Kosmetik baru tiap dunia"],
  folder_structure: "ServerScriptService/\n  Checkpoints.server.luau\nReplicatedStorage/\n  Remotes/",
  files: [
    {
      path: "ServerScriptService/Checkpoints.server.luau",
      runs_on: "server",
      purpose: "Simpan checkpoint pemain (DataStore + retry)",
      content: '--!strict\nlocal DataStoreService = game:GetService("DataStoreService")\nlocal store = DataStoreService:GetDataStore("Checkpoints")\n-- (contoh mode demo)\n',
    },
  ],
  security_measures: ["Checkpoint divalidasi di server berdasarkan posisi"],
  monetization: [{ type: "cosmetic", name: "Jejak Pelangi", price_robux: 49, description: "Efek jejak kosmetik", fairness_note: "Murni kosmetik" }],
  studio_steps: ["Buat place baru", "Salin script ke folder yang sesuai"],
  design_doc_markdown: "# Duo Obby\n\nDokumen desain contoh (mode demo).",
};

export const MOCK: Record<string, unknown> = {
  scout: trendReport,
  kobbie: {
    items: [
      shirt("Retro Stripe Tee", "Retro Stripe", ["#1e3a5f", "#f2e8cf", "#e07a5f"], "pendek", true),
      shirt("Pastel Dream Longsleeve", "Y2K Pastel", ["#f7c6d9", "#bde0fe", "#ffffff"], "panjang", false),
      shirt("Earth Trail Tank", "Gorpcore Earth Tone", ["#6b705c", "#a5a58d", "#cb997e"], "tanpa_lengan", false),
    ],
  },
  bruno: { items: [ugc("Trail Shell Jacket", "Jacket")] },
  sesko: { items: [ugc("Trail Cargo Pants", "Pants", { pairs_with: ["Trail Shell Jacket"], bundle_name: "Trail Set" })] },
  dalot: { game },
  qa: { verdict: "pass", quality_score: 7, issues: [{ severity: "info", category: "quality", detail: "Mode demo: hasil QA contoh" }], summary: "Lolos (mode demo)" },
};
