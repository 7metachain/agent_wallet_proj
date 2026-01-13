import { Address } from "viem";

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: Address;
  logoURI?: string;
}

// Token 地址映射 (按链 ID 组织)
// Monad Testnet Chain ID: 10143
export const TOKENS: Record<number, Record<string, TokenInfo>> = {
  // Monad Testnet (10143)
  // 注意: Token 地址为占位符，待 Monad 测试网公开后更新
  10143: {
    MON: {
      symbol: "MON",
      name: "Monad",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, // Native token
      logoURI: "https://monad.xyz/logo.png",
    },
    WMON: {
      symbol: "WMON",
      name: "Wrapped Monad",
      decimals: 18,
      address: "0x0000000000000000000000000000000000000001" as Address, // Placeholder
      logoURI: "https://monad.xyz/wmon-logo.png",
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0xEbaE6CA454De1D446eda9052ffD9AFCAb1E518C6" as Address, // Placeholder
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
    USDT: {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      address: "0x0000000000000000000000000000000000000003" as Address, // Placeholder
      logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    },
    DAI: {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      address: "0x0000000000000000000000000000000000000004" as Address, // Placeholder
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

// 常用 Token 符号列表 (Monad)
export const COMMON_TOKEN_SYMBOLS = ["MON", "WMON", "USDC", "USDT", "DAI"];

// Monad Testnet Chain ID
export const MONAD_TESTNET_CHAIN_ID = 10143;

