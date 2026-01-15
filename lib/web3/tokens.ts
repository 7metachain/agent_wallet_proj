import { Address } from "viem";

// TokenInfo: 描述代币的元数据结构，供 UI 和业务逻辑使用
// - symbol: 代币简称（例如 ETH、USDC）
// - name: 代币全称
// - decimals: 小数位数（用于金额格式化与单位转换）
// - address: 合约地址（原生币使用特殊地址占位）
// - logoURI: 可选，代币图标 URL（用于展示）
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
  logoURI?: string;
}

// TOKENS: 按链 ID 组织的代币映射表。每个链包含若干已知代币及其元数据。
// 设计目的：
// - 为交易构建、余额查询、UI 下拉选择等场景提供可靠的代币元数据来源
// - 将链相关的代币隔离，便于多链支持
export const TOKENS: Record<number, Record<string, TokenInfo>> = {
  // Monad Testnet (10143)
  10143: {
    MON: {
      symbol: "MON",
      name: "Monad",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
      logoURI: "https://via.placeholder.com/150/8B5CF6/FFFFFF?text=MON",
    },
    // Mock MONAD Token (ERC20)
    MONAD: {
      symbol: "MONAD",
      name: "Mock Monad Token",
      decimals: 18,
      address: (process.env.NEXT_PUBLIC_MONAD_TOKEN || "0x0000000000000000000000000000000000000000") as Address,
      logoURI: "https://via.placeholder.com/150/8B5CF6/FFFFFF?text=MONAD",
    },
    // Mock USDC (for testing purposes)
    USDC: {
      symbol: "USDC",
      name: "Mock USD Coin",
      decimals: 6,
      address: (process.env.NEXT_PUBLIC_MOCK_USDC || "0x0000000000000000000000000000000000000000") as Address,
      logoURI: "https://via.placeholder.com/150/2775CA/FFFFFF?text=USDC",
    },
  },

  // Base Sepolia (84532)
  84532: {
    ETH: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      address: "0x4200000000000000000000000000000000000006" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
    // Mock MONAD Token (部署后从 .env 读取地址)
    MONAD: {
      symbol: "MONAD",
      name: "Mock Monad",
      decimals: 18,
      address: (process.env.NEXT_PUBLIC_MONAD_TOKEN || "0x0000000000000000000000000000000000000000") as Address,
      logoURI: "https://via.placeholder.com/150/8B5CF6/FFFFFF?text=MONAD",
    },
  },

  // Arbitrum Sepolia (421614)
  421614: {
    ETH: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      address: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
  },

  // Ethereum Sepolia (11155111)
  11155111: {
    ETH: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
    DAI: {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x68194a729C2450ad26072b3D33ADaCbcef39D574" as Address,
      logoURI: "https://assets.coingecko.com/coins/images/9956/small/4943.png",
    },
  },
};

// 根据符号（symbol）获取 Token 信息
// - 返回值可能为 undefined（符号未收录或链未支持）
// - 自动处理代币符号别名（例如在 Monad Testnet 上将 ETH 映射为 MON）
export function getTokenBySymbol(
  chainId: number,
  symbol: string
): TokenInfo | undefined {
  const chainTokens = TOKENS[chainId];
  if (!chainTokens) return undefined;

  const normalizedSymbol = symbol.toUpperCase();

  // 在 Monad Testnet 上，将 ETH 自动映射为 MON（原生代币）
  if (chainId === 10143 && normalizedSymbol === "ETH") {
    console.log(`[tokens] Auto-mapping ETH to MON for Monad Testnet`);
    return chainTokens["MON"];
  }

  return chainTokens[normalizedSymbol];
}

// 根据地址获取 Token 信息（地址优先匹配，区分大小写规范化）
// - 常用于从链上返回的 token 地址映射为 UI 可识别的元数据
export function getTokenByAddress(
  chainId: number,
  address: Address
): TokenInfo | undefined {
  const chainTokens = TOKENS[chainId];
  if (!chainTokens) return undefined;

  const normalizedAddress = address.toLowerCase();
  return Object.values(chainTokens).find(
    (token) => token.address.toLowerCase() === normalizedAddress
  );
}

// 获取指定链上所有已知 Token 的数组（用于列表渲染或下拉选择）
export function getTokensForChain(chainId: number): TokenInfo[] {
  const chainTokens = TOKENS[chainId];
  if (!chainTokens) return [];
  return Object.values(chainTokens);
}

// 常用 Token 符号列表，用于 UI 预设或快速筛选
export const COMMON_TOKEN_SYMBOLS = ["ETH", "WETH", "USDC", "USDT", "DAI", "WBTC"];

