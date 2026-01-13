/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Optimize compile performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Reduce memory usage during builds
  experimental: {
    // Use worker threads for compilation
    workerThreads: true,
    // Cache optimization
    cpus: Math.max(1, require('os').cpus().length - 1),
  },

  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Optimize webpack for faster compilation
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    // Cache webpack modules for faster rebuilds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },
};

module.exports = nextConfig;

