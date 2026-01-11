/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 在 CI 或本地快速迭代时，允许在构建阶段忽略 ESLint 报错。
  // 注意：长期不建议关闭 lint，生产发布前应修复所有 lint 问题。
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // 为浏览器打包时避免某些原生 / react-native 包导致的解析错误，添加别名
    // MetaMask SDK 在浏览器 bundle 中会尝试引入 '@react-native-async-storage/async-storage'
    // 将其映射为 false（或指向空实现）可以避免构建时报错
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false,
    };

    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;

