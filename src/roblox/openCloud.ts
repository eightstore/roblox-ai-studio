import { config } from "../config.js";

/**
 * Upload aset atas nama grup via Open Cloud Assets API.
 *
 * PENTING: cek di Creator Hub (Open Cloud > Assets API > "Supported asset types") bahwa tipe
 * "Shirt" didukung untuk API key-mu sebelum menyalakan ROBLOX_AUTO_UPLOAD. Kalau belum didukung,
 * biarkan false: item approved tetap muncul di dashboard dengan PNG siap upload manual.
 * Memasang harga & menjual di Marketplace (biaya upload Robux) dilakukan di Creator Hub.
 */
const BASE = "https://apis.roblox.com/assets/v1";

export async function uploadClassicShirt(opts: {
  png: Buffer;
  name: string;
  description: string;
}): Promise<{ assetId: string }> {
  if (!config.robloxApiKey || !config.robloxGroupId) throw new Error("ROBLOX_API_KEY / ROBLOX_GROUP_ID belum diisi");

  const form = new FormData();
  form.append(
    "request",
    JSON.stringify({
      assetType: "Shirt",
      displayName: opts.name,
      description: opts.description,
      creationContext: { creator: { groupId: config.robloxGroupId } },
    }),
  );
  form.append("fileContent", new Blob([new Uint8Array(opts.png)], { type: "image/png" }), "shirt.png");

  const res = await fetch(`${BASE}/assets`, {
    method: "POST",
    headers: { "x-api-key": config.robloxApiKey },
    body: form,
  });
  if (!res.ok) throw new Error(`Open Cloud ${res.status}: ${await res.text()}`);
  const op = (await res.json()) as { path: string; done?: boolean; response?: { assetId: string } };
  return { assetId: await waitForOperation(op) };
}

async function waitForOperation(op: { path: string; done?: boolean; response?: { assetId: string } }): Promise<string> {
  // Upload bersifat asinkron (moderasi). Poll operation sampai selesai, maksimal ~2 menit.
  for (let i = 0; i < 24 && !op.done; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${BASE}/${op.path}`, { headers: { "x-api-key": config.robloxApiKey } });
    if (!res.ok) throw new Error(`Open Cloud operation ${res.status}: ${await res.text()}`);
    op = (await res.json()) as typeof op;
  }
  if (!op.done || !op.response?.assetId) throw new Error(`Upload belum selesai (operation ${op.path}); cek manual di Creator Hub`);
  return op.response.assetId;
}
