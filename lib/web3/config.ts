import { http, createConfig } from "wagmi";
import { baseSepolia, arbitrumSepolia, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { chain } from "wagmi/chains";

// Monad 测试网配置 - 使用更完整的链定义
export const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://explorer.testnet.monad.xyz",
      apiUrl: "https://explorer.testnet.monad.xyz/api",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 0,
    },
  },
  testnet: true,
} as const;

// Hardhat 本地网络配置
export const hardhatLocal = {
  id: 31337,
  name: "Hardhat Local",
  network: "hardhat-local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hardhat Block Explorer",
      url: "http://127.0.0.1:8545",
    },
  },
  testnet: true,
} as const;

// 该文件负责导出应用使用到的链与 RainbowKit/wagmi 的运行时配置。
// 主要职责：
// - 指定支持的链（测试网）
// - 配置 WalletConnect 项目 ID（用于 WalletConnect v2）
// - 指定网络传输（这里使用 HTTP RPC 客户端）
// - 开启 SSR 模式以支持服务端渲染场景

// 使用 RainbowKit 的 `getDefaultConfig` 来简化常见的钱包连接配置。
// 参数说明：
// - appName: 在钱包或连接界面显示的应用名
// - projectId: WalletConnect 项目 ID（从环境变量读取），若未配置会使用占位符
// - chains: 应用支持的链数组（包括 Monad 测试网）
// - transports: 每个链使用的传输层，这里用 `http()` 来创建简单的 HTTP RPC 传输
// - ssr: 是否启用服务端渲染相关支持（true 表示启用）
export const config = getDefaultConfig({
  appName: "Intent Bot",
  // WalletConnect v2 需要 projectId，将从环境变量读取以便不同环境配置不同值。
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  // 这里列出的是当前应用支持的链——Hardhat 本地网、Monad 测试网和其他 Sepolia 测试网
  chains: [hardhatLocal, monadTestnet, baseSepolia, arbitrumSepolia, sepolia],
  // transports 使用链 id 作为键，方便按链指定不同的传输实现（例如 websocket 或 http）
  transports: {
    [hardhatLocal.id]: http(),
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
  },
  // 如果你的应用在 Next.js 中使用 SSR，设为 true 可以让 rainbowkit/wagmi 做出相应兼容
  ssr: true,
});

// 导出受支持的链列表和对应的类型别名，便于其它模块引用和进行类型检查。
export const supportedChains = [hardhatLocal, monadTestnet, baseSepolia, arbitrumSepolia, sepolia] as const;
export type SupportedChainId = (typeof supportedChains)[number]["id"];

// 导出添加 Monad 网络的函数
export async function addMonadNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x279f", // 10143 in hex
          chainName: "Monad Testnet",
          nativeCurrency: {
            name: "Monad",
            symbol: "MON",
            decimals: 18,
          },
          rpcUrls: ["https://testnet-rpc.monad.xyz"],
          blockExplorerUrls: ["https://explorer.testnet.monad.xyz"],
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Failed to add Monad network:", error);
    return false;
  }
}

// 扩展 Window 接口以支持 ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

