
# Msarch App

Aplikasi starter Next.js untuk manajemen proyek dan tugas karyawan.

## Prasyarat

Sebelum Anda dapat menjalankan aplikasi ini, pastikan Node.js dan npm (yang terinstal bersama Node.js) sudah terpasang di komputer Anda.

- **Node.js**: Unduh versi LTS dari [nodejs.org](https://nodejs.org/).
- **Editor Kode**: Disarankan menggunakan [Visual Studio Code](https://code.visualstudio.com/).

## Menjalankan Secara Lokal (Pengembangan)

1.  **Instal Dependensi**

    Buka terminal di direktori root proyek dan jalankan:
    ```bash
    npm install
    ```

2.  **Jalankan Server Pengembangan**

    Setelah dependensi terinstal, jalankan server:
    ```bash
    npm run dev
    ```

    Aplikasi sekarang akan berjalan di `http://localhost:9002`.

## Menjalankan di Produksi (Misalnya di NAS)

Aplikasi ini dikonfigurasi untuk dijalankan menggunakan `pm2`.

1.  **Instal PM2 secara Global**
    ```bash
    npm install pm2 -g
    ```

2.  **Bangun Aplikasi**
    ```bash
    npm run build
    ```

3.  **Mulai Aplikasi dengan PM2**
    ```bash
    pm2 start ecosystem.config.js
    ```
    Aplikasi akan berjalan di port `9002` sesuai konfigurasi di `ecosystem.config.js`.

## Konfigurasi Variabel Lingkungan

Untuk integrasi dengan layanan Google dan untuk menentukan URL aplikasi, Anda perlu mengatur variabel di file `.env` dan `ecosystem.config.js`.

### 1. File `.env` (Untuk Pengembangan Lokal)

Buat file baru bernama `.env` di direktori root. File ini **hanya digunakan saat menjalankan `npm run dev`**.

```env
# Kredensial Google OAuth 2.0
# Dapatkan ini dari Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="GANTI_DENGAN_CLIENT_ID_ANDA"
GOOGLE_CLIENT_SECRET="GANTI_DENGAN_CLIENT_SECRET_ANDA"

# URL dasar aplikasi Anda saat pengembangan.
# HARUS sama dengan salah satu URI yang terdaftar di Google Cloud Console.
NEXT_PUBLIC_BASE_URL="http://localhost:9002"

# URI Pengalihan Google. Dibangun secara otomatis dari NEXT_PUBLIC_BASE_URL. JANGAN DIUBAH.
NEXT_PUBLIC_GOOGLE_REDIRECT_URI="${NEXT_PUBLIC_BASE_URL}/api/auth/google/callback"
```

### 2. File `ecosystem.config.js` (Untuk Produksi dengan PM2)

File ini mengontrol konfigurasi saat aplikasi dijalankan dengan `pm2 start`.

- Buka `ecosystem.config.js`.
- Temukan baris `NEXT_PUBLIC_BASE_URL`.
- **Ganti** `'http://localhost:9002'` dengan URL publik atau alamat IP NAS Anda. Contoh:
  - **Untuk Jaringan Lokal:** `NEXT_PUBLIC_BASE_URL: 'http://192.168.1.100:9002'`
  - **Untuk Akses Internet (dengan domain):** `NEXT_PUBLIC_BASE_URL: 'https://aplikasi-saya.com'`

### 3. Konfigurasi Google Cloud Console

Pastikan **semua** URL yang Anda gunakan (baik untuk lokal maupun produksi) terdaftar sebagai **Authorized redirect URIs** di Google Cloud Console.
Contoh:
- `http://localhost:9002/api/auth/google/callback`
- `http://192.168.1.100:9002/api/auth/google/callback`
- `https://aplikasi-saya.com/api/auth/google/callback`

**PENTING**: File `.env` berisi informasi sensitif. Jangan pernah memasukkannya ke dalam riwayat Git.

