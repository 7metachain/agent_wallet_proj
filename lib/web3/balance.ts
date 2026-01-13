/**
 * Client-side balance checking utilities
 * Uses wagmi and viem to query balances from the connected wallet
 */

import { Address, formatUnits } from "viem";
import { getTokenBySymbol, COMMON_TOKEN_SYMBOLS } from "./tokens";
import { erc20Abi } from "./abi/erc20";
import { BalanceInfo } from "@/types/intent";

/**
 * Format balance amount with proper decimals
 */
export function formatBalance(balance: bigint, decimals: number): string {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;

  // Show up to 4 decimal places, removing trailing zeros
  return num.toFixed(4).replace(/\.?0+$/, "");
}

/**
 * Query native token (MON) balance
 */
export async function queryNativeBalance(
  address: Address,
  chainId: number,
  publicClient: any
): Promise<BalanceInfo> {
  console.log("queryNativeBalance called", { address, chainId });

  try {
    const balance = await publicClient.getBalance({ address });
    console.log("Native balance raw:", balance);

    return {
      token: "MON",
      symbol: "MON",
      balance: formatBalance(balance, 18),
      rawBalance: balance.toString(),
      decimals: 18,
    };
  } catch (error) {
    console.error("Error in queryNativeBalance:", error);
    throw error;
  }
}

/**
 * Query ERC20 token balance
 */
export async function queryERC20Balance(
  address: Address,
  symbol: string,
  chainId: number,
  publicClient: any
): Promise<BalanceInfo | null> {
  console.log(`queryERC20Balance called for ${symbol}`, { address, chainId });

  try {
    const tokenInfo = getTokenBySymbol(chainId, symbol);
    if (!tokenInfo) {
      console.warn(`Token ${symbol} not found for chain ${chainId}`);
      return null;
    }

    console.log(`Token info for ${symbol}:`, tokenInfo);

    // Skip native token (handled separately)
    if (tokenInfo.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      console.log(`Skipping native token ${symbol}`);
      return null;
    }

    // Skip tokens with placeholder addresses
    if (tokenInfo.address === "0x") {
      console.warn(`Token ${symbol} has placeholder address on chain ${chainId}`);
      return null;
    }

    console.log(`Calling readContract for ${symbol} at ${tokenInfo.address}`);
    const balance = await publicClient.readContract({
      address: tokenInfo.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });

    console.log(`${symbol} balance raw:`, balance);

    return {
      token: tokenInfo.name,
      symbol: tokenInfo.symbol,
      balance: formatBalance(balance, tokenInfo.decimals),
      rawBalance: balance.toString(),
      decimals: tokenInfo.decimals,
    };
  } catch (error) {
    console.error(`Error querying ${symbol} balance:`, error);
    return null;
  }
}

/**
 * Query all token balances in parallel
 */
export async function queryAllBalances(
  address: Address,
  chainId: number,
  publicClient: any
): Promise<BalanceInfo[]> {
  try {
    // Query native balance
    const nativeBalance = await queryNativeBalance(address, chainId, publicClient);

    // Query ERC20 tokens in parallel
    const erc20Queries = COMMON_TOKEN_SYMBOLS.filter((s) => s !== "MON").map(
      (symbol) => queryERC20Balance(address, symbol, chainId, publicClient)
    );

    const erc20Balances = await Promise.all(erc20Queries);

    // Combine results, filter out nulls
    const allBalances = [nativeBalance, ...erc20Balances.filter(Boolean)];

    return allBalances as BalanceInfo[];
  } catch (error) {
    console.error("Error querying all balances:", error);
    throw new Error("Failed to query wallet balances");
  }
}

/**
 * Format balance data into a human-readable markdown message
 */
export function formatBalanceMessage(balances: BalanceInfo[]): string {
  if (balances.length === 0) {
    return "📊 **Wallet Balance on Monad**\n\nNo tokens found in this wallet.";
  }

  const balanceLines = balances
    .map((b) => `• ${b.symbol}: ${b.balance} ${b.symbol}`)
    .join("\n");

  return `📊 **Wallet Balance on Monad**\n\n${balanceLines}`;
}
