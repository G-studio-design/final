# Dockerfile

# Base Image
FROM node:18-alpine AS base

# 1. Tahap Dependencies
# --------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Tahap Builder
# ---------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumen untuk User/Group ID
ARG PUID=1000
ARG PGID=1000

# Buat pengguna dan grup
RUN addgroup -g ${PGID} nodejs && \
    adduser -u ${PUID} -G nodejs -s /bin/sh -D nextjs

# Build aplikasi Next.js
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI
RUN npm run build

# 3. Tahap Runner (Produksi)
# -------------------------
FROM base AS runner
WORKDIR /app

# Set variabel lingkungan
ENV NODE_ENV=production

# Ganti pengguna ke non-root
USER nextjs

# Salin artefak yang sudah dibangun
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

EXPOSE 4000

CMD ["npm", "start"]
