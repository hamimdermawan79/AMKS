import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'jimp',
    'sharp',
    'pino',
    'qrcode-terminal',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
  },
};

export default nextConfig;
