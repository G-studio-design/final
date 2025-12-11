# Dockerfile

# ==================================
# Tahap 1: Builder
# ==================================
# Menggunakan Node.js versi 20-alpine sebagai basis image
FROM node:20-alpine AS builder

# Menetapkan direktori kerja di dalam container
WORKDIR /app

# Menyalin file package.json dan package-lock.json
COPY package*.json ./

# Menginstal dependensi
RUN npm install

# Menyalin seluruh kode aplikasi
COPY . .

# Membangun aplikasi Next.js untuk produksi
RUN npm run build

# ==================================
# Tahap 2: Runner
# ==================================
# Menggunakan image yang sama untuk menjaga konsistensi
FROM node:20-alpine AS runner

WORKDIR /app

# Mengatur PUID dan PGID dari build arguments.
# Nilai default (1000) digunakan jika tidak ada argumen yang diberikan.
ARG PUID=1000
ARG PGID=1000

# Alpine Linux menggunakan /etc/group dan /etc/passwd
# Perintah ini lebih tangguh:
# 1. Cek apakah grup dengan GID yang diberikan sudah ada.
# 2. Jika tidak ada, buat grup baru.
# 3. Ambil nama grup yang ada atau yang baru dibuat.
# 4. Tambahkan pengguna 'nodejs' ke grup tersebut dengan UID yang diberikan.
RUN \
  if ! grep -q ":${PGID}:" /etc/group; then \
    addgroup -g ${PGID} -S nodejs; \
  fi && \
  GROUP_NAME=$(getent group ${PGID} | cut -d: -f1) && \
  adduser -u ${PUID} -S -G ${GROUP_NAME} nodejs

# Menyalin file build dari tahap 'builder'
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Mengganti pemilik file ke pengguna 'nodejs' yang baru dibuat
# Ini memastikan aplikasi berjalan dengan izin yang benar, bukan sebagai root.
USER nodejs

# Mengekspos port 4000
EXPOSE 4000

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]
