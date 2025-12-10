
# Dockerfile

# 1. Tahap Instalasi Dependensi (Builder)
# =======================================
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Tahap Pembangunan Aplikasi (Builder)
# =======================================
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 3. Tahap Produksi (Runner)
# ===========================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# MEMBUAT GRUP DAN USER YANG DIPERLUKAN
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set ownership and copy over the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Set ownership and copy over the static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4000

ENV PORT 4000

CMD ["node", "server.js"]
