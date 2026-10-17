# Uji coba di laptop (tanpa VPS)

Semua jalan di komputermu sendiri. Kalau `ANTHROPIC_API_KEY` dikosongkan, proyek berjalan dalam **MODE DEMO**: agent memakai contoh output, jadi **gratis**. Seluruh alur bisa dicoba: siklus → dashboard → approve/revisi/tolak → terbit → website → voting.

## 1. Pasang yang dibutuhkan (sekali saja)

- **Node.js 22 LTS**: https://nodejs.org (pilih "LTS").
- **Database**, pilih salah satu:
  - **A. Docker Desktop** (https://www.docker.com/products/docker-desktop): Postgres jalan dengan satu perintah.
  - **B. Supabase gratis** (https://supabase.com): tanpa instal apa pun, database di cloud.
- **Git** (opsional, untuk clone): https://git-scm.com. Bisa juga download ZIP dari GitHub.

## 2. Ambil kode

```bash
git clone https://github.com/eightstore/roblox-ai-studio.git
cd roblox-ai-studio
npm install
```

## 3. Siapkan konfigurasi

Salin `.env.example` menjadi `.env`:
- Windows (PowerShell): `copy .env.example .env`
- Mac/Linux: `cp .env.example .env`

Isi bawaannya sudah cocok untuk uji lokal (mode demo, token admin `admin123`).

## 4. Nyalakan database

**A. Docker:**
```bash
docker compose up -d
```

**B. Supabase:** buat project → **Project Settings → Database → Connection string (URI)** → salin ke `DATABASE_URL` di `.env` (ganti `[YOUR-PASSWORD]` dengan password project).

Lalu buat tabelnya:
```bash
npm run db:init
```

## 5. Jalankan

```bash
npm start
```

- Website komunitas: http://localhost:3000
- Dashboard admin: http://localhost:3000/admin.html → isi token `admin123` → **Muat**
- Klik **Jalankan siklus sekarang**. Dalam beberapa detik muncul 6 karya contoh (3 classic shirt, 1 jaket 3D, 1 celana 3D, 1 game).
- Coba **Approve**, lalu **Tandai terbit…** (isi asset ID sembarang, mis. `123`). Karya akan muncul di website dan bisa di-vote.
- File hasil (PNG shirt, brief Blender, script Luau) ada di folder `storage/items/<id>/`.

Untuk berhenti, tekan `Ctrl + C`. Data tetap tersimpan di database.

## 6. Pakai AI sungguhan

1. Buat API key di https://console.anthropic.com dan isi `ANTHROPIC_API_KEY` di `.env`.
2. Restart (`Ctrl + C`, lalu `npm start`). Pesan "MODE DEMO" tidak muncul lagi.
3. Tanpa `IMAGE_API_URL`, gambar tetap berupa placeholder garis-garis dari palet warna AI. Isi `IMAGE_API_URL` kalau sudah punya generator gambar.

Satu siklus nyata memanggil Claude sekitar 14 kali (DALOT paling besar). Cek pemakaian di console Anthropic setelah siklus pertama.

## Masalah umum

| Pesan | Solusi |
|---|---|
| `ECONNREFUSED ...5432` | Database belum jalan: `docker compose up -d`, atau cek `DATABASE_URL` Supabase. |
| `EADDRINUSE :3000` | Port dipakai aplikasi lain: ganti `PORT=3001` di `.env`. |
| Dashboard `unauthorized` | Token yang diketik harus sama dengan `ADMIN_TOKEN` di `.env`. |
| `catalog ...` di laporan tren | Endpoint Roblox Catalog gagal diakses. Tidak fatal, siklus tetap jalan. |

Jadwal otomatis (`CYCLE_CRON`, default jam 02:00) hanya jalan selama `npm start` aktif. Untuk 24 jam penuh nanti, pindahkan ke VPS/Railway.
