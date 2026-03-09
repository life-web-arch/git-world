/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        // Stop Webpack from scanning Android root and parent directories
        ignored:[
          '**/node_modules/**', 
          '/data/**', 
          '/system/**', 
          '/storage/**', 
          '/sdcard/**',
          '/' // This stops the scandir '/' error
        ],
      };
      config.cache = false; // Prevents ENOENT cache crash in Termux
    }
    return config;
  },
};

export default nextConfig;
