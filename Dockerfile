# Dockerfile

# Tahap 1: Instalasi Dependensi
# Menggunakan base image node-alpine untuk ukuran yang lebih kecil
FROM node:20-alpine AS deps
# Atur direktori kerja di dalam image
WORKDIR /app
# Salin package.json dan package-lock.json (atau yarn.lock)
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm install

# Tahap 2: Build Aplikasi
# Menggunakan base image yang sama
FROM node:20-alpine AS builder
# Argumen untuk User dan Group ID, default ke 1000
ARG PUID=1000
ARG PGID=1000

# Buat grup dan pengguna terlebih dahulu
RUN if ! getent group ${PGID} > /dev/null 2>&1; then \
        addgroup -g ${PGID} nodejs; \
    fi && \
    adduser -S -u ${PUID} -G $(getent group ${PGID} | cut -d: -f1) nextjs

WORKDIR /app

# Salin dependensi dari tahap 'deps'
COPY --from=deps /app/node_modules ./node_modules
# Salin sisa file aplikasi
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Tahap 3: Produksi
# Menggunakan base image yang sama
FROM node:20-alpine AS runner
ARG PUID=1000
ARG PGID=1000
WORKDIR /app

# Atur environment variable
ENV NODE_ENV=production

# Buat grup dan pengguna (sama seperti tahap builder)
RUN if ! getent group ${PGID} > /dev/null 2>&1; then \
        addgroup -g ${PGID} nodejs; \
    fi && \
    adduser -S -u ${PUID} -G $(getent group ${PGID} | cut -d: -f1) nextjs

# Salin folder .next/standalone yang sudah di-build
COPY --from=builder /app/.next/standalone ./

# Salin folder public dan .next/static
COPY --from=builder --chown=nextjs:$(getent group ${PGID} | cut -d: -f1) /app/public ./public
COPY --from=builder --chown=nextjs:$(getent group ${PGID} | cut -d: -f1) /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:$(getent group ${PGID} | cut -d: -f1) /app/database ./database

# Ganti pemilik semua file ke pengguna nextjs
RUN chown -R nextjs:$(getent group ${PGID} | cut -d: -f1) .

# Ganti ke pengguna non-root
USER nextjs

# Expose port 4000
EXPOSE 4000

# Jalankan aplikasi
CMD ["node", "server.js"]
