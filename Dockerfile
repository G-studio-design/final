# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /

# Copy package.json and package-lock.json (if available)
# and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Create the final, smaller production image
FROM node:20-alpine

# Set the working directory
WORKDIR /

# Copy the built application from the builder stage
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /.next ./.next
COPY --from=builder /public ./public
COPY --from=builder /package.json ./package.json

# Expose the port the app runs on
EXPOSE 4000

# The command to run the application
CMD ["npm", "start"]
