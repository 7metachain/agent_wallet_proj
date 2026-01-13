# 跨链策略文档

## 概述

通过跨链聚合器 API（如 LI.FI、Socket）实现跨链资产转移和兑换，降低工程复杂度，提升演示效果。

## 方案对比

| 功能 | 工程难度 | 演示效果 | 推荐度 |
|------|----------|----------|--------|
| **跨链聚合器 API** | ⭐ 低 | ⭐⭐⭐⭐⭐ 高 | 🏆 首选 |
| 跨链桥集成 | ⭐⭐⭐ 中 | ⭐⭐⭐ 中 | 可选 |
| 原生跨链消息 | ⭐⭐⭐⭐⭐ 高 | ⭐⭐⭐ 中 | 不推荐 |

## 推荐方案：LI.FI 跨链聚合器

### 为什么选择 LI.FI？

1. **工程简单**: 只需调用 API，无需处理各桥的复杂逻辑
2. **自动路由**: 自动选择最优跨链路径
3. **多链支持**: 支持 20+ 条链（需确认 Monad 支持情况）
4. **成本透明**: 费用包含在交易中，无需额外处理

### API 集成示例

```typescript
// 获取跨链报价
const quote = await fetch('https://li.quest/v1/quote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fromChain: 1,           // Ethereum
    toChain: 10143,         // Monad
    fromToken: 'USDC',
    toToken: 'MON',
    fromAmount: '500000000', // 500 USDC (6 decimals)
    fromAddress: userAddress,
  })
});

const { transactionRequest } = await quote.json();

// transactionRequest 包含完整的交易数据，直接发送即可
```

## 实现步骤

### 1. 新增 Tool 定义

**文件**: `lib/ai/tools.ts`

```typescript
{
  name: "cross_chain_swap",
  description: "跨链兑换代币，从一条链转移并兑换到另一条链",
  parameters: {
    type: "object",
    properties: {
      fromChain: { 
        type: "string",
        enum: ["ethereum", "arbitrum", "base", "monad"],
        description: "源链"
      },
      toChain: { 
        type: "string",
        enum: ["ethereum", "arbitrum", "base", "monad"],
        description: "目标链"
      },
      fromToken: { type: "string" },
      toToken: { type: "string" },
      amount: { type: "string" }
    },
    required: ["fromChain", "toChain", "fromToken", "toToken", "amount"]
  }
}
```

### 2. 安装 LI.FI SDK

```bash
npm install @lifi/sdk
```

### 3. 实现跨链路由

**文件**: `lib/web3/cross-chain.ts`

```typescript
import { LiFi } from '@lifi/sdk';

const lifi = new LiFi({
  integrator: 'intent-bot',
});

export async function getCrossChainQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
}) {
  const quote = await lifi.getQuote({
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.amount,
  });
  
  return quote;
}

export async function executeCrossChainSwap(quote: Quote) {
  // LI.FI 返回的交易数据可以直接执行
  return quote.transactionRequest;
}
```

### 4. 更新交易构建逻辑

**文件**: `app/api/transaction/route.ts`

```typescript
case "cross_chain_swap": {
  const { fromChain, toChain, fromToken, toToken, amount } = intent.params;
  const quote = await getCrossChainQuote({
    fromChain: getChainId(fromChain),
    toChain: getChainId(toChain),
    fromToken,
    toToken,
    amount,
  });
  
  transactions.push({
    id: `cross-chain-${fromChain}-${toChain}`,
    type: "cross_chain",
    to: quote.transactionRequest.to,
    data: quote.transactionRequest.data,
    value: quote.transactionRequest.value,
    description: `跨链 ${fromToken} → ${toToken} (${fromChain} → ${toChain})`,
  });
  break;
}
```

## 工作量估算

| 步骤 | 时间 |
|------|------|
| 新增 Tool 定义 | 15 分钟 |
| 安装 LI.FI SDK | 5 分钟 |
| 实现跨链路由 | 30 分钟 |
| 更新交易构建 | 30 分钟 |
| 测试验证 | 30 分钟 |
| **总计** | **约 1-2 小时** |

## 演示案例

### Killer Demo: 跨链 + 多协议

```
User: "我在 Ethereum 上有 10,000 USDC，帮我找到最好的收益方案"

Bot: 🔍 正在分析跨链+多协议收益方案...

📊 收益对比分析：
┌─────────────────────────────────────────────────┐
│  协议             │ 链        │ APY   │ 风险   │
├─────────────────────────────────────────────────┤
│  Aave V3         │ Ethereum  │ 3.2%  │ 🟢 低  │
│  Aave V3         │ Base      │ 4.1%  │ 🟢 低  │
│  Curvance        │ Monad     │ 5.8%  │ 🟡 中  │
│  Native Staking  │ Monad     │ 8.2%  │ 🟢 低  │
└─────────────────────────────────────────────────┘

💡 推荐方案：混合策略（预计综合 APY: 6.7%）

📋 交易计划 (6 步)：
1️⃣ 🌉 跨链：ETH USDC → Monad USDC (via LI.FI)
2️⃣ 💱 兑换：4,000 USDC → ~3,850 MON
3️⃣ 🔒 质押：3,850 MON → Monad Native Staking
4️⃣ 🏦 存入：3,000 USDC → Curvance
5️⃣ 🌉 跨链：3,000 USDC → Base (via LI.FI)
6️⃣ 🏦 存入：~2,998 USDC → Aave V3 (Base)

💰 收益预估：
   • 年化收益: ~$670 (6.7% 混合 APY)
   • 跨链费用: ~$3.70 (一次性)
   • Gas 费用: ~$8.50 (估算)

确认执行此方案？
```

## 注意事项

### 1. Monad 支持情况

⚠️ **需要确认**: LI.FI/Socket 是否已支持 Monad Testnet

**备选方案**:
- 如果未支持，可以先用 Base/Arbitrum 作为演示
- Monad 作为终点链可以模拟展示

### 2. API 成本

- LI.FI API 免费使用
- 跨链费用包含在交易中，由用户支付
- 无需额外 API Key（可选）

### 3. 错误处理

```typescript
try {
  const quote = await getCrossChainQuote(params);
} catch (error) {
  if (error.message.includes('unsupported chain')) {
    return {
      error: 'Monad 暂未支持，请使用其他链',
      alternatives: ['base', 'arbitrum'],
    };
  }
}
```

## 替代方案：Socket

如果 LI.FI 不支持 Monad，可以考虑 Socket：

```typescript
// Socket API 示例
const quote = await fetch('https://api.socket.tech/v2/quote', {
  method: 'GET',
  params: {
    fromChainId: '1',
    toChainId: '10143',
    fromTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    toTokenAddress: '0x...', // MON
    fromAmount: '500000000',
  }
});
```

## 参考资源

- [LI.FI 文档](https://docs.li.fi)
- [Socket 文档](https://docs.socket.tech)
- [跨链桥对比](https://defillama.com/bridges)
