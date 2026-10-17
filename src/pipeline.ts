import fs from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import * as agents from "./agents/index.js";
import type * as S from "./agents/schemas.js";
import { config } from "./config.js";
import { logActivity, q } from "./lib/db.js";
import { generateImage } from "./lib/images.js";
import { notify } from "./lib/notify.js";
import { checkClassicShirtPng, checkListingText, hasBlocker, type RuleFinding } from "./roblox/rules.js";
import { composeClassicShirt } from "./roblox/template.js";
import { collectTrendData } from "./trends/sources.js";

type Kind = "classic_shirt" | "ugc_shirt" | "ugc_pants" | "game";
type Agent = "kobbie" | "bruno" | "sesko" | "dalot";

const AGENT_OF: Record<Kind, Agent> = { classic_shirt: "kobbie", ugc_shirt: "bruno", ugc_pants: "sesko", game: "dalot" };

async function saveFile(itemId: number, name: string, content: Buffer | string): Promise<string> {
  const rel = path.posix.join("items", String(itemId), name);
  const abs = path.join(config.storageDir, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content);
  return rel;
}

async function insertItem(cycleId: number | null, kind: Kind, name: string, data: unknown, extra: { revisionOf?: number; bundleKey?: string } = {}) {
  const [row] = await q<{ id: number }>(
    `insert into items (cycle_id, agent, kind, name, data, revision_of, bundle_key)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [cycleId, AGENT_OF[kind], kind, name, JSON.stringify(data), extra.revisionOf ?? null, extra.bundleKey ?? null],
  );
  return row.id;
}

// ---------- Produksi file per jenis karya ----------

async function buildClassicShirt(id: number, s: z.infer<typeof S.ClassicShirt>) {
  const fabric = await generateImage(s.texture_prompt, 1024, s.palette_hex);
  const front = s.front_graphic_prompt ? await generateImage(s.front_graphic_prompt, 512, s.palette_hex.slice(1)) : null;
  const back = s.back_graphic_prompt ? await generateImage(s.back_graphic_prompt, 512, s.palette_hex.slice(1)) : null;
  const png = await composeClassicShirt({ fabric, frontGraphic: front, backGraphic: back, sleeveStyle: s.sleeve_style });

  const files = [await saveFile(id, "shirt.png", png), await saveFile(id, "fabric.png", fabric)];
  const findings = [
    ...(await checkClassicShirtPng(png)),
    ...checkListingText({ ...s, prompts: [s.texture_prompt, s.front_graphic_prompt, s.back_graphic_prompt] }),
  ];
  return { files, findings };
}

async function buildUgc(id: number, u: z.infer<typeof S.UgcShirt> | z.infer<typeof S.UgcPants>) {
  // Hanya color map yang digenerate; normal & roughness lebih baik di-bake di Blender dari mesh final.
  const color = await generateImage(u.pbr_textures.color_prompt, 1024, []);
  const brief = [
    `# ${u.name} (${u.category}, ${u.target})`,
    `\n## Bentuk 3D\n- Siluet: ${u.shape_3d.silhouette}\n- Panjang: ${u.shape_3d.length}\n- Potongan: ${u.shape_3d.cut}\n- Aksesori: ${u.shape_3d.accessories.join(", ") || "-"}`,
    `\n## Tekstur PBR (${u.pbr_textures.resolution})\n- Color: ${u.pbr_textures.color_prompt}\n- Normal: ${u.pbr_textures.normal_prompt}\n- Roughness: ${u.pbr_textures.roughness_prompt}`,
    `\n## Brief Blender\n- Triangle budget: ${u.blender_brief.triangle_budget}\n- Cage: ${u.blender_brief.cage_notes}\n- Attachment: ${u.blender_brief.attachment_points.join(", ")}\n- UV: ${u.blender_brief.uv_notes}\n\n${u.blender_brief.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    `\n## ⚠️ WAJIB dicek manual\n${u.manual_checks.map((c) => `- [ ] ${c}`).join("\n")}`,
    `\n## Marketplace\n${u.marketplace_description}\n\nTag: ${u.tags.join(", ")} · Harga: ${u.price_robux} Robux`,
  ].join("\n");

  const files = [await saveFile(id, "color_1024.png", color), await saveFile(id, "blender-brief.md", brief)];
  const findings: RuleFinding[] = checkListingText({ ...u, prompts: [u.pbr_textures.color_prompt] });
  // Batas konservatif; cek ulang angka resmi Roblox untuk layered clothing.
  if (u.blender_brief.triangle_budget > 4000)
    findings.push({ severity: "warn", rule: "triangles", detail: `Budget ${u.blender_brief.triangle_budget} triangle, verifikasi batas layered clothing` });
  return { files, findings };
}

async function buildGame(id: number, g: z.infer<typeof S.GameConcept>) {
  const files = [await saveFile(id, "DESIGN.md", g.design_doc_markdown)];
  for (const f of g.files) {
    // Path dari model diperlakukan sebagai input tak tepercaya: buang "..", path absolut, dan karakter aneh.
    const safe = f.path.split(/[\\/]+/).filter((p) => p && p !== ".." && p !== ".").map((p) => p.replace(/[^\w.\- ]/g, "_")).join("/");
    if (safe) files.push(await saveFile(id, path.posix.join("src", safe), f.content));
  }
  const findings: RuleFinding[] = [];
  const serverFiles = g.files.filter((f) => f.runs_on === "server").length;
  if (serverFiles === 0) findings.push({ severity: "block", rule: "server_authority", detail: "Tidak ada script server" });
  if (!g.files.some((f) => /DataStoreService/.test(f.content)))
    findings.push({ severity: "warn", rule: "datastore", detail: "Tidak ada penggunaan DataStoreService" });
  for (const m of g.monetization) findings.push(...checkListingText({ name: m.name, marketplace_description: m.description, tags: Array(5).fill(""), price_robux: m.price_robux }).filter((x) => x.rule !== "price"));
  return { files, findings };
}

// ---------- QA ----------

async function produceAndCheck(id: number, kind: Kind, data: any) {
  try {
    const { files, findings } =
      kind === "classic_shirt" ? await buildClassicShirt(id, data)
      : kind === "game" ? await buildGame(id, data)
      : await buildUgc(id, data);

    const qa = await agents.qualityCheck(kind, data, findings);
    const failed = hasBlocker(findings) || qa.verdict === "fail";
    const status = failed ? "qa_failed" : "pending_review";
    await q(`update items set files=$2, rule_check=$3, qa=$4, status=$5, updated_at=now() where id=$1`, [
      id, JSON.stringify(files), JSON.stringify(findings), JSON.stringify(qa), status,
    ]);
    await logActivity("qa", `${data.name ?? data.title}: ${failed ? "gagal QA" : "lolos QA, menunggu review admin"} (skor ${qa.quality_score}/10)`, id);
  } catch (err) {
    await q(`update items set status='qa_failed', qa=$2, updated_at=now() where id=$1`, [
      id, JSON.stringify({ verdict: "fail", error: (err as Error).message }),
    ]);
    await notify(`❌ Item #${id} gagal diproses: ${(err as Error).message}`);
  }
}

// ---------- Siklus 24 jam ----------

let running = false;

export async function runCycle() {
  if (running) {
    console.log("Siklus sebelumnya masih berjalan, dilewati.");
    return;
  }
  running = true;
  const [{ id: cycleId }] = await q<{ id: number }>("insert into cycles default values returning id");
  try {
    await logActivity("scout", "Mulai riset tren...");
    const trends = await agents.trendScout(await collectTrendData());
    await q("update cycles set trend_report=$2 where id=$1", [cycleId, JSON.stringify(trends)]);
    await logActivity("scout", `Menemukan ${trends.fashion_trends.length} tren fashion & ${trends.game_trends.length} tren game`);

    // Kobbie, Bruno, DALOT berjalan paralel; Sesko menunggu Bruno supaya bawahannya bisa jadi satu set.
    const results = await Promise.allSettled([
      agents.kobbie(trends).then(async (out) => {
        for (const s of out.items) {
          const id = await insertItem(cycleId, "classic_shirt", s.name, s);
          await logActivity("kobbie", `Mendesain classic shirt "${s.name}"`, id);
          await produceAndCheck(id, "classic_shirt", s);
        }
      }),
      agents.bruno(trends).then(async (out) => {
        const bundleKey = `cycle-${cycleId}`;
        const brunoIds: number[] = [];
        for (const u of out.items) {
          const id = await insertItem(cycleId, "ugc_shirt", u.name, u, { bundleKey });
          brunoIds.push(id);
          await logActivity("bruno", `Membuat konsep 3D ${u.category.toLowerCase()} "${u.name}"`, id);
        }
        const seskoOut = await agents.sesko(trends, out.items);
        const seskoJobs = seskoOut.items.map(async (p) => {
          const id = await insertItem(cycleId, "ugc_pants", p.name, p, { bundleKey });
          await logActivity("sesko", `Membuat konsep 3D ${p.category.toLowerCase()} "${p.name}" (pasangan: ${p.pairs_with.join(", ") || "-"})`, id);
          await produceAndCheck(id, "ugc_pants", p);
        });
        await Promise.all([...out.items.map((u, i) => produceAndCheck(brunoIds[i], "ugc_shirt", u)), ...seskoJobs]);
      }),
      agents.dalot(trends).then(async (out) => {
        const id = await insertItem(cycleId, "game", out.game.title, out.game);
        await logActivity("dalot", `Mengusulkan game "${out.game.title}" (${out.game.genre})`, id);
        await produceAndCheck(id, "game", out.game);
      }),
    ]);

    const errors = results.flatMap((r, i) => (r.status === "rejected" ? [`${["kobbie", "bruno/sesko", "dalot"][i]}: ${r.reason?.message ?? r.reason}`] : []));
    await q("update cycles set status=$2, finished_at=now(), error=$3 where id=$1", [cycleId, errors.length ? "failed" : "done", errors.join("\n") || null]);

    const [{ n }] = await q<{ n: number }>("select count(*)::int n from items where cycle_id=$1 and status='pending_review'", [cycleId]);
    await notify(`✅ Siklus #${cycleId} selesai. ${n} karya menunggu review di ${config.publicBaseUrl}/admin.html` + (errors.length ? `\n⚠️ ${errors.join("\n")}` : ""));
  } catch (err) {
    await q("update cycles set status='failed', finished_at=now(), error=$2 where id=$1", [cycleId, (err as Error).message]);
    await notify(`❌ Siklus #${cycleId} gagal: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

// ---------- Revisi dari dashboard admin ----------

export async function reviseItem(itemId: number, adminNote: string) {
  const [item] = await q("select * from items where id=$1", [itemId]);
  if (!item) throw new Error("Item tidak ditemukan");
  const [cycle] = await q("select trend_report from cycles where id=$1", [item.cycle_id]);
  const trends = (cycle?.trend_report ?? { fashion_trends: [], game_trends: [], member_feedback_summary: "", notes: "" }) as S.TrendReport;
  const revision = { previous: item.data, adminNote };
  const kind = item.kind as Kind;

  await q("update items set status='revision_requested', admin_note=$2, updated_at=now() where id=$1", [itemId, adminNote]);
  await logActivity(AGENT_OF[kind], `Merevisi "${item.name}" sesuai catatan admin`, itemId);

  let data: any;
  if (kind === "classic_shirt") data = (await agents.kobbie(trends, revision)).items[0];
  else if (kind === "ugc_shirt") data = (await agents.bruno(trends, revision)).items[0];
  else if (kind === "ugc_pants") data = (await agents.sesko(trends, [], revision)).items[0];
  else data = (await agents.dalot(trends, revision)).game;
  if (!data) throw new Error("Agent tidak mengembalikan hasil revisi");
  // Mode demo tidak benar-benar merevisi; kembalikan karya yang sama supaya alurnya tetap masuk akal.
  if (config.demoMode) data = item.data;

  const newId = await insertItem(item.cycle_id, kind, data.name ?? data.title, data, { revisionOf: itemId, bundleKey: item.bundle_key });
  await produceAndCheck(newId, kind, data);
  return newId;
}
