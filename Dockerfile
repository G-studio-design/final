# Tahap 1: Base Image
FROM node:20-alpine AS base

# Tahap 2: Instalasi Dependensi
# Alih-alih build, kita buat stage 'deps' terpisah untuk caching layer Docker
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --frozen-lockfile

# Tahap 3: Build Aplikasi
# Menggunakan file dari 'deps' untuk build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Tahap 4: Image Produksi Final
# Menggunakan image base yang ringan dan menyalin hanya artefak yang diperlukan
FROM base AS runner
WORKDIR /app

# Ambil PUID dan PGID dari argumen build
ARG PUID=1029
ARG PGID=100

# Buat grup dan pengguna 'nodejs'
# Pastikan grup ada sebelum menambahkan pengguna ke dalamnya
RUN addgroup -S -g ${PGID} nodejs || true
RUN adduser -S -u ${PUID} -G nodejs nodejs

# Ganti kepemilikan direktori aplikasi
RUN chown -R nodejs:nodejs /app

# Ganti ke pengguna non-root
USER nodejs

# Salin file build dari stage 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/database ./database
COPY --from=builder /app/public/uploads ./public/uploads


# Expose port yang digunakan aplikasi Anda
EXPOSE 4000

# Perintah untuk menjalankan aplikasi
CMD ["node", "server.js"]
