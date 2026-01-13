# 意图定义文档

## 概述

Intent Bot 支持的所有意图类型及其参数定义。

## 当前支持的意图

| # | 意图名称 | 功能 | 触发词示例 |
|---|----------|------|-----------|
| 1 | `swap_tokens` | 代币兑换 | swap, exchange, 换, 兑换 |
| 2 | `supply_to_curvance` | 存入 Curvance | deposit, supply, 存, 借出 |
| 3 | `withdraw_from_curvance` | 从 Curvance 提取 | withdraw, 提, 取出 |
| 4 | `transfer_token` | 转账 | send, transfer, 转, 发送 |
| 5 | `check_balance` | 查询余额 | balance, 余额, 有多少 |

## 详细参数定义

### 1. swap_tokens

**功能**: 在同一链上兑换代币

**参数**:
```typescript
{
  fromToken: string;      // 必填: 源代币符号，如 "USDC"
  toToken: string;        // 必填: 目标代币符号，如 "MON"
  amount: string;         // 必填: 数量（人类可读格式）
  slippage?: number;      // 可选: 滑点容忍度，默认 0.5%
}
```

**示例**:
- "Swap 100 USDC to MON"
- "把 50 USDC 换成 MON"

### 2. supply_to_curvance

**功能**: 存入 Curvance 借贷协议赚取利息

**参数**:
```typescript
{
  token: string;          // 必填: 代币符号，如 "MON", "USDC"
  amount: string;         // 必填: 数量，支持 "100", "half", "all"
}
```

**示例**:
- "把 0.5 个 MON 存到 Curvance"
- "存一半 USDC 到 Curvance"

### 3. withdraw_from_curvance

**功能**: 从 Curvance 提取已存入的代币

**参数**:
```typescript
{
  token: string;          // 必填: 代币符号
  amount: string;         // 必填: 数量，支持 "max" 表示全部
}
```

**示例**:
- "从 Curvance 提取我所有的 USDC"
- "取出 100 MON"

### 4. transfer_token

**功能**: 转账代币到指定地址

**参数**:
```typescript
{
  token: string;          // 必填: 代币符号
  amount: string;         // 必填: 数量
  to: string;             // 必填: 接收地址（0x...）
}
```

**示例**:
- "转 50 MON 到 0x1234...abcd"
- "发送 100 USDC 给朋友"

### 5. check_balance

**功能**: 查询钱包代币余额

**参数**:
```typescript
{
  token?: string;         // 可选: 指定代币，不填则查全部
}
```

**示例**:
- "我有多少 MON"
- "查询余额"

## 可扩展的意图（待实现）

| 意图 | 说明 | 优先级 |
|------|------|--------|
| `native_stake` | Monad 原生质押 | ⭐⭐⭐ 高 |
| `cross_chain_swap` | 跨链兑换 | ⭐⭐⭐ 高 |
| `borrow_from_curvance` | 从 Curvance 借款 | ⭐⭐ 中 |
| `repay_to_curvance` | 还款 | ⭐⭐ 中 |
| `get_yield_info` | 查询收益率 | ⭐ 低 |
| `set_reward_destination` | 设置收益地址 | ⭐⭐ 中 |

## 统一意图设计（多协议支持）

### 未来架构

当支持多协议时，意图可以统一为：

```typescript
{
  name: "supply",
  description: "存入借贷协议赚取收益",
  parameters: {
    token: string;
    amount: string;
    protocol?: "curvance" | "aave" | "auto";  // 新增
    chain?: "monad" | "ethereum" | "base" | "arbitrum";  // 新增
  }
}
```

### 协议路由逻辑

```typescript
if (protocol === "auto") {
  // 自动选择收益最高的协议
  const bestProtocol = await findBestYield(token, amount);
  return routeToProtocol(bestProtocol);
} else {
  // 使用指定协议
  return routeToProtocol(protocol);
}
```

## 意图识别流程

```
用户输入
    ↓
AI 意图解析 (Function Calling)
    ↓
意图类型判断
    ↓
参数提取和验证
    ↓
交易构建
    ↓
用户确认
    ↓
执行交易
```

## 特殊参数处理

### 相对数量

| 输入 | 处理逻辑 |
|------|----------|
| "half" | 查询余额，取 50% |
| "all" / "max" | 查询余额，取 100% |
| "三分之一" | 查询余额，取 33.33% |

### 代币符号标准化

- 支持大小写不敏感
- 支持常见别名（如 ETH = WETH）
- 自动补全（USDC → USDC.e）

## 错误处理

### 无法识别的意图

```typescript
{
  message: "我不太确定您的意图，请选择：",
  options: [
    "存入代币赚取收益",
    "提取代币",
    "兑换代币",
    "其他"
  ]
}
```

### 参数缺失

```typescript
{
  message: "请提供更多信息：",
  questions: [
    "您要存入哪种代币？",
    "存入多少数量？"
  ]
}
```

## 测试用例示例

参考 `test/intent-test-cases.json` 文件，包含：

- 各种意图类型的测试用例
- 边界情况测试
- 多语言输入测试
- 复合意图测试

## 参考资源

- `lib/ai/tools.ts` - 工具定义源码
- `lib/ai/prompts.ts` - 系统提示词
- `test/intent-test-cases.json` - 测试用例
