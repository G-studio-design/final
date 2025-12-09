# Gunakan base image Node.js versi 18-alpine yang ringan
FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json (atau yarn.lock) terlebih dahulu
# Ini memanfaatkan cache Docker. Layer ini hanya akan di-build ulang jika file-file ini berubah.
COPY package.json package-lock.json* ./

# Instal dependensi. Flag --legacy-peer-deps seringkali membantu mengatasi
# masalah konflik dependensi minor pada versi npm yang lebih baru.
RUN npm install --legacy-peer-deps

# Salin sisa kode aplikasi ke dalam direktori kerja
COPY . .

# Build aplikasi Next.js untuk produksi
RUN npm run build

# Ekspos port yang akan digunakan oleh aplikasi
EXPOSE 4000

# Set environment variable untuk mode produksi
ENV NODE_ENV=production

# Perintah untuk menjalankan aplikasi saat container dimulai
CMD ["npm", "start"]
