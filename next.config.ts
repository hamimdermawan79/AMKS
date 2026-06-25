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
    },
  },
};

export default nextConfig;
