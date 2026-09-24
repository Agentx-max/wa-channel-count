/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'sharp'],
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@whiskeysockets/baileys'];
    }
    return config;
  },
};

export default nextConfig;
