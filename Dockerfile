# Dockerfile

# 1. Instalasi dependensi
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package.json dan lockfile
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Instalasi berdasarkan lockfile yang ada
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2. Build aplikasi
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabel Lingkungan Next.js
# Ini akan diekspos ke sisi klien, diawali dengan NEXT_PUBLIC_
# Tambahkan variabel publik lainnya jika diperlukan.
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI

RUN npm run build

# 3. Menjalankan aplikasi
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment untuk menonaktifkan telemetri Next.js
# ENV NEXT_TELEMETRY_DISABLED 1

# Pindahkan file build yang diperlukan dari tahap 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Salin database dan folder file proyek
COPY --chown=nextjs:nodejs /app/database ./database

# Atur pengguna non-root
USER nextjs

EXPOSE 4000
ENV PORT 4000

# Jalankan server
CMD ["node", "server.js"]
