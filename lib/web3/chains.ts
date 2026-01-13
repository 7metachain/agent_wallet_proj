import { defineChain } from "viem";

// ============================================
// Monad Mainnet 链配置
// Curvance 合约部署在此网络
// ============================================
export const monadMainnet = defineChain({
  id: 41454,
  name: "Monad",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://monadexplorer.com",
    },
  },
  testnet: false,
});

// Monad Mainnet Chain ID
export const MONAD_MAINNET_CHAIN_ID = 41454;

// ============================================
// Monad Testnet 链配置
// ============================================
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

// Monad Testnet Chain ID
export const MONAD_TESTNET_CHAIN_ID = 10143;

// ============================================
// 默认使用的网络
// 注意：Curvance 合约在 Mainnet 上
// ============================================
export const DEFAULT_CHAIN = monadMainnet;
export const DEFAULT_CHAIN_ID = MONAD_MAINNET_CHAIN_ID;
