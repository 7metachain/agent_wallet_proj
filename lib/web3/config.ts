import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { 
  monadMainnet, 
  monadTestnet, 
  MONAD_MAINNET_CHAIN_ID, 
  MONAD_TESTNET_CHAIN_ID 
} from "./chains";

// 使用 RainbowKit 的 getDefaultConfig 简化配置
// 支持 Monad Mainnet (Curvance) 和 Testnet
export const config = getDefaultConfig({
  appName: "Intent Bot",
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

// 重新导出链定义（保持向后兼容）
export { 
  monadMainnet, 
  monadTestnet, 
  MONAD_MAINNET_CHAIN_ID, 
  MONAD_TESTNET_CHAIN_ID 
} from "./chains";
