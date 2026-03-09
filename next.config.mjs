/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. This is helpful for 3D projects with
    // complex library type mismatches.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
