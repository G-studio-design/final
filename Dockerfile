# Tahap 1: Instalasi Dependensi
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Tahap 2: Build Aplikasi
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Tahap 3: Image Produksi
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Anda bisa menambahkan ENV lain di sini jika perlu

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 4000
ENV PORT 4000

# Jalankan aplikasi
CMD ["node", "server.js"]
