# Dockerfile
FROM node:20-alpine AS base

# --- Builder Stage ---
# Builds the Next.js application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Runner Stage ---
# Creates the final, optimized image for running the app
FROM base AS runner
WORKDIR /app

# Arguments for user and group IDs, with default values
ARG PUID=1000
ARG PGID=1000

# Create user and group with corrected, more robust logic
# This handles cases where the GID already exists in the container (common on Synology)
RUN \
  if ! getent group ${PGID} > /dev/null 2>&1; then \
    echo "--- Group with GID ${PGID} does not exist, creating it as 'nodejsgroup' ---"; \
    addgroup -g ${PGID} -S nodejsgroup; \
  else \
    echo "--- Group with GID ${PGID} already exists, will use it ---"; \
  fi && \
  adduser -u ${PUID} -S nodejs -G $(getent group ${PGID} | cut -d: -f1)

# Copy built application files from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json .
COPY --from=builder /app/public ./public

# Set ownership of the application files to the newly created user
# This is crucial for file write permissions (e.g., database, uploads)
RUN chown -R nodejs:$(getent group ${PGID} | cut -d: -f1) .

# Switch to the non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 4000

# The command to start the application
CMD ["node", "server.js"]
