import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'jimp',
    'sharp',
    'pino',
    'qrcode-terminal',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 hari cache
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
  },
};

export default nextConfig;
