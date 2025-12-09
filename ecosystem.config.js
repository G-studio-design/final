
module.exports = {
  apps: [
    {
      name: 'msarch-app',
      script: 'npm',
      args: 'start',
      // Opsi tambahan:
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9002,
        // ================= PENTING UNTUK PRODUKSI DI NAS =================
        // GANTI URL DI BAWAH INI DENGAN ALAMAT PUBLIK NAS ANDA.
        // JIKA HANYA UNTUK JARINGAN LOKAL, GUNAKAN: http://[ALAMAT_IP_NAS_ANDA]:9002
        // JIKA UNTUK DIAKSES DARI INTERNET, GUNAKAN DOMAIN PUBLIK ANDA: https://www.domain-anda.com
        // =================================================================
        NEXT_PUBLIC_BASE_URL: 'http://localhost:9002' // Ganti ini saat deployment
      },
    },
  ],
};
