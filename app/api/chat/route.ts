import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { intentTools } from "@/lib/ai/tools";
import { v4 as uuidv4 } from "uuid";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const response = await openai.chat.completions.create({
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

