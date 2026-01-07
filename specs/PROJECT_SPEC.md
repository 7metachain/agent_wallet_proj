# Intent-Based Trading Bot - 项目技术文档

## 一、项目概述

**项目名称**：Intent Bot（意图交易机器人）

**核心价值**：用户通过自然语言描述交易意图，AI 自动解析并构建链上交易，降低 Web3 操作门槛。

**技术栈**：
- 前端：Next.js 14 + TypeScript + shadcn/ui + Tailwind CSS
- 钱包：wagmi v2 + viem + RainbowKit
- AI：OpenAI GPT-4o + Vercel AI SDK
- 协议：0x/1inch API (Swap) + Aave V3 SDK (Lending)
- 测试网：Base Sepolia / Arbitrum Sepolia

---

## 二、项目结构

```
intent-bot/
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts              # AI 意图解析 API
│   │   ├── quote/
│   │   │   └── route.ts              # 获取 Swap 报价
│   │   └── transaction/
│   │       └── route.ts              # 构建交易数据
│   ├── page.tsx                      # 主页面
│   ├── layout.tsx                    # 根布局
│   └── globals.css                   # 全局样式
│
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx         # 聊天容器
│   │   ├── ChatInput.tsx             # 输入框组件
│   │   ├── ChatMessage.tsx           # 单条消息
│   │   └── ChatMessages.tsx          # 消息列表
│   ├── transaction/
│   │   ├── TransactionCard.tsx       # 交易预览卡片
│   │   ├── TransactionStep.tsx       # 多步交易步骤
│   │   └── TransactionStatus.tsx     # 交易状态展示
│   ├── wallet/
│   │   ├── ConnectButton.tsx         # 钱包连接按钮
│   │   └── WalletInfo.tsx            # 钱包信息展示
│   └── ui/                           # shadcn/ui 组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── lib/
│   ├── ai/
│   │   ├── tools.ts                  # Function Calling 工具定义
│   │   ├── prompts.ts                # 系统提示词
│   │   └── parser.ts                 # 意图解析逻辑
│   ├── web3/
│   │   ├── config.ts                 # wagmi 配置
│   │   ├── chains.ts                 # 链配置
│   │   ├── tokens.ts                 # Token 地址映射表
│   │   ├── swap.ts                   # Swap 交易构建
│   │   ├── aave.ts                   # Aave 交易构建
│   │   └── abi/                      # 合约 ABI
│   │       ├── erc20.ts
│   │       └── aave-pool.ts
│   └── utils/
│       ├── format.ts                 # 格式化工具
│       └── constants.ts              # 常量定义
│
├── hooks/
│   ├── useChat.ts                    # 聊天状态管理
│   ├── useIntentParser.ts            # 意图解析 Hook
│   ├── useTransactionBuilder.ts      # 交易构建 Hook
│   └── useTokenBalance.ts            # Token 余额查询
│
├── types/
│   ├── intent.ts                     # 意图类型定义
│   ├── transaction.ts                # 交易类型定义
│   └── chat.ts                       # 聊天类型定义
│
├── config/
│   └── tokens.json                   # Token 配置文件
│
├── .env.local                        # 环境变量（不提交）
├── .env.example                      # 环境变量示例
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 三、核心接口定义

### 3.1 AI 意图解析接口

#### `POST /api/chat`

**描述**：接收用户自然语言输入，返回解析后的交易意图

**请求体**：
```typescript
interface ChatRequest {
  message: string;           // 用户输入的自然语言
  walletAddress: string;     // 用户钱包地址
  chainId: number;           // 当前链 ID
  history?: ChatMessage[];   // 历史对话（可选）
}
```

**响应体**：
```typescript
interface ChatResponse {
  message: string;           // AI 回复文本
  intents: Intent[];         // 解析出的意图列表
  needsConfirmation: boolean; // 是否需要用户确认
}

interface Intent {
  id: string;                // 意图唯一 ID
  type: 'swap' | 'supply' | 'withdraw' | 'transfer' | 'check_balance';
  params: SwapParams | SupplyParams | WithdrawParams | TransferParams;
  status: 'pending' | 'ready' | 'executing' | 'success' | 'failed';
}
```

**意图参数类型**：
```typescript
// Swap 参数
interface SwapParams {
  fromToken: string;         // 源 Token 符号 (如 "USDC")
  toToken: string;           // 目标 Token 符号 (如 "ETH")
  amount: string;            // 金额（人类可读格式）
  slippage?: number;         // 滑点百分比，默认 0.5
}

// Aave Supply 参数
interface SupplyParams {
  token: string;             // Token 符号
  amount: string;            // 金额
  useAsCollateral?: boolean; // 是否作为抵押品，默认 true
}

// Aave Withdraw 参数
interface WithdrawParams {
  token: string;             // Token 符号
  amount: string;            // 金额，"max" 表示全部
}

// 转账参数
interface TransferParams {
  token: string;             // Token 符号
  amount: string;            // 金额
  to: string;                // 接收地址或 ENS
}
```

---

### 3.2 报价查询接口

#### `POST /api/quote`

**描述**：获取 Swap 交易报价

**请求体**：
```typescript
interface QuoteRequest {
  fromToken: string;         // 源 Token 地址
  toToken: string;           // 目标 Token 地址
  amount: string;            // 金额（最小单位 wei）
  chainId: number;
  slippage?: number;
}
```

**响应体**：
```typescript
interface QuoteResponse {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;        // 输入金额
  toAmount: string;          // 预期输出金额
  toAmountMin: string;       // 最小输出（含滑点）
  estimatedGas: string;      // 预估 Gas
  priceImpact: string;       // 价格影响百分比
  route: string[];           // 交易路径
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}
```

---

### 3.3 交易构建接口

#### `POST /api/transaction`

**描述**：根据意图构建可执行的交易数据

**请求体**：
```typescript
interface TransactionBuildRequest {
  intent: Intent;            // 意图对象
  walletAddress: string;     // 用户钱包地址
  chainId: number;
}
```

**响应体**：
```typescript
interface TransactionBuildResponse {
  transactions: PreparedTransaction[];  // 交易列表（可能多笔）
  summary: TransactionSummary;
}

interface PreparedTransaction {
  id: string;
  type: 'approve' | 'swap' | 'supply' | 'withdraw' | 'transfer';
  to: string;                // 目标合约地址
  data: string;              // 编码后的 calldata
  value: string;             // ETH 金额（wei）
  gasLimit?: string;         // Gas 限制
  description: string;       // 人类可读描述
}

interface TransactionSummary {
  totalSteps: number;        // 总步骤数
  estimatedGas: string;      // 总预估 Gas
  warnings?: string[];       // 风险警告
}
```

---

### 3.4 Token 余额查询接口

#### `GET /api/balance`

**描述**：查询用户 Token 余额

**查询参数**：
```typescript
interface BalanceQuery {
  address: string;           // 钱包地址
  chainId: number;
  tokens?: string[];         // Token 地址列表，不传则返回常用 Token
}
```

**响应体**：
```typescript
interface BalanceResponse {
  balances: TokenBalance[];
}

interface TokenBalance {
  token: TokenInfo;
  balance: string;           // 原始余额（wei）
  formatted: string;         // 格式化余额
  usdValue?: string;         // USD 价值
}
```

---

## 四、AI Function Calling 定义

```typescript
// lib/ai/tools.ts
import { z } from 'zod';

export const intentTools = {
  // 1. Token 兑换
  swap_tokens: {
    description: "Swap/exchange one token for another token. Use this when user wants to convert, swap, exchange, or trade tokens.",
    parameters: z.object({
      fromToken: z.string().describe("The token symbol to swap from (e.g., 'USDC', 'ETH')"),
      toToken: z.string().describe("The token symbol to swap to (e.g., 'ETH', 'USDC')"),
      amount: z.string().describe("The amount to swap in human readable format"),
      slippage: z.number().optional().describe("Slippage tolerance in percentage, default 0.5")
    })
  },

  // 2. 存入 Aave
  supply_to_aave: {
    description: "Supply/deposit tokens to Aave lending protocol to earn interest. Use when user wants to deposit, supply, lend, or earn yield.",
    parameters: z.object({
      token: z.string().describe("The token symbol to supply (e.g., 'ETH', 'USDC')"),
      amount: z.string().describe("The amount to supply, can be a number or 'half', 'all'"),
    })
  },

  // 3. 从 Aave 取出
  withdraw_from_aave: {
    description: "Withdraw tokens from Aave lending protocol. Use when user wants to withdraw or retrieve their deposited assets.",
    parameters: z.object({
      token: z.string().describe("The token symbol to withdraw"),
      amount: z.string().describe("The amount to withdraw, 'max' for full balance"),
    })
  },

  // 4. 转账
  transfer_token: {
    description: "Transfer/send tokens to another address. Use when user wants to send, transfer tokens to someone.",
    parameters: z.object({
      token: z.string().describe("The token symbol to transfer"),
      amount: z.string().describe("The amount to transfer"),
      to: z.string().describe("The recipient address or ENS name"),
    })
  },

  // 5. 查询余额
  check_balance: {
    description: "Check token balance in wallet. Use when user asks about their balance, holdings, or how much they have.",
    parameters: z.object({
      token: z.string().optional().describe("Specific token to check, or omit for all tokens"),
    })
  }
};
```

---

## 五、系统提示词

```typescript
// lib/ai/prompts.ts
export const SYSTEM_PROMPT = `You are an AI assistant for a Web3 trading bot. Your job is to understand user's intent and help them execute blockchain transactions.

## Your Capabilities:
1. **swap_tokens**: Exchange one token for another (e.g., USDC to ETH)
2. **supply_to_aave**: Deposit tokens into Aave to earn interest
3. **withdraw_from_aave**: Withdraw tokens from Aave
4. **transfer_token**: Send tokens to another address
5. **check_balance**: Check wallet token balances

## Guidelines:
- Parse user's natural language and call the appropriate function(s)
- For complex requests, break them into multiple steps
- Always confirm amounts and tokens before execution
- Use common token symbols: ETH, USDC, USDT, DAI, WETH, WBTC
- If user says "half", calculate 50% of their balance
- If user says "all" or "everything", use their full balance
- Be helpful and explain what each transaction will do

## Response Format:
- Be concise and clear
- List each step if there are multiple transactions
- Warn about any risks (high slippage, large amounts)

## Examples:
User: "Swap 100 USDC to ETH"
→ Call swap_tokens(fromToken: "USDC", toToken: "ETH", amount: "100")

User: "把我一半的 ETH 存到 Aave"
→ Call check_balance first, then supply_to_aave with 50% of ETH balance

User: "Convert my USDC to ETH and deposit half to Aave"
→ Call swap_tokens, then supply_to_aave with half of received ETH
`;
```

---

## 六、团队分工

### 👨‍💻 前端工程师 (Frontend Engineer)

**职责范围**：
1. 项目初始化与基础架构搭建
2. UI 组件开发
3. 钱包连接集成
4. 状态管理与用户交互

**具体任务**：

| 任务 | 优先级 | 预估时间 | 交付物 |
|------|--------|----------|--------|
| Next.js 项目初始化 + shadcn/ui 配置 | P0 | 1h | 可运行的基础框架 |
| RainbowKit 钱包连接集成 | P0 | 2h | ConnectButton 组件 |
| Chat UI 组件开发 | P0 | 3h | ChatContainer, ChatInput, ChatMessages |
| 交易预览卡片组件 | P0 | 2h | TransactionCard, TransactionStep |
| 多步交易进度展示 | P1 | 2h | TransactionStatus 组件 |
| Token 余额展示组件 | P1 | 1h | WalletInfo 组件 |
| 响应式布局优化 | P2 | 1h | 移动端适配 |
| Loading/Error 状态处理 | P1 | 1h | 全局状态组件 |

**技术要求**：
- 熟悉 React + TypeScript
- 了解 wagmi/viem 基本用法
- 熟悉 Tailwind CSS

**关键产出文件**：
```
components/chat/*
components/transaction/*
components/wallet/*
app/page.tsx
app/layout.tsx
hooks/useChat.ts
```

---

### 🔧 后端工程师 (Backend/Full-stack Engineer)

**职责范围**：
1. API 路由开发
2. AI 意图解析集成
3. 协议 SDK 集成
4. 交易构建逻辑

**具体任务**：

| 任务 | 优先级 | 预估时间 | 交付物 |
|------|--------|----------|--------|
| OpenAI + Vercel AI SDK 集成 | P0 | 2h | /api/chat 路由 |
| Function Calling Tools 定义 | P0 | 2h | lib/ai/tools.ts |
| 系统提示词优化 | P0 | 1h | lib/ai/prompts.ts |
| 0x/1inch Swap API 集成 | P0 | 3h | lib/web3/swap.ts, /api/quote |
| Aave V3 SDK 集成 | P0 | 3h | lib/web3/aave.ts |
| 交易构建接口 | P0 | 2h | /api/transaction |
| Token 余额查询 | P1 | 1h | /api/balance |
| 错误处理与日志 | P1 | 1h | 统一错误格式 |
| 多步交易编排 | P2 | 2h | 复杂意图拆解逻辑 |

**技术要求**：
- 熟悉 Node.js + TypeScript
- 了解 OpenAI API / Function Calling
- 熟悉 ethers.js 或 viem
- 了解 DeFi 协议基础（Swap、Lending）

**关键产出文件**：
```
app/api/chat/route.ts
app/api/quote/route.ts
app/api/transaction/route.ts
lib/ai/*
lib/web3/swap.ts
lib/web3/aave.ts
```

---

### 📜 合约工程师 (Smart Contract Engineer)

**职责范围**：
1. 合约交互逻辑
2. ABI 管理
3. 测试网配置
4. 交易数据编码

**具体任务**：

| 任务 | 优先级 | 预估时间 | 交付物 |
|------|--------|----------|--------|
| 测试网 Token 地址整理 | P0 | 1h | config/tokens.json |
| ERC20 Approve 逻辑 | P0 | 1h | approve 交易构建 |
| Aave V3 Pool ABI 整理 | P0 | 1h | lib/web3/abi/aave-pool.ts |
| Swap Router ABI 整理 | P0 | 1h | lib/web3/abi/swap-router.ts |
| 交易 calldata 编码 | P0 | 2h | 各协议交易编码函数 |
| Gas 估算逻辑 | P1 | 1h | estimateGas 封装 |
| 多链配置 | P1 | 1h | lib/web3/chains.ts |
| 交易模拟 (Tenderly) | P2 | 2h | 可选功能 |

**技术要求**：
- 熟悉 Solidity 基础
- 了解 ERC20 标准
- 熟悉 viem 合约交互
- 了解 Aave V3、Uniswap V3 合约接口

**关键产出文件**：
```
lib/web3/abi/*
lib/web3/tokens.ts
lib/web3/chains.ts
config/tokens.json
```

---

## 七、开发计划 (时间线)

### Day 1: 基础框架 (8h)

```
┌────────────────────────────────────────────────────────────┐
│ 上午 (4h)                                                   │
│ ├── [前端] 项目初始化 + shadcn/ui 配置                      │
│ ├── [前端] RainbowKit 钱包连接                              │
│ └── [合约] 测试网 Token 地址整理                            │
├────────────────────────────────────────────────────────────┤
│ 下午 (4h)                                                   │
│ ├── [前端] Chat UI 基础组件                                 │
│ ├── [后端] OpenAI API 集成 + Function Calling               │
│ └── [合约] ABI 文件整理                                     │
└────────────────────────────────────────────────────────────┘
```

### Day 2: 核心功能 (8h)

```
┌────────────────────────────────────────────────────────────┐
│ 上午 (4h)                                                   │
│ ├── [后端] Swap API 集成 (0x/1inch)                         │
│ ├── [后端] Aave SDK 集成                                    │
│ └── [合约] 交易编码逻辑                                     │
├────────────────────────────────────────────────────────────┤
│ 下午 (4h)                                                   │
│ ├── [前端] 交易预览卡片                                     │
│ ├── [前端] 交易执行流程                                     │
│ └── [全员] 联调测试                                         │
└────────────────────────────────────────────────────────────┘
```

### Day 3: 完善与演示 (4h)

```
┌────────────────────────────────────────────────────────────┐
│ ├── [前端] UI 美化 + 动效                                   │
│ ├── [后端] 错误处理优化                                     │
│ ├── [全员] Bug 修复                                         │
│ └── [全员] Demo 准备                                        │
└────────────────────────────────────────────────────────────┘
```

---

## 八、环境变量配置

```bash
# .env.example

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# RPC Providers
NEXT_PUBLIC_ALCHEMY_API_KEY=xxxxx

# 0x API (可选，有免费额度)
ZRX_API_KEY=xxxxx

# 1inch API (可选)
ONEINCH_API_KEY=xxxxx

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxxxx
```

---

## 九、测试网资源

### Base Sepolia
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Explorer**: https://sepolia.basescan.org

### Arbitrum Sepolia
- **Chain ID**: 421614
- **RPC**: https://sepolia-rollup.arbitrum.io/rpc
- **Faucet**: https://faucet.quicknode.com/arbitrum/sepolia
- **Explorer**: https://sepolia.arbiscan.io

### 测试 Token 获取
- Sepolia ETH: https://sepoliafaucet.com
- Aave Faucet: https://app.aave.com/faucet (测试网模式)

---

## 十、参考资源

- [wagmi 文档](https://wagmi.sh)
- [viem 文档](https://viem.sh)
- [RainbowKit 文档](https://rainbowkit.com)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [0x API 文档](https://0x.org/docs/api)
- [1inch API 文档](https://docs.1inch.io)
- [Aave V3 开发文档](https://docs.aave.com/developers)
- [shadcn/ui](https://ui.shadcn.com)

