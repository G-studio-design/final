# Dockerfile

# ==================================
# ---- 1. Base Stage ----
# ==================================
FROM node:20-alpine AS base
WORKDIR /app

# ==================================
# ---- 2. Builder Stage ----
# ==================================
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==================================
# ---- 3. Production Stage ----
# ==================================
FROM base AS production
ENV NODE_ENV=production

# --- Args for User/Group mapping ---
ARG PUID=1000
ARG PGID=1000

# --- Create user and group ---
# This is the corrected block. It now creates the group first if it doesn't exist.
RUN \
  if ! getent group ${PGID} > /dev/null 2>&1; then \
    addgroup -g ${PGID} nextjs; \
  fi && \
  adduser -D -u ${PUID} -G $(getent group ${PGID} | cut -d: -f1) nextjs

# --- Copy necessary files from builder ---
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:$(getent group ${PGID} | cut -d: -f1) /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 4000

CMD ["npm", "start"]
