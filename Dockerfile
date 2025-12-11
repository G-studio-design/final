# Dockerfile

# Argumen untuk User dan Group ID
ARG PUID=1000
ARG PGID=1000

# Tahap 1: Build aplikasi
FROM node:20-alpine AS builder

WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Instal dependensi
RUN npm install

# Salin sisa kode aplikasi
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Tahap 2: Setup environment produksi
FROM node:20-alpine AS runner

WORKDIR /app

# Atur environment ke production
ENV NODE_ENV=production

# Buat group dan user non-root dengan GID dan UID yang ditentukan
RUN addgroup -g ${PGID} --system nodejs
RUN adduser -u ${PUID} --system nodejs -G nodejs

# Salin folder .next dari tahap builder
COPY --from=builder /app/.next ./.next

# Salin folder public
COPY --from=builder /app/public ./public

# Salin file konfigurasi Next.js dan package.json
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./

# Berikan kepemilikan folder /app ke user non-root yang baru dibuat
# Ini penting agar aplikasi bisa menulis file (misalnya, file cache) jika diperlukan
RUN chown -R nodejs:nodejs /app

# Ganti ke user non-root
USER nodejs

# Buka port 4000
EXPOSE 4000

# Jalankan aplikasi
CMD ["npm", "start"]
