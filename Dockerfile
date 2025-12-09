# Dockerfile

# Base Image
FROM node:18-alpine AS base

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./


# -------------------- Dependencies --------------------
FROM base AS deps
RUN npm install --only=production


# -------------------- Build --------------------
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


# -------------------- Runner --------------------
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 4000

# Start app
CMD ["npm", "start"]
