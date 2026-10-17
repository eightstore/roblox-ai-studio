@echo off
title Studio AI Roblox
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang. Download dan instal dari https://nodejs.org ^(pilih LTS^), lalu jalankan file ini lagi.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Menginstal paket untuk pertama kali, tunggu 1-3 menit...
  call npm install
  if errorlevel 1 ( echo Gagal npm install. Cek koneksi internet. & pause & exit /b 1 )
)

if not exist .env copy .env.example .env >nul

echo Browser akan terbuka otomatis. Untuk berhenti, tutup jendela ini atau tekan Ctrl+C.
start "" cmd /c "timeout /t 10 >nul & start http://localhost:3000/admin.html"
call npm start
pause
