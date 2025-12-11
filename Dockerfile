# Tahap 1: Base Image dengan Node.js
FROM node:18-alpine AS base

# Set direktori kerja di dalam kontainer
# Semua file proyek akan sudah ada di sini berkat docker-compose
WORKDIR /

# Salin package.json dan package-lock.json (jika ada)
# Ini memanfaatkan caching Docker
COPY package*.json ./

# Instal dependensi
RUN npm install --no-update-notifier --no-audit

# Salin sisa file aplikasi
COPY . .

# Build aplikasi Next.js
RUN npm run build

# Default command untuk menjalankan aplikasi
CMD ["npm", "start"]
