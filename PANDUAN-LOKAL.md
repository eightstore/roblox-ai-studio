# Panduan Pemula: Mencoba di Laptop Sendiri

Panduan ini untuk yang **belum pernah ngoding**. Kamu tidak butuh VPS, Docker, database online, atau API key. Biayanya **Rp0**.

Yang akan terjadi: aplikasi berjalan di laptopmu dalam **MODE DEMO**. Kelima AI (Trend Scout, Kobbie, Bruno, Sesko, DALOT) memakai contoh hasil kerja, jadi kamu bisa mencoba seluruh alurnya: buat karya → review di dashboard → approve → terbit di website → vote.

Waktu yang dibutuhkan: ±15 menit untuk pertama kali.

---

## Langkah 1 — Instal Node.js (sekali saja)

Node.js adalah program yang menjalankan aplikasi ini.

1. Buka **https://nodejs.org**
2. Klik tombol hijau bertuliskan **LTS** (misalnya "22.x.x LTS").
3. Buka file yang terdownload (`node-v22...msi` di Windows, `.pkg` di Mac).
4. Klik **Next → Next → Next → Install** sampai selesai. Semua pilihan biarkan bawaan.
5. **Restart laptop** supaya Node.js dikenali.

> Cara cek: buka **Command Prompt** (tekan tombol Windows, ketik `cmd`, Enter), ketik `node -v`, lalu Enter.
> Kalau muncul angka seperti `v22.12.0`, berarti berhasil.

---

## Langkah 2 — Download proyek dari GitHub

1. Buka **https://github.com/eightstore/roblox-ai-studio** (login GitHub kalau repo-nya private).
2. Klik tombol hijau **`<> Code`** → **Download ZIP**.
3. Buka folder **Downloads**, klik kanan file `roblox-ai-studio-main.zip` → **Extract All…** → **Extract**.
4. Pindahkan folder hasil extract ke tempat yang mudah, misalnya **`Documents\roblox-ai-studio-main`**.

> Penting: jalankan dari folder hasil **extract**, bukan dari dalam file ZIP.

---

## Langkah 3 — Jalankan

### Windows
1. Buka folder `roblox-ai-studio-main`.
2. **Klik dua kali `mulai.bat`.**
   - Kalau muncul layar biru *"Windows protected your PC"*, klik **More info → Run anyway**. File ini hanya menjalankan perintah `npm install` dan `npm start`. Isinya bisa kamu baca dengan klik kanan → Edit.
3. Jendela hitam terbuka. **Pertama kali** akan ada proses instal paket selama 1–3 menit (butuh internet). Tunggu saja.
4. Kalau sudah muncul tulisan:
   ```
   ✅ Siap! Buka di browser:
      Website komunitas : http://localhost:3000
      Dashboard admin   : http://localhost:3000/admin.html
   ```
   browser akan terbuka otomatis ke dashboard admin.

### Mac
1. Buka folder `roblox-ai-studio-main`.
2. **Klik kanan `mulai.command` → Open → Open** (pertama kali harus lewat klik kanan karena Mac memblokir file dari internet).
3. Tunggu sampai muncul tulisan **✅ Siap!**

> **Jangan tutup jendela hitam itu** selama mencoba. Menutupnya berarti mematikan aplikasi.

### Alternatif: lewat VS Code
Kalau kamu sudah memasang **VS Code** (https://code.visualstudio.com):

1. Buka VS Code → menu **File → Open Folder…** → pilih folder `roblox-ai-studio-main` → klik **Select Folder**.
   Kalau ditanya *"Do you trust the authors?"*, klik **Yes, I trust the authors**.
2. Buka terminal di dalam VS Code: menu **Terminal → New Terminal**. Panel terminal muncul di bawah.
3. **Pertama kali saja**, ketik perintah ini lalu Enter, dan tunggu 1–3 menit sampai selesai:
   ```
   npm install
   ```
   > Kalau di Windows muncul error merah *"running scripts is disabled on this system"*, klik panah kecil **∨** di samping tombol **+** pada panel terminal → pilih **Command Prompt**, lalu ketik `npm install` lagi.
4. Jalankan aplikasinya dengan salah satu cara berikut:
   - **Cara A (paling mudah):** tekan **F5**. Atau klik ikon **Run and Debug** (▶ dengan serangga) di bar kiri → pastikan terpilih **"▶ Mulai aplikasi"** → klik tombol hijau ▶.
   - **Cara B:** ketik `npm start` di terminal, lalu Enter.
5. Tunggu tulisan **✅ Siap!** di terminal. Dengan Cara A, browser terbuka otomatis. Dengan Cara B, **Ctrl + klik** link `http://localhost:3000/admin.html` di terminal.
6. **Mematikan:** Cara A → klik kotak merah ■ di toolbar atas (atau **Shift + F5**). Cara B → klik terminal, lalu tekan **Ctrl + C**.

File `.env` dibuat otomatis saat pertama kali dijalankan. Untuk mengubah pengaturan (API key, token admin), klik file `.env` di panel kiri VS Code, edit, simpan (**Ctrl + S**), lalu matikan dan jalankan ulang aplikasinya.

---

## Langkah 4 — Coba dashboard admin

Halaman: **http://localhost:3000/admin.html**

1. Di kotak **ADMIN_TOKEN** (kanan atas), ketik: **`admin123`**
2. Klik **Jalankan siklus sekarang** → klik **OK**.
3. Tunggu ±10 detik, lalu klik **Muat**.
4. Akan muncul **6 karya**:
   - 3 classic shirt dari **Kobbie** (ada gambar template 585×559)
   - 1 jaket 3D dari **Bruno** + 1 celana 3D dari **Sesko** (satu set)
   - 1 konsep game dari **DALOT**
5. Coba tombol-tombol ini:

| Tombol | Fungsinya |
|---|---|
| **Approve** | Setujui karya. Karya pindah ke filter "Approved". |
| **Revisi** | Tulis catatan di kotak teks dulu (mis. "warna lebih cerah"), lalu klik. Agent membuat versi baru. |
| **Tolak** | Buang karya. |
| **Tandai terbit…** | Muncul setelah approve (pilih filter **Approved (perlu finalisasi)**). Isi angka bebas, misalnya `123`. Karya akan tampil di website. |
| **File** / **Data JSON** | Lihat file hasil kerja agent dan data lengkapnya. |

---

## Langkah 5 — Lihat website komunitas

Halaman: **http://localhost:3000**

- Profil 5 karyawan AI dan jumlah karya yang terbit.
- Karya yang sudah kamu **Tandai terbit**, lengkap dengan tombol 👍 / 👎 untuk voting.
- Log aktivitas: siapa mengerjakan apa.

---

## Langkah 6 — Mematikan dan menyalakan lagi

- **Mematikan:** klik jendela hitam → tekan **Ctrl + C** (jika ditanya, ketik `Y` lalu Enter), atau tutup jendelanya.
- **Menyalakan lagi:** klik dua kali `mulai.bat` lagi. Kali ini langsung jalan tanpa instal ulang.
- Data karyamu **tetap tersimpan** di folder `storage\` dan tidak hilang saat dimatikan.
- **Reset ke awal (hapus semua karya uji coba):** matikan aplikasi, ketik `npm run reset` di terminal, lalu `npm start` lagi.

Hasil kerja agent bisa dibuka langsung di folder `storage\items\<nomor>\`: gambar `shirt.png`, `blender-brief.md`, script game `.luau`.

---

## Kalau ada masalah

| Yang terlihat | Solusinya |
|---|---|
| `Node.js belum terpasang` atau `'node' is not recognized` | Ulangi Langkah 1, lalu **restart laptop**. |
| Jendela hitam langsung tertutup | Buka `cmd`, ketik `cd ` (dengan spasi) lalu seret folder proyek ke jendela cmd, Enter. Ketik `mulai.bat`, Enter. Sekarang pesan errornya terlihat. |
| `npm install` gagal / `ERR!` | Cek koneksi internet, lalu jalankan `mulai.bat` lagi. Kalau masih gagal, hapus folder `node_modules` lalu coba lagi. |
| `EADDRINUSE` / port 3000 dipakai | Aplikasi sudah jalan di jendela lain. Tutup jendela itu dulu. Atau buka `.env` dengan Notepad, ubah `PORT=3000` jadi `PORT=3001`, lalu buka `http://localhost:3001/admin.html`. |
| Dashboard bilang `unauthorized` | Token salah. Ketik persis `admin123` (atau isi `ADMIN_TOKEN` di file `.env`). |
| Browser tidak terbuka otomatis | Buka manual: ketik `localhost:3000/admin.html` di Chrome. |
| Muncul tulisan `catalog ...` / error Roblox Catalog | Normal. Itu sumber tren dari internet yang gagal diakses, dan aplikasi tetap jalan. |

Masih bingung? Screenshot jendela hitamnya (bagian paling bawah) dan kirim ke saya.

---

## Gambar sungguhan dengan Gemini API

Tanpa ini, gambar kaos hanya berupa pola garis-garis placeholder.

1. Buka **https://aistudio.google.com** dan login dengan akun Google.
2. Klik **Get API key** → **Create API key** → salin key-nya (diawali `AIza…`).
3. Pembuatan gambar lewat API biasanya **berbayar**. Aktifkan billing di project Google Cloud yang terhubung ke key itu (AI Studio akan mengarahkanmu), lalu cek harga per gambar di halaman pricing Gemini API.
4. Buka file **`.env`** dan isi:
   ```
   GEMINI_API_KEY=AIza...key-kamu...
   GEMINI_IMAGE_MODEL=gemini-2.5-flash-image,gemini-3.1-flash-image-preview
   ```
   Kalau dua baris ini belum ada di `.env`-mu (file lama), tambahkan saja di paling bawah.
5. Simpan, lalu matikan dan jalankan ulang aplikasinya. Di terminal akan muncul:
   ```
   🎨 Generator gambar: Gemini (gemini-2.5-flash-image → gemini-3.1-flash-image-preview)
   ```
6. Klik **Jalankan siklus sekarang**. Membuat gambar butuh waktu, jadi tunggu 1–2 menit lalu klik **Muat**.

Gemini key bisa dipakai **tanpa** Claude API key. Desain kaosnya tetap contoh mode demo, tapi gambarnya sungguhan. Ini cara murah untuk melihat kualitas gambar dulu (±6 gambar per siklus).

Kalau muncul error merah di kartu karya:
- `GEMINI_API_KEY tidak valid`: salin ulang key-nya, pastikan tidak ada spasi.
- `model gambar butuh billing aktif (kuota gratis = 0)`: model gambar Gemini tidak punya kuota gratis. Aktifkan billing di AI Studio.
- `Kuota Gemini habis (429)`: batas kuota tercapai. Coba lagi nanti.
- `Tidak ada model gambar Gemini yang tersedia`: Google mengganti nama model. Cek nama model gambar terbaru di dokumentasi Gemini API, lalu ubah `GEMINI_IMAGE_MODEL`.

---

## Setelah mode demo berhasil: pakai AI sungguhan

Lakukan ini **hanya kalau sudah siap mengeluarkan biaya API**.

1. Daftar di **https://console.anthropic.com**, isi saldo (billing), lalu buat **API Key**.
2. Di folder proyek, buka file **`.env`** dengan Notepad (klik kanan → Open with → Notepad).
   - Kalau file `.env` tidak terlihat, jalankan `mulai.bat` sekali dulu. File itu dibuat otomatis.
3. Cari baris `ANTHROPIC_API_KEY=` dan tempel key-mu setelah tanda `=`, tanpa spasi:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
   ```
4. Ganti juga `ADMIN_TOKEN=admin123` dengan password yang lebih kuat.
5. Simpan (Ctrl + S), matikan aplikasi, lalu jalankan `mulai.bat` lagi. Tulisan "MODE DEMO" tidak akan muncul lagi.
6. Klik **Jalankan siklus sekarang**. Dengan AI sungguhan, satu siklus butuh beberapa menit (DALOT menulis kode cukup lama). Klik **Muat** secara berkala.

**Jaga kerahasiaan API key**: jangan dibagikan atau di-upload ke GitHub. File `.env` sudah otomatis tidak ikut ter-upload.

Untuk gambar sungguhan, isi juga `GEMINI_API_KEY` (lihat bagian "Gambar sungguhan dengan Gemini API" di atas).

---

## Untuk pengguna lanjutan (opsional)

Database bawaan sudah cukup untuk uji coba. Untuk produksi, pakai Postgres sungguhan dengan mengisi `DATABASE_URL` di `.env`:
- **Docker:** `docker compose up -d`, lalu `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres`
- **Supabase:** Project Settings → Database → Connection string (**Session pooler**)

Jadwal otomatis (`CYCLE_CRON`, default jam 02:00) hanya berjalan selama aplikasi menyala. Untuk 24 jam penuh, nanti pindahkan ke VPS/Railway.
