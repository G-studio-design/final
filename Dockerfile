# Dockerfile

# =================================================================================================
# Tahap 1: Build - Membangun aplikasi Next.js
# =================================================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Salin file package.json dan yarn.lock/package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Instal dependensi
RUN npm install

# Salin sisa kode aplikasi
COPY . .

# Bangun aplikasi
RUN npm run build

# =================================================================================================
# Tahap 2: Runner - Menjalankan aplikasi
# =================================================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# ARG untuk user dan group ID
ARG PUID=1000
ARG PGID=1000

# Buat grup dan pengguna agar file tidak dimiliki oleh 'root'
# Langkah 1: Buat grup dengan nama 'nodejs'.
RUN addgroup -g ${PGID} -S nodejs

# Langkah 2: Buat pengguna 'nodejs' dan tambahkan ke grup 'nodejs'.
RUN adduser -D -S -h /app -u ${PUID} -G nodejs nodejs

# Salin dependensi dari tahap builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Salin folder .next (hasil build) dan folder public
# --chown memastikan file-file ini dimiliki oleh pengguna 'nodejs' yang baru dibuat
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Salin file-file lain yang diperlukan untuk menjalankan aplikasi
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/ecosystem.config.js ./
COPY --from=builder /app/.env ./

# Ganti pemilik semua file di /app ke pengguna 'nodejs'
RUN chown -R nodejs:nodejs /app

# Ganti ke pengguna non-root
USER nodejs

# Ekspos port 4000
EXPOSE 4000

# Jalankan aplikasi menggunakan PM2
CMD ["npm", "start"]
