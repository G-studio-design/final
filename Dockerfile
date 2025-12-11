# 1. Base Image
# Menggunakan image Node.js versi LTS dengan basis Alpine yang ringan
FROM node:20-alpine

# 2. Set Working Directory
# Menetapkan direktori kerja di dalam kontainer
WORKDIR /app

# 3. Copy package.json and package-lock.json
# Menyalin file-file ini terlebih dahulu untuk memanfaatkan cache Docker
COPY package*.json ./

# 4. Install Dependencies
# Menginstal dependensi proyek
RUN npm install

# 5. Copy Application Code
# Menyalin sisa kode aplikasi ke dalam direktori kerja
COPY . .

# 6. Set File Permissions (Opsional, tapi praktik yang baik)
# Mengubah kepemilikan file ke pengguna non-root
# RUN chown -R node:node .

# 7. Build the Application
# Menjalankan script build dari Next.js
RUN npm run build

# 8. Expose Port
# Memberi tahu Docker bahwa kontainer akan berjalan di port 4000
EXPOSE 4000

# 9. Set User (Opsional, tapi sangat disarankan untuk keamanan)
# Beralih ke pengguna non-root yang dibuat oleh image Node.js
# USER node

# 10. Default Command
# Perintah yang akan dijalankan saat kontainer dimulai
CMD ["npm", "start"]
