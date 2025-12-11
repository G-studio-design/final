# Dockerfile

# ==================================
# Base Stage
# ==================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ==================================
# Dependencies Stage
# ==================================
FROM base AS deps
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm install --frozen-lockfile

# ==================================
# Builder Stage
# ==================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable Next.js telemetry
# See https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ==================================
# Runner Stage
# ==================================
FROM base AS runner
# Set user and group arguments
ARG PUID=1000
ARG PGID=1000

# Create user and group
# Check if group exists, if not create it. Then create user.
RUN \
  if ! getent group ${PGID} > /dev/null 2>&1; then \
    addgroup -g ${PGID} -S nodejs; \
  fi && \
  adduser -u ${PUID} -S nodejs -G $(getent group ${PGID} | cut -d: -f1)

# Set user
USER nodejs

# Copy built app and node_modules
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose port and start app
EXPOSE 4000
CMD ["npm", "start"]
