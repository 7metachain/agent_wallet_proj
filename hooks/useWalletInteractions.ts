"use client";

// 扩展 Window 接口以支持 ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

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
  useWalletClient,
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
import { buildSwapTransaction, buildSupplyTransaction, buildWithdrawTransaction, buildTransferTransaction, buildFaucetTransaction, buildStakeTransaction } from "@/lib/web3/transaction-builder";
import { getWalletSummary } from "@/lib/web3/balance-checker";

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
  const { data: walletClient } = useWalletClient();

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
  const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

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
        // Mock 模式：模拟交易执行
        if (MOCK_MODE) {
          console.log('🎭 [Mock Mode] Simulating transactions without blockchain execution...');
          console.log(`[wallet-hook] Total transactions: ${transactions.length}`);

          for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            console.log(`[wallet-hook] Simulating tx ${i + 1}/${transactions.length}`, {
              id: tx.id,
              type: tx.type,
              to: tx.to,
              value: tx.value?.toString(),
            });

            setTxState((prev) => ({
              ...prev,
              currentStep: i + 1,
            }));

            // 模拟延迟（1-2秒）
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            // 生成模拟交易哈希
            const mockHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}` as `0x${string}`;
            txHashes.push(mockHash);

            console.log(`[wallet-hook] Mock transaction ${i + 1} completed: ${mockHash}`);
          }

          setTxState({
            isExecuting: false,
            isConfirming: false,
            isSuccess: true,
            error: null,
            currentTxHash: txHashes[txHashes.length - 1],
            currentStep: 0,
            totalSteps: transactions.length,
          });

          console.log('✅ [Mock Mode] All transactions simulated successfully!');
          console.log(`[wallet-hook] Transaction hashes:`, txHashes);

          return {
            success: true,
            txHashes,
            error: null,
          };
        }

        // 真实模式：执行区块链交易
        console.log('[wallet-hook] Starting to send transactions...');
        for (let i = 0; i < transactions.length; i++) {
          const tx = transactions[i];

          console.log(`[wallet-hook] Preparing tx ${i + 1}/${transactions.length}`, {
            id: tx.id,
            to: tx.to,
            value: tx.value?.toString()
          });

          if (DEBUG) console.debug(`[wallet-hook] sending tx ${i + 1}/${transactions.length} id=${tx.id} to=${tx.to}`);
          setTxState((prev) => ({
            ...prev,
            currentStep: i + 1,
          }));

          // 发送交易
          console.log('[wallet-hook] Calling sendTransactionAsync...');
          console.log('[wallet-hook] Transaction details:', {
            to: tx.to,
            value: tx.value?.toString(),
            valueInETH: tx.value ? Number(tx.value) / 1e18 : 0,
            gasLimit: tx.gasLimit?.toString(),
            gasPrice: tx.gasPrice?.toString(),
            dataLength: tx.data?.length,
            dataPreview: tx.data?.substring(0, 50) + '...',
          });

          // 对于 Monad Testnet，使用 window.ethereum 直接发送以避免 viem 超时
          let hash: `0x${string}`;
          if (chainId === 10143 && typeof window !== 'undefined' && window.ethereum) {
            console.log('[wallet-hook] Using window.ethereum directly for Monad Testnet (to avoid viem timeout)');

            try {
              // 构建交易参数
              const txParams: any = {
                from: address,
                to: tx.to,
                data: tx.data as `0x${string}`,
              };

              // 只在有值时添加 value
              if (tx.value && tx.value > 0n) {
                txParams.value = '0x' + tx.value.toString(16);
              }

              console.log('[wallet-hook] Final txParams:', {
                from: txParams.from,
                to: txParams.to,
                value: txParams.value,
                valueInETH: tx.value ? Number(tx.value) / 1e18 : 0,
                dataLength: txParams.data?.length,
                dataPreview: txParams.data?.substring(0, 100) + '...',
              });

              // 检测是否是原生代币 + data 的组合（智能账户不支持）
              const hasValue = tx.value && tx.value > BigInt(0);
              const hasData = tx.data && tx.data.length > 0;

              if (hasValue && hasData) {
                console.warn('[wallet-hook] Detected native token + data transaction');
                console.warn('[wallet-hook] This may fail with smart accounts (Concentric)');
                console.warn('[wallet-hook] If this fails, please switch to a standard EOA account in MetaMask');
              }

              // 使用 MetaMask 的直接 API，不经过 viem
              // 不预设 Gas 参数，让 MetaMask 完全处理
              console.log('[wallet-hook] Sending transaction via MetaMask...');
              const result = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams],
              });

              hash = result as `0x${string}`;
              console.log(`[wallet-hook] Transaction sent via MetaMask: ${hash}`);
            } catch (error: any) {
              console.error('[wallet-hook] window.ethereum.request failed:', error);
              console.error('[wallet-hook] Error details:', {
                code: error.code,
                message: error.message,
                data: error.data,
                stack: error.stack
              });

              // 检测特定的智能账户错误
              if (error.message && error.message.includes('External transactions to internal accounts cannot include data')) {
                const smartAccountError = 'Your wallet (Concentric smart account) does not support sending native tokens with function calls. Please switch to a standard EOA account in MetaMask, or supply ERC20 tokens instead.';
                console.error('[wallet-hook] Smart account incompatibility detected');
                setTxState((prev) => ({
                  ...prev,
                  isExecuting: false,
                  error: smartAccountError,
                }));
                return {
                  success: false,
                  txHashes: [],
                  error: smartAccountError,
                };
              }

              // 如果是用户拒绝的错误
              if (error.code === 4001) {
                setTxState((prev) => ({
                  ...prev,
                  isExecuting: false,
                  error: 'User rejected the transaction',
                }));
                return {
                  success: false,
                  txHashes: [],
                  error: 'User rejected the transaction',
                };
              }

              // 其他错误，尝试回退到 sendTransaction
              console.log('[wallet-hook] Falling back to sendTransaction...');
              try {
                hash = await sendTransactionAsync(tx as any);
              } catch (fallbackError: any) {
                console.error('[wallet-hook] Fallback also failed:', fallbackError);
                setTxState((prev) => ({
                  ...prev,
                  isExecuting: false,
                  error: error.message || 'Transaction failed',
                }));
                return {
                  success: false,
                  txHashes,
                  error: error.message || fallbackError.message,
                };
              }
            }
          } else {
            // 其他链使用 sendTransaction
            hash = await sendTransactionAsync(tx as any);
          }

          console.log(`[wallet-hook] Got hash! ${hash}`);
          if (DEBUG) console.debug(`[wallet-hook] tx sent - id=${tx.id} hash=${hash}`);

          txHashes.push(hash);

          console.log(`[wallet-hook] tx submitted successfully - hash=${hash}`);
          console.log(`[wallet-hook] transaction in mempool, check MetaMask for status`);

          // 不等待确认，直接标记为成功（因为 MetaMask 已经签名发送）
          // 用户可以在 MetaMask 中查看确认状态
          setTxState((prev) => ({
            ...prev,
            currentTxHash: hash,
            isConfirming: false, // 不再等待确认
          }));
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
      console.log('[executeIntent] Called with intent:', intent.type, intent.params);

      if (!chainId || !address || !publicClient) {
        console.error('[executeIntent] Wallet not connected or missing data');
        return {
          success: false,
          txHashes: [],
          error: "Wallet not connected or chain not supported",
        };
      }

      try {
        console.log('[executeIntent] Building transactions...');
        let transactions: PreparedTransaction[] = [];

        switch (intent.type) {
          case "swap":
            console.log('[executeIntent] Building swap transaction...');
            transactions = await buildSwapTransaction(intent, address, chainId);
            console.log('[executeIntent] Swap transaction built:', transactions);
            break;
          case "supply":
            transactions = await buildSupplyTransaction(intent, address, chainId);
            break;
          case "withdraw":
            transactions = await buildWithdrawTransaction(intent, address, chainId);
            break;
          case "transfer":
            transactions = await buildTransferTransaction(intent, address, chainId);
            break;
          case "call_faucet":
            console.log('[executeIntent] Building faucet transaction...');
            transactions = await buildFaucetTransaction(intent, address, chainId);
            console.log('[executeIntent] Faucet transaction built:', transactions);
            break;
          case "check_balance":
            // 实际查询余额
            console.log("💰 [Balance Check] Querying balance for", address, "on chain", chainId);

            // 更新状态为执行中
            setTxState({
              isExecuting: true,
              isConfirming: false,
              isSuccess: false,
              error: null,
              currentTxHash: null,
              currentStep: 1,
              totalSteps: 1,
            });

            try {
              const summary = await getWalletSummary(publicClient, chainId, address as Address);
              console.log("✅ [Balance Check] Query successful:", summary);

              // 更新状态为成功
              setTxState({
                isExecuting: false,
                isConfirming: false,
                isSuccess: true,
                error: null,
                currentTxHash: null,
                currentStep: 1,
                totalSteps: 1,
              });

              // 余额查询成功，但不需要交易哈希
              // 我们将通过状态更新来显示结果
              return {
                success: true,
                txHashes: [],
              };
            } catch (error: any) {
              console.error("❌ [Balance Check] Query failed:", error);

              // 更新状态为失败
              setTxState({
                isExecuting: false,
                isConfirming: false,
                isSuccess: false,
                error: error.message || "Failed to query balance",
                currentTxHash: null,
                currentStep: 0,
                totalSteps: 0,
              });

              return {
                success: false,
                txHashes: [],
                error: error.message || "Failed to query balance",
              };
            }
          case "stake_with_yield":
            console.log('[executeIntent] Building stake transaction...');
            transactions = await buildStakeTransaction(intent, address, chainId);
            console.log('[executeIntent] Stake transaction built:', transactions);
            break;
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
    [chainId, address, publicClient, executeTransactions]
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
