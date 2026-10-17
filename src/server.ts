import fs from "node:fs/promises";
import path from "node:path";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { logActivity, q } from "./lib/db.js";
import { notify } from "./lib/notify.js";
import { reviseItem, runCycle } from "./pipeline.js";
import { uploadClassicShirt } from "./roblox/openCloud.js";

export const AGENT_PROFILES = [
  { id: "scout", name: "Trend Scout", role: "Riset tren Pinterest, TikTok & Roblox Marketplace" },
  { id: "kobbie", name: "Kobbie", role: "Desainer Classic Shirt" },
  { id: "bruno", name: "Bruno", role: "Desainer UGC 3D atasan" },
  { id: "sesko", name: "Sesko", role: "Desainer UGC 3D bawahan" },
  { id: "dalot", name: "DALOT", role: "Game developer Luau" },
];

export function buildServer() {
  const app = Fastify({ logger: { level: "warn" } });

  // storage/ sengaja tidak disajikan statis: publik hanya lihat preview item published, admin lewat /api/admin/files.
  app.register(fastifyStatic, { root: path.resolve("public") });

  // ---------- Publik (website komunitas) ----------

  app.get("/api/agents", async () => {
    const stats = await q(
      `select agent, count(*) filter (where status='published')::int as published, count(*)::int as total
         from items group by agent`,
    );
    return AGENT_PROFILES.map((p) => ({ ...p, ...(stats.find((s) => s.agent === p.id) ?? { published: 0, total: 0 }) }));
  });

  app.get("/api/items", async () =>
    q(
      `select i.id, i.agent, i.kind, i.name, i.roblox_asset_id, i.bundle_key, i.published_at,
              i.data->>'marketplace_description' as description, i.data->'tags' as tags,
              coalesce(sum(v.value),0)::int as score
         from items i left join votes v on v.item_id=i.id
        where i.status='published' group by i.id order by i.published_at desc limit 100`,
    ),
  );

  app.get<{ Params: { id: string } }>("/api/items/:id/preview", async (req, reply) => {
    const [item] = await q("select files from items where id=$1 and status='published'", [req.params.id]);
    const file = (item?.files as string[] | undefined)?.find((f) => f.endsWith(".png"));
    if (!file) return reply.code(404).send();
    return reply.type("image/png").send(await fs.readFile(path.join(config.storageDir, file)));
  });

  app.post<{ Params: { id: string }; Body: { member_id: string; value: 1 | -1 } }>("/api/items/:id/vote", async (req, reply) => {
    // TODO sebelum produksi: ganti member_id dari body dengan identitas login (mis. OAuth Roblox) supaya vote tidak bisa dipalsukan.
    const { member_id, value } = req.body ?? ({} as any);
    if (!member_id || ![1, -1].includes(value)) return reply.code(400).send({ error: "member_id & value (1/-1) wajib" });
    await q(
      `insert into votes (item_id, member_id, value) select id, $2, $3 from items where id=$1 and status='published'
       on conflict (item_id, member_id) do update set value=excluded.value, created_at=now()`,
      [req.params.id, member_id, value],
    );
    return { ok: true };
  });

  app.get("/api/activity", async () =>
    q("select at, actor, message, item_id from activity_log where public order by at desc limit 50"),
  );

  // ---------- Admin ----------

  const requireAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!config.adminToken || req.headers.authorization !== `Bearer ${config.adminToken}`) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  };

  app.register(async (admin) => {
    admin.addHook("onRequest", requireAdmin);

    admin.get<{ Querystring: { status?: string } }>("/api/admin/items", async (req) =>
      q(
        `select id, cycle_id, agent, kind, name, status, data, files, rule_check, qa, admin_note, revision_of,
                bundle_key, roblox_asset_id, created_at
           from items where ($1::text is null or status=$1) order by id desc limit 200`,
        [req.query.status ?? null],
      ),
    );

    admin.get<{ Querystring: { path: string } }>("/api/admin/files", async (req, reply) => {
      const abs = path.resolve(config.storageDir, req.query.path ?? "");
      if (!abs.startsWith(config.storageDir + path.sep)) return reply.code(400).send();
      return reply.sendFile(path.relative(config.storageDir, abs), config.storageDir);
    });

    admin.post<{ Params: { id: string } }>("/api/admin/items/:id/approve", async (req, reply) => {
      const [item] = await q("select * from items where id=$1", [req.params.id]);
      if (!item) return reply.code(404).send();
      if (!["pending_review", "qa_failed", "publish_failed"].includes(item.status))
        return reply.code(409).send({ error: `Status ${item.status} tidak bisa di-approve` });

      await q("update items set status='approved', updated_at=now() where id=$1", [item.id]);
      await logActivity("admin", `Menyetujui "${item.name}"`, item.id);

      // Classic shirt bisa auto-upload; UGC & game difinalisasi manusia di Blender/Studio lalu ditandai published.
      if (item.kind === "classic_shirt" && config.robloxAutoUpload) {
        try {
          const png = await fs.readFile(path.join(config.storageDir, (item.files as string[]).find((f) => f.endsWith("shirt.png"))!));
          const { assetId } = await uploadClassicShirt({ png, name: item.name, description: item.data.marketplace_description });
          await q("update items set status='published', roblox_asset_id=$2, published_at=now() where id=$1", [item.id, assetId]);
          await logActivity("system", `"${item.name}" terbit di grup (asset ${assetId})`, item.id);
          return { status: "published", assetId };
        } catch (err) {
          await q("update items set status='publish_failed', admin_note=$2 where id=$1", [item.id, (err as Error).message]);
          await notify(`❌ Upload "${item.name}" gagal: ${(err as Error).message}`);
          return reply.code(502).send({ error: (err as Error).message });
        }
      }
      return { status: "approved" };
    });

    admin.post<{ Params: { id: string }; Body: { note: string } }>("/api/admin/items/:id/revise", async (req, reply) => {
      if (!req.body?.note) return reply.code(400).send({ error: "Catatan revisi wajib diisi" });
      // Revisi memanggil agent (bisa beberapa menit) — jalankan di background.
      reviseItem(Number(req.params.id), req.body.note).catch((err) => notify(`❌ Revisi #${req.params.id} gagal: ${err.message}`));
      return { status: "revision_requested" };
    });

    admin.post<{ Params: { id: string }; Body: { note?: string } }>("/api/admin/items/:id/reject", async (req) => {
      await q("update items set status='rejected', admin_note=$2, updated_at=now() where id=$1", [req.params.id, req.body?.note ?? null]);
      await logActivity("admin", `Menolak item #${req.params.id}`, Number(req.params.id), false);
      return { status: "rejected" };
    });

    // Setelah upload manual (classic) atau finalisasi Blender/Studio (UGC & game).
    admin.post<{ Params: { id: string }; Body: { roblox_asset_id: string } }>("/api/admin/items/:id/published", async (req, reply) => {
      if (!req.body?.roblox_asset_id) return reply.code(400).send({ error: "roblox_asset_id wajib" });
      const [item] = await q(
        "update items set status='published', roblox_asset_id=$2, published_at=now(), updated_at=now() where id=$1 and status='approved' returning name",
        [req.params.id, req.body.roblox_asset_id],
      );
      if (!item) return reply.code(409).send({ error: "Item harus berstatus approved" });
      await logActivity("system", `"${item.name}" terbit`, Number(req.params.id));
      return { status: "published" };
    });

    admin.post("/api/admin/cycle", async () => {
      runCycle().catch((err) => notify(`❌ Siklus manual gagal: ${err.message}`));
      return { started: true };
    });
  });

  return app;
}
