# Dockerfile

# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Arguments for user and group IDs
ARG PUID=1000
ARG PGID=1000

# Create group and user
# This command first checks if the group exists. If not, it creates it.
# Then it adds the user. This avoids "gid in use" errors on systems like Synology.
RUN if ! getent group ${PGID} > /dev/null 2>&1; then \
        addgroup -g ${PGID} nodejs; \
    fi && \
    adduser -u ${PUID} -G $(getent group ${PGID} | cut -d: -f1) -s /bin/sh -D nextjs

# Set ownership of the app directory
# This step is deferred until after files are copied.

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:$(getent group ${PGID} | cut -d: -f1) /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy database and other persistent files
# Ensure these files/folders exist or handle their absence gracefully
COPY --chown=nextjs:$(getent group ${PGID} | cut -d: -f1) database ./database

# The main app directory should also be owned by the node user.
RUN chown -R nextjs:$(getent group ${PGID} | cut -d: -f1) /app

USER nextjs

EXPOSE 4000

CMD ["npm", "start"]
