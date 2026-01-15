import { encodeFunctionData, parseUnits, Address, maxUint256 } from "viem";
import { Intent, PreparedTransaction } from "@/types/intent";
import { getTokenBySymbol } from "@/lib/web3/tokens";
import { erc20Abi } from "@/lib/web3/abi/erc20";
import { swapRouterAbi } from "@/lib/web3/abi/uniswap-v3-router";
import { aavePoolAbi } from "@/lib/web3/abi/aave-v3-pool";
import { STAKING_POOL_ABI } from "@/lib/web3/abi/staking-pool";

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

// 控制调试输出的开关：在运行/构建时设置 `NEXT_PUBLIC_DEBUG_TX=true` 即可打开日志
const DEBUG = process.env.NEXT_PUBLIC_DEBUG_TX === "true";

/**
 * 获取链的默认 Gas 配置
 * 用于避免 MetaMask 调用慢速 RPC 进行 Gas 估计
 *
 * 关键优化：对于 Monad Testnet，使用固定的 Gas 配置来绕过慢速 RPC 的 Gas 估计
 * - 使用合理的固定 Gas Limit（基于 Mock 合约的实际消耗）
 * - 使用较低的固定 Gas Price（Monad Testnet 不需要高 Gas）
 * - 完全避免 EIP-1559 参数（使用 legacy gasPrice）
 */
function getGasConfig(chainId: number) {
  // 所有链都使用默认配置（让 MetaMask 完全处理 Gas 估计）
  // 避免 "internal JSON-RPC error" 问题
  console.log(`[tx-builder] Using default gas config for chain ${chainId} (let MetaMask handle)`);

  return {
    simpleGasLimit: undefined,
    complexGasLimit: undefined,
    gasPrice: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  };
}

// 协议地址配置
// 优先使用环境变量中配置的 Mock 合约地址，否则使用默认的测试网地址
const getProtocolAddress = (chainId: number, protocol: string): Address => {
  // 检查环境变量（用于部署的 Mock 合约）
  const envVar = process.env[`NEXT_PUBLIC_MOCK_${protocol.toUpperCase()}`];
  if (envVar) {
    console.log(`[tx-builder] Using Mock contract from env: ${protocol} = ${envVar}, chainId=${chainId}`);
    return envVar as Address;
  }

  // 默认测试网地址配置
  const PROTOCOL_ADDRESSES: Record<number, Record<string, Address>> = {
    // Monad Testnet (使用环境变量中的 Mock 合约地址)
    10143: {
      uniswapV3Router: (process.env.NEXT_PUBLIC_MOCK_SWAP_ROUTER || "0x98Ed6EFA01fb3745b636615Fb7c4243a6D595d8B") as Address,
      aaveV3Pool: (process.env.NEXT_PUBLIC_MOCK_AAVE_POOL || "0xD1053Fd162FcD510F48122c9159E908460857821") as Address,
    },
    // Ethereum Sepolia (真实 Aave/Uniswap)
    11155111: {
      uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
      aaveV3Pool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951" as Address,
    },
    // Base Sepolia (真实 Aave/Uniswap)
    84532: {
      uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
      aaveV3Pool: "0x0BBd97c36A2680793fe7B374D9D39A6d639D717f" as Address,
    },
    // Arbitrum Sepolia (真实 Aave/Uniswap)
    421614: {
      uniswapV3Router: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E" as Address,
      aaveV3Pool: "0x9D83Ccb475a8E9b9F53C6366aF3A3E6d81A3F385" as Address,
    },
  };

  const addresses = PROTOCOL_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`No ${protocol} configured for chain ${chainId}. Please deploy mock contracts or use a supported testnet.`);
  }
  return addresses[protocol];
};

/**
 * 检查是否为原生代币（ETH、MON 或使用特殊地址的代币）
 */
function isNativeToken(symbol: string, tokenAddress: Address): boolean {
  return (
    symbol.toUpperCase() === "ETH" ||
    symbol.toUpperCase() === "MON" ||
    tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  );
}

/**
 * 构建 Swap 交易
 * 1. 如果是 ERC20 Token，需要先 approve Uniswap Router
 * 2. 执行 swap
 */
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

  console.log(`[tx-builder] Building swap transaction:`, {
    fromToken,
    toToken,
    amount,
    amountIn: amountIn.toString(),
    fromTokenAddress: fromTokenInfo.address,
    toTokenAddress: toTokenInfo.address,
    uniswapRouter,
    isNativeFrom: isNativeToken(fromToken, fromTokenInfo.address)
  });

  // 获取 Gas 配置
  const gasConfig = getGasConfig(chainId);

  const transactions: PreparedTransaction[] = [];

  // 如果不是原生代币，需要先 approve
  if (!isNativeToken(fromToken, fromTokenInfo.address)) {
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
      gasLimit: gasConfig.simpleGasLimit,
      gasPrice: gasConfig.gasPrice,
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
    value: isNativeToken(fromToken, fromTokenInfo.address) ? amountIn : BigInt(0),
    gasLimit: gasConfig.complexGasLimit,
    gasPrice: gasConfig.gasPrice,
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

  // 获取 Gas 配置
  const gasConfig = getGasConfig(chainId);

  const transactions: PreparedTransaction[] = [];

  // 如果不是原生代币，需要先 approve
  if (!isNativeToken(token, tokenInfo.address)) {
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
      gasLimit: gasConfig.simpleGasLimit,
      gasPrice: gasConfig.gasPrice,
      
      description: `Approve ${amount} ${token} for Aave`,
    });
  }

  // Supply 到 Aave
  console.log(`[tx-builder] Encoding supply function call...`);
  console.log(`[tx-builder] Supply params:`, {
    asset: tokenInfo.address,
    amount: amountToSupply.toString(),
    onBehalfOf: walletAddress,
    referralCode: 0
  });

  const supplyData = encodeFunctionData({
    abi: aavePoolAbi,
    functionName: "supply",
    args: [tokenInfo.address, amountToSupply, walletAddress, 0], // referralCode = 0
  });

  console.log(`[tx-builder] Supply data encoded:`, {
    data: supplyData,
    dataLength: supplyData.length,
    dataPreview: supplyData.substring(0, 100) + '...'
  });

  const isNative = isNativeToken(token, tokenInfo.address);
  const supplyValue = isNative ? amountToSupply : BigInt(0);

  console.log(`[tx-builder] Building supply transaction:`, {
    token,
    amount,
    amountToSupply: amountToSupply.toString(),
    tokenAddress: tokenInfo.address,
    isNative,
    aavePool,
    walletAddress,
    supplyValue: supplyValue.toString(),
    dataLength: supplyData.length,
    gasConfig: gasConfig
  });

  // For native tokens with smart accounts (Concentric), we need to handle differently
  // because they can't send value + data in the same transaction
  if (isNative) {
    // Option 1: Try to send as single transaction (works for standard EOAs)
    // Option 2: For smart accounts, the wallet should handle batching automatically
    // Concentric should support this via UserOperations, but if it doesn't work,
    // users need to switch to a standard EOA account

    transactions.push({
      id: `${intent.id}-supply`,
      type: "supply",
      to: aavePool,
      data: supplyData,
      value: supplyValue,
      gasLimit: gasConfig.complexGasLimit,
      gasPrice: gasConfig.gasPrice,
      description: `Supply ${amount} ${token} to Aave`,
    });
  } else {
    // ERC20 tokens - standard approach
    transactions.push({
      id: `${intent.id}-supply`,
      type: "supply",
      to: aavePool,
      data: supplyData,
      value: BigInt(0),
      gasLimit: gasConfig.complexGasLimit,
      gasPrice: gasConfig.gasPrice,
      description: `Supply ${amount} ${token} to Aave`,
    });
  }

  console.log(`[tx-builder] Supply transaction built:`, {
    txCount: transactions.length,
    hasApprove: transactions.length > 1,
    supplyTx: {
      to: transactions[transactions.length - 1].to,
      value: transactions[transactions.length - 1].value.toString(),
      description: transactions[transactions.length - 1].description
    }
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

  // 获取 Gas 配置
  const gasConfig = getGasConfig(chainId);

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
      gasLimit: gasConfig.complexGasLimit,
      gasPrice: gasConfig.gasPrice,
      
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

  // 获取 Gas 配置
  const gasConfig = getGasConfig(chainId);

  if (isNativeToken(token, tokenInfo.address)) {
    // 原生代币转账（ETH、MON 等）
    return [
      {
        id: `${intent.id}-transfer`,
        type: "transfer",
        to: to as Address,
        data: "0x",
        value: amountToTransfer,
        gasLimit: gasConfig.simpleGasLimit,
        gasPrice: gasConfig.gasPrice,
        
        description: `Transfer ${amount} ${token} to ${to}`,
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
        gasLimit: gasConfig.simpleGasLimit,
        gasPrice: gasConfig.gasPrice,
        
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
    case "call_faucet":
      return buildFaucetTransaction(intent, walletAddress, chainId);
    case "stake_with_yield":
      return buildStakeTransaction(intent, walletAddress, chainId);
    default:
      throw new Error(`Unknown intent type: ${(intent as any).type}`);
  }
}

/**
 * 构建 Faucet 交易
 * 调用 MockMonad 合约的 faucet() 函数获取测试币
 */
export async function buildFaucetTransaction(
  intent: Intent,
  _walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (intent.type !== "call_faucet") {
    throw new Error("Invalid intent type");
  }

  // 从环境变量获取 MockMonad 合约地址
  const mockMonadAddress = (process.env.NEXT_PUBLIC_MONAD_TOKEN ||
    "0x0000000000000000000000000000000000000000") as Address;

  if (mockMonadAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("MockMonad contract address not configured. Please set NEXT_PUBLIC_MONAD_TOKEN in .env.local");
  }

  console.log(`[tx-builder] Building faucet transaction:`, {
    contract: mockMonadAddress,
    chainId
  });

  // 获取 Gas 配置
  const gasConfig = getGasConfig(chainId);

  // MockMonad ABI - 只需要 faucet 函数
  const mockMonadAbi = [
    {
      type: "function",
      name: "faucet",
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [],
    },
  ] as const;

  // 编码调用数据
  const data = encodeFunctionData({
    abi: mockMonadAbi,
    functionName: "faucet",
    args: [],
  });

  const tx: PreparedTransaction = {
    id: `faucet-${Date.now()}`,
    type: "swap", // 使用 swap 类型，因为它是一个合约调用
    to: mockMonadAddress,
    data,
    value: BigInt(0),
    gasLimit: gasConfig.simpleGasLimit,
    gasPrice: gasConfig.gasPrice,
    
    description: "Call MockMonad.faucet() to get 100 MONAD tokens",
  };

  console.log(`[tx-builder] Faucet transaction built:`, {
    to: tx.to,
    description: tx.description,
    gasLimit: gasConfig.simpleGasLimit
  });

  return [tx];
}

/**
 * 构建 Stake 交易
 * 1. 如果是 ERC20 Token，需要先 approve Staking Pool
 * 2. 执行 stake
 */
export async function buildStakeTransaction(
  intent: Intent,
  walletAddress: Address,
  chainId: number
): Promise<PreparedTransaction[]> {
  if (DEBUG) console.debug(`[tx-builder] buildStakeTransaction called - intentId=${intent.id}, chainId=${chainId}, wallet=${walletAddress}`);
  if (intent.type !== "stake_with_yield") {
    throw new Error("Invalid intent type");
  }

  const { token, amount, yieldRecipient } = intent.params;
  const tokenInfo = getTokenBySymbol(chainId, token);

  if (!tokenInfo) {
    throw new Error(`Token not found: ${token}`);
  }

  const amountToStake = parseUnits(amount, tokenInfo.decimals);

  // 从环境变量获取 Staking Pool 合约地址
  const stakingPoolAddress = (process.env.NEXT_PUBLIC_STAKING_POOL ||
    "0x0000000000000000000000000000000000000000") as Address;

  if (stakingPoolAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Staking Pool contract address not configured. Please set NEXT_PUBLIC_STAKING_POOL in .env.local");
  }

  // 获取 Gas 配置
  const gasConfig = getGasConfig(chainId);

  const transactions: PreparedTransaction[] = [];

  // 如果不是原生代币，需要先 approve
  if (!isNativeToken(token, tokenInfo.address)) {
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [stakingPoolAddress, maxUint256],
    });

    transactions.push({
      id: `${intent.id}-approve`,
      type: "approve",
      to: tokenInfo.address,
      data: approveData,
      value: BigInt(0),
      gasLimit: gasConfig.simpleGasLimit,
      gasPrice: gasConfig.gasPrice,
      description: `Approve ${amount} ${token} for Staking Pool`,
    });
  }

  // Stake 到 Staking Pool
  const stakeData = encodeFunctionData({
    abi: STAKING_POOL_ABI,
    functionName: "stake",
    args: [amountToStake, yieldRecipient as Address],
  });

  const isNative = isNativeToken(token, tokenInfo.address);
  const stakeValue = isNative ? amountToStake : BigInt(0);

  console.log(`[tx-builder] Building stake transaction:`, {
    token,
    amount,
    amountToStake: amountToStake.toString(),
    tokenAddress: tokenInfo.address,
    isNative,
    stakingPool: stakingPoolAddress,
    walletAddress,
    stakeValue: stakeValue.toString(),
    yieldRecipient,
    dataLength: stakeData.length,
  });

  transactions.push({
    id: `${intent.id}-stake`,
    type: "swap", // 使用 swap 类型，因为它是一个合约调用
    to: stakingPoolAddress,
    data: stakeData,
    value: stakeValue,
    gasLimit: gasConfig.complexGasLimit,
    gasPrice: gasConfig.gasPrice,
    description: `Stake ${amount} ${token} (yield to ${yieldRecipient})`,
  });

  console.log(`[tx-builder] Stake transaction built:`, {
    txCount: transactions.length,
    hasApprove: transactions.length > 1,
    stakeTx: {
      to: transactions[transactions.length - 1].to,
      value: transactions[transactions.length - 1].value.toString(),
      description: transactions[transactions.length - 1].description
    }
  });

  return transactions;
}
