# Tahap 1: Base image dengan Node.js
FROM node:18-alpine AS base

# Tahap 2: Instalasi dependensi production
FROM base AS deps
WORKDIR /app
COPY package.json ./
# Hapus baris package-lock.json karena tidak selalu ada
RUN npm install --only=production

# Tahap 3: Build aplikasi Next.js
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Tahap 4: Final image untuk production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs ./.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Jalankan aplikasi sebagai user non-root untuk keamanan
USER nextjs

EXPOSE 4000
ENV PORT 4000

# Perintah untuk menjalankan aplikasi
CMD ["node_modules/.bin/next", "start"]
