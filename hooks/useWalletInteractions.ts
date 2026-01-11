"use client";

// React Hooks 导入
// useCallback: 用于缓存回调函数，避免不必要的重新渲染
// useState: 用于在函数组件中添加状态管理
import { useCallback, useState } from "react";

// Wagmi 库相关导入，用于以太坊钱包交互
/**
 * 
 * 【wagmi】 是一个专为 Ethereum 区块链设计的React Hooks 库，
 * 它简化了去中心化应用（DApp）的开发流程，通过提供一系列可复用的 Hooks，
 * 使开发者能够轻松处理钱包连接、智能合约交互、状态管理和数据查询等任务。
 * 该库基于 viem 构建，
 * 并深度整合了 TanStack Query（原 React Query：TanStack Query 是一个专为 React 设计的数据获取和状态管理库，
 * ‌简化了异步数据操作‌，无需手动管理全局状态或缓存，支持自动刷新和错误处理），
 * 以实现高效的区块链数据缓存和自动重试机制。‌‌核心功能与架构‌ wagmi 
 * 的核心功能包括钱包连接、合约读写、事件监听和状态管理。其架构采用分层设计，关键组件包括：
 * ‌createConfig‌：用于初始化全局配置，支持多链网络、自定义RPC 传输和连接器管理。
 * ‌createStorage‌：负责状态持久化，支持类型安全存储和SSR（服务端渲染）场景。
 * ‌Hooks 系统‌：如 useConnect、useAccount、useContractRead 等，封装了常见操作，降低开发复杂度。‌
 * 
 */
// useAccount: 获取当前连接的账户信息
// useSendTransaction: 发送交易
// useWaitForTransactionReceipt: 等待交易确认
// useReadContract: 读取合约数据
// useBalance: 获取原生代币余额
// usePublicClient: 获取公共客户端，用于与区块链交互
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useReadContract,
  useBalance,
  usePublicClient,
} from "wagmi";

// Viem 库相关导入，用于以太坊类型和工具函数
//Viem 是一个专为区块链设计的 ‌TypeScript 库‌，提供低级别的无状态基础组件，用于与区块链网络进行交互。
// parseUnits: 将人类可读的数字转换为 wei 单位
// formatUnits: 将 wei 单位转换为人类可读的数字
// Address: 以太坊地址类型
import { parseUnits, formatUnits, Address } from "viem";

// 自定义类型导入
// Intent: 用户意图类型，定义用户想要执行的操作
// PreparedTransaction: 预处理交易类型
// TransactionResult: 交易结果类型
import { Intent, PreparedTransaction, TransactionResult } from "@/types/intent";

// 交易构建函数导入，用于构建不同类型的交易
import { buildSwapTransaction, buildSupplyTransaction, buildWithdrawTransaction, buildTransferTransaction } from "@/lib/web3/transaction-builder";

/**
 * 交易执行状态接口
 * 定义交易执行过程中的各种状态
 */
export interface TransactionState {
  isExecuting: boolean;      // 是否正在执行交易
  isConfirming: boolean;      // 是否正在等待交易确认
  isSuccess: boolean;         // 交易是否成功执行
  error: string | null;       // 错误信息
  currentTxHash: `0x${string}` | null;  // 当前交易哈希
  currentStep: number;        // 当前执行的步骤
  totalSteps: number;         // 总步骤数
}

/**
 * 交易执行结果接口
 * 定义交易执行后的结果
 */
export interface ExecutionResult {
  success: boolean;           // 交易是否成功
  txHashes: `0x${string}`[];  // 所有交易哈希数组
  error?: string;             // 错误信息（可选）
}

/**
 * 钱包交互 Hook
 * 提供完整的钱包交互功能：交易构建、执行、余额查询等
 */
export function useWalletInteractions() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // 交易发送
  const { sendTransaction } = useSendTransaction();

  // 交易状态管理
  const [txState, setTxState] = useState<TransactionState>({
    isExecuting: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    currentTxHash: null,
    currentStep: 0,
    totalSteps: 0,
  });

  /**
   * 批量执行交易
   */
  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_TX === "true";

  const executeTransactions = useCallback(
    async (transactions: PreparedTransaction[]): Promise<ExecutionResult> => {
      if (DEBUG) console.debug(`[wallet-hook] executeTransactions called - txCount=${transactions.length}`);
      if (!isConnected || !address) {
        return {
          success: false,
          txHashes: [],
          error: "Wallet not connected",
        };
      }

      setTxState({
        isExecuting: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        currentTxHash: null,
        currentStep: 0,
        totalSteps: transactions.length,
      });

      const txHashes: `0x${string}`[] = [];

      try {
        for (let i = 0; i < transactions.length; i++) {
          const tx = transactions[i];

          if (DEBUG) console.debug(`[wallet-hook] sending tx ${i + 1}/${transactions.length} id=${tx.id} to=${tx.to}`);
          setTxState((prev) => ({
            ...prev,
            currentStep: i + 1,
          }));

          // 发送交易
          // PreparedTransaction 包含自定义的 `type` 字段，可能与 wagmi 的 SendTransactionVariables 类型不完全匹配。
          // 这里使用类型断言为 any 以避免编译时类型错误（运行时仍会按 tx 对象发送）。
          const hash = await sendTransactionAsync(tx as any);

          if (DEBUG) console.debug(`[wallet-hook] tx sent - id=${tx.id} hash=${hash}`);

          txHashes.push(hash);

          setTxState((prev) => ({
            ...prev,
            currentTxHash: hash,
            isConfirming: true,
          }));

          // 等待交易确认
          const receipt = await publicClient?.waitForTransactionReceipt({
            hash,
          });

          if (receipt?.status === "reverted") {
            throw new Error(`Transaction ${i + 1} failed`);
          }
        }

        setTxState({
          isExecuting: false,
          isConfirming: false,
          isSuccess: true,
          error: null,
          currentTxHash: txHashes[txHashes.length - 1],
          currentStep: transactions.length,
          totalSteps: transactions.length,
        });

        return {
          success: true,
          txHashes,
        };
      } catch (error: any) {
        const errorMessage = error.message || "Transaction failed";

        setTxState((prev) => ({
          ...prev,
          isExecuting: false,
          isConfirming: false,
          error: errorMessage,
        }));

        return {
          success: false,
          txHashes,
          error: errorMessage,
        };
      }
    },
    [isConnected, address, sendTransaction, publicClient]
  );

  // 发送交易的异步版本（用于批量执行）
  const { sendTransactionAsync } = useSendTransaction();

  /**
   * 执行意图交易
   * 根据意图类型构建并执行交易
   */
  const executeIntent = useCallback(
    async (intent: Intent): Promise<ExecutionResult> => {
      if (!chainId) {
        return {
          success: false,
          txHashes: [],
          error: "Chain ID not found",
        };
      }

      try {
        let transactions: PreparedTransaction[] = [];

        switch (intent.type) {
          case "swap":
            transactions = await buildSwapTransaction(intent, address!, chainId);
            break;
          case "supply":
            transactions = await buildSupplyTransaction(intent, address!, chainId);
            break;
          case "withdraw":
            transactions = await buildWithdrawTransaction(intent, address!, chainId);
            break;
          case "transfer":
            transactions = await buildTransferTransaction(intent, address!, chainId);
            break;
          case "check_balance":
            // 余额查询不需要执行交易
            return {
              success: true,
              txHashes: [],
            };
          default:
            return {
              success: false,
              txHashes: [],
              error: `Unknown intent type: ${(intent as any).type}`,
            };
        }

        return executeTransactions(transactions);
      } catch (error: any) {
        return {
          success: false,
          txHashes: [],
          error: error.message || "Failed to execute intent",
        };
      }
    },
    [chainId, address, executeTransactions]
  );

  /**
   * 查询 ERC20 余额
   */
  const getTokenBalance = useCallback(
    (tokenAddress: Address, ownerAddress: Address) => {
      return useReadContract({
        address: tokenAddress,
        abi: [
          {
            type: "function",
            name: "balanceOf",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ type: "uint256" }],
          },
        ],
        functionName: "balanceOf",
        args: [ownerAddress],
      });
    },
    []
  );

  /**
   * 查询原生余额
   */
  const getNativeBalance = useCallback((ownerAddress: Address) => {
    return useBalance({
      address: ownerAddress,
    });
  }, []);

  /**
   * 查询 Token 授权额度
   */
  const getTokenAllowance = useCallback(
    (tokenAddress: Address, ownerAddress: Address, spenderAddress: Address) => {
      return useReadContract({
        address: tokenAddress,
        abi: [
          {
            type: "function",
            name: "allowance",
            stateMutability: "view",
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            outputs: [{ type: "uint256" }],
          },
        ],
        functionName: "allowance",
        args: [ownerAddress, spenderAddress],
      });
    },
    []
  );

  /**
   * 重置交易状态
   */
  const resetTxState = useCallback(() => {
    setTxState({
      isExecuting: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      currentTxHash: null,
      currentStep: 0,
      totalSteps: 0,
    });
  }, []);

  return {
    // 状态
    txState,
    isConnected,
    address,
    chainId,

    // 交易执行
    executeIntent,
    executeTransactions,

    // 余额查询
    getTokenBalance,
    getNativeBalance,
    getTokenAllowance,

    // 工具函数
    resetTxState,
  };
}

/**
 * 单个意图执行 Hook
 * 用于执行单个意图的交易
 */
export function useIntentExecution(intent: Intent) {
  const { executeIntent, txState } = useWalletInteractions();

  const handleExecute = useCallback(async () => {
    return executeIntent(intent);
  }, [intent, executeIntent]);

  return {
    execute: handleExecute,
    ...txState,
  };
}
