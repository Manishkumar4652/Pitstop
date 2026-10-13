const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared-types'],
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['shared-types'] = path.resolve(__dirname, '../../packages/shared-types/src/index.ts');
    return config;
  },
};

module.exports = nextConfig;
