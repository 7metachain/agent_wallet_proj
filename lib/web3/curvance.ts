import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  CURVANCE_POOL_ABI,
  CURVANCE_POOL_ADDRESS,
  ERC20_APPROVE_ABI,
} from "./abi/curvance";
import { getTokenBySymbol, MONAD_TESTNET_CHAIN_ID } from "./tokens";

// 交易类型定义
export interface PreparedTransaction {
  id: string;
  type: "approve" | "supply" | "withdraw";
  to: Address;
  data: `0x${string}`;
  value: string;
  gasLimit?: string;
  description: string;
}

// Supply 参数
export interface SupplyParams {
  token: string;
  amount: string;
  userAddress: Address;
}

// Withdraw 参数
export interface WithdrawParams {
  token: string;
  amount: string;
  userAddress: Address;
}

/**
 * 构建 Supply (存款) 交易
 * @param params Supply 参数
 * @returns 准备好的交易数组 (可能包含 approve + supply)
 */
export async function buildSupplyTx(
  params: SupplyParams
): Promise<PreparedTransaction[]> {
  const { token, amount, userAddress } = params;
  const transactions: PreparedTransaction[] = [];

  // 获取 Token 信息
  const tokenInfo = getTokenBySymbol(MONAD_TESTNET_CHAIN_ID, token);
  if (!tokenInfo) {
    throw new Error(`Token ${token} not found on Monad Testnet`);
  }

  // 解析金额
  const parsedAmount = parseUnits(amount, tokenInfo.decimals);

  // 检查是否是原生代币 (MON)
  const isNativeToken =
    tokenInfo.address.toLowerCase() ===
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE".toLowerCase();

  if (!isNativeToken) {
    // 非原生代币需要先 approve
    const approveData = encodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [CURVANCE_POOL_ADDRESS as Address, parsedAmount],
    });

    transactions.push({
      id: `approve-${token}-${Date.now()}`,
      type: "approve",
      to: tokenInfo.address,
      data: approveData,
      value: "0",
      description: `Approve ${amount} ${token} for Curvance`,
    });
  }

  // 构建 supply 交易
  const supplyData = encodeFunctionData({
    abi: CURVANCE_POOL_ABI,
    functionName: "supply",
    args: [
      tokenInfo.address,
      parsedAmount,
      userAddress,
      0, // referralCode
    ],
  });

  transactions.push({
    id: `supply-${token}-${Date.now()}`,
    type: "supply",
    to: CURVANCE_POOL_ADDRESS as Address,
    data: supplyData,
    value: isNativeToken ? parsedAmount.toString() : "0",
    description: `Supply ${amount} ${token} to Curvance`,
  });

  return transactions;
}

/**
 * 构建 Withdraw (取款) 交易
 * @param params Withdraw 参数
 * @returns 准备好的交易
 */
export async function buildWithdrawTx(
  params: WithdrawParams
): Promise<PreparedTransaction[]> {
  const { token, amount, userAddress } = params;
  const transactions: PreparedTransaction[] = [];

  // 获取 Token 信息
  const tokenInfo = getTokenBySymbol(MONAD_TESTNET_CHAIN_ID, token);
  if (!tokenInfo) {
    throw new Error(`Token ${token} not found on Monad Testnet`);
  }

  // 解析金额
  // 如果 amount 是 "max" 或 "all"，使用最大值
  let parsedAmount: bigint;
  if (amount.toLowerCase() === "max" || amount.toLowerCase() === "all") {
    // 使用 uint256 最大值表示取出全部
    parsedAmount = BigInt(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
  } else {
    parsedAmount = parseUnits(amount, tokenInfo.decimals);
  }

  // 构建 withdraw 交易
  const withdrawData = encodeFunctionData({
    abi: CURVANCE_POOL_ABI,
    functionName: "withdraw",
    args: [tokenInfo.address, parsedAmount, userAddress],
  });

  transactions.push({
    id: `withdraw-${token}-${Date.now()}`,
    type: "withdraw",
    to: CURVANCE_POOL_ADDRESS as Address,
    data: withdrawData,
    value: "0",
    description: `Withdraw ${amount === "max" || amount === "all" ? "all" : amount} ${token} from Curvance`,
  });

  return transactions;
}

/**
 * 获取交易摘要
 */
export function getTransactionSummary(
  transactions: PreparedTransaction[]
): {
  totalSteps: number;
  descriptions: string[];
} {
  return {
    totalSteps: transactions.length,
    descriptions: transactions.map((tx) => tx.description),
  };
}
