import { http } from "wagmi";
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// 定义 Monad Testnet 链配置
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

// 使用 RainbowKit 的 getDefaultConfig 简化配置
export const config = getDefaultConfig({
  appName: "Intent Bot",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

// 导出支持的链
export const supportedChains = [monadTestnet] as const;
export type SupportedChainId = (typeof supportedChains)[number]["id"];

// Monad Testnet Chain ID
export const MONAD_TESTNET_CHAIN_ID = 10143;