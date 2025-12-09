# ---- Base Stage ----
# Start with the official Node.js 18 image.
# Using a specific version is good practice for consistent builds.
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies needed for some native Node.js modules.
# We do this in the base stage so it's available for all subsequent stages.
RUN apk add --no-cache libc6-compat


# ---- Dependencies Stage ----
# This stage is dedicated to installing ONLY the production dependencies.
FROM base AS deps
WORKDIR /app

# Copy package.json and the lock file.
COPY package.json ./

# Use 'npm install' which is more flexible than 'npm ci' and doesn't require a lock file.
# This is better for deployment environments where a lock file might not be present.
RUN npm install --only=production


# ---- Build Stage ----
# This stage builds the Next.js application.
FROM base AS builder
WORKDIR /app

# Copy the installed production dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code.
COPY . .

# Install ALL dependencies, including 'devDependencies' needed for building.
RUN npm install

# Build the Next.js application.
RUN npm run build


# ---- Runner Stage (Final Image) ----
# This is the final, small, and optimized image that will run the application.
FROM base AS runner
WORKDIR /app

# Set the environment to 'production'.
ENV NODE_ENV=production
# Expose the port the app will run on.
EXPOSE 4000

# Automatically create a 'next' user with no password and no home directory.
# Running as a non-root user is a security best practice.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application from the 'builder' stage.
# This includes the '.next' folder, 'public' folder, and 'node_modules'.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the user to the non-root user we created.
USER nextjs

# The command to start the application.
# It runs the server.js file from the standalone output.
CMD ["node", "server.js"]
