import sharp, { type OverlayOptions } from "sharp";

/**
 * Tata letak template Classic Shirt Roblox 585x559 (koordinat kiri-atas, lebar, tinggi).
 * Sumber: template resmi Roblox — cocokkan sekali dengan template terbaru di Creator Hub sebelum produksi.
 */
export const TEMPLATE_W = 585;
export const TEMPLATE_H = 559;

type Region = { x: number; y: number; w: number; h: number };

export const TORSO: Record<"up" | "left" | "front" | "right" | "back" | "down", Region> = {
  up: { x: 231, y: 8, w: 128, h: 64 },
  left: { x: 165, y: 74, w: 64, h: 128 },
  front: { x: 231, y: 74, w: 128, h: 128 },
  right: { x: 361, y: 74, w: 64, h: 128 },
  back: { x: 427, y: 74, w: 128, h: 128 },
  down: { x: 231, y: 204, w: 128, h: 64 },
};

// Lengan kanan karakter ada di sisi kiri gambar, lengan kiri di sisi kanan.
export const RIGHT_ARM: Record<"up" | "left" | "back" | "right" | "front" | "down", Region> = {
  up: { x: 217, y: 289, w: 64, h: 64 },
  left: { x: 19, y: 355, w: 64, h: 128 },
  back: { x: 85, y: 355, w: 64, h: 128 },
  right: { x: 151, y: 355, w: 64, h: 128 },
  front: { x: 217, y: 355, w: 64, h: 128 },
  down: { x: 217, y: 485, w: 64, h: 64 },
};

export const LEFT_ARM: Record<"up" | "front" | "left" | "back" | "right" | "down", Region> = {
  up: { x: 308, y: 289, w: 64, h: 64 },
  front: { x: 308, y: 355, w: 64, h: 128 },
  left: { x: 374, y: 355, w: 64, h: 128 },
  back: { x: 440, y: 355, w: 64, h: 128 },
  right: { x: 506, y: 355, w: 64, h: 128 },
  down: { x: 308, y: 485, w: 64, h: 64 },
};

async function crop(texture: Buffer, r: Region, offset: { x: number; y: number }) {
  // Tekstur di-skala ke 512 lalu dipotong di posisi berbeda per panel supaya pola tidak terlihat identik.
  return sharp(texture)
    .resize(512, 512, { fit: "cover" })
    .extract({ left: offset.x % (512 - r.w), top: offset.y % (512 - r.h), width: r.w, height: r.h })
    .png()
    .toBuffer();
}

/**
 * Susun tekstur kain (+ grafis depan/belakang opsional) menjadi PNG template classic shirt.
 * Area di luar panel dibiarkan transparan, seperti template resmi.
 */
export async function composeClassicShirt(opts: {
  fabric: Buffer;
  sleeveFabric?: Buffer; // default sama dengan fabric
  frontGraphic?: Buffer | null;
  backGraphic?: Buffer | null;
  sleeveStyle: "panjang" | "pendek" | "tanpa_lengan";
}): Promise<Buffer> {
  const layers: OverlayOptions[] = [];
  let i = 0;
  for (const r of Object.values(TORSO)) {
    layers.push({ input: await crop(opts.fabric, r, { x: 37 * i, y: 53 * i }), left: r.x, top: r.y });
    i++;
  }

  if (opts.sleeveStyle !== "tanpa_lengan") {
    const sleeve = opts.sleeveFabric ?? opts.fabric;
    for (const arm of [RIGHT_ARM, LEFT_ARM]) {
      for (const r of Object.values(arm)) {
        let input = await crop(sleeve, r, { x: 29 * i, y: 41 * i });
        // Lengan pendek: hanya bagian atas panel samping yang berkain, sisanya transparan (kulit avatar terlihat).
        if (opts.sleeveStyle === "pendek" && r.h === 128) {
          input = await sharp({ create: { width: r.w, height: r.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite([{ input: await sharp(input).extract({ left: 0, top: 0, width: r.w, height: 48 }).toBuffer(), left: 0, top: 0 }])
            .png()
            .toBuffer();
        } else if (opts.sleeveStyle === "pendek" && r === arm.down) {
          continue;
        }
        layers.push({ input, left: r.x, top: r.y });
        i++;
      }
    }
  }

  for (const [graphic, r] of [
    [opts.frontGraphic, TORSO.front],
    [opts.backGraphic, TORSO.back],
  ] as const) {
    if (!graphic) continue;
    const g = await sharp(graphic).resize(r.w - 24, r.h - 24, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    layers.push({ input: g, left: r.x + 12, top: r.y + 12 });
  }

  return sharp({
    create: { width: TEMPLATE_W, height: TEMPLATE_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(layers)
    .png()
    .toBuffer();
}
