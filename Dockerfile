# Dockerfile
# Tahap 1: Instalasi dependensi
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Tahap 2: Membangun aplikasi
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Tahap 3: Menjalankan aplikasi di lingkungan produksi
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Menyalin file build dari tahap sebelumnya
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Menyalin file database dan konfigurasi
COPY database ./database
COPY ecosystem.config.js .
COPY next.config.js .
COPY .env .

EXPOSE 4000

CMD ["npm", "start"]
