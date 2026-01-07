import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { intentTools } from "@/lib/ai/tools";
import { v4 as uuidv4 } from "uuid";

// Mock 模式标识
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

// 初始化 OpenAI 客户端（仅在非 Mock 模式下）
const openai = !MOCK_MODE
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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

    // 调用 OpenAI API
    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: intentTools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message;
    const intents: any[] = [];

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
          case "supply_to_aave":
            intentType = "supply";
            break;
          case "withdraw_from_aave":
            intentType = "withdraw";
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
      needsConfirmation: intents.length > 0,
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
      case "supply":
        return `Supply ${intent.params.amount} ${intent.params.token} to Aave`;
      case "withdraw":
        return `Withdraw ${intent.params.amount} ${intent.params.token} from Aave`;
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

  // 检测 supply/deposit 意图
  if (
    lowerMessage.includes("supply") ||
    lowerMessage.includes("deposit") ||
    lowerMessage.includes("存") ||
    lowerMessage.includes("aave")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "0.1";
    const token = lowerMessage.includes("usdc") ? "USDC" : "ETH";

    return {
      message: `🏦 **[Mock Mode]** I'll help you supply ${amount} ${token} to Aave to earn yield.\n\nClick "Execute" to proceed.`,
      intents: [
        {
          id: uuidv4(),
          type: "supply",
          params: {
            token,
            amount,
          },
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: true,
    };
  }

  // 检测 withdraw 意图
  if (
    lowerMessage.includes("withdraw") ||
    lowerMessage.includes("取") ||
    lowerMessage.includes("提取")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "max";
    const token = lowerMessage.includes("usdc") ? "USDC" : "ETH";

    return {
      message: `📤 **[Mock Mode]** I'll help you withdraw ${amount} ${token} from Aave.\n\nClick "Execute" to proceed.`,
      intents: [
        {
          id: uuidv4(),
          type: "withdraw",
          params: {
            token,
            amount,
          },
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
    return {
      message: `📊 **[Mock Mode]** Here's your wallet balance:\n\n• ETH: 0.5 ETH (~$1,250)\n• USDC: 500 USDC\n• DAI: 100 DAI\n\n*Note: This is mock data for testing.*`,
      intents: [
        {
          id: uuidv4(),
          type: "check_balance",
          params: {},
          status: "ready",
          createdAt: Date.now(),
        },
      ],
      needsConfirmation: false,
    };
  }

  // 默认响应
  return {
    message: `👋 **[Mock Mode]** I'm Intent Bot! I can help you with:\n\n• **Swap** - "Swap 100 USDC to ETH"\n• **Supply** - "Deposit 0.1 ETH to Aave"\n• **Withdraw** - "Withdraw my USDC from Aave"\n• **Transfer** - "Send 50 USDC to vitalik.eth"\n• **Balance** - "Check my balance"\n\nTry one of these commands!`,
    intents: [],
    needsConfirmation: false,
  };
}
