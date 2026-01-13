import { Address, encodeFunctionData, parseUnits } from "viem";
import {
  CTOKEN_ABI,
  NATIVE_VAULT_ZAPPER_ABI,
  ERC20_APPROVE_ABI,
  CURVANCE_NATIVE_VAULT_ZAPPER,
  CURVANCE_SHMON_MARKET,
  CURVANCE_CTOKENS,
  MOCK_LENDING_POOL_ABI,
  MOCK_LENDING_POOL_ADDRESS,
} from "./abi/curvance";
import { getTokenBySymbol } from "./tokens";

// Chain IDs
const MONAD_MAINNET_CHAIN_ID = 41454;
const MONAD_TESTNET_CHAIN_ID = 10143;

// 原生代币地址标识
const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address;

// ============================================
// 配置：选择使用 Mock 合约还是真实 Curvance
// ============================================
// 在 Testnet 上使用 Mock 合约，在 Mainnet 上使用真实 Curvance
export const USE_MOCK_ON_TESTNET = true;

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
  chainId?: number;
}

// Withdraw 参数
export interface WithdrawParams {
  token: string;
  amount: string;
  userAddress: Address;
  chainId?: number;
}

/**
 * 判断是否应该使用 Mock 合约
 */
function shouldUseMock(chainId?: number): boolean {
  if (!USE_MOCK_ON_TESTNET) return false;
  if (!chainId) return true; // 默认使用 Mock
  return chainId === MONAD_TESTNET_CHAIN_ID;
}

/**
 * 获取 Mock 合约地址
 */
function getMockPoolAddress(): Address {
  if (MOCK_LENDING_POOL_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Mock Lending Pool 尚未部署！请先部署合约并更新地址。查看 contracts/DEPLOY_GUIDE.md");
  }
  return MOCK_LENDING_POOL_ADDRESS as Address;
}

/**
 * 获取 token 对应的 cToken 地址 (仅用于真实 Curvance)
 */
function getCTokenAddress(token: string): Address | null {
  const upperToken = token.toUpperCase();
  
  // 对于 MON/WMON，使用 shMON 市场的 cWMON
  if (upperToken === "MON" || upperToken === "WMON") {
    return CURVANCE_SHMON_MARKET.cWMON as Address;
  }
  
  // 查找其他 cToken
  const cTokenAddress = CURVANCE_CTOKENS[upperToken];
  return cTokenAddress ? (cTokenAddress as Address) : null;
}

/**
 * 构建 Supply (存款) 交易
 * 支持 Mock 合约 (Testnet) 和真实 Curvance (Mainnet)
 */
export async function buildSupplyTx(
  params: SupplyParams
): Promise<PreparedTransaction[]> {
  const { token, amount, userAddress, chainId = MONAD_TESTNET_CHAIN_ID } = params;
  const transactions: PreparedTransaction[] = [];

  // 获取 Token 信息
  let tokenInfo = getTokenBySymbol(chainId, token);
  if (!tokenInfo) {
    tokenInfo = getTokenBySymbol(MONAD_TESTNET_CHAIN_ID, token);
  }
  if (!tokenInfo) {
    tokenInfo = getTokenBySymbol(MONAD_MAINNET_CHAIN_ID, token);
  }
  
  if (!tokenInfo) {
    throw new Error(`Token ${token} not found on Monad`);
  }

  // 解析金额
  const parsedAmount = parseUnits(amount, tokenInfo.decimals);

  // 检查是否是原生代币 (MON)
  const isNativeToken =
    token.toUpperCase() === "MON" ||
    tokenInfo.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

  // ============================================
  // Mock 合约模式 (Testnet)
  // ============================================
  if (shouldUseMock(chainId)) {
    const mockPoolAddress = getMockPoolAddress();

    if (isNativeToken) {
      // 使用 Mock 的 depositNative(onBehalfOf)
      const supplyData = encodeFunctionData({
        abi: MOCK_LENDING_POOL_ABI,
        functionName: "depositNative",
        args: [userAddress],
      });

      transactions.push({
        id: `supply-${token}-${Date.now()}`,
        type: "supply",
        to: mockPoolAddress,
        data: supplyData,
        value: parsedAmount.toString(),
        description: `Supply ${amount} ${token} to Lending Pool`,
      });
    } else {
      // ERC20: 先 approve，再 supply
      const approveData = encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [mockPoolAddress, parsedAmount],
      });

      transactions.push({
        id: `approve-${token}-${Date.now()}`,
        type: "approve",
        to: tokenInfo.address,
        data: approveData,
        value: "0",
        description: `Approve ${amount} ${token}`,
      });

      const supplyData = encodeFunctionData({
        abi: MOCK_LENDING_POOL_ABI,
        functionName: "supply",
        args: [tokenInfo.address, parsedAmount, userAddress, 0],
      });

      transactions.push({
        id: `supply-${token}-${Date.now()}`,
        type: "supply",
        to: mockPoolAddress,
        data: supplyData,
        value: "0",
        description: `Supply ${amount} ${token} to Lending Pool`,
      });
    }

    return transactions;
  }

  // ============================================
  // 真实 Curvance 模式 (Mainnet)
  // ============================================
  if (isNativeToken) {
    const cTokenAddress = getCTokenAddress(token);
    if (!cTokenAddress) {
      throw new Error(`No cToken found for ${token}`);
    }

    const supplyData = encodeFunctionData({
      abi: NATIVE_VAULT_ZAPPER_ABI,
      functionName: "depositNative",
      args: [cTokenAddress, userAddress],
    });

    transactions.push({
      id: `supply-${token}-${Date.now()}`,
      type: "supply",
      to: CURVANCE_NATIVE_VAULT_ZAPPER as Address,
      data: supplyData,
      value: parsedAmount.toString(),
      description: `Supply ${amount} ${token} to Curvance`,
    });
  } else {
    const cTokenAddress = getCTokenAddress(token);
    if (!cTokenAddress) {
      throw new Error(`No cToken found for ${token}`);
    }

    const approveData = encodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      functionName: "approve",
      args: [cTokenAddress, parsedAmount],
    });

    transactions.push({
      id: `approve-${token}-${Date.now()}`,
      type: "approve",
      to: tokenInfo.address,
      data: approveData,
      value: "0",
      description: `Approve ${amount} ${token} for Curvance`,
    });

    const depositData = encodeFunctionData({
      abi: CTOKEN_ABI,
      functionName: "deposit",
      args: [parsedAmount, userAddress],
    });

    transactions.push({
      id: `supply-${token}-${Date.now()}`,
      type: "supply",
      to: cTokenAddress,
      data: depositData,
      value: "0",
      description: `Supply ${amount} ${token} to Curvance`,
    });
  }

  return transactions;
}

/**
 * 构建 Withdraw (取款) 交易
 * 支持 Mock 合约 (Testnet) 和真实 Curvance (Mainnet)
 */
export async function buildWithdrawTx(
  params: WithdrawParams
): Promise<PreparedTransaction[]> {
  const { token, amount, userAddress, chainId = MONAD_TESTNET_CHAIN_ID } = params;
  const transactions: PreparedTransaction[] = [];

  // 获取 Token 信息
  let tokenInfo = getTokenBySymbol(chainId, token);
  if (!tokenInfo) {
    tokenInfo = getTokenBySymbol(MONAD_TESTNET_CHAIN_ID, token);
  }
  if (!tokenInfo) {
    tokenInfo = getTokenBySymbol(MONAD_MAINNET_CHAIN_ID, token);
  }
  
  if (!tokenInfo) {
    throw new Error(`Token ${token} not found on Monad`);
  }

  // 检查是否是原生代币 (MON)
  const isNativeToken =
    token.toUpperCase() === "MON" ||
    tokenInfo.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

  // 解析金额
  let parsedAmount: bigint;
  const isMaxWithdraw = amount.toLowerCase() === "max" || amount.toLowerCase() === "all";
  
  if (isMaxWithdraw) {
    parsedAmount = BigInt(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
  } else {
    parsedAmount = parseUnits(amount, tokenInfo.decimals);
  }

  // ============================================
  // Mock 合约模式 (Testnet)
  // ============================================
  if (shouldUseMock(chainId)) {
    const mockPoolAddress = getMockPoolAddress();
    const assetAddress = isNativeToken ? NATIVE_TOKEN_ADDRESS : tokenInfo.address;

    const withdrawData = encodeFunctionData({
      abi: MOCK_LENDING_POOL_ABI,
      functionName: "withdraw",
      args: [assetAddress, parsedAmount, userAddress],
    });

    transactions.push({
      id: `withdraw-${token}-${Date.now()}`,
      type: "withdraw",
      to: mockPoolAddress,
      data: withdrawData,
      value: "0",
      description: `Withdraw ${isMaxWithdraw ? "all" : amount} ${token} from Lending Pool`,
    });

    return transactions;
  }

  // ============================================
  // 真实 Curvance 模式 (Mainnet)
  // ============================================
  const cTokenAddress = getCTokenAddress(token);
  if (!cTokenAddress) {
    throw new Error(`No cToken found for ${token}`);
  }

  if (isNativeToken) {
    if (isMaxWithdraw) {
      const redeemData = encodeFunctionData({
        abi: NATIVE_VAULT_ZAPPER_ABI,
        functionName: "redeemNative",
        args: [cTokenAddress, parsedAmount, userAddress],
      });

      transactions.push({
        id: `withdraw-${token}-${Date.now()}`,
        type: "withdraw",
        to: CURVANCE_NATIVE_VAULT_ZAPPER as Address,
        data: redeemData,
        value: "0",
        description: `Withdraw all ${token} from Curvance`,
      });
    } else {
      const withdrawData = encodeFunctionData({
        abi: NATIVE_VAULT_ZAPPER_ABI,
        functionName: "withdrawNative",
        args: [cTokenAddress, parsedAmount, userAddress],
      });

      transactions.push({
        id: `withdraw-${token}-${Date.now()}`,
        type: "withdraw",
        to: CURVANCE_NATIVE_VAULT_ZAPPER as Address,
        data: withdrawData,
        value: "0",
        description: `Withdraw ${amount} ${token} from Curvance`,
      });
    }
  } else {
    const withdrawData = encodeFunctionData({
      abi: CTOKEN_ABI,
      functionName: "withdraw",
      args: [parsedAmount, userAddress, userAddress],
    });

    transactions.push({
      id: `withdraw-${token}-${Date.now()}`,
      type: "withdraw",
      to: cTokenAddress,
      data: withdrawData,
      value: "0",
      description: `Withdraw ${isMaxWithdraw ? "all" : amount} ${token} from Curvance`,
    });
  }

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

/**
 * 获取用户在 Lending Pool 的存款余额
 */
export async function getUserLendingBalance(
  userAddress: Address,
  token: string,
  chainId?: number
): Promise<{ balance: bigint } | null> {
  // 这里需要实际调用合约查询余额
  // 返回 null 表示需要在前端实现实际查询
  return null;
}
