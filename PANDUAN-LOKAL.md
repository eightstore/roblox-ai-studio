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
- **Reset ke awal:** matikan aplikasi, lalu hapus folder `storage\database` dan `storage\items`.

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

Gambar classic shirt masih berupa **pola garis placeholder** dari warna pilihan AI sampai kamu menghubungkan generator gambar (`IMAGE_API_URL`). Itu langkah berikutnya, dan saya bisa bantu.

---

## Untuk pengguna lanjutan (opsional)

Database bawaan sudah cukup untuk uji coba. Untuk produksi, pakai Postgres sungguhan dengan mengisi `DATABASE_URL` di `.env`:
- **Docker:** `docker compose up -d`, lalu `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres`
- **Supabase:** Project Settings → Database → Connection string (**Session pooler**)

Jadwal otomatis (`CYCLE_CRON`, default jam 02:00) hanya berjalan selama aplikasi menyala. Untuk 24 jam penuh, nanti pindahkan ke VPS/Railway.
