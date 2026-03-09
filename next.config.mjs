/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { dev }) => {
    if (dev && process.env.TERMUX_VERSION) {
      config.watchOptions = { poll: 1000, ignored: ['**/node_modules/**', '/data/**', '/system/**'] };
      config.cache = false;
    }
    return config;
  }
};
export default nextConfig;
