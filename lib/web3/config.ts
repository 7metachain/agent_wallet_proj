import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// 定义 Monad Mainnet
export const monadMainnet = defineChain({
  id: 143,
  name: "Monad Mainnet",
  network: "monad",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.monad.xyz"],
      webSocket: ["wss://rpc.monad.xyz"],
    },
    public: {
      http: ["https://rpc.monad.xyz"],
      webSocket: ["wss://rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1,
    },
  },
});

// 定义 Monad Testnet
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.monad.xyz"],
    },
    public: {
      http: ["https://testnet.monad.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "Monad Testnet Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

// 使用 RainbowKit 的 getDefaultConfig 简化配置
export const config = getDefaultConfig({
  appName: "Monad Intent Bot",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [monadMainnet, monadTestnet],
  transports: {
    [monadMainnet.id]: http(),
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

// 导出支持的链
export const supportedChains = [monadMainnet, monadTestnet] as const;
export type SupportedChainId = (typeof supportedChains)[number]["id"];

