# Dockerfile

# ==================================
# Stage 1: Base Image & Dependencies
# ==================================
# Using the official Node.js 20 image based on Alpine Linux
FROM node:20-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# ==================================
# Stage 2: Build
# ==================================
# Use a new stage for building the application to keep the final image small
FROM base AS build

# Install dependencies (including devDependencies needed for build)
# Using --no-update-notifier and --no-audit for cleaner, faster builds
RUN npm install --no-update-notifier --no-audit

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# ==================================
# Stage 3: Production Image
# ==================================
# Start from a clean base image again for the final production stage
FROM base AS production

# Set build arguments for user and group IDs, with defaults
ARG PUID=1026
ARG PGID=100

# Create a non-root user and group for running the app
# This robust command first checks if the group exists, and only creates it if it doesn't.
# Then it creates the user, ensuring compatibility.
RUN addgroup -S -g ${PGID} nodejs || true && \
    adduser -S -u ${PUID} -G nodejs nodejs

# Copy only the necessary files from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./

# Switch to the non-root user for security
USER nodejs

# Expose the port the app runs on
EXPOSE 4000

# The command to start the application
CMD ["npm", "start"]
