import { Address } from "viem";

// 意图类型
export type IntentType =
  | "swap"
  | "stake"
  | "unstake"
  | "claim_rewards"
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

// Stake 意图
export interface StakeIntent extends BaseIntent {
  type: "stake";
  params: {
    amount: string;
    validator?: string;
  };
}

// Unstake 意图
export interface UnstakeIntent extends BaseIntent {
  type: "unstake";
  params: {
    amount: string;
    validator?: string;
  };
}

// Claim Rewards 意图
export interface ClaimRewardsIntent extends BaseIntent {
  type: "claim_rewards";
  params: {
    validator?: string;
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
  | StakeIntent
  | UnstakeIntent
  | ClaimRewardsIntent
  | TransferIntent
  | CheckBalanceIntent;

// 交易类型
export type TransactionType =
  | "approve"
  | "swap"
  | "stake"
  | "unstake"
  | "claim_rewards"
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

