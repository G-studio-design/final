# Dockerfile

# Stage 1: Base image with Node.js
# Using a specific version is better for reproducibility
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Stage 2: Install dependencies
# Copy package.json and package-lock.json
FROM base AS deps
COPY package.json ./
# Use npm ci for faster, more reliable builds in CI/CD environments
RUN npm ci

# Stage 3: Build the application
# Copy source code and build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Make sure the build command is run
RUN npm run build

# Stage 4: Production image
# Use a lean base image for production
FROM base AS runner
WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
# Standalone output is more optimized for production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
# Use the node server from the standalone output
CMD ["node", "server.js"]
