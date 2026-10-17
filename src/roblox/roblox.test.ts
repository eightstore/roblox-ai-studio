import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { placeholderTexture } from "../lib/images.js";
import { checkClassicShirtPng, checkListingText, hasBlocker } from "./rules.js";
import { LEFT_ARM, RIGHT_ARM, TEMPLATE_H, TEMPLATE_W, TORSO, composeClassicShirt } from "./template.js";

test("semua panel template berada di dalam 585x559 dan tidak saling tumpang tindih", () => {
  const regions = [...Object.values(TORSO), ...Object.values(RIGHT_ARM), ...Object.values(LEFT_ARM)];
  for (const r of regions) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= TEMPLATE_W && r.y + r.h <= TEMPLATE_H, JSON.stringify(r));
  }
  for (let i = 0; i < regions.length; i++)
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i], b = regions[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.ok(!overlap, `${JSON.stringify(a)} tumpang tindih ${JSON.stringify(b)}`);
    }
});

test("composeClassicShirt menghasilkan PNG 585x559 yang lolos cek", async () => {
  const fabric = await placeholderTexture(1024, ["#1e3a5f", "#f2e8cf"]);
  for (const sleeveStyle of ["panjang", "pendek", "tanpa_lengan"] as const) {
    const png = await composeClassicShirt({ fabric, frontGraphic: await placeholderTexture(512, ["#c1121f"]), sleeveStyle });
    assert.deepEqual(await checkClassicShirtPng(png), []);
    // Torso depan berisi, sudut kiri atas (di luar panel) transparan.
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
    assert.equal(alpha(0, 0), 0);
    assert.equal(alpha(TORSO.front.x + 64, TORSO.front.y + 64), 255);
    const sleeveBottom = alpha(RIGHT_ARM.front.x + 32, RIGHT_ARM.front.y + 120);
    assert.equal(sleeveBottom, sleeveStyle === "panjang" ? 255 : 0);
  }
});

test("cek listing menangkap merek, panjang teks, dan spam", () => {
  const ok = { name: "Pastel Cloud Tee", marketplace_description: "Kaos pastel lembut.", tags: ["a", "b", "c", "d", "e"], price_robux: 10 };
  assert.deepEqual(checkListingText(ok), []);
  assert.ok(hasBlocker(checkListingText({ ...ok, name: "Nike Style Hoodie" })));
  assert.ok(hasBlocker(checkListingText({ ...ok, name: "x".repeat(41) })));
  assert.ok(hasBlocker(checkListingText({ ...ok, marketplace_description: "FREE ROBUX inside" })));
  // Kata yang kebetulan mengandung nama merek tidak boleh ikut terblokir.
  assert.ok(!hasBlocker(checkListingText({ ...ok, name: "Supremely Soft Knit" })));
});
