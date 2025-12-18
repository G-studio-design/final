// src/config/api-config.ts
'use client';

// Cerdas menentukan base URL API berdasarkan hostname saat ini.
// Ini memungkinkan aplikasi menggunakan koneksi lokal yang lebih cepat saat berada di jaringan yang sama dengan NAS,
// dan beralih ke URL publik (Cloudflare) saat diakses dari internet.

const getApiBaseUrl = (): string => {
  // Hanya jalankan di sisi klien (browser)
  if (typeof window === 'undefined') {
    // Di sisi server (SSR/RSC), asumsikan koneksi internal antar-container.
    // Ganti 'app' dengan nama layanan Next.js Anda di docker-compose.yml jika berbeda.
    return 'http://app:4000';
  }

  const hostname = window.location.hostname;

  // Cek apakah hostname adalah alamat IP lokal atau nama domain .local
  // Regex ini mencakup: 192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x, dan localhost.
  const isLocalNetwork =
    hostname === 'localhost' ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(hostname) ||
    /^192\.168(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){2}$/.test(hostname) ||
    /^10(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(hostname) ||
    /^172\.(?:1[6-9]|2[0-9]|3[0-1])(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){2}$/.test(hostname) ||
    hostname.endsWith('.local');

  if (isLocalNetwork) {
    // Jika di jaringan lokal, gunakan alamat IP NAS Anda secara langsung.
    // Pastikan port 4000 bisa diakses di jaringan lokal Anda.
    // window.location.hostname akan menjadi IP NAS jika Anda mengaksesnya via IP.
    return `${window.location.protocol}//${hostname}:${window.location.port}`;
  } else {
    // Jika diakses dari internet (via domain Cloudflare), gunakan path relatif
    // agar browser otomatis menggunakan domain yang sedang diakses.
    return ''; // Path relatif akan menggunakan domain saat ini
  }
};

export const API_BASE_URL = getApiBaseUrl();
