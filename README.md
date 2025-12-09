# Msarch App

Aplikasi starter Next.js untuk manajemen proyek dan tugas karyawan.

## Prasyarat

- **Node.js**: Unduh versi LTS dari [nodejs.org](https://nodejs.org/).
- **Editor Kode**: Disarankan menggunakan [Visual Studio Code](https://code.visualstudio.com/).
- **Synology NAS**: Dengan akses admin untuk menginstal paket.

## Deployment & Konfigurasi HTTPS di Synology NAS

Metode ini menggunakan Docker untuk isolasi, dan **Tailscale** untuk mendapatkan akses HTTPS yang aman dan gratis tanpa perlu konfigurasi router (port forwarding). HTTPS **wajib** untuk fitur seperti Notifikasi Push dan Absensi berbasis lokasi.

### 1. Prasyarat di Synology

1.  Buka **Package Center** di DSM.
2.  Cari dan instal **Container Manager** (mungkin bernama Docker pada versi DSM yang lebih lama).
3.  Cari dan instal **Tailscale**.

### 2. Siapkan Struktur Folder di NAS

1.  Buka **File Station**.
2.  Di bawah folder `docker`, buat folder baru bernama `msarch-app`.
3.  Unggah **semua file dan folder proyek Anda** (termasuk `Dockerfile`, `package.json`, `src`, dll.) ke dalam folder `/docker/msarch-app` tersebut.

### 3. Konfigurasi Jaringan & Domain dengan Tailscale

**A. Instal dan Login ke Tailscale:**
1.  Buka paket **Tailscale** yang sudah Anda instal di Synology.
2.  Klik **Login**. Anda akan diarahkan ke browser untuk login menggunakan akun Google, Microsoft, atau GitHub. Gunakan akun yang mudah Anda ingat.
3.  Setelah login, NAS Anda akan muncul di daftar mesin di [Admin Console Tailscale](https://login.tailscale.com/admin/machines).

**B. Dapatkan Nama Domain HTTPS Anda:**
1.  Di [Admin Console Tailscale](https://login.tailscale.com/admin/machines), cari mesin (NAS) Anda. Anda akan melihat nama domain yang diberikan, contohnya: `nama-nas.nama-akun.ts.net`. **Catat domain ini.** Inilah alamat HTTPS permanen Anda.

**C. Atur Reverse Proxy:**
1.  Di DSM, buka **Control Panel** > **Login Portal** > tab **Advanced** > **Reverse Proxy**.
2.  Klik **Create**.
3.  **Source (Dari Internet via Tailscale):**
    -   Protocol: `HTTPS`
    -   Hostname: Masukkan domain Tailscale Anda dari langkah B (misal: `nama-nas.nama-akun.ts.net`).
    -   Port: `443`
4.  **Destination (Ke Aplikasi Docker):**
    -   Protocol: `HTTP`
    -   Hostname: `localhost`
    -   Port: `4000`
5.  Klik **Save**.

### 4. Buat dan Konfigurasi File `.env`

1.  Di dalam folder `/docker/msarch-app` di File Station, buat file baru bernama `.env`.
2.  Salin konten di bawah, tempel ke file `.env`, dan **isi dengan kredensial Anda**. Ganti `nama-nas.nama-akun.ts.net` dengan domain Tailscale Anda.

```env
# =======================================================
# Kredensial Google OAuth 2.0 (Untuk Login & Kalender)
# =======================================================
# Dapatkan dari Google Cloud Console: https://console.cloud.google.com/apis/credentials
# PENTING: Saat membuat kredensial, tambahkan URI pengalihan di bawah ini ke daftar "Authorized redirect URIs".
GOOGLE_CLIENT_ID="GANTI_DENGAN_CLIENT_ID_ANDA"
GOOGLE_CLIENT_SECRET="GANTI_DENGAN_CLIENT_SECRET_ANDA"
NEXT_PUBLIC_GOOGLE_REDIRECT_URI="https://nama-nas.nama-akun.ts.net/api/auth/google/callback"

# =======================================================
# Kunci VAPID untuk Notifikasi Push Web (WAJIB)
# =======================================================
# Untuk membuatnya, jalankan perintah ini di terminal komputer Anda:
# npx web-push generate-vapid-keys
#
# Salin kunci Public dan Private yang dihasilkan ke sini.
VAPID_SUBJECT="mailto:youremail@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="GANTI_DENGAN_PUBLIC_KEY_ANDA"
VAPID_PRIVATE_KEY="GANTI_DENGAN_PRIVATE_KEY_ANDA"
```

### 5. Bangun dan Jalankan Aplikasi di Container Manager

1.  Buka **Container Manager**.
2.  Navigasi ke **Project** dan klik **Create**.
3.  **Project Name**: `msarch-app`
4.  **Path**: Arahkan ke `/docker/msarch-app`.
5.  **Source**: Pilih **Create docker-compose.yml**.
6.  Salin dan tempel konfigurasi berikut ini:
    ```yaml
    version: '3.8'
    services:
      msarch-app:
        build:
          context: .
          dockerfile: Dockerfile
        container_name: msarch-app-prod
        restart: unless-stopped
        ports:
          - "4000:4000"
        volumes:
          - ./database:/app/database
          - ./public/uploads:/app/public/uploads
        env_file:
          - .env
    ```
7.  Klik **Next**, lewati pengaturan Web Station (jika ditanya), lalu klik **Done** untuk memulai proses build. Proses ini bisa memakan waktu beberapa menit.

### 6. Akses Aplikasi Anda

1.  **Instal Tailscale** di komputer atau ponsel yang ingin Anda gunakan untuk mengakses aplikasi. Login dengan akun yang sama seperti saat Anda login di NAS.
2.  Setelah terinstal, buka browser dan akses aplikasi Anda melalui alamat **HTTPS** dari Tailscale:

**`https://nama-nas.nama-akun.ts.net`** (Ganti dengan domain Tailscale Anda)

Aplikasi Anda kini berjalan dengan aman di jaringan pribadi Anda, dan semua fitur (lokasi, notifikasi) akan berfungsi.