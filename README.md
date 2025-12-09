# Msarch App

Aplikasi starter Next.js untuk manajemen proyek dan tugas karyawan.

## Prasyarat

Sebelum Anda dapat menjalankan aplikasi ini, pastikan Node.js dan npm (yang terinstal bersama Node.js) sudah terpasang di komputer Anda.

- **Node.js**: Unduh versi LTS dari [nodejs.org](https://nodejs.org/).
- **Editor Kode**: Disarankan menggunakan [Visual Studio Code](https://code.visualstudio.com/).

## Menjalankan Secara Lokal

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

    Aplikasi sekarang akan berjalan di `http://localhost:4000`.

## Deployment di Synology NAS (Metode Docker)

Metode ini mengisolasi aplikasi Anda dalam sebuah "container" sehingga tidak mengganggu sistem utama NAS Anda dan lebih mudah dikelola.

### Prasyarat di Synology:

1.  Buka **Package Center** di DSM (Desktop Synology).
2.  Cari dan instal **Container Manager** (mungkin bernama Docker pada versi DSM yang lebih lama).
3.  Pastikan juga **Text Editor** terinstal dari Package Center untuk memudahkan pengeditan.

### Langkah-langkah Deployment:

1.  **Siapkan Struktur Folder di NAS Anda:**
    -   Buka **File Station**.
    -   Buat folder baru di NAS Anda, misalnya di bawah `docker`, dengan nama `msarch-app`. **PENTING: Semua file proyek Anda akan berada di sini.**
    -   Unggah **semua file dan folder proyek Anda** (termasuk `Dockerfile`, `package.json`, `src`, dll.) ke dalam folder `msarch-app` tersebut.

    Struktur folder yang benar di NAS akan terlihat seperti ini:
    ```
    /docker/
    └── msarch-app/
        ├── Dockerfile
        ├── package.json
        ├── .env
        ├── src/
        ├── database/
        └── ...file dan folder proyek lainnya
    ```

2.  **Buat File `.env` di NAS:**
    -   Di dalam folder `/docker/msarch-app` di File Station, buat file baru bernama `.env`.
    -   Klik kanan file `.env` tersebut dan pilih "Open with Text Editor".
    -   Salin konten dari bagian **Konfigurasi Variabel Lingkungan** di bawah ini, tempelkan ke editor, lalu isi dengan kredensial Anda.

3.  **Buka Container Manager:**
    -   Jalankan aplikasi **Container Manager** dari menu utama DSM.

4.  **Buat Proyek Baru:**
    -   Di Container Manager, navigasi ke bagian **Project** dan klik **Create**.
    -   **Project Name**: Beri nama `msarch-app`.
    -   **Path**: Arahkan ke folder `/docker/msarch-app`.
    -   **Source**: Pilih **Create docker-compose.yml**.
    -   Salin dan tempel konfigurasi berikut ini ke dalam editor:
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
    -   Klik **Next**.

5.  **Lewati Konfigurasi Web Station:**
    -   Jika wizard menanyakan tentang Web Station, lewati saja. Jangan centang apa pun, lalu klik **Next**.

6.  **Build dan Jalankan Proyek:**
    -   Pada langkah terakhir, pastikan opsi **"Start the project once it is created"** dicentang.
    -   Klik **Done**.

    Container Manager sekarang akan mulai membangun "image" Docker. Proses ini mungkin memakan waktu beberapa menit. Anda bisa melihat log-nya di tab **Log** pada halaman proyek di Container Manager.

7.  **Akses Aplikasi Anda:**
    -   Setelah proses build selesai dan container berjalan, Anda dapat mengakses aplikasi dengan membuka browser dan menuju ke: `http://<IP_ADDRESS_NAS_ANDA>:4000`.

Aplikasi Anda sekarang berjalan 24/7 di Synology NAS Anda!

## Konfigurasi Variabel Lingkungan

Untuk mengintegrasikan dengan layanan Google dan mengaktifkan Notifikasi Push, Anda perlu membuat file `.env` di dalam folder `docker/msarch-app` Anda.

1.  Buat file baru bernama `.env` di dalam folder `/docker/msarch-app`.
2.  Salin dan tempel konten di bawah ini ke dalam file `.env`, lalu ganti placeholder dengan kredensial Anda yang sebenarnya.

**PENTING:** Selalu apit nilai variabel dengan tanda kutip (`"`) untuk memastikan tidak ada kesalahan pembacaan, terutama untuk `PUBLIC_KEY` dan `PRIVATE_KEY`.

```env
# Kredensial Google OAuth 2.0
# Dapatkan ini dari Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="GANTI_DENGAN_CLIENT_ID_ANDA"
GOOGLE_CLIENT_SECRET="GANTI_DENGAN_CLIENT_SECRET_ANDA"

# URI Pengalihan harus sama persis dengan yang dikonfigurasi di Google Cloud Console.
# Ganti localhost dengan alamat IP NAS Anda atau nama domain jika Anda menggunakannya.
NEXT_PUBLIC_GOOGLE_REDIRECT_URI="http://<IP_NAS_ANDA_ATAU_DOMAIN>:4000/api/auth/google/callback"

# ==============================================================================
# Kunci VAPID untuk Notifikasi Push Web (WAJIB UNTUK NOTIFIKASI REAL-TIME)
# ==============================================================================
# Untuk membuatnya, jalankan perintah berikut di terminal komputer Anda (bukan di NAS):
# npx web-push generate-vapid-keys
#
# Perintah ini akan menghasilkan sepasang kunci (Public dan Private). Salin dan tempel kunci tersebut di bawah.
# Subject biasanya berupa link mailto: ke email admin Anda.

VAPID_SUBJECT="mailto:youremail@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="GANTI_DENGAN_PUBLIC_KEY_HASIL_GENERASI"
VAPID_PRIVATE_KEY="GANTI_DENGAN_PRIVATE_KEY_HASIL_GENERASI"
```

**PENTING**: File `.env` berisi informasi sensitif. Jangan pernah membagikan file `.env` Anda atau memasukkannya ke dalam riwayat Git.
