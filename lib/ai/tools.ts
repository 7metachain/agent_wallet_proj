import { z } from "zod";

// Swap Token 参数 Schema
export const swapTokensSchema = z.object({
  fromToken: z
    .string()
    .describe("The token symbol to swap from (e.g., 'USDC', 'MON')"),
  toToken: z
    .string()
    .describe("The token symbol to swap to (e.g., 'MON', 'USDC')"),
  amount: z.string().describe("The amount to swap in human readable format"),
  slippage: z
    .number()
    .optional()
    .describe("Slippage tolerance in percentage, default 0.5"),
});

// Supply to Curvance 参数 Schema (Monad 原生借贷协议)
export const supplyToCurvanceSchema = z.object({
  token: z
    .string()
    .describe("The token symbol to supply (e.g., 'MON', 'USDC')"),
  amount: z
    .string()
    .describe("The amount to supply, can be a number or 'half', 'all'"),
});

// Withdraw from Curvance 参数 Schema
export const withdrawFromCurvanceSchema = z.object({
  token: z.string().describe("The token symbol to withdraw"),
  amount: z
    .string()
    .describe("The amount to withdraw, 'max' for full balance"),
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
// 适配 Monad 网络和 Curvance 协议
export const intentTools = [
  {
    type: "function" as const,
    function: {
      name: "swap_tokens",
      description:
        "Swap/exchange one token for another token on Monad. Use this when user wants to convert, swap, exchange, or trade tokens.",
      parameters: {
        type: "object",
        properties: {
          fromToken: {
            type: "string",
            description: "The token symbol to swap from (e.g., 'USDC', 'MON')",
          },
          toToken: {
            type: "string",
            description: "The token symbol to swap to (e.g., 'MON', 'USDC')",
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
      name: "supply_to_curvance",
      description:
        "Supply/deposit tokens to Curvance lending protocol on Monad to earn interest. Use when user wants to deposit, supply, lend, or earn yield.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol to supply (e.g., 'MON', 'USDC')",
          },
          amount: {
            type: "string",
            description:
              "The amount to supply, can be a number or 'half', 'all'",
          },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "withdraw_from_curvance",
      description:
        "Withdraw tokens from Curvance lending protocol on Monad. Use when user wants to withdraw or retrieve their deposited assets.",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The token symbol to withdraw",
          },
          amount: {
            type: "string",
            description: "The amount to withdraw, 'max' for full balance",
          },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "transfer_token",
      description:
        "Transfer/send tokens to another address on Monad. Use when user wants to send, transfer tokens to someone.",
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
            description: "The recipient address",
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
        "Check token balance in wallet on Monad. Use when user asks about their balance, holdings, or how much they have.",
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
  | "supply"
  | "withdraw"
  | "transfer"
  | "check_balance";

export interface ParsedIntent {
  id: string;
  type: IntentType;
  params: Record<string, unknown>;
  description: string;
}

