# Dockerfile

# --- Tahap 1: Pemasangan Dependensi & Build ---
# Gunakan Node.js versi LTS (Long-Term Support) yang stabil.
# Varian '-alpine' lebih kecil ukurannya, cocok untuk produksi.
FROM node:20-alpine AS deps
WORKDIR /app

# Salin package.json dan package-lock.json untuk menginstal dependensi
COPY package.json package-lock.json* ./
# Instal hanya dependensi produksi untuk menjaga ukuran image tetap kecil
RUN npm ci --only=production

# --- Tahap 2: Build Aplikasi ---
FROM node:20-alpine AS builder
WORKDIR /app

# Salin dependensi dari tahap sebelumnya
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build aplikasi Next.js
# Variabel lingkungan NEXT_TELEMETRY_DISABLED=1 untuk menonaktifkan telemetri saat build.
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# --- Tahap 3: Produksi ---
# Tahap ini akan menghasilkan image final yang ramping.
FROM node:20-alpine AS runner
WORKDIR /app

# Nonaktifkan telemetri Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 4000

# Buat pengguna non-root untuk keamanan yang lebih baik
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Salin artefak build dari tahap builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Salin folder .next (standalone) dan node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Salin folder database
COPY --chown=nextjs:nodejs database ./database

# Atur kepemilikan untuk direktori database agar bisa ditulis
RUN chown -R nextjs:nodejs ./database

# Ganti ke pengguna non-root
USER nextjs

EXPOSE 4000

# Jalankan aplikasi
CMD ["npm", "start"]
