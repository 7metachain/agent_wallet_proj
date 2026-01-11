import { encodeFunctionData, parseUnits, Address, maxUint256 } from "viem";
import { Intent, PreparedTransaction } from "@/types/intent";
import { getTokenBySymbol } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";
import { swapRouterAbi } from "@/lib/web3/abi/uniswap-v3-router";
import { aavePoolAbi } from "@/lib/web3/abi/aave-v3-pool";

// transaction-builder.ts 负责将高层的 `Intent` 翻译为一组可发送的低层交易（`PreparedTransaction[]`）。
// 职责包括：
// - 根据 intent 类型（swap / supply / withdraw / transfer）构建相应的交易序列；
// - 在必要时插入 ERC20 的 approve 交易；
// - 使用合约 ABI（Uniswap V3 Router / Aave Pool / ERC20）对交易 calldata 进行编码；
// - 返回统一的 `PreparedTransaction` 结构，供上层 Hook 映射为 wallet/sendTransaction 的参数并发送。
//
// 注意事项：
// - `PreparedTransaction` 为本项目自定义类型，发送前可能需要在 Hook 层映射为 wagmi 的 send 参数；
// - 为兼容部分 TypeScript 编译目标，文件中避免直接使用 BigInt 字面量（如 `0n`），改用 `BigInt(...)`。

// 协议地址配置
const PROTOCOL_ADDRESSES: Record<number, Record<string, Address>> = {
  // Ethereum Sepolia
  11155111: {
    uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
    aaveV3Pool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951" as Address,
  },
  // Base Sepolia
  84532: {
    uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
    aaveV3Pool: "0x0BBd97c36A2680793fe7B374D9D39A6d639D717f" as Address,
  },
  // Arbitrum Sepolia
  421614: {
    uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
    aaveV3Pool: "0x9D83Ccb475a8E9b9F53C6366aF3A3E6d81A3F385" as Address,
  },
};

/**
 * 获取协议地址
 */
function getProtocolAddress(chainId: number, protocol: "uniswapV3Router" | "aaveV3Pool"): Address {
  const addresses = PROTOCOL_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses[protocol];
}

/**
 * 构建 Swap 交易
 * 1. 如果是 ERC20 Token，需要先 approve Uniswap Router
 * 2. 执行 swap
 */
// 控制调试输出的开关：在运行/构建时设置 `NEXT_PUBLIC_DEBUG_TX=true` 即可打开日志
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_TX === "true";

export async function buildSwapTransaction(
  intent: Intent,
  walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (DEBUG) console.debug(`[tx-builder] buildSwapTransaction called - intentId=${intent.id}, chainId=${chainId}, wallet=${walletAddress}`);
  if (intent.type !== "swap") {
    throw new Error("Invalid intent type");
  }

  const { fromToken, toToken, amount, slippage = 0.5 } = intent.params;
  const fromTokenInfo = getTokenBySymbol(chainId, fromToken);
  const toTokenInfo = getTokenBySymbol(chainId, toToken);

  if (!fromTokenInfo || !toTokenInfo) {
    throw new Error(`Token not found: ${fromToken} or ${toToken}`);
  }

  const amountIn = parseUnits(amount, fromTokenInfo.decimals);
  const uniswapRouter = getProtocolAddress(chainId, "uniswapV3Router");

  const transactions: PreparedTransaction[] = [];

  // 如果不是 ETH，需要先 approve
  if (fromToken.toUpperCase() !== "ETH") {
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [uniswapRouter, maxUint256],
    });

    transactions.push({
      id: `${intent.id}-approve`,
      type: "approve",
      to: fromTokenInfo.address,
      data: approveData,
      value: BigInt(0),
      description: `Approve ${amount} ${fromToken} for Uniswap`,
    });
  }

  // 计算最小输出金额（考虑滑点）
  // 计算最小输出（考虑滑点），使用 BigInt 运算以保持单位一致
  const amountOutMinimum = amountIn * (BigInt(1000 - slippage * 10)) / BigInt(1000);

  // 构建交易数据
  const swapData = encodeFunctionData({
    abi: swapRouterAbi,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: fromTokenInfo.address,
        tokenOut: toTokenInfo.address,
        fee: 3000, // 0.3% fee tier
            recipient: walletAddress,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minutes
            amountIn,
            amountOutMinimum,
            sqrtPriceLimitX96: BigInt(0),
      },
    ],
  });

  transactions.push({
    id: `${intent.id}-swap`,
    type: "swap",
    to: uniswapRouter,
    data: swapData,
    value: fromToken.toUpperCase() === "ETH" ? amountIn : BigInt(0),
    description: `Swap ${amount} ${fromToken} to ${toToken}`,
  });

  return transactions;
}

/**
 * 构建 Supply 交易
 * 1. 如果是 ERC20 Token，需要先 approve Aave Pool
 * 2. 执行 supply
 */
export async function buildSupplyTransaction(
  intent: Intent,
  walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (DEBUG) console.debug(`[tx-builder] buildSupplyTransaction called - intentId=${intent.id}, chainId=${chainId}, wallet=${walletAddress}`);
  if (intent.type !== "supply") {
    throw new Error("Invalid intent type");
  }

  const { token, amount, useAsCollateral = true } = intent.params;
  const tokenInfo = getTokenBySymbol(chainId, token);

  if (!tokenInfo) {
    throw new Error(`Token not found: ${token}`);
  }

  const amountToSupply = parseUnits(amount, tokenInfo.decimals);
  const aavePool = getProtocolAddress(chainId, "aaveV3Pool");

  const transactions: PreparedTransaction[] = [];

  // 如果不是 ETH，需要先 approve
  if (token.toUpperCase() !== "ETH") {
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [aavePool, maxUint256],
    });

    transactions.push({
      id: `${intent.id}-approve`,
      type: "approve",
      to: tokenInfo.address,
      data: approveData,
      value: BigInt(0),
      description: `Approve ${amount} ${token} for Aave`,
    });
  }

  // Supply 到 Aave
  const supplyData = encodeFunctionData({
    abi: aavePoolAbi,
    functionName: "supply",
    args: [tokenInfo.address, amountToSupply, walletAddress, 0], // referralCode = 0
  });

  transactions.push({
    id: `${intent.id}-supply`,
    type: "supply",
    to: aavePool,
    data: supplyData,
    value: token.toUpperCase() === "ETH" ? amountToSupply : BigInt(0),
    description: `Supply ${amount} ${token} to Aave`,
  });

  return transactions;
}

/**
 * 构建 Withdraw 交易
 */
export async function buildWithdrawTransaction(
  intent: Intent,
  walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (DEBUG) console.debug(`[tx-builder] buildWithdrawTransaction called - intentId=${intent.id}, chainId=${chainId}, wallet=${walletAddress}`);
  if (intent.type !== "withdraw") {
    throw new Error("Invalid intent type");
  }

  const { token, amount } = intent.params;
  const tokenInfo = getTokenBySymbol(chainId, token);

  if (!tokenInfo) {
    throw new Error(`Token not found: ${token}`);
  }

  const amountToWithdraw = amount === "MAX" ? maxUint256 : parseUnits(amount, tokenInfo.decimals);
  const aavePool = getProtocolAddress(chainId, "aaveV3Pool");

  // Withdraw 从 Aave
  const withdrawData = encodeFunctionData({
    abi: aavePoolAbi,
    functionName: "withdraw",
    args: [tokenInfo.address, amountToWithdraw, walletAddress],
  });

  const transactions: PreparedTransaction[] = [
    {
      id: `${intent.id}-withdraw`,
      type: "withdraw",
      to: aavePool,
      data: withdrawData,
      value: BigInt(0),
      description: `Withdraw ${amount} ${token} from Aave`,
    },
  ];

  return transactions;
}

/**
 * 构建 Transfer 交易
 */
export async function buildTransferTransaction(
  intent: Intent,
  walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (DEBUG) console.debug(`[tx-builder] buildTransferTransaction called - intentId=${intent.id}, chainId=${chainId}, wallet=${walletAddress}`);
  if (intent.type !== "transfer") {
    throw new Error("Invalid intent type");
  }

  const { token, amount, to } = intent.params;
  const tokenInfo = getTokenBySymbol(chainId, token);

  if (!tokenInfo) {
    throw new Error(`Token not found: ${token}`);
  }

  const amountToTransfer = parseUnits(amount, tokenInfo.decimals);

  if (token.toUpperCase() === "ETH") {
    // ETH 转账
    return [
      {
        id: `${intent.id}-transfer`,
        type: "transfer",
        to: to as Address,
        data: "0x",
        value: amountToTransfer,
        description: `Transfer ${amount} ETH to ${to}`,
      },
    ];
  } else {
    // ERC20 转账
    const transferData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to as Address, amountToTransfer],
    });

    return [
      {
        id: `${intent.id}-transfer`,
        type: "transfer",
        to: tokenInfo.address,
        data: transferData,
        value: BigInt(0),
        description: `Transfer ${amount} ${token} to ${to}`,
      },
    ];
  }
}

/**
 * 构建所有交易类型的通用函数
 */
export async function buildTransaction(
  intent: Intent,
  walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (DEBUG) console.debug(`[tx-builder] buildTransaction dispatch - intentId=${intent.id}, type=${intent.type}, chainId=${chainId}`);
  switch (intent.type) {
    case "swap":
      return buildSwapTransaction(intent, walletAddress, chainId);
    case "supply":
      return buildSupplyTransaction(intent, walletAddress, chainId);
    case "withdraw":
      return buildWithdrawTransaction(intent, walletAddress, chainId);
    case "transfer":
      return buildTransferTransaction(intent, walletAddress, chainId);
    case "check_balance":
      return [];
    default:
      throw new Error(`Unknown intent type: ${(intent as any).type}`);
  }
}
