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
  // Monad Mainnet (143)
  143: {
    MON: {
      symbol: "MON",
      name: "Monad",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
      logoURI: "https://www.monad.xyz/favicon.ico",
    },
    WMON: {
      symbol: "WMON",
      name: "Wrapped MON",
      decimals: 18,
      address: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A" as Address,
      logoURI: "https://www.monad.xyz/favicon.ico",
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x" as Address, // TODO: Update with actual Monad mainnet USDC address
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
    USDT: {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      address: "0x" as Address, // TODO: Update with actual Monad mainnet USDT address
      logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      address: "0x" as Address, // TODO: Update with actual Monad mainnet WETH address
      logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    },
    WBTC: {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      address: "0x" as Address, // TODO: Update with actual Monad mainnet WBTC address
      logoURI: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
    },
  },

  // Monad Testnet (10143)
  10143: {
    MON: {
      symbol: "MON",
      name: "Monad",
      decimals: 18,
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
      logoURI: "https://www.monad.xyz/favicon.ico",
    },
    WMON: {
      symbol: "WMON",
      name: "Wrapped MON",
      decimals: 18,
      address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701" as Address,
      logoURI: "https://www.monad.xyz/favicon.ico",
    },
    USDC: {
      symbol: "USDC",
      name: "USD Coin (Testnet)",
      decimals: 6,
      address: "0x" as Address, // Can be minted from Atlantis DEX or Nabla Discord
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    },
    USDT: {
      symbol: "USDT",
      name: "Tether USD (Testnet)",
      decimals: 6,
      address: "0x" as Address, // Can be minted from Atlantis DEX or Nabla Discord
      logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    },
    WETH: {
      symbol: "WETH",
      name: "Wrapped Ether (Testnet)",
      decimals: 18,
      address: "0x" as Address, // Can be minted from Atlantis DEX or Nabla Discord
      logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    },
    WBTC: {
      symbol: "WBTC",
      name: "Wrapped Bitcoin (Testnet)",
      decimals: 8,
      address: "0x" as Address, // Can be minted from Atlantis DEX or Nabla Discord
      logoURI: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
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

// 常用 Token 符号列表 (Monad 生态)
export const COMMON_TOKEN_SYMBOLS = ["MON", "WMON", "USDC", "USDT", "WETH", "WBTC"];

