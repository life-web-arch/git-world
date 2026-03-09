/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // We removed the eslint block because Next 16 handles it differently
  webpack: (config, { dev }) => {
    if (dev && process.env.TERMUX_VERSION) {
      config.watchOptions = {
        poll: 1000,
        ignored: ['**/node_modules/**', '/data/**', '/system/**']
      };
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;
