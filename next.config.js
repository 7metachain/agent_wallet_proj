/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Enable source maps for debugging
  productionBrowserSourceMaps: false,

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

  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Enable source maps in development for debugging
    if (dev) {
      // Use source-map for server-side (API routes) to enable proper debugging
      // Use eval-source-map for client-side for faster rebuilds
      config.devtool = isServer ? 'source-map' : 'eval-source-map';
    }

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

