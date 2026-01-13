import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { intentTools } from "@/lib/ai/tools";
import { v4 as uuidv4 } from "uuid";
import { createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "@/lib/web3/chains";

// Mock 模式标识
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

// 初始化 OpenAI 兼容客户端（使用第三方 DeepSeek API）
const openai = !MOCK_MODE
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://maas-openapi.wanjiedata.com/api/v1",
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
    if (MOCK_MODE || !process.env.DEEPSEEK_API_KEY) {
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

    // 调用 DeepSeek API（OpenAI 兼容接口）
    const response = await openai!.chat.completions.create({
      model: "deepseek-v3-2-251201",
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

        // 根据函数名创建意图 (Monad + Curvance)
        let intentType: string;
        switch (functionName) {
          case "swap_tokens":
            intentType = "swap";
            break;
          case "supply_to_curvance":
            intentType = "supply";
            break;
          case "withdraw_from_curvance":
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

    // 如果识别到 check_balance 意图，查询真实余额
    const balanceIntent = intents.find((intent) => intent.type === "check_balance");
    let finalMessage = assistantMessage.content || generateIntentSummary(intents);

    if (balanceIntent && walletAddress) {
      try {
        // 验证钱包地址格式
        if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
          throw new Error(`Invalid wallet address format: ${walletAddress}`);
        }

        // 创建公共客户端查询余额
        const publicClient = createPublicClient({
          chain: monadTestnet,
          transport: http(monadTestnet.rpcUrls.default.http[0], {
            timeout: 10000, // 10 秒超时
          }),
        });

        // 查询原生代币 (MON) 余额
        const nativeBalance = await publicClient.getBalance({
          address: walletAddress as `0x${string}`,
        });

        const formattedBalance = formatEther(nativeBalance);
        const displayAmount = parseFloat(formattedBalance).toFixed(4).replace(/\.?0+$/, '');

        // 如果指定了特定 token，可以在这里添加查询逻辑
        // TODO: 当 Token 地址更新后，添加 ERC20 余额查询

        finalMessage = `📊 **您的钱包余额 (Monad Testnet):**\n\n• **MON**: ${displayAmount} MON\n\n*实时查询结果*`;
      } catch (error: any) {
        console.error("Error fetching balance:", error);
        // 提供更详细的错误信息
        const errorMessage = error?.message || String(error) || 'Unknown error';
        const isNetworkError = errorMessage.includes('fetch') || 
                              errorMessage.includes('timeout') || 
                              errorMessage.includes('network') ||
                              errorMessage.includes('ECONNREFUSED') ||
                              errorMessage.includes('ENOTFOUND');
        
        if (isNetworkError) {
          finalMessage = `📊 **余额查询**\n\n⚠️ 无法连接到 Monad Testnet RPC，请检查网络连接。\n\n*提示：您可以稍后重试，或使用 Mock 模式进行测试。*`;
        } else {
          finalMessage = `📊 **余额查询**\n\n⚠️ 查询失败：${errorMessage}\n\n*请稍后重试*`;
        }
      }
    }

    // 返回响应
    return NextResponse.json({
      message: finalMessage,
      intents,
      needsConfirmation: intents.length > 0 && !balanceIntent, // 余额查询不需要确认
    });
  } catch (error: any) {
    console.error("Chat API error:", error);

    // 检查是否是 API Key 错误
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "DeepSeek API key is invalid or not configured" },
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
        return `Supply ${intent.params.amount} ${intent.params.token} to Curvance`;
      case "withdraw":
        return `Withdraw ${intent.params.amount} ${intent.params.token} from Curvance`;
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

    // 检测代币对 (Monad 网络)
    let fromToken = "USDC";
    let toToken = "MON";

    if (lowerMessage.includes("mon") && lowerMessage.includes("usdc")) {
      if (lowerMessage.indexOf("mon") < lowerMessage.indexOf("usdc")) {
        fromToken = "MON";
        toToken = "USDC";
      }
    } else if (lowerMessage.includes("usdt")) {
      fromToken = "USDT";
    }

    return {
      message: `🔄 **[Mock Mode]** I'll help you swap ${amount} ${fromToken} to ${toToken} on Monad.\n\nClick "Execute" to proceed with the transaction.`,
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

  // 检测 supply/deposit 意图 (Curvance)
  if (
    lowerMessage.includes("supply") ||
    lowerMessage.includes("deposit") ||
    lowerMessage.includes("存") ||
    lowerMessage.includes("curvance")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "0.1";
    const token = lowerMessage.includes("usdc") ? "USDC" : "MON";

    return {
      message: `🏦 **[Mock Mode]** I'll help you supply ${amount} ${token} to Curvance to earn yield.\n\nClick "Execute" to proceed.`,
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

  // 检测 withdraw 意图 (Curvance)
  if (
    lowerMessage.includes("withdraw") ||
    lowerMessage.includes("取") ||
    lowerMessage.includes("提取")
  ) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? amountMatch[1] : "max";
    const token = lowerMessage.includes("usdc") ? "USDC" : "MON";

    return {
      message: `📤 **[Mock Mode]** I'll help you withdraw ${amount} ${token} from Curvance.\n\nClick "Execute" to proceed.`,
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
    const token = lowerMessage.includes("mon") ? "MON" : "USDC";

    // 尝试提取地址
    const addressMatch = message.match(/(0x[a-fA-F0-9]{40})/);
    const to = addressMatch ? addressMatch[1] : "0x1234...5678";

    return {
      message: `💸 **[Mock Mode]** I'll help you transfer ${amount} ${token} to ${to} on Monad.\n\nClick "Execute" to proceed.`,
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
      message: `📊 **您的钱包余额 (Monad Testnet):**\n\n• **MON**: 10.5 MON\n• **USDC**: 500 USDC\n• **DAI**: 100 DAI\n\n*Mock 模式 - 测试数据*`,
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
    message: `👋 **[Mock Mode]** I'm Intent Bot on Monad! I can help you with:\n\n• **Swap** - "Swap 100 USDC to MON"\n• **Supply** - "Deposit 0.1 MON to Curvance"\n• **Withdraw** - "Withdraw my USDC from Curvance"\n• **Transfer** - "Send 50 USDC to 0x..."\n• **Balance** - "Check my balance"\n\nTry one of these commands!`,
    intents: [],
    needsConfirmation: false,
  };
}