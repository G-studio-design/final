
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
       {
         protocol: 'https',
         hostname: 'lh3.googleusercontent.com',
       },
       {
         protocol: 'https',
         hostname: 'placehold.co',
       }
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
