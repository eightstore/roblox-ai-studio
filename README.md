# Studio AI Komunitas Roblox

Backend 24 jam untuk alur: **Trend Scout → Kobbie / Bruno / Sesko / DALOT → Quality & Safety Check → Dashboard Admin → Publish → Website komunitas → voting kembali ke Trend Scout.**

```
src/
  index.ts            server + penjadwal cron (atau --once untuk 1 siklus)
  pipeline.ts         siklus 24 jam, produksi file, QA, revisi
  server.ts           API publik (website) + API admin (approve/revisi/tolak/publish)
  agents/prompts.ts   prompt dasar + 4 karyawan + Scout + QA
  agents/schemas.ts   skema JSON output tiap agent (structured outputs, selalu valid)
  trends/sources.ts   Roblox Marketplace + data/fashion-seeds.json + data/game-seeds.json + vote member
  roblox/template.ts  menyusun tekstur ke template Classic Shirt 585x559
  roblox/rules.ts     cek otomatis: ukuran PNG, panjang nama/deskripsi, tag, kata merek & spam
  roblox/openCloud.ts upload ke grup via Open Cloud
public/index.html     website komunitas (karya, profil AI, voting, log)
public/admin.html     dashboard admin
db/schema.sql         tabel cycles, items, votes, activity_log
```

## Menjalankan

> **Pemula / uji di laptop:** instal Node.js, lalu klik dua kali **`mulai.bat`** (Windows) atau **`mulai.command`** (Mac). Panduan lengkap ada di [PANDUAN-LOKAL.md](PANDUAN-LOKAL.md).
> Tanpa `ANTHROPIC_API_KEY`, proyek berjalan dalam mode demo (gratis). Tanpa `DATABASE_URL`, database bawaan dibuat otomatis di `storage/database`.

```bash
npm install
cp .env.example .env          # isi ANTHROPIC_API_KEY, ADMIN_TOKEN (DATABASE_URL opsional)
npm run run-once              # uji 1 siklus penuh
npm start                     # server + jadwal harian (CYCLE_CRON)
```

- Website: `http://localhost:3000/` · Admin: `http://localhost:3000/admin.html` (masukkan `ADMIN_TOKEN`)
- `npm test` menguji template 585x559 dan cek aturan. Tes ini tidak memanggil API berbayar.

## Bedanya dengan rencana awal

1. **Classic shirt tidak digambar langsung sebagai template.** Generator gambar hampir tidak pernah tepat menaruh panel UV. Jadi Kobbie meminta *tekstur kain* (+ grafis depan/belakang opsional), lalu `template.ts` memotongnya ke 18 panel (torso, lengan kanan, lengan kiri). Hasilnya selalu 585x559 dan bisa diupload. Lengan panjang, pendek, dan tanpa lengan didukung.
2. **JSON dijamin valid.** Agent memakai *structured outputs* dengan skema Zod. Kalimat "tanpa teks tambahan" tidak diperlukan, dan JSON rusak tidak membuat siklus gagal.
3. **Ada dua lapis cek.** Pertama cek deterministik yang murah (ukuran, panjang teks, daftar merek, spam), lalu QA AI. Item yang gagal tetap tampil di dashboard dengan status `qa_failed`, jadi kamu bisa minta revisi alih-alih kehilangan item itu.
4. **Revisi adalah loop nyata.** Tombol *Revisi* + catatan mengirim karya lama dan catatanmu ke agent yang sama. Hasilnya menjadi item baru (`revision_of`) dan lewat QA lagi.
5. **Bruno → Sesko berjalan berurutan.** Sesko menerima item Bruno siklus itu, dan keduanya diberi `bundle_key` yang sama untuk dijual sebagai set.
6. **UGC tidak menggenerate normal/roughness map.** Hasilnya lebih baik kalau di-bake di Blender dari mesh final. Yang dibuat adalah color map 1024 + `blender-brief.md` dengan checklist manual.
7. **Kode DALOT ditulis ke `storage/items/<id>/src/…`.** Path dari model dibersihkan dulu (tidak bisa keluar folder). Kode tidak pernah dijalankan otomatis.

## ⚠️ Wajib dicek sebelum produksi

| Hal | Kenapa |
|---|---|
| **Open Cloud mendukung `assetType: "Shirt"`?** | Saya tidak bisa membuka docs Roblox dari lingkungan ini. Cek *Assets API → supported asset types*. Kalau belum didukung, biarkan `ROBLOX_AUTO_UPLOAD=false`: approve → upload manual PNG di Creator Hub → tombol *Tandai terbit* + asset ID. |
| **Harga & on-sale** | Kode tidak mengatur harga atau memasang item di Marketplace. Lakukan di Creator Hub (ada biaya Robux per upload). |
| **Koordinat template** | `template.ts` memakai layout standar 585x559. Cocokkan sekali dengan template resmi terbaru. |
| **Batas triangle layered clothing** | Brief memberi peringatan di atas 4.000. Verifikasi angka resmi terbaru. |
| **URL Roblox Catalog** | Endpoint web publik bisa berubah. Override dengan `ROBLOX_CATALOG_URLS`. Error sumber tercatat di laporan tren dan tidak menghentikan siklus. |
| **Pinterest / TikTok** | Belum ada integrasi API. Isi `data/fashion-seeds.json` dari scraper atau secara manual. Patuhi ToS masing-masing platform. |
| **Voting** | `member_id` masih dari browser, jadi bisa dipalsukan. Ganti dengan login (mis. OAuth Roblox) sebelum hasil vote dipakai serius. |
| **Syarat akun** | Cek syarat terbaru untuk menjual classic clothing atas nama grup dan untuk akses UGC 3D (verifikasi, biaya publish, izin role grup). |

## Deploy 24 jam

- **VPS / Railway / Render:** `npm start` (Node 22+). Simpan `storage/` di volume persisten, atau ganti `saveFile` di `pipeline.ts` dengan Supabase Storage.
- **Database:** connection string Supabase di `DATABASE_URL` (SSL otomatis).
- **Monitoring:** `DISCORD_WEBHOOK_URL` menerima notifikasi siklus selesai, item gagal, dan upload gagal. Tambahkan UptimeRobot ke `/api/activity`.
- **Next.js / Vercel:** `public/*.html` cukup untuk mulai. Untuk website yang lebih bagus, panggil API yang sama (`/api/items`, `/api/agents`, `/api/activity`, `/api/items/:id/vote`) dari Next.js.

## Biaya per siklus (perkiraan kasar)

Satu siklus = 1 Scout + Kobbie + Bruno + Sesko + DALOT + ±9 QA. Pemanggilan dengan output paling besar adalah DALOT (kode). System prompt di-cache. Ukur `usage` setelah beberapa siklus sebelum menurunkan model/effort. `effort` per agent bisa diatur di `src/agents/index.ts`, dan modelnya lewat `CLAUDE_MODEL`.
