# --- Tahap 1: Instalasi Dependensi ---
# Menggunakan base image Node.js versi LTS yang stabil.
FROM node:18-alpine AS deps
WORKDIR /app

# Salin hanya package.json, karena package-lock.json tidak selalu ada.
COPY package.json ./

# Jalankan npm install yang lebih fleksibel daripada npm ci.
# Ini akan menginstal dependensi produksi.
RUN npm install --only=production

# --- Tahap 2: Build Aplikasi ---
# Mulai dari base image yang sama.
FROM node:18-alpine AS builder
WORKDIR /app

# Salin dependensi yang sudah terinstal dari tahap sebelumnya.
COPY --from=deps /app/node_modules ./node_modules

# Salin sisa kode aplikasi.
COPY . .

# Nonaktifkan telemetri Next.js untuk proses build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build aplikasi Next.js untuk produksi.
RUN npm run build

# --- Tahap 3: Produksi ---
# Image final yang ramping.
FROM node:18-alpine AS runner
WORKDIR /app

# Atur lingkungan ke produksi.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat pengguna non-root untuk keamanan.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin folder .next yang sudah di-build dari tahap builder.
COPY --from=builder /app/.next ./.next

# Salin folder public dan node_modules.
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Ganti kepemilikan file ke pengguna non-root.
RUN chown -R nextjs:nodejs .

# Ganti ke pengguna non-root.
USER nextjs

# Expose port yang digunakan aplikasi.
EXPOSE 4000

# Perintah untuk menjalankan aplikasi.
CMD ["npm", "start"]
