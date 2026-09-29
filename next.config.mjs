/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'sharp'],
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), clipboard-write=(self)',
          },
          {
            // Strict CSP allowlist — no unsafe-inline/unsafe-eval in script-src.
            // Next.js 16 injects a small inline bootstrap script; 'unsafe-inline' is
            // required only for style-src (CSS-in-JS / inline <style>).
            // All script execution is limited to same-origin bundles only.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'none'",
              // Next.js runtime bundles are served from same origin.
              // 'unsafe-inline' is intentionally NOT included here.
              // If Next.js requires an inline bootstrap script, add a nonce via middleware instead.
              "script-src 'self'",
              // Inline styles are needed by Next.js CSS-in-JS and emotion.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Google Fonts glyphs
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images from same origin, ibb.co (favicon), WhatsApp media, raw.githubusercontent.com (party popper emoji)
              "img-src 'self' data: blob: https://i.ibb.co https://pps.whatsapp.net https://raw.githubusercontent.com",
              // API calls are same-origin only. WhatsApp fetching is server-side.
              "connect-src 'self'",
              // No external frames allowed.
              "frame-src 'none'",
              // No plugins.
              "object-src 'none'",
              // Prevent base-URI hijacking.
              "base-uri 'self'",
              // Disallow form submissions to external URLs.
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@whiskeysockets/baileys'];
    }
    return config;
  },
};

export default nextConfig;
