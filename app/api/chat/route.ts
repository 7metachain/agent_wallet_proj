import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { intentTools } from "@/lib/ai/tools";
import { v4 as uuidv4 } from "uuid";

// Mock 模式标识
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

console.log("MOCK_MODE:", MOCK_MODE);
// 初始化 OpenAI 兼容客户端（支持 DeepSeek / OpenAI）
const openai = !MOCK_MODE
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, walletAddress, chainId, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Mock 模式：返回模拟响应
    if (MOCK_MODE || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(generateMockResponse(message));
    }

    // 构建消息历史
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      // 添加上下文信息
      {
        role: "system",
        content: `User context: Wallet address: ${walletAddress || "not connected"}, Chain ID: ${chainId || "unknown"}`,
      },
      // 添加历史消息
      ...history.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      // 当前消息
      { role: "user", content: message },
    ];

      console.log("Received request with messages:", messages);

    // 调用 AI API (支持 OpenAI / DeepSeek)
    const response = await openai!.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages,
      tools: intentTools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message;
    const intents: any[] = [];

    console.log("AI response message:", assistantMessage);

    // 解析工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        // 根据函数名创建意图
        let intentType: string;
        switch (functionName) {
          case "swap_tokens":
            intentType = "swap";
            break;
          case "stake_monad":
            intentType = "stake";
            break;
          case "unstake_monad":
            intentType = "unstake";
            break;
          case "claim_rewards":
            intentType = "claim_rewards";
            break;
          case "transfer_token":
            intentType = "transfer";
            break;
          case "check_balance":
            intentType = "check_balance";
            break;
          default:
            continue;
        }

        intents.push({
          id: uuidv4(),
          type: intentType,
          params: args,
          status: "ready",
          createdAt: Date.now(),
        });
      }
    }

    // 返回响应
    return NextResponse.json({
      message: assistantMessage.content || generateIntentSummary(intents),
      intents,
      needsConfirmation: intents.length > 0 &&
        intents.some(i => i.type !== "check_balance"),
    });
  } catch (error: any) {
    console.error("Chat API error:", error);

    // 检查是否是 API Key 错误
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid or not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// 生成意图摘要
function generateIntentSummary(intents: any[]): string {
  if (intents.length === 0) {
    return "I understand your request, but I couldn't identify a specific action. Could you please rephrase?";
  }

  const summaries = intents.map((intent) => {
    switch (intent.type) {
      case "swap":
        return `Swap ${intent.params.amount} ${intent.params.fromToken} to ${intent.params.toToken}`;
      case "stake":
        return `Stake ${intent.params.amount} MON to validator`;
      case "unstake":
        return `Unstake ${intent.params.amount} MON from validator`;
      case "claim_rewards":
        return `Claim staking rewards from validator`;
      case "transfer":
        return `Transfer ${intent.params.amount} ${intent.params.token} to ${intent.params.to}`;
      case "check_balance":
        return `Check balance${intent.params.token ? ` for ${intent.params.token}` : ""}`;
      default:
        return "";
    }
  });

  return `I'll help you with the following:\n${summaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nClick "Execute" to proceed.`;
}

// Mock 响应生成器
function generateMockResponse(message: string): {
  message: string;
  intents: any[];
  needsConfirmation: boolean;
} {
  const lowerMessage = message.toLowerCase();

  // 检测 swap 意图
  if (
    lowerMessage.includes("swap") ||
    lowerMessage.includes("exchange") ||
    lowerMessage.includes("convert") ||
    lowerMessage.includes("换") ||
    lowerMessage.includes("兑换")
  ) {
    // 尝试解析金额和代币
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "100";

    // 检测代币对
    let fromToken = "USDC";
    let toToken = "ETH";

    if (lowerMessage.includes("eth") && lowerMessage.includes("usdc")) {
      if (lowerMessage.indexOf("eth") < lowerMessage.indexOf("usdc")) {
        fromToken = "ETH";
        toToken = "USDC";
      }
    } else if (lowerMessage.includes("usdt")) {
      fromToken = "USDT";
    }

    return {
      message: `🔄 **[Mock Mode]** I'll help you swap ${amount} ${fromToken} to ${toToken}.\n\nClick "Execute" to proceed with the transaction.`,
      intents: [
        {
          id: uuidv4(),
          type: "swap",
          params: {
            fromToken,
            toToken,
            amount,
            slippage: 0.5,
          },
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: true,
    };
  }

  // 检测 stake 意图
  if (
    lowerMessage.includes("stake") ||
    lowerMessage.includes("质押") ||
    lowerMessage.includes("staking")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "10";

    return {
      message: `🏦 **[Mock Mode]** I'll help you stake ${amount} MON to earn staking rewards.\n\nClick "Execute" to proceed.`,
      intents: [
        {
          id: uuidv4(),
          type: "stake",
          params: {
            amount,
          },
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: true,
    };
  }

  // 检测 unstake 意图
  if (
    lowerMessage.includes("unstake") ||
    lowerMessage.includes("undelegate") ||
    lowerMessage.includes("取消质押") ||
    lowerMessage.includes("解除质押")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "all";

    return {
      message: `📤 **[Mock Mode]** I'll help you unstake ${amount} MON from validator.\n\nClick "Execute" to proceed.`,
      intents: [
        {
          id: uuidv4(),
          type: "unstake",
          params: {
            amount,
          },
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: true,
    };
  }

  // 检测 claim rewards 意图
  if (
    lowerMessage.includes("claim") ||
    lowerMessage.includes("collect") ||
    lowerMessage.includes("领取") ||
    lowerMessage.includes("提取") ||
    (lowerMessage.includes("收益") && !lowerMessage.includes("质押")) ||
    lowerMessage.includes("奖励")
  ) {
    return {
      message: `💰 **[Mock Mode]** I'll help you claim your staking rewards from the validator.\n\nClick "Execute" to proceed.`,
      intents: [
        {
          id: uuidv4(),
          type: "claim_rewards",
          params: {},
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: true,
    };
  }

  // 检测 transfer 意图
  if (
    lowerMessage.includes("send") ||
    lowerMessage.includes("transfer") ||
    lowerMessage.includes("发送") ||
    lowerMessage.includes("转")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "50";
    const token = lowerMessage.includes("eth") ? "ETH" : "USDC";

    // 尝试提取地址
    const addressMatch = message.match(/(0x[a-fA-F0-9]{40})/);
    const ensMatch = message.match(/([a-zA-Z0-9-]+\.eth)/);
    const to = addressMatch
      ? addressMatch[1]
      : ensMatch
        ? ensMatch[1]
        : "0x1234...5678";

    return {
      message: `💸 **[Mock Mode]** I'll help you transfer ${amount} ${token} to ${to}.\n\nClick "Execute" to proceed.`,
      intents: [
        {
          id: uuidv4(),
          type: "transfer",
          params: {
            token,
            amount,
            to,
          },
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: true,
    };
  }

  // 检测 balance 意图
  if (
    lowerMessage.includes("balance") ||
    lowerMessage.includes("余额") ||
    lowerMessage.includes("how much") ||
    lowerMessage.includes("查")
  ) {
    const tokenMatch = message.match(/\b(MON|USDC|WMON|USDT|WETH|WBTC)\b/i);
    const token = tokenMatch ? tokenMatch[1].toUpperCase() : undefined;

    return {
      message: `📊 I'll check your ${token || "wallet"} balance on Monad.\n\nPlease connect your wallet to see your balances.`,
      intents: [
        {
          id: uuidv4(),
          type: "check_balance",
          params: { token },
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: false,
    };
  }

  // 默认响应
  return {
    message: `👋 **[Mock Mode]** I'm Monad Intent Bot! I can help you with:\n\n• **Swap** - "Swap 100 USDC to MON"\n• **Stake** - "Stake 10 MON"\n• **Unstake** - "Unstake all my MON"\n• **Transfer** - "Send 50 USDC to 0x..."\n• **Balance** - "Check my balance"\n\nTry one of these commands!`,
    intents: [],
    needsConfirmation: false,
  };
}
