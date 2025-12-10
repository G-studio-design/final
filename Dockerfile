# Dockerfile

# Tahap 1: Instalasi dependensi
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Tahap 2: Build aplikasi
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Secara eksplisit meneruskan variabel lingkungan build-time
# Ini penting agar Next.js tahu tentang variabel ini saat proses build
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI
RUN npm run build

# Tahap 3: Produksi
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Secara otomatis menentukan pengguna dan grup non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Menyalin artefak build yang diperlukan
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mengatur environment variable untuk Google Redirect URI saat runtime
# Ini adalah perubahan kunci untuk memastikan nilainya selalu terbaru dari .env
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI

USER nextjs
EXPOSE 4000
CMD ["node", "server.js"]
