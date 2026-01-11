import { Address, formatUnits, PublicClient } from "viem";
import { TokenInfo, getTokenBySymbol, getTokensForChain } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";

// balance-checker.ts 负责封装与余额/授权相关的链上读取逻辑。
// 主要用途：
// - 查询原生代币（例如 ETH）余额
// - 查询 ERC20 代币余额和 allowance（授权额度）
// - 聚合钱包摘要（native + tokens）供 UI 显示
// 设计要点：
// - 使用 wagmi 的 `PublicClient` 以无签名只读方式与 RPC 交互（适合在服务端或前端只读场景）
// - 将余额以 bigint 原始单位返回，同时提供 `formatted`（人类可读字符串）
// - 对可能发生的链读取错误做容错处理并在控制台打印，避免抛出致命异常

/**
 * 余额信息
 */
export interface BalanceInfo {
  token: TokenInfo;
  balance: string;
  formatted: string;
  decimals: number;
}

/**
 * 查询原生代币余额 (ETH, etc.)
 */
export async function getNativeBalance(
  publicClient: PublicClient,
  address: Address
): Promise<bigint> {
  const balance = await publicClient.getBalance({
    address,
  });
  return balance;
}

/**
 * 查询 ERC20 代币余额
 */
export async function getERC20Balance(
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address
): Promise<bigint> {
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [ownerAddress],
  });
  return balance as bigint;
}

/**
 * 查询单个代币余额
 */
export async function getTokenBalance(
  publicClient: PublicClient,
  chainId: number,
  symbol: string,
  ownerAddress: Address
): Promise<BalanceInfo | null> {
  const tokenInfo = getTokenBySymbol(chainId, symbol);
  if (!tokenInfo) {
    return null;
  }

  // 如果是原生代币
  if (symbol.toUpperCase() === "ETH") {
    const balance = await getNativeBalance(publicClient, ownerAddress);
    return {
      token: tokenInfo,
      balance: balance.toString(),
      formatted: formatUnits(balance, tokenInfo.decimals),
      decimals: tokenInfo.decimals,
    };
  }

  // ERC20 代币
  const balance = await getERC20Balance(publicClient, tokenInfo.address, ownerAddress);
  return {
    token: tokenInfo,
    balance: balance.toString(),
    formatted: formatUnits(balance, tokenInfo.decimals),
    decimals: tokenInfo.decimals,
  };
}

/**
 * 查询所有代币余额
 */
export async function getAllTokenBalances(
  publicClient: PublicClient,
  chainId: number,
  ownerAddress: Address
): Promise<BalanceInfo[]> {
  const tokens = getTokensForChain(chainId);
  const balances: BalanceInfo[] = [];

  for (const token of tokens) {
    try {
      let balance: bigint;

      if (token.symbol.toUpperCase() === "ETH") {
        balance = await getNativeBalance(publicClient, ownerAddress);
      } else {
        balance = await getERC20Balance(publicClient, token.address, ownerAddress);
      }

      // 只返回余额大于 0 的代币
      if (balance > BigInt(0)) {
        balances.push({
          token,
          balance: balance.toString(),
          formatted: formatUnits(balance, token.decimals),
          decimals: token.decimals,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch balance for ${token.symbol}:`, error);
    }
  }

  return balances;
}

/**
 * 查询 ERC20 授权额度
 */
export async function getAllowance(
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<bigint> {
  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress],
    });
    return allowance as bigint;
  } catch (error) {
    console.error("Failed to fetch allowance:", error);
    return BigInt(0);
  }
}

/**
 * 检查授权额度是否足够
 */
export async function hasSufficientAllowance(
  publicClient: PublicClient,
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address,
  requiredAmount: bigint
): Promise<boolean> {
  const allowance = await getAllowance(
    publicClient,
    tokenAddress,
    ownerAddress,
    spenderAddress
  );
  return allowance >= requiredAmount;
}

/**
 * 获取钱包摘要信息
 */
export interface WalletSummary {
  nativeBalance: BalanceInfo;
  tokenBalances: BalanceInfo[];
  totalValue?: string; // 需要价格信息才能计算
}

/**
 * 查询钱包摘要
 */
export async function getWalletSummary(
  publicClient: PublicClient,
  chainId: number,
  ownerAddress: Address
): Promise<WalletSummary> {
  // 查询原生代币余额
  const nativeBalanceInfo = await getTokenBalance(
    publicClient,
    chainId,
    "ETH",
    ownerAddress
  );

  if (!nativeBalanceInfo) {
    throw new Error("Failed to fetch native balance");
  }

  // 查询所有代币余额
  const allBalances = await getAllTokenBalances(
    publicClient,
    chainId,
    ownerAddress
  );

  // 分离原生代币和其他代币
  const tokenBalances = allBalances.filter(
    (b) => b.token.symbol.toUpperCase() !== "ETH"
  );

  return {
    nativeBalance: nativeBalanceInfo,
    tokenBalances,
  };
}

/**
 * 格式化余额显示
 */
export function formatBalanceDisplay(balance: BalanceInfo): string {
  const num = parseFloat(balance.formatted);

  // 如果小于 0.001，显示科学计数法
  if (num < 0.001 && num > 0) {
    return `${num.toExponential(2)} ${balance.token.symbol}`;
  }

  // 如果小于 1，显示 4 位小数
  if (num < 1) {
    return `${num.toFixed(4)} ${balance.token.symbol}`;
  }

  // 否则显示 2 位小数
  return `${num.toFixed(2)} ${balance.token.symbol}`;
}

/**
 * 检查余额是否足够
 */
export function hasSufficientBalance(
  balance: bigint,
  required: bigint
): boolean {
  return balance >= required;
}

/**
 * 检查多个代币余额是否足够
 */
export async function checkSufficientBalances(
  publicClient: PublicClient,
  chainId: number,
  ownerAddress: Address,
  requiredBalances: { symbol: string; amount: string }[]
): Promise<{ symbol: string; sufficient: boolean; currentBalance: string }[]> {
  const results = [];

  for (const { symbol, amount } of requiredBalances) {
    const balanceInfo = await getTokenBalance(
      publicClient,
      chainId,
      symbol,
      ownerAddress
    );

    if (!balanceInfo) {
      results.push({
        symbol,
        sufficient: false,
        currentBalance: "0",
      });
      continue;
    }

    const tokenInfo = getTokenBySymbol(chainId, symbol);
    if (!tokenInfo) {
      continue;
    }

    const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** tokenInfo.decimals));
    const currentBalance = BigInt(balanceInfo.balance);

    results.push({
      symbol,
      sufficient: currentBalance >= requiredAmount,
      currentBalance: balanceInfo.formatted,
    });
  }

  return results;
}
