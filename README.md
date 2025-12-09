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

    Aplikasi sekarang akan berjalan di `http://localhost:4000`. Jika Anda ingin mengaksesnya dari perangkat lain di jaringan yang sama, gunakan alamat IP lokal komputer Anda (misalnya, `http://192.168.1.10:4000`).

## Konfigurasi Variabel Lingkungan

Untuk mengintegrasikan dengan layanan Google dan mengaktifkan Notifikasi Push, Anda perlu membuat file `.env` di direktori root proyek.

1.  Buat file baru bernama `.env`.
2.  Salin dan tempel konten di bawah ini ke dalam file `.env`, lalu ganti placeholder dengan kredensial Anda yang sebenarnya.

**PENTING:** Selalu apit nilai variabel dengan tanda kutip (`"`) untuk memastikan tidak ada kesalahan pembacaan.

```env
# Kredensial Google OAuth 2.0
# Dapatkan ini dari Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="GANTI_DENGAN_CLIENT_ID_ANDA"
GOOGLE_CLIENT_SECRET="GANTI_DENGAN_CLIENT_SECRET_ANDA"

# URI Pengalihan harus sama persis dengan yang dikonfigurasi di Google Cloud Console.
# Untuk pengembangan lokal, biasanya seperti ini.
NEXT_PUBLIC_GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"

# ==============================================================================
# Kunci VAPID untuk Notifikasi Push Web (WAJIB UNTUK NOTIFIKASI REAL-TIME)
# ==============================================================================
# Untuk membuatnya, jalankan perintah berikut di terminal Anda:
# npx web-push generate-vapid-keys
#
# Perintah ini akan menghasilkan sepasang kunci (Public dan Private). Salin dan tempel kunci tersebut di bawah.
# Subject biasanya berupa link mailto: ke email admin Anda.

VAPID_SUBJECT="mailto:youremail@example.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="GANTI_DENGAN_PUBLIC_KEY_HASIL_GENERASI"
VAPID_PRIVATE_KEY="GANTI_DENGAN_PRIVATE_KEY_HASIL_GENERASI"
```

**PENTING**: File `.env` berisi informasi sensitif. File ini sudah tercantum di dalam `.gitignore` untuk mencegahnya diunggah ke GitHub secara tidak sengaja. Jangan pernah membagikan file `.env` Anda atau memasukkannya ke dalam riwayat Git.
