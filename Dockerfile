# Dockerfile

# ==================================
# Builder Stage
# ==================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# ==================================
# Runner Stage
# ==================================
FROM node:20-alpine AS runner

WORKDIR /app

# --- User and Group Management ---
# Add build arguments for user and group IDs
ARG PUID=1000
ARG PGID=1000

# Create a group and user
RUN \
  if ! getent group ${PGID} > /dev/null 2>&1; then \
    addgroup -g ${PGID} nodejs; \
  else \
    echo "Group with GID ${PGID} already exists."; \
  fi && \
  adduser -h /app -s /bin/sh -D -u ${PUID} nextjs && \
  addgroup nextjs nodejs

# --- File Copying and Permissions ---
# Copy standalone output
COPY --from=builder /app/.next/standalone ./
# Copy public and database assets with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

# Set the user to run the application
USER nextjs

EXPOSE 4000
ENV PORT 4000
ENV NODE_ENV=production

# The command to run the application
CMD ["node", "server.js"]
