/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Disable ESLint and TypeScript checks during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

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
    // 为浏览器打包时避免某些原生 / react-native 包导致的解析错误，添加别名
    // MetaMask SDK 在浏览器 bundle 中会尝试引入 '@react-native-async-storage/async-storage'
    // 将其映射为 false（或指向空实现）可以避免构建时报错
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false,
    };

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

