import { Address } from "viem";

// 意图类型
export type IntentType =
  | "swap"
  | "supply"
  | "withdraw"
  | "transfer"
  | "check_balance";

// 意图状态
export type IntentStatus =
  | "pending"
  | "ready"
  | "executing"
  | "success"
  | "failed";

// 基础意图接口
export interface BaseIntent {
  id: string;
  type: IntentType;
  status: IntentStatus;
  createdAt: number;
}

// Swap 意图

export interface SwapIntent extends BaseIntent {
  type: "swap";
  params: {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: number;
  };
}

// Supply 意图
export interface SupplyIntent extends BaseIntent {
  type: "supply";
  params: {
    token: string;
    amount: string;
    useAsCollateral?: boolean;
  };
}

// Withdraw 意图
export interface WithdrawIntent extends BaseIntent {
  type: "withdraw";
  params: {
    token: string;
    amount: string;
  };
}

// Transfer 意图
export interface TransferIntent extends BaseIntent {
  type: "transfer";
  params: {
    token: string;
    amount: string;
    to: string;
  };
}

// Check Balance 意图
export interface CheckBalanceIntent extends BaseIntent {
  type: "check_balance";
  params: {
    token?: string;
  };
}

// 意图联合类型
export type Intent =
  | SwapIntent
  | SupplyIntent
  | WithdrawIntent
  | TransferIntent
  | CheckBalanceIntent;

// 交易类型
export type TransactionType =
  | "approve"
  | "swap"
  | "supply"
  | "withdraw"
  | "transfer";

// 准备好的交易
export interface PreparedTransaction {
  id: string;
  type: TransactionType;
  to: Address;
  data: `0x${string}`;
  value: bigint;
  gasLimit?: bigint;
  description: string;
}

// 交易执行结果
export interface TransactionResult {
  transactionId: string;
  hash: `0x${string}`;
  status: "pending" | "success" | "failed";
  error?: string;
}

// 交易摘要
export interface TransactionSummary {
  totalSteps: number;
  currentStep: number;
  estimatedGas: string;
  warnings?: string[];
}

