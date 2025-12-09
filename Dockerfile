# Versi 1: Sederhana dan Andal (Direkomendasikan)
# Menggunakan Node.js versi 18-alpine sebagai dasar yang ringan
FROM node:18-alpine AS base

# Mengatur direktori kerja di dalam container
WORKDIR /app

# Menyalin package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan cache Docker. Langkah ini hanya akan dijalankan ulang jika file-file ini berubah.
COPY package*.json ./

# Menginstal dependensi
# --legacy-peer-deps digunakan untuk mengatasi potensi konflik versi minor antar paket
RUN npm install --legacy-peer-deps

# Menyalin sisa kode aplikasi ke dalam container
COPY . .

# Menjalankan proses build Next.js untuk produksi
RUN npm run build

# Mengatur environment variable untuk mode produksi
ENV NODE_ENV=production

# Mengekspos port 4000 yang akan digunakan oleh aplikasi
EXPOSE 4000

# Perintah default untuk menjalankan aplikasi saat container dimulai
CMD ["npm", "start"]
