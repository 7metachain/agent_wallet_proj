import { z } from "zod";

// Swap Token 参数 Schema
export const swapTokensSchema = z.object({
  fromToken: z
    .string()
    .describe("The token symbol to swap from (e.g., 'USDC', 'ETH')"),
  toToken: z
    .string()
    .describe("The token symbol to swap to (e.g., 'ETH', 'USDC')"),
  amount: z.string().describe("The amount to swap in human readable format"),
  slippage: z
    .number()
    .optional()
    .describe("Slippage tolerance in percentage, default 0.5"),
});

// Stake to Monad 参数 Schema
export const stakeMonadSchema = z.object({
  amount: z
    .string()
    .describe("The amount of MON to stake, can be a number or 'half', 'all'"),
  validator: z
    .string()
    .optional()
    .describe("Validator address to delegate to (optional, will use default if not specified)"),
});

// Unstake from Monad 参数 Schema
export const unstakeMonadSchema = z.object({
  amount: z
    .string()
    .describe("The amount of MON to unstake, 'max' for full balance"),
  validator: z
    .string()
    .optional()
    .describe("Validator address to undelegate from (optional)"),
});

// Claim Rewards 参数 Schema
export const claimRewardsSchema = z.object({
  validator: z
    .string()
    .optional()
    .describe("Validator address to claim rewards from (optional, will use default if not specified)"),
});

// Transfer Token 参数 Schema
export const transferTokenSchema = z.object({
  token: z.string().describe("The token symbol to transfer"),
  amount: z.string().describe("The amount to transfer"),
  to: z.string().describe("The recipient address or ENS name"),
});

// Check Balance 参数 Schema
export const checkBalanceSchema = z.object({
  token: z
    .string()
    .optional()
    .describe("Specific token to check, or omit for all tokens"),
});

// 工具定义（用于 OpenAI Function Calling）
export const intentTools = [
  {
    type: "function" as const,
    function: {
      name: "swap_tokens",
      description:
        "Swap/exchange one token for another token. Use this when user wants to convert, swap, exchange, or trade tokens.",
      parameters: {
        type: "object",
        properties: {
          fromToken: {
            type: "string",
            description: "The token symbol to swap from (e.g., 'USDC', 'ETH')",
          },
          toToken: {
            type: "string",
            description: "The token symbol to swap to (e.g., 'ETH', 'USDC')",
          },
          amount: {
            type: "string",
            description: "The amount to swap in human readable format",
          },
          slippage: {
            type: "number",
            description: "Slippage tolerance in percentage, default 0.5",
          },
        },
        required: ["fromToken", "toToken", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "stake_monad",
      description:
        "Stake MON tokens to Monad validators to earn staking rewards. Use when user wants to stake, delegate, or earn staking yield.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description:
              "The amount of MON to stake, can be a number or 'half', 'all'",
          },
          validator: {
            type: "string",
            description: "Validator address to delegate to (optional, will use default if not specified)",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "unstake_monad",
      description:
        "Unstake/undelegate MON tokens from Monad validators. Use when user wants to unstake, undelegate, or retrieve their staked MON.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description: "The amount of MON to unstake, 'max' for full balance",
          },
          validator: {
            type: "string",
            description: "Validator address to undelegate from (optional)",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "claim_rewards",
      description:
        "Claim staking rewards from Monad validators to wallet. Use when user wants to claim, collect, withdraw, or retrieve their staking rewards/earnings.",
      parameters: {
        type: "object",
        properties: {
          validator: {
            type: "string",
            description: "Validator address to claim rewards from (optional, will use default if not specified)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "transfer_token",
      description:
        "Transfer/send tokens to another address. Use when user wants to send, transfer tokens to someone.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol to transfer",
          },
          amount: {
            type: "string",
            description: "The amount to transfer",
          },
          to: {
            type: "string",
            description: "The recipient address or ENS name",
          },
        },
        required: ["token", "amount", "to"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_balance",
      description:
        "Check token balance in wallet. Use when user asks about their balance, holdings, or how much they have.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "Specific token to check, or omit for all tokens",
          },
        },
        required: [],
      },
    },
  },
];

// Intent 类型定义
export type IntentType =
  | "swap"
  | "stake"
  | "unstake"
  | "claim_rewards"
  | "transfer"
  | "check_balance";

export interface ParsedIntent {
  id: string;
  type: IntentType;
  params: Record<string, unknown>;
  description: string;
}

