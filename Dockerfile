# Dockerfile

# ==================================
# Builder Stage
# ==================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# ==================================
# Production Stage
# ==================================
FROM node:20-alpine AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built assets from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json .

# Create a non-root user and group to run the app
ARG PUID=1026
ARG PGID=100
RUN addgroup -g ${PGID} -S nodejs
RUN adduser -u ${PUID} -S nodejs -G nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to the non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 4000

# The command to run the application
CMD ["node", "server.js"]
