const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared-types'],
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['shared-types'] = path.resolve(__dirname, '../../packages/shared-types/src/index.ts');
    return config;
  },

  /**
   * Security Headers — applied to every page/API route.
   * Equivalent of Helmet for the Next.js frontend.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer info sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by the app
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
          // Content Security Policy — restrict where scripts/styles/connections can come from
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js needs inline scripts for hydration; restrict to same origin
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
              // Allow inline styles (used by Tailwind / framer-motion) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Google Fonts files
              "font-src 'self' https://fonts.gstatic.com",
              // API calls to our own backend + Google Maps tile/geocoding APIs
              "connect-src 'self' http://localhost:4000 https://maps.googleapis.com https://maps.gstatic.com",
              // Images: self, data URIs, and all HTTPS (for map tiles)
              "img-src 'self' data: blob: https:",
              // Google Maps iframes
              "frame-src https://www.google.com",
              // Block all object/embed
              "object-src 'none'",
              // Upgrade HTTP to HTTPS
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
