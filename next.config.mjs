/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Only apply Termux-specific hacks if we are in a dev environment
    if (dev && process.env.TERMUX_VERSION) {
      config.watchOptions = {
        poll: 1000,
        ignored: ['**/node_modules/**', '/data/**', '/system/**']
      };
      config.cache = false;
    }
    return config;
  },
  // Ensure we don't use turbopack on Vercel build
  experimental: {
    // This forces Vercel to use the Webpack builder
    turbo: undefined 
  }
};

export default nextConfig;
