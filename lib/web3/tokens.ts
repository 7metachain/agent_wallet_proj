import { Address } from "viem";

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
  logoURI?: string;
}

// Token 地址映射 (按链 ID 组织)
export const TOKENS: Record<number, Record<string, TokenInfo>> = {
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

// 根据符号获取 Token 信息
export function getTokenBySymbol(
  chainId: number,
  symbol: string
): TokenInfo | undefined {
  const chainTokens = TOKENS[chainId];
  if (!chainTokens) return undefined;
  return chainTokens[symbol.toUpperCase()];
}

// 根据地址获取 Token 信息
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

// 获取链上所有 Token
export function getTokensForChain(chainId: number): TokenInfo[] {
  const chainTokens = TOKENS[chainId];
  if (!chainTokens) return [];
  return Object.values(chainTokens);
}

// 常用 Token 符号列表
export const COMMON_TOKEN_SYMBOLS = ["ETH", "WETH", "USDC", "USDT", "DAI", "WBTC"];

