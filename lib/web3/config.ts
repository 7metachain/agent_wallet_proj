import { http, createConfig } from "wagmi";
import { baseSepolia, arbitrumSepolia, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// 使用 RainbowKit 的 getDefaultConfig 简化配置
export const config = getDefaultConfig({
  appName: "Intent Bot",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [baseSepolia, arbitrumSepolia, sepolia],
  transports: {
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

// 导出支持的链
export const supportedChains = [baseSepolia, arbitrumSepolia, sepolia] as const;
export type SupportedChainId = (typeof supportedChains)[number]["id"];

