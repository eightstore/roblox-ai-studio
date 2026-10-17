#!/bin/bash
# Mac: klik dua kali file ini. Linux: jalankan ./mulai.command di terminal.
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "Node.js belum terpasang. Instal dari https://nodejs.org (pilih LTS), lalu jalankan lagi."
  read -r -p "Tekan Enter untuk keluar"; exit 1
fi
[ -d node_modules ] || { echo "Menginstal paket untuk pertama kali, tunggu 1-3 menit..."; npm install || exit 1; }
[ -f .env ] || cp .env.example .env
echo "Browser akan terbuka otomatis. Untuk berhenti tekan Ctrl+C."
( sleep 10; (command -v open >/dev/null && open http://localhost:3000/admin.html) || xdg-open http://localhost:3000/admin.html ) >/dev/null 2>&1 &
npm start
